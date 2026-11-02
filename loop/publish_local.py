#!/usr/bin/env python3
"""Publish existing source receipts; never run a scanner, browser, collector or LLM.

Defaults: ~/PROJECTS and ~/Library/Application Support/Kinetic Clinician. Every
source path is overridable below. A file read preserves its source timestamp;
only local_publisher_health records this publisher's actual completion time.
Run from the existing local master, not a second reconciliation scheduler.
"""
import argparse
from datetime import datetime, timedelta, timezone
import glob
import hashlib
import json
import os
from pathlib import Path
import re
import sys
import urllib.error
import urllib.parse
import urllib.request

import reconcile as shared

KC = "kc-reset-push"
ADS = "advertising-reset-push"
CONTROL = "portfolio-control"


def read_json(path):
    raw = Path(path).read_bytes()
    data = json.loads(raw)
    if not isinstance(data, dict):
        raise ValueError("source must be a JSON object")
    return data, hashlib.sha256(raw).hexdigest()


def counts(data, keys):
    return {key: data[key] for key in keys if isinstance(data.get(key), (int, float)) and not isinstance(data[key], bool)}


def safe_counts(data):
    return {str(key): value for key, value in data.items() if isinstance(value, (int, float)) and not isinstance(value, bool)} if isinstance(data, dict) else {}


def status(raw):
    name = str(raw or "").lower()
    if any(word in name for word in ("error", "fail")):
        return "failed"
    if name in ("ok", "success", "succeeded", "complete", "completed", "healthy"):
        return "ok"
    if name in ("partial", "degraded", "warning", "warn"):
        return "degraded"
    return "unknown"


def scanner(data):
    finished = data.get("finished")
    facts = {"status": status(data.get("status")), "source_status": data.get("status"),
        **counts(data, ("groups_scanned", "posts_seen", "candidates", "queued", "drafts")),
        "failed_group_count": len(data.get("failed_groups", [])), "runtime_error_present": bool(data.get("runtime_error"))}
    if facts["runtime_error_present"]:
        facts["status"] = "failed"
    if not finished:
        facts.update(status="unknown", reason="No completed scanner receipt")
    return facts, finished or data.get("started")


def collector(data):
    report = data.get("report", data)
    run = report.get("collector", {})
    links = run.get("link_checks", {})
    facts = {"status": status(run.get("status")), "source_status": run.get("status"),
        "scope": "Collector heartbeat and saved coverage; individual ATS freshness is not established by this receipt",
        "summary": counts(report.get("summary", {}), ("configured_source_rows", "connected_employers", "posting_rows", "public_posting_rows", "posted_pay_rows", "retained_posting_rows", "excluded_inactive_or_expired_rows")),
        "failed_source_count": len(run.get("failed_sources", [])),
        "link_checks": {**counts(links, ("verified_jobs", "total_jobs", "checked_jobs", "unchecked_jobs", "confirmed_invalid_jobs", "due_jobs")),
            "checked_at": links.get("checked_at"), "source_status": links.get("status"), "by_status": safe_counts(links.get("by_status"))}}
    return facts, run.get("finished_at") or report.get("generated_at") or data.get("updated_at")


def source_health(data):
    sources = data.get("sources", [])
    if not isinstance(sources, list):
        raise ValueError("sources must be a list")
    totals = {}
    for source in sources:
        if isinstance(source, dict):
            key = str(source.get("status") or "unknown")
            totals[key] = totals.get(key, 0) + 1
    failed = sum(number for key, number in totals.items() if status(key) == "failed")
    return {"status": "degraded" if failed else "observed", "configured_sources": len(sources), "failed_sources": failed,
        "source_status_counts": totals}, data.get("generated_at")


def quality(data):
    fields = data.get("field_counts", {})
    return {"status": "observed", "scope": "Existing sampled read-only field audit; not full-corpus verification",
        "counts": safe_counts(data.get("counts")), "link_counts": safe_counts(data.get("link_counts")),
        "field_counts": {key: safe_counts(fields.get(key)) for key in ("title", "role", "location", "pay", "date_posted", "schedule", "employer", "employment_type")},
        **counts(data, ("requests", "elapsed_ms"))}, data.get("checked_at")


def marketing(data):
    completeness = data.get("source_completeness", {})
    summary = data.get("summary", {})
    return {"status": "saved_check", "scope": "Saved Metricool snapshot only; no queue refresh or publishing performed",
        "summary": counts(summary, ("content_records", "scheduled_content_records", "reported_published_content_records", "draft_content_records")),
        "queues_checked": completeness.get("queues_checked", []),
        "queue_local_date_start": completeness.get("queue_local_date_start"), "queue_local_date_end": completeness.get("queue_local_date_end"),
        "automatic_refresh_configured": bool(completeness.get("automatic_refresh_configured")),
        "historical_publication_audit_complete": bool(completeness.get("historical_publication_audit_complete")),
        "scheduled_through_at_utc": summary.get("scheduled_through_at_utc")}, data.get("checked_at_utc")


