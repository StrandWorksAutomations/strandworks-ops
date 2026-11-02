#!/usr/bin/env python3
"""Bounded, vendor-neutral portfolio reconciliation. Intended cadence: every 15 minutes.

No LLM calls, Linear mutations, publishing, or legacy QA/feed routes. Official
Linear API/auth/error contract: https://linear.app/developers/graphql
"""
import argparse
from contextlib import contextmanager
from datetime import datetime, timedelta, timezone
import fcntl
import hashlib
import importlib.machinery
import importlib.util
import json
import os
from pathlib import Path
import re
import sys
import time
import urllib.error
import urllib.request
from zoneinfo import ZoneInfo

loader = importlib.machinery.SourceFileLoader("portfolio_swd", str(Path(__file__).with_name("swd")))
spec = importlib.util.spec_from_loader(loader.name, loader)
swd = importlib.util.module_from_spec(spec)
loader.exec_module(swd)
ET = ZoneInfo("America/New_York")
CONTROL = "portfolio-control"
ISSUE_RE = re.compile(r"^[A-Z][A-Z0-9]*-[0-9]+$")


class RemoteError(Exception):
    def __init__(self, message, retryable=False):
        super().__init__(message)
        self.retryable = retryable


def iso(now):
    return now.astimezone(timezone.utc).isoformat()


def stamp(value):
    if not value:
        return None
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
        return parsed.replace(tzinfo=timezone.utc) if parsed.tzinfo is None else parsed
    except (ValueError, AttributeError):
        return None


def digest(value):
    return hashlib.sha256(json.dumps(value, sort_keys=True, separators=(",", ":")).encode()).hexdigest()


def latest_metric(focus, objective_id, metric_id):
    rows = [m for m in focus.get("metrics", []) if m.get("objective_id") == objective_id and m.get("metric_id") == metric_id]
    minimum = datetime.min.replace(tzinfo=timezone.utc)
    # Derived health receipts explicitly retain source_observed_at. Select their
    # newest publication, then age that original source time. Generic facts and
    # provider budgets keep observation-time ordering, including late backfills.
    def effective_time(row):
        value = row.get("value")
        if isinstance(value, dict) and "source_observed_at" in value:
            return stamp(row.get("created_at")) or stamp(row.get("observed_at")) or minimum
        return stamp(row.get("observed_at")) or minimum
    return max(rows, key=lambda m: (effective_time(m),
        int(m["id"]) if str(m.get("id", "")).isdigit() else 0), default=None)


def metric_conditions(focus, objective, now):
    reasons = []
    for definition in objective.get("metric_definitions", []):
        if not isinstance(definition, dict):
            continue
        alert_statuses = definition.get("alert_statuses", [])
        alert_statuses = {str(value).lower() for value in alert_statuses} if isinstance(alert_statuses, list) else set()
        max_age = definition.get("max_age_hours")
        max_age = max_age if isinstance(max_age, (int, float)) and not isinstance(max_age, bool) and max_age > 0 else None
        if not alert_statuses and not max_age:
            continue
        row = latest_metric(focus, objective["id"], definition.get("id"))
        label = definition.get("label") or definition.get("id")
        if not row:
            reasons.append(f"{label}: no source observation published (unknown).")
            continue
        value = row.get("value")
        current_status = str(value.get("status", "")).lower() if isinstance(value, dict) else "unknown" if value is None else ""
        observed = value.get("source_observed_at") if isinstance(value, dict) and "source_observed_at" in value else row.get("observed_at")
        source_at = stamp(observed)
        if current_status in alert_statuses:
            reasons.append(f"{label}: {current_status}; source observation {observed or 'unknown'}.")
        if max_age:
            if not source_at or source_at > now + timedelta(minutes=5):
                reasons.append(f"{label}: source time unknown; freshness cannot be established.")
            elif now - source_at > timedelta(hours=max_age):
                reasons.append(f"{label}: source observation {observed} exceeds {max_age:g} hours.")
    return reasons


