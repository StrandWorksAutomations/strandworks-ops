#!/usr/bin/env python3
"""Read provider quota metadata only. Never interpret token totals as allowance."""
import argparse
from datetime import datetime, timezone, timedelta
import importlib.machinery
import importlib.util
import json
from pathlib import Path
import sys

HERE = Path(__file__).resolve().parent

def stamp(value):
    return datetime.fromisoformat(value.replace("Z", "+00:00"))

def codex_snapshot(directory):
    latest = None
    for path in sorted(directory.rglob("*.jsonl"), key=lambda p: p.stat().st_mtime, reverse=True)[:40]:
        with path.open("rb") as stream:
            stream.seek(max(0, path.stat().st_size - 262144))
            for line in stream:
                try:
                    row = json.loads(line)
                    payload = row.get("payload", {})
                    if payload.get("type") != "token_count":
                        continue
                    limits = payload.get("rate_limits") or {}
                    weekly = next((limits[k] for k in ("primary", "secondary") if limits.get(k, {}).get("window_minutes") == 10080), None)
                    if weekly and (not latest or row["timestamp"] > latest["observed_at"]):
                        latest = {"used_percent": weekly["used_percent"], "observed_at": row["timestamp"], "reset_at": datetime.fromtimestamp(weekly["resets_at"], timezone.utc).isoformat(), "source": "Codex provider rate-limit event"}
                except (ValueError, KeyError, TypeError):
                    continue
    return latest

def verdict(snapshot, budget, now):
    if not snapshot:
        return {"allowed": False, "reason": "Provider quota unavailable"}
    result = {**snapshot, "stop_at_used": budget["stop_at_used"], "remaining_percent": 100 - snapshot["used_percent"], "allowed": False}
    if stamp(snapshot["reset_at"]) != stamp(budget["reset_at"]):
        result["reason"] = "Different allowance period; a reset does not authorize another allocation"
    elif now >= stamp(budget["stop_at"]):
        result["reason"] = "Pre-reset cutoff reached"
    elif now - stamp(snapshot["observed_at"]) > timedelta(hours=2):
        result["reason"] = "Quota snapshot older than two hours"
    elif snapshot["used_percent"] >= budget["stop_at_used"]:
        result["reason"] = "Reserved allowance reached"
    else:
        result.update(allowed=True, reason="Within approved pre-reset allocation", points_until_stop=round(budget["stop_at_used"] - snapshot["used_percent"], 2))
    return result

def main():
    p = argparse.ArgumentParser()
    p.add_argument("provider", choices=["codex", "claude"])
    p.add_argument("--manifest", type=Path, default=HERE / "portfolio-push.json")
    p.add_argument("--sessions", type=Path, default=Path.home() / ".codex/sessions")
    p.add_argument("--claude-snapshot", type=Path)
    p.add_argument("--publish", action="store_true")
    args = p.parse_args()
    plan = json.loads(args.manifest.read_text())
    budget = plan["quota"][args.provider]
    snapshot = codex_snapshot(args.sessions) if args.provider == "codex" else (json.loads(args.claude_snapshot.read_text()) if args.claude_snapshot else {"used_percent": budget["used_at_kickoff"], "observed_at": plan["kickoff"], "reset_at": budget["reset_at"], "source": budget["source"]})
    result = verdict(snapshot, budget, datetime.now(timezone.utc))
    if args.publish and snapshot:
        loader = importlib.machinery.SourceFileLoader("meter_swd", str(HERE / "swd"))
        spec = importlib.util.spec_from_loader(loader.name, loader)
        swd = importlib.util.module_from_spec(spec); loader.exec_module(swd)
        swd.rpc("portfolio_metric", {"p_observation": {"objective_id": "portfolio-control", "metric_id": args.provider + "_budget", "value": result, "observed_at": snapshot["observed_at"], "source": snapshot["source"], "evidence": [], "idempotency_key": f'meter-v1:{args.provider}:{snapshot["observed_at"]}:{snapshot["used_percent"]}'}})
    print(json.dumps(result))
    return 0 if result["allowed"] else 2

if __name__ == "__main__":
    sys.exit(main())
