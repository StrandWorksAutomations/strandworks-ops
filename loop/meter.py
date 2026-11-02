#!/usr/bin/env python3
"""Read provider quota metadata only. Never interpret token totals as allowance."""
import argparse
from datetime import datetime, timezone, timedelta
import hashlib
import importlib.machinery
import importlib.util
import json
import math
from pathlib import Path
import sys

HERE = Path(__file__).resolve().parent

def stamp(value):
    result = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if result.tzinfo is None:
        raise ValueError("quota timestamps require a timezone")
    return result

def codex_snapshot(directory):
    latest = None
    for path in sorted(directory.rglob("*.jsonl"), key=lambda p: p.stat().st_mtime, reverse=True)[:40]:
        with path.open("rb") as stream:
            stream.seek(max(0, path.stat().st_size - 262144))
            for line in stream:
                if b'"rate_limits"' not in line or b'"token_count"' not in line:
                    continue
                try:
                    row = json.loads(line)
                    payload = row.get("payload", {})
                    if payload.get("type") != "token_count":
                        continue
                    limits = payload.get("rate_limits") or {}
                    weekly = next((limits[k] for k in ("primary", "secondary") if isinstance(limits.get(k), dict) and limits[k].get("window_minutes") == 10080), None)
                    if weekly and (not latest or row["timestamp"] > latest["observed_at"]):
                        latest = {"used_percent": weekly["used_percent"], "observed_at": row["timestamp"], "reset_at": datetime.fromtimestamp(weekly["resets_at"], timezone.utc).isoformat(), "source": "Codex provider rate-limit event"}
                except (ValueError, KeyError, TypeError, AttributeError, OverflowError, OSError):
                    continue
    return latest

def limit_verdict(snapshot, budget, now):
    if not snapshot:
        return {"allowed": False, "reason": "Provider quota unavailable"}
    try:
        if not isinstance(snapshot, dict):
            raise ValueError("quota snapshot must be an object")
        for label, value in (("used_percent", snapshot["used_percent"]), ("stop_at_used", budget["stop_at_used"])):
            if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value) or not 0 <= value <= 100:
                raise ValueError(f"{label} must be a finite percentage in 0..100")
        observed, reset = stamp(snapshot["observed_at"]), stamp(snapshot["reset_at"])
        expected_reset, cutoff = stamp(budget["reset_at"]), stamp(budget["stop_at"])
        if cutoff > expected_reset:
            raise ValueError("quota cutoff must not follow reset")
        if observed > now + timedelta(minutes=5):
            raise ValueError("quota observation is in the future")
    except (ValueError, TypeError, KeyError, AttributeError, OverflowError) as error:
        return {"allowed": False, "reason": "Invalid provider quota: " + str(error)}
    result = {**snapshot, "stop_at_used": budget["stop_at_used"], "stop_at": budget["stop_at"], "remaining_percent": 100 - snapshot["used_percent"], "allowed": False}
    result.pop("additional_limits", None)
    if reset != expected_reset:
        result["reason"] = "Different allowance period; a reset does not authorize another allocation"
    elif now >= cutoff:
        result["reason"] = "Pre-reset cutoff reached"
    elif now - observed > timedelta(hours=2):
        result["reason"] = "Quota snapshot older than two hours"
    elif snapshot["used_percent"] >= budget["stop_at_used"]:
        result["reason"] = "Reserved allowance reached"
    else:
        result.update(allowed=True, reason="Within approved pre-reset allocation", points_until_stop=round(budget["stop_at_used"] - snapshot["used_percent"], 2))
    return result


def verdict(snapshot, budget, now):
    result = limit_verdict(snapshot, budget, now)
    configured = budget.get("additional_limits") or {}
    reported = (snapshot.get("additional_limits") or {}) if isinstance(snapshot, dict) else {}
    if not isinstance(configured, dict) or not isinstance(reported, dict):
        return {"allowed": False, "reason": "Invalid additional quota limits"}
    additional = {name: limit_verdict(reported.get(name), cap, now) for name, cap in configured.items()}
    if additional:
        result["additional_limits"] = additional
    unconfigured = set(reported) - set(configured)
    if unconfigured:
        result.update(allowed=False, reason="Unconfigured provider quota limit: " + ", ".join(sorted(unconfigured)))
    else:
        for name, check in additional.items():
            if not check["allowed"]:
                if result["allowed"]:
                    result["reason"] = f"Additional limit {name}: {check['reason']}"
                result["allowed"] = False
                break
    return result


def provider_snapshot(provider, budget, sessions, snapshot_file=None):
    if provider == "codex":
        return codex_snapshot(sessions)
    return json.loads(snapshot_file.read_text()) if snapshot_file else budget.get("verified_snapshot")


def metric_observation(provider, snapshot, result):
    if not isinstance(snapshot, dict) or not snapshot.get("observed_at") or not snapshot.get("source"):
        return None
    if result["reason"].startswith("Invalid provider quota"):
        return None
    # A repeated condition is the same payload; stale/cutoff transitions change
    # the payload hash even when the provider observation itself is unchanged.
    report = {"objective_id": "portfolio-control", "metric_id": provider + "_budget",
        "value": result, "observed_at": snapshot["observed_at"], "source": snapshot["source"], "evidence": []}
    stable = json.dumps(report, sort_keys=True, separators=(",", ":"), allow_nan=False)
    report["idempotency_key"] = f"meter-v2:{provider}:" + hashlib.sha256(stable.encode()).hexdigest()
    return report


def main(argv=None, now=None):
    p = argparse.ArgumentParser()
    p.add_argument("provider", choices=["codex", "claude"])
    p.add_argument("--manifest", type=Path, default=HERE / "portfolio-push.json")
    p.add_argument("--sessions", type=Path, default=Path.home() / ".codex/sessions")
    p.add_argument("--claude-snapshot", type=Path)
    p.add_argument("--publish", action="store_true")
    args = p.parse_args(argv)
    plan = json.loads(args.manifest.read_text())
    budget = {**plan["quota"][args.provider]}
    # The portfolio closes before Codex's provider cutoff. Enforce that earlier
    # boundary in code as well as session guidance; it grants no later packet.
    cutoff = min(stamp(budget["stop_at"]), stamp(plan["close"]))
    budget["stop_at"] = cutoff.isoformat()
    budget["additional_limits"] = {name: {**limit, "stop_at": min(stamp(limit["stop_at"]), cutoff).isoformat()}
        for name, limit in budget.get("additional_limits", {}).items()}
    try:
        snapshot = provider_snapshot(args.provider, budget, args.sessions, args.claude_snapshot)
    except (OSError, ValueError, TypeError):
        snapshot = None
    result = verdict(snapshot, budget, now or datetime.now(timezone.utc))
    observation = metric_observation(args.provider, snapshot, result) if args.publish else None
    if observation:
        loader = importlib.machinery.SourceFileLoader("meter_swd", str(HERE / "swd"))
        spec = importlib.util.spec_from_loader(loader.name, loader)
        swd = importlib.util.module_from_spec(spec); loader.exec_module(swd)
        swd.rpc("portfolio_metric", {"p_observation": observation})
    print(json.dumps(result))
    return 0 if result["allowed"] else 2

if __name__ == "__main__":
    sys.exit(main())