def published_adapter(focus, objective_id, metric_id, now, max_age):
    row = latest_metric(focus, objective_id, metric_id)
    if not row or not isinstance(row.get("value"), dict):
        return {"status": "unknown", "reason": "No structured source receipt published"}
    value = row["value"]
    observed = value.get("source_observed_at") if "source_observed_at" in value else row.get("observed_at")
    source_at = stamp(observed)
    current_status = value.get("status", "unknown")
    if not source_at or source_at > now + timedelta(minutes=5):
        current_status = "unknown"
    elif now - source_at > timedelta(hours=max_age) and current_status not in ("failed", "unknown"):
        current_status = "stale"
    return {"status": current_status, "source_observed_at": observed,
        "reason": "Published source receipt only; reconciler did not execute the source job", "metric_id": metric_id}


def retry(call, sleep=time.sleep):
    for attempt in range(3):
        try:
            return call()
        except RemoteError as error:
            if not error.retryable or attempt == 2:
                raise
            sleep(2 ** attempt)


def request_json(url, payload, headers):
    request = urllib.request.Request(url, data=json.dumps(payload).encode(), method="POST",
        headers={"Content-Type": "application/json", **headers})
    try:
        with urllib.request.urlopen(request, timeout=15) as response:
            return json.loads(response.read())
    except urllib.error.HTTPError as error:
        # Never emit request bodies/headers or remote bodies that may echo them.
        raise RemoteError(f"remote HTTP {error.code}", error.code in (408, 429) or error.code >= 500) from None
    except (urllib.error.URLError, TimeoutError, OSError):
        raise RemoteError("remote network unavailable", True) from None
    except ValueError:
        raise RemoteError("remote response was not JSON", True) from None


def rpc(name, args):
    try:
        agent_token = swd.token()
        api_key = os.environ.get("OWNER_LOOP_APIKEY") or swd.KEY_FILE.read_text().strip()
    except (swd.LoopError, OSError):
        raise RemoteError("owner-loop credential unavailable") from None
    return request_json(f"{swd.SUPABASE_URL}/rest/v1/rpc/{name}", {"p_token": agent_token, **args}, {"apikey": api_key})


def linear_snapshot(issue_ids):
    key = os.environ.get("LINEAR_API_KEY")
    if not key:
        raise RemoteError("LINEAR_API_KEY is not configured")
    if any(not ISSUE_RE.fullmatch(issue_id) for issue_id in issue_ids):
        raise RemoteError("invalid tracked Linear issue identifier")
    records = []
    # One bounded query per batch; never scan the entire workspace.
    for start in range(0, len(issue_ids), 40):
        batch = issue_ids[start:start + 40]
        query = "query PortfolioSnapshot {" + " ".join(
            f"i{i}: issue(id:{json.dumps(identifier)}) {{ id identifier title url updatedAt dueDate state {{ name type }} }}"
            for i, identifier in enumerate(batch)) + "}"
        result = retry(lambda: request_json("https://api.linear.app/graphql", {"query": query}, {"Authorization": key}))
        if result.get("errors"):
            raise RemoteError("Linear returned GraphQL errors; prior snapshot retained")
        data = result.get("data")
        if not isinstance(data, dict) or any(not isinstance(data.get(f"i{i}"), dict) for i in range(len(batch))):
            raise RemoteError("Linear returned incomplete issue data; prior snapshot retained")
        records.extend(data[f"i{i}"] for i in range(len(batch)))
    return records


@contextmanager
def run_lock(directory):
    directory.mkdir(parents=True, exist_ok=True, mode=0o700)
    with open(directory / "reconcile.lock", "a+") as lock:
        os.chmod(lock.name, 0o600)
        try:
            fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:
            yield False
            return
        try:
            yield True
        finally:
            fcntl.flock(lock, fcntl.LOCK_UN)