def public_json(url):
    parsed = urllib.parse.urlparse(url)
    if parsed.scheme != "https" or parsed.username or parsed.password:
        raise ValueError("public collector URL must be HTTPS without credentials")
    try:
        with urllib.request.urlopen(url, timeout=12) as response:
            raw = response.read(20 * 1024 * 1024 + 1)
        if len(raw) > 20 * 1024 * 1024:
            raise ValueError("public collector receipt exceeds 20 MB")
        data = json.loads(raw)
        if not isinstance(data, dict):
            raise ValueError("public collector receipt must be an object")
        return data, hashlib.sha256(raw).hexdigest()
    except urllib.error.HTTPError as error:
        raise ValueError(f"public collector HTTP {error.code}") from None
    except (urllib.error.URLError, TimeoutError, OSError):
        raise ValueError("public collector unavailable") from None


class Publisher:
    def __init__(self, state, save, call=shared.rpc, fetch=public_json, clock=lambda: datetime.now(timezone.utc)):
        self.state, self.save, self.call, self.fetch = state, save, call, fetch
        self.clock = clock
        self.state.setdefault("first_seen", {})
        self.state.setdefault("last_condition", {})
        self.writes = 0

    def observation(self, adapter, objective, metric, facts, observed, evidence, now, max_age, file_hash=None):
        source_time = shared.stamp(observed)
        facts = {**facts, "source_observed_at": shared.iso(source_time) if source_time else None}
        if file_hash:
            facts["source_sha256"] = file_hash
        if not source_time or source_time > now + timedelta(minutes=5):
            facts["status"] = "unknown"
            facts.setdefault("reason", "Source observation timestamp unavailable or invalid")
            source_time = None
        elif now - source_time > timedelta(hours=max_age) and facts.get("status") not in ("failed", "unknown"):
            facts.update(status="stale", freshness_reason=f"Source observation exceeds {max_age:g} hours")
        # Unknown-source first-seen time is durable; reading the same unavailable
        # source again does not manufacture a new source observation.
        condition = shared.digest({"adapter": adapter, "facts": facts, "evidence": evidence})
        if source_time:
            timestamp = shared.iso(source_time)
        else:
            if self.state["last_condition"].get(adapter) != condition:
                self.state["first_seen"][condition] = shared.iso(now)
            timestamp = self.state["first_seen"].setdefault(condition, shared.iso(now))
        self.state["last_condition"][adapter] = condition
        payload = {"objective_id": objective, "metric_id": metric, "value": facts, "observed_at": timestamp,
            "source": f"local receipt publisher / {adapter}; original source time retained; no source job executed", "evidence": evidence}
        payload["idempotency_key"] = "local:" + adapter + ":" + shared.digest(payload)
        return payload

    def queue(self, payload):
        key = payload["idempotency_key"]
        if key in self.state["done"] or any(p["key"] == key for p in self.state["pending"]):
            return
        self.state["pending"].append({"key": key, "payload": payload})
        self.save()

    def drain(self, now):
        while self.state["pending"]:
            pending = self.state["pending"][0]
            shared.retry(lambda: self.call("portfolio_metric", {"p_observation": pending["payload"]}))
            self.state["done"][pending["key"]] = shared.iso(now)
            self.state["pending"].pop(0)
            self.writes += 1
            self.save()

    def file_receipt(self, adapter, path, parser, objective, metric, now, max_age):
        try:
            data, source_hash = read_json(path)
            facts, observed = parser(data)
        except (OSError, ValueError, TypeError, AttributeError):
            facts, observed, source_hash = {"status": "unknown", "reason": "Configured source receipt unavailable or invalid"}, None, None
        return self.observation(adapter, objective, metric, facts, observed, [str(path)], now, max_age, source_hash)

    def run(self, args, now):
        self.drain(now)
        receipts = [
            self.file_receipt("kc_scanner", args.scanner, scanner, KC, "scheduled_scan", now, 14),
            self.file_receipt("kc_collector_local", args.collector, collector, KC, "collector_local_health", now, 6),
            self.file_receipt("kc_source_health", args.source_health, source_health, KC, "failed_sources", now, 6),
            self.file_receipt("marketing_saved", args.marketing, marketing, ADS, "approved_coverage", now, 24),
        ]
        matches = sorted(glob.glob(args.quality_glob))
        receipts.append(self.file_receipt("kc_field_quality", matches[-1] if matches else args.quality_glob, quality, KC, "field_coverage", now, 30))
        try:
            if not args.collector_url:
                raise ValueError("public collector adapter disabled")
            data, source_hash = self.fetch(args.collector_url)
            facts, observed = collector(data)
        except (OSError, ValueError, TypeError, AttributeError):
            facts, observed, source_hash = {"status": "unknown", "reason": "Public collector receipt unavailable or disabled"}, None, None
        receipts.append(self.observation("kc_collector_public", KC, "source_freshness", facts, observed,
            [args.collector_url] if args.collector_url else [], now, 6, source_hash))
        scout_matches = sorted(glob.glob(args.tech_scout_glob))
        scout = Path(scout_matches[-1]) if scout_matches else None
        scout_time, scout_hash = None, None
        if scout:
            try:
                match = re.match(r"(\d{4}-\d{2}-\d{2})-(\d{6})-", scout.name)
                if match:
                    scout_time = datetime.strptime("".join(match.groups()), "%Y-%m-%d%H%M%S").replace(tzinfo=timezone.utc).isoformat()
                scout_hash = hashlib.sha256(scout.read_bytes()).hexdigest()
            except (OSError, ValueError):
                scout, scout_time = None, None
        receipts.append(self.observation("tech_scout_saved", CONTROL, "tech_scout_freshness",
            {"status": "saved_check" if scout else "unknown", "scope": "Existing dated tech-scout receipt only; no new research executed"},
            scout_time, [str(scout)] if scout else [args.tech_scout_glob], now, 192, scout_hash))
        for payload in receipts:
            self.queue(payload)
        self.drain(now)
        completed = self.clock()
        health = {"objective_id": CONTROL, "metric_id": "local_publisher_health", "value": {"status": "completed",
            "completed_at": shared.iso(completed), "source_jobs_executed": False,
            "receipts": {p["metric_id"]: {"status": p["value"]["status"], "source_observed_at": p["value"]["source_observed_at"]} for p in receipts}},
            "observed_at": shared.iso(completed), "source": "Actual local receipt publisher completion; no source jobs executed", "evidence": []}
        health["idempotency_key"] = "local:completion:" + shared.digest(health)
        self.queue(health)
        self.drain(completed)
        self.state["last_completed_at"] = shared.iso(completed)
        self.save()
        return {"status": "completed", "completed_at": shared.iso(completed), "writes": self.writes,
            "source_jobs_executed": False, "receipts": health["value"]["receipts"]}


