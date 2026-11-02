from datetime import datetime, timedelta, timezone
import importlib.util
import json
from pathlib import Path
import sys
import tempfile
import unittest

sys.path.insert(0, str(Path(__file__).parent))
spec = importlib.util.spec_from_file_location("publish_local", Path(__file__).with_name("publish_local.py"))
publisher = importlib.util.module_from_spec(spec)
spec.loader.exec_module(publisher)
NOW = datetime(2026, 11, 2, 18, 0, tzinfo=timezone.utc)


class PublisherTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)
        self.state = {"pending": [], "done": {}, "alerts": {}}
        self.sent = []
        self.results = {}
        self.clock = NOW
        def call(name, args):
            self.assertEqual(name, "portfolio_metric")
            observation = args["p_observation"]
            key = observation["idempotency_key"]
            if key in self.results:
                self.assertEqual(self.results[key], observation)
            self.results[key] = observation
            self.sent.append(observation)
            return {"id": len(self.results)}
        self.call = call
        self.runner = publisher.Publisher(self.state, lambda: None, call, lambda _: self.coverage(), lambda: self.clock)

    def tearDown(self):
        self.tmp.cleanup()

    def coverage(self):
        return {"generated_at": NOW.isoformat(), "collector": {"status": "partial", "finished_at": NOW.isoformat(), "failed_sources": [{"private": "not copied"}],
            "link_checks": {"checked_at": NOW.isoformat(), "verified_jobs": 4, "total_jobs": 8}}, "summary": {"configured_source_rows": 9}, "cells": [{"secret": "not copied"}]}, "source-hash"

    def write(self, name, data):
        path = self.root / name
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(data))
        return path

    def args(self):
        scan = self.write("scan.json", {"finished": NOW.isoformat(), "status": "RUNTIME_ERROR", "groups_scanned": 0,
            "failed_groups": [], "runtime_error": "private diagnostic", "new_questions": ["private question"], "tokens": {"secret": "not copied"}})
        local = self.write("collector.json", self.coverage()[0])
        health = self.write("health.json", {"generated_at": NOW.isoformat(), "sources": [{"status": "healthy", "url": "private-url"}, {"status": "failed"}]})
        quality = self.write("quality/job-quality-2026-11-02T18-00-00-000Z.json", {"checked_at": NOW.isoformat(), "counts": {"verified": 1, "inconclusive": 19},
            "observations": ["private sample"], "field_counts": {"pay": {"verified": 2, "mismatch": 0, "inconclusive": 18}}})
        marketing = self.write("marketing.json", {"checked_at_utc": NOW.isoformat(), "source_completeness": {"queues_checked": ["tenetrix"], "automatic_refresh_configured": False}, "summary": {"scheduled_content_records": 12}, "posts": ["not copied"]})
        (self.root / "2026-11-02-170000-host-tech-scout.md").write_text("Existing research, not executed by publisher")
        return publisher.arguments(["--scanner", str(scan), "--collector", str(local), "--source-health", str(health), "--quality-glob", str(quality.parent / "job-quality-*.json"),
            "--marketing", str(marketing), "--tech-scout-glob", str(self.root / "*tech-scout.md"), "--state-dir", str(self.root / "state")])

    def test_whitelisted_receipts_preserve_source_time_and_not_private_content(self):
        result = self.runner.run(self.args(), NOW)
        self.assertFalse(result["source_jobs_executed"])
        by_metric = {row["metric_id"]: row for row in self.sent}
        self.assertEqual(by_metric["scheduled_scan"]["value"]["status"], "failed")
        self.assertEqual(by_metric["scheduled_scan"]["observed_at"], NOW.isoformat())
        self.assertEqual(by_metric["source_freshness"]["value"]["status"], "degraded")
        self.assertEqual(by_metric["field_coverage"]["value"]["field_counts"]["pay"]["inconclusive"], 18)
        rendered = json.dumps(self.sent)
        for forbidden in ("private diagnostic", "private question", "private-url", "private sample", "not copied"):
            self.assertNotIn(forbidden, rendered)
        self.assertEqual(by_metric["tech_scout_freshness"]["observed_at"], "2026-11-02T17:00:00+00:00")
        self.assertIn("no new research", by_metric["tech_scout_freshness"]["value"]["scope"])

    def test_rereading_unchanged_files_only_publishes_completion_health(self):
        args = self.args()
        self.runner.run(args, NOW)
        before = len(self.sent)
        self.clock = NOW + timedelta(minutes=15)
        self.runner.run(args, self.clock)
        self.assertEqual([m["metric_id"] for m in self.sent[before:]], ["local_publisher_health"])

    def test_old_file_mtime_cannot_make_source_fresh(self):
        path = self.write("old.json", {"finished": (NOW - timedelta(days=2)).isoformat(), "status": "SUCCESS", "failed_groups": []})
        payload = self.runner.file_receipt("test", path, publisher.scanner, publisher.KC, "scheduled_scan", NOW, 8)
        self.assertEqual(payload["value"]["status"], "stale")
        self.assertEqual(payload["observed_at"], (NOW - timedelta(days=2)).isoformat())

    def test_missing_timestamp_and_receipt_stay_unknown_without_freshening(self):
        path = self.root / "missing.json"
        first = self.runner.file_receipt("test", path, publisher.scanner, publisher.KC, "scheduled_scan", NOW, 8)
        later = self.runner.file_receipt("test", path, publisher.scanner, publisher.KC, "scheduled_scan", NOW + timedelta(hours=2), 8)
        self.assertEqual(first, later)
        self.assertEqual(first["value"]["status"], "unknown")
        self.assertIsNone(first["value"]["source_observed_at"])

    def test_missing_condition_can_recur_after_source_recovery(self):
        path = self.root / "scan.json"
        first = self.runner.file_receipt("test", path, publisher.scanner, publisher.KC, "scheduled_scan", NOW, 8)
        self.write("scan.json", {"finished": NOW.isoformat(), "status": "SUCCESS", "failed_groups": []})
        self.runner.file_receipt("test", path, publisher.scanner, publisher.KC, "scheduled_scan", NOW + timedelta(minutes=15), 8)
        path.unlink()
        recurring = self.runner.file_receipt("test", path, publisher.scanner, publisher.KC, "scheduled_scan", NOW + timedelta(minutes=30), 8)
        self.assertNotEqual(first["idempotency_key"], recurring["idempotency_key"])

    def test_uncertain_response_retains_exact_payload_for_retry(self):
        payload = self.runner.observation("test", publisher.KC, "scheduled_scan", {"status": "ok"}, NOW.isoformat(), [], NOW, 8)
        self.runner.queue(payload)
        def uncertain(name, args):
            self.call(name, args)
            raise publisher.shared.RemoteError("response lost")
        self.runner.call = uncertain
        with self.assertRaises(publisher.shared.RemoteError):
            self.runner.drain(NOW)
        self.assertEqual(self.state["pending"][0]["payload"], payload)
        self.runner.call = self.call
        self.runner.drain(NOW + timedelta(minutes=15))
        self.assertEqual(self.sent[0], self.sent[1])
        self.assertEqual(len(self.results), 1)

    def test_cli_root_overrides_build_all_default_paths(self):
        args = publisher.arguments(["--projects-root", "/tmp/portfolio", "--kc-data-dir", "/tmp/kc"])
        self.assertTrue(args.scanner.startswith("/tmp/kc/"))
        self.assertTrue(args.marketing.startswith("/tmp/portfolio/"))


if __name__ == "__main__":
    unittest.main()