def save_state(path, state):
    temporary = path.with_suffix(".tmp")
    fd = os.open(temporary, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
    with os.fdopen(fd, "w") as output:
        json.dump(state, output, sort_keys=True)
        output.flush()
        os.fsync(output.fileno())
    temporary.replace(path)


def load_state(path):
    if not path.exists():
        return {"pending": [], "done": {}, "alerts": {}}
    try:
        state = json.loads(path.read_text())
    except (OSError, ValueError):
        raise RemoteError("reconciler state is unreadable; preserve it and recover before publishing") from None
    if (not isinstance(state, dict) or not isinstance(state.get("pending"), list)
            or not isinstance(state.get("done"), dict) or not isinstance(state.get("alerts"), dict)):
        raise RemoteError("reconciler state has an invalid shape; recover before publishing")
    return state


class Reconciler:
    def __init__(self, state, save, call=rpc, fetch_linear=linear_snapshot, sleep=time.sleep):
        self.state, self.save, self.call, self.fetch_linear, self.sleep = state, save, call, fetch_linear, sleep
        self.writes = 0

    def read(self, name, args):
        return retry(lambda: self.call(name, args), self.sleep)

    def enqueue(self, key, name, args, effect=None):
        if key in self.state["done"] or any(p["key"] == key for p in self.state["pending"]):
            return
        self.state["pending"].append({"key": key, "name": name, "args": args, "effect": effect})
        self.save()

    def drain(self, now):
        while self.state["pending"]:
            pending = self.state["pending"][0]
            try:
                result = self.read(pending["name"], pending["args"])
            except RemoteError as error:
                # A previous successful DROP whose response was lost is already clear.
                if pending["name"] == "owner_loop_transition" and pending["args"]["p_action"] == "drop":
                    current = self.read("owner_loop_get", {"p_ref": pending["args"]["p_ref"]})
                    if current.get("status") not in ("done", "dropped"):
                        raise error
                    result = current
                else:
                    raise
            effect = pending.get("effect")
            if effect and effect["action"] == "alert":
                self.state["alerts"][effect["objective"]] = {"hash": effect["hash"], "ref": result["ref"]}
            elif effect and effect["action"] == "clear":
                self.state["alerts"].pop(effect["objective"], None)
            self.state["done"][pending["key"]] = iso(now)
            self.state["pending"].pop(0)
            self.writes += 1
            self.save()

    def concerns(self, focus, now):
        grouped = {}
        for objective in focus["objectives"]:
            if objective["status"] == "complete":
                continue
            reasons = []
            for field, label in ((("target_at", "Delivery target"), ("review_at", "Review")) if objective["status"] == "active" else (("review_at", "Review"),)):
                due = stamp(objective.get(field))
                if due and due < now:
                    reasons.append(f"{label} overdue since {objective[field]}.")
            reports = [stamp(r.get("created_at")) for r in focus["reports"] if r["objective_id"] == objective["id"]]
            checkpoints = [stamp(l.get("renewed_at")) for l in focus["leases"] if l["objective_id"] == objective["id"] and l.get("checkpoint")]
            activity = max([d for d in reports + checkpoints + [stamp(objective.get("created_at"))] if d], default=now)
            if objective["status"] == "active" and now - activity > timedelta(hours=24):
                reasons.append(f"No progress checkpoint/report since {iso(activity)}.")
            if objective["status"] == "active":
                reasons.extend(metric_conditions(focus, objective, now))
            for lease in focus["leases"]:
                expiry = stamp(lease.get("expires_at"))
                if lease["objective_id"] == objective["id"] and not lease.get("released_at") and expiry and expiry <= now:
                    reasons.append(f"{lease['issue_id']} claim expired at {lease['expires_at']}; inspect checkpoint and writer before recovery.")
            if reasons:
                grouped[objective["id"]] = {"objective": objective, "reasons": reasons}
        return grouped

    def alert_changes(self, concerns):
        for objective_id, concern in concerns.items():
            objective = concern["objective"]
            body = "\n".join(concern["reasons"])
            fingerprint = digest(body)
            prior = self.state["alerts"].get(objective_id)
            if prior and prior["hash"] == fingerprint:
                continue
            key = f"alert:{objective_id}:{fingerprint}"
            # A cleared condition may recur, or an open condition can return to
            # an earlier shape. Its old delivery receipt must not suppress it.
            self.state["done"].pop(key, None)
            self.enqueue(key, "owner_loop_ask", {"p_item": {"kind": "alert", "project": objective["project"],
                "title": f"Project check-in: {objective['title']}", "body": body,
                "origin_agent": "portfolio-reconciler", "options": [],
                "dedupe_key": f"portfolio-reconcile:{objective_id}"}},
                {"action": "alert", "objective": objective_id, "hash": fingerprint})
        for objective_id, prior in list(self.state["alerts"].items()):
            if objective_id not in concerns:
                self.enqueue(f"clear:{objective_id}:{prior['ref']}", "owner_loop_transition",
                    {"p_ref": prior["ref"], "p_action": "drop", "p_actor": "portfolio-reconciler", "p_note": "Current source check cleared these conditions."},
                    {"action": "clear", "objective": objective_id})

    def refresh_linear(self, focus, now):
        state = self.state.get("linear", {})
        attempted = stamp(state.get("attempted_at"))
        if attempted and now - attempted < timedelta(hours=1):
            return state
        tracked = sorted({i for o in focus["objectives"] for i in o.get("issue_ids", [])})
        state = {**state, "attempted_at": iso(now), "tracked_count": len(tracked)}
        try:
            if not tracked:
                raise RemoteError("No Linear issue IDs configured")
            records = self.fetch_linear(tracked)
            state.update(status="ok", checked_at=iso(now), issues=records, error=None)
        except RemoteError as error:
            state.update(status="stale" if state.get("checked_at") else "unknown", error=str(error))
        self.state["linear"] = state
        self.save()
        return state

    def marketing(self, now, focus=None):
        path = os.environ.get("PORTFOLIO_MARKETING_SNAPSHOT")
        if not path:
            if focus:
                return published_adapter(focus, "advertising-reset-push", "approved_coverage", now, 24)
            return {"status": "unknown", "reason": "No automatic Metricool/Meta refresh adapter; saved dashboard snapshot unchanged"}
        try:
            saved = json.loads(Path(path).read_text())
            checked = saved.get("checked_at_utc")
            when = stamp(checked)
            if not when or when > now:
                raise ValueError("missing or future check time")
            return {"status": "stale" if now - when > timedelta(hours=24) else "saved_check", "checked_at": checked,
                "reason": "Saved snapshot only; reconciler did not refresh Metricool or Meta"}
        except (OSError, ValueError, AttributeError):
            return {"status": "unknown", "reason": "Configured marketing snapshot unavailable or invalid; no refresh performed"}

    def publish_metrics(self, control, adapters, now):
        if not control:
            return
        hour = now.astimezone(timezone.utc).strftime("%Y-%m-%dT%H")
        for name, value in (("linear_snapshot", adapters["linear"]), ("adapter_health", adapters)):
            key = f"portfolio:{name}:{hour}"
            observation = {"objective_id": CONTROL, "metric_id": name,
                "value": value, "observed_at": iso(now), "source": "portfolio-reconciler (source check times retained)",
                "evidence": []}
            # Local state emits once per hour; a preflight and a new runtime can
            # observe different facts in that hour. Only identical payload retries
            # share a server idempotency key. Persist the exact payload in outbox.
            observation["idempotency_key"] = key + ":" + digest(observation)
            self.enqueue(key, "portfolio_metric", {"p_observation": observation})

    def publish_reports(self, focus, control, concerns, adapters, now):
        if not control or not control.get("issue_ids"):
            return ["portfolio-control objective with a Linear issue ID is required for durable digests"]
        local = now.astimezone(ET)
        slots = []
        if local.hour >= 17:
            slots.append((f"daily:{local.date()}", "Daily portfolio digest"))
        if local.weekday() >= 4 and (local.weekday() > 4 or local.hour >= 16):
            year, week, _ = local.isocalendar()
            slots.append((f"weekly:{year}-W{week:02}", "Weekly portfolio and parked-opportunity review receipt"))
        active = [o["id"] for o in focus["objectives"] if o["status"] == "active"]
        parked = [o["id"] for o in focus["objectives"] if o["status"] == "paused"]
        for slot, title in slots:
            key = f"portfolio:{slot}"
            report = {"issue_id": control["issue_ids"][0], "objective_id": CONTROL, "session_id": "portfolio-reconciler",
                "agent": "system", "result": f"{title}: {len(active)} active objectives; {len(concerns)} need attention.",
                "evidence": ["https://dashboard.strandautomationworks.com/focus", "https://dashboard.strandautomationworks.com/timeline"],
                "validation": json.dumps({"checked_at": iso(now), "adapters": adapters}, sort_keys=True),
                "remaining": json.dumps({key: value["reasons"] for key, value in concerns.items()}, sort_keys=True),
                "next_action": "Inspect attention items and next review dates; update Linear and publish evidence."}
            if slot.startswith("weekly"):
                report["remaining"] += "\nParked objectives: " + (", ".join(parked) or "none recorded")
                report["remaining"] += "\nOpportunity research is unknown: no scouting adapter ran. This is a review receipt, not new market/technology research."
            report["idempotency_key"] = key
            self.enqueue(key, "portfolio_report", {"p_report": report})
        return []

    def run(self, now):
        self.drain(now)  # recover exact pending payloads before making new observations
        focus = self.read("portfolio_focus", {"p_project": "portfolio"})
        if not isinstance(focus, dict) or any(not isinstance(focus.get(k), list) for k in ("objectives", "reports", "leases", "metrics")):
            raise RemoteError("portfolio focus unavailable or invalid; no empty-success fallback")
        control = next((o for o in focus["objectives"] if o["id"] == CONTROL), None)
        concerns = self.concerns(focus, now)
        self.alert_changes(concerns)
        adapters = {"linear": self.refresh_linear(focus, now), "marketing": self.marketing(now, focus),
            "scanners": published_adapter(focus, "kc-reset-push", "scheduled_scan", now, 8),
            "collector": published_adapter(focus, "kc-reset-push", "source_freshness", now, 6),
            "tech_scout_receipt": published_adapter(focus, CONTROL, "tech_scout_freshness", now, 192),
            "opportunities": {"status": "unknown", "reason": "No automatic opportunity research performed"}}
        self.publish_metrics(control, adapters, now)
        warnings = self.publish_reports(focus, control, concerns, adapters, now)
        self.drain(now)
        completed = datetime.now(timezone.utc)
        health = {"objective_id": CONTROL, "metric_id": "reconciler_health", "value": {"status": "completed",
            "completed_at": iso(completed), "objectives_checked": len(focus["objectives"]), "source_jobs_executed": False},
            "observed_at": iso(completed), "source": "Actual portfolio reconciler completion; source execution claims remain with source receipts", "evidence": []}
        health["idempotency_key"] = "portfolio:reconciler-health:" + digest(health)
        self.enqueue(health["idempotency_key"], "portfolio_metric", {"p_observation": health})
        self.drain(completed)
        self.state["last_completed_at"] = iso(completed)
        self.state["done"] = {k: v for k, v in self.state["done"].items() if stamp(v) and now - stamp(v) < timedelta(days=60)}
        self.save()
        return {"status": "completed", "checked_at": iso(now), "objectives_checked": len(focus["objectives"]),
            "attention_objectives": list(concerns), "writes": self.writes, "pending_writes": len(self.state["pending"]),
            "adapters": adapters, "warnings": warnings}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--state-dir", type=Path, default=Path(os.environ.get("PORTFOLIO_STATE_DIR", "~/.cache/strandworks/portfolio-control")).expanduser())
    args = parser.parse_args()
    now = datetime.now(timezone.utc)
    with run_lock(args.state_dir) as acquired:
        if not acquired:
            print(json.dumps({"status": "skipped_overlap", "checked_at": iso(now)}))
            return 0
        path = args.state_dir / "state.json"
        try:
            state = load_state(path)
            reconciler = Reconciler(state, lambda: save_state(path, state))
            result = reconciler.run(now)
        except RemoteError as error:
            result = {"status": "failed", "checked_at": iso(now), "error": str(error)}
            save_state(args.state_dir / "latest.json", result)
            print(json.dumps(result))
            return 1
        save_state(args.state_dir / "latest.json", result)
        print(json.dumps(result))
        return 0


if __name__ == "__main__":
    sys.exit(main())