def arguments(argv=None):
    home = Path.home()
    base = argparse.ArgumentParser(add_help=False)
    base.add_argument("--projects-root", type=Path, default=Path(os.environ.get("STRANDWORKS_PROJECTS_ROOT", str(home / "PROJECTS"))))
    base.add_argument("--kc-data-dir", type=Path, default=Path(os.environ.get("PORTFOLIO_KC_DATA_DIR", str(home / "Library/Application Support/Kinetic Clinician"))))
    preliminary, _ = base.parse_known_args(argv)
    root, data = preliminary.projects_root, preliminary.kc_data_dir
    parser = argparse.ArgumentParser(description=__doc__, parents=[base])
    parser.add_argument("--scanner", default=os.environ.get("PORTFOLIO_KC_SCANNER_JSON", str(data / "fb-scan/last-run.json")))
    parser.add_argument("--collector", default=os.environ.get("PORTFOLIO_KC_COLLECTOR_JSON", str(data / "collector/data/jobs/collector/coverage.json")))
    parser.add_argument("--source-health", default=os.environ.get("PORTFOLIO_KC_SOURCE_HEALTH_JSON", str(data / "collector/data/jobs/source-health.json")))
    parser.add_argument("--quality-glob", default=os.environ.get("PORTFOLIO_KC_QUALITY_GLOB", str(data / "job-quality-audit/reports/job-quality-*.json")))
    parser.add_argument("--collector-url", default=os.environ.get("PORTFOLIO_KC_COLLECTOR_URL", "https://kineticclinician.com/api/feed-health"))
    parser.add_argument("--marketing", default=os.environ.get("PORTFOLIO_MARKETING_SNAPSHOT", str(root / "strandworks-ops/registers/marketing-snapshot.json")))
    parser.add_argument("--tech-scout-glob", default=os.environ.get("PORTFOLIO_TECH_SCOUT_GLOB", str(root / "strandworks-ops/briefings/*tech-scout*.md")))
    parser.add_argument("--state-dir", type=Path, default=Path(os.environ.get("PORTFOLIO_PUBLISH_STATE_DIR", str(home / ".cache/strandworks/portfolio-local-publisher"))))
    return parser.parse_args(argv)


def main():
    args = arguments()
    with shared.run_lock(args.state_dir) as acquired:
        if not acquired:
            print(json.dumps({"status": "skipped_overlap"}))
            return 0
        path = args.state_dir / "state.json"
        try:
            saved = shared.load_state(path)
            result = Publisher(saved, lambda: shared.save_state(path, saved)).run(args, datetime.now(timezone.utc))
        except (shared.RemoteError, OSError, ValueError) as error:
            # Source content/credentials are never included in failure output.
            result = {"status": "failed", "checked_at": shared.iso(datetime.now(timezone.utc)), "error": type(error).__name__, "source_jobs_executed": False}
            shared.save_state(args.state_dir / "latest.json", result)
            print(json.dumps(result))
            return 1
        shared.save_state(args.state_dir / "latest.json", result)
        print(json.dumps(result))
        return 0


if __name__ == "__main__":
    sys.exit(main())
