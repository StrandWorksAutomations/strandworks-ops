import contextlib
from datetime import datetime, timedelta, timezone
import importlib.util
import io
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

spec = importlib.util.spec_from_file_location("reconcile", Path(__file__).with_name("reconcile.py"))
reconcile = importlib.util.module_from_spec(spec)
spec.loader.exec_module(reconcile)
UTC = timezone.utc
NOW = datetime(2026, 11, 2, 23, 0, tzinfo=UTC)  # Monday 18:00 Eastern


def state():
    return {"pending": [], "done": {}, "alerts": {}}


def focus():
    return {"checked_at": NOW.isoformat(), "objectives": [
        {"id": "portfolio-control", "project": "portfolio", "title": "Portfolio control", "status": "active", "created_at": NOW.isoformat(), "issue_ids": ["STR-92000"]},
        {"id": "kc-reliability", "project": "highest-paying", "title": "Reliable search", "status": "active", "created_at": NOW.isoformat(), "target_at": (NOW - timedelta(hours=1)).isoformat(), "issue_ids": ["STR-92001"]},
    ], "metrics": [], "reports": [], "leases": [], "owner_loop": []}


class FakeRemote:
    def __init__(self):
        self.focus = focus()
        self.calls = []
        self.results = {}
        self.fail_after_commit = None
        self.refs = {}

    def __call__(self, name, args):
        self.calls.append((name, json.loads(json.dumps(args))))
        if name == "portfolio_focus":
            return self.focus
        if name == "owner_loop_ask":
            key = args["p_item"]["dedupe_key"]
            result = {"ref": self.refs.get(key, f"D-{len(self.refs) + 1:04}"), "status": "open"}
            self.refs[key] = result["ref"]
            return result
        if name == "owner_loop_transition":
            return {"ref": args["p_ref"], "status": "dropped"}
        if name in ("portfolio_report", "portfolio_metric"):
            payload = args.get("p_report") or args["p_observation"]
            key = payload["idempotency_key"]
            if key in self.results and self.results[key] != payload:
                raise reconcile.RemoteError("conflicting idempotency payload")
            self.results[key] = payload
            if self.fail_after_commit == name:
                self.fail_after_commit = None
                raise reconcile.RemoteError("uncertain response")
            return {"id": key}
        raise AssertionError(name)


class ReconcilerTests(unittest.TestCase):
    def runner(self, remote=None, saved=None):
        remote = remote or FakeRemote()
        saved = saved or state()
        self.linear_calls = []
        def linear(ids):
            self.linear_calls.append(ids)
            return [{"identifier": i, "state": {"name": "In Progress", "type": "started"}} for i in ids]
        return reconcile.Reconciler(saved, lambda: None, remote, linear, lambda _: None), remote, saved

    def test_distinct_runtime_observations_in_same_hour_do_not_collide(self):
        remote = FakeRemote()
        first, _, _ = self.runner(remote)
        first.publish_metrics(remote.focus["objectives"][0], {"linear": {"status": "unknown"}}, NOW)
        first.drain(NOW)
        second, _, _ = self.runner(remote)
        second.publish_metrics(remote.focus["objectives"][0], {"linear": {"status": "ok"}}, NOW + timedelta(minutes=1))
        second.drain(NOW + timedelta(minutes=1))
        self.assertEqual(len(remote.results), 4)

    def test_repeated_failure_receipts_are_quiet_but_recovery_and_new_fault_alert(self):
        runner, remote, saved = self.runner()
        objective = remote.focus["objectives"][1]
        objective.pop("target_at")
        objective["metric_definitions"] = [{"id": "scan", "label": "Scan", "alert_statuses": ["failed", "unknown"]}]
        metric = {"objective_id": objective["id"], "metric_id": "scan", "value": {"status": "failed", "source_observed_at": NOW.isoformat()}, "observed_at": NOW.isoformat()}
        remote.focus["metrics"] = [metric]
        runner.run(NOW)
        metric["value"]["source_observed_at"] = (NOW + timedelta(minutes=15)).isoformat()
        runner.run(NOW + timedelta(minutes=15))
        self.assertEqual(len([name for name, _ in remote.calls if name == "owner_loop_ask"]), 1)
        metric["value"]["status"] = "ok"
        runner.run(NOW + timedelta(minutes=30))
        self.assertNotIn(objective["id"], saved["alerts"])
        metric["value"]["status"] = "unknown"
        runner.run(NOW + timedelta(minutes=45))
        self.assertEqual(len([name for name, _ in remote.calls if name == "owner_loop_ask"]), 2)

    def test_scan_adapter_allows_the_existing_13_hour_overnight_gap(self):
        runner, remote, _ = self.runner()
        source_at = (NOW - timedelta(hours=13)).isoformat()
        remote.focus["metrics"] = [{"objective_id": "kc-reset-push", "metric_id": "scheduled_scan", "observed_at": source_at,
            "value": {"status": "ok", "source_observed_at": source_at}}]
        self.assertEqual(runner.run(NOW)["adapters"]["scanners"]["status"], "ok")

    def test_parked_objective_still_requires_dated_review(self):
        runner, remote, _ = self.runner()
        objective = remote.focus["objectives"][1]
        objective.update(status="paused", review_at=(NOW - timedelta(hours=1)).isoformat(), created_at=(NOW - timedelta(days=3)).isoformat())
        reasons = runner.concerns(remote.focus, NOW)["kc-reliability"]["reasons"]
        self.assertEqual(len(reasons), 1)
        self.assertIn("Review overdue", reasons[0])

    def test_unchanged_run_is_quiet_and_linear_is_hourly(self):
        runner, remote, saved = self.runner()
        first = runner.run(NOW)
        before = len(remote.calls)
        runner.writes = 0
        second = runner.run(NOW + timedelta(minutes=15))
        self.assertEqual(first["attention_objectives"], ["kc-reliability"])
        self.assertEqual(second["writes"], 1)  # actual runner completion heartbeat, no repeated alerts
        self.assertEqual(len(self.linear_calls), 1)
        extra = remote.calls[before:]
        self.assertEqual([name for name, _ in extra], ["portfolio_focus", "portfolio_metric"])
        self.assertEqual(extra[1][1]["p_observation"]["metric_id"], "reconciler_health")
        self.assertEqual(second["adapters"]["marketing"]["status"], "unknown")
        self.assertEqual(second["adapters"]["scanners"]["status"], "unknown")

    def test_changed_conditions_clear_and_can_recur(self):
        runner, remote, saved = self.runner()
        runner.run(NOW)
        original_due = remote.focus["objectives"][1].pop("target_at")
        runner.run(NOW + timedelta(minutes=15))
        self.assertNotIn("kc-reliability", saved["alerts"])
        self.assertTrue(any(name == "owner_loop_transition" for name, _ in remote.calls))
        remote.focus["objectives"][1]["target_at"] = original_due
        runner.run(NOW + timedelta(minutes=30))
        asks = [args for name, args in remote.calls if name == "owner_loop_ask"]
        self.assertEqual(len(asks), 2)

    def test_expired_lease_and_old_progress_survive_idle_chat(self):
        runner, remote, saved = self.runner()
        remote.focus["objectives"][1]["created_at"] = (NOW - timedelta(days=3)).isoformat()
        remote.focus["leases"] = [{"objective_id": "kc-reliability", "issue_id": "STR-92001", "expires_at": (NOW - timedelta(days=2)).isoformat(),
            "renewed_at": (NOW - timedelta(days=2, hours=1)).isoformat(), "checkpoint": "Local build retained", "released_at": None}]
        concerns = runner.concerns(remote.focus, NOW)
        self.assertTrue(any("claim expired" in reason for reason in concerns["kc-reliability"]["reasons"]))
        self.assertTrue(any("No progress" in reason for reason in concerns["kc-reliability"]["reasons"]))
        self.assertEqual(remote.focus["leases"][0]["checkpoint"], "Local build retained")

    def test_uncertain_report_response_retries_exact_saved_payload(self):
        runner, remote, saved = self.runner()
        remote.fail_after_commit = "portfolio_report"
        with self.assertRaisesRegex(reconcile.RemoteError, "uncertain"):
            runner.run(NOW)
        pending = json.loads(json.dumps(saved["pending"][0]))
        recovered = reconcile.Reconciler(saved, lambda: None, remote, runner.fetch_linear, lambda _: None)
        recovered.run(NOW + timedelta(minutes=15))
        report_calls = [args for name, args in remote.calls if name == "portfolio_report"]
        self.assertEqual(report_calls[0], report_calls[1])
        self.assertEqual(report_calls[1], pending["args"])
        self.assertEqual(len([key for key in remote.results if "daily" in key]), 1)
        self.assertFalse(saved["pending"])

    def test_linear_failure_retains_prior_source_time_and_data(self):
        runner, remote, saved = self.runner()
        runner.run(NOW)
        old = json.loads(json.dumps(saved["linear"]))
        def unavailable(_):
            raise reconcile.RemoteError("Linear unavailable")
        runner.fetch_linear = unavailable
        result = runner.run(NOW + timedelta(hours=1))
        self.assertEqual(result["adapters"]["linear"]["status"], "stale")
        self.assertEqual(saved["linear"]["checked_at"], old["checked_at"])
        self.assertEqual(saved["linear"]["issues"], old["issues"])

    def test_weekly_four_pm_and_daily_five_pm_use_eastern(self):
        runner, remote, saved = self.runner()
        friday = datetime(2026, 11, 6, 20, 59, tzinfo=UTC)
        runner.run(friday)
        self.assertFalse(any("weekly" in key for key in remote.results))
        runner.run(friday + timedelta(minutes=1))
        self.assertTrue(any("weekly" in key for key in remote.results))
        self.assertFalse(any("daily" in key for key in remote.results))
        runner.run(friday + timedelta(hours=1, minutes=1))
        self.assertTrue(any("daily" in key for key in remote.results))
        weekly = next(value for key, value in remote.results.items() if "weekly" in key)
        self.assertIn("no scouting adapter ran", weekly["remaining"])

    def test_focus_failure_is_not_empty_success(self):
        runner, remote, saved = self.runner()
        def unavailable(name, args):
            raise reconcile.RemoteError("source unavailable")
        runner.call = unavailable
        with self.assertRaisesRegex(reconcile.RemoteError, "unavailable"):
            runner.run(NOW)
        self.assertNotIn("last_completed_at", saved)

    def test_metric_policy_detects_failure_and_missing_laptop_publication(self):
        runner, remote, _ = self.runner()
        objective = remote.focus["objectives"][1]
        objective.pop("target_at")
        objective["metric_definitions"] = [{"id": "scan", "label": "Scheduled scan", "alert_statuses": ["failed", "unknown", "stale"], "max_age_hours": 8}]
        remote.focus["metrics"] = [{"id": 1, "objective_id": objective["id"], "metric_id": "scan", "observed_at": (NOW - timedelta(hours=1)).isoformat(), "value": {"status": "failed", "source_observed_at": (NOW - timedelta(hours=1)).isoformat()}}]
        self.assertIn("failed", " ".join(runner.concerns(remote.focus, NOW)[objective["id"]]["reasons"]))
        remote.focus["metrics"][0]["value"]["status"] = "ok"
        later = NOW + timedelta(hours=9)
        self.assertIn("exceeds 8 hours", " ".join(runner.concerns(remote.focus, later)[objective["id"]]["reasons"]))
        self.assertEqual(reconcile.published_adapter(remote.focus, objective["id"], "scan", later, 8)["status"], "stale")
        remote.focus["metrics"] = []
        self.assertIn("no source observation", " ".join(runner.concerns(remote.focus, NOW)[objective["id"]]["reasons"]))

    def test_receipt_time_is_used_instead_of_recent_publication_time(self):
        objective = {"id": "kc", "metric_definitions": [{"id": "scan", "max_age_hours": 1}]}
        recent = NOW.isoformat()
        old = (NOW - timedelta(days=2)).isoformat()
        data = {"metrics": [{"id": 10, "objective_id": "kc", "metric_id": "scan", "observed_at": recent,
            "value": {"status": "ok", "source_observed_at": old}}]}
        self.assertIn(old, " ".join(reconcile.metric_conditions(data, objective, NOW)))
        self.assertEqual(reconcile.published_adapter(data, "kc", "scan", NOW, 1)["status"], "stale")

    def test_equal_source_time_uses_latest_record_and_nonpolicy_metrics_are_quiet(self):
        objective = {"id": "kc", "metric_definitions": [{"id": "scan", "alert_statuses": ["failed"]}, {"id": "unvalidated_accuracy"}]}
        data = {"metrics": [{"id": 9, "objective_id": "kc", "metric_id": "scan", "observed_at": NOW.isoformat(), "value": {"status": "ok"}},
            {"id": 10, "objective_id": "kc", "metric_id": "scan", "observed_at": NOW.isoformat(), "value": {"status": "failed"}}]}
        self.assertEqual(len(reconcile.metric_conditions(data, objective, NOW)), 1)
        self.assertIn("failed", reconcile.metric_conditions(data, objective, NOW)[0])

    def test_new_publication_of_old_failure_is_not_hidden_by_recent_manual_inspection(self):
        data = {"metrics": [{"id": 9, "objective_id": "kc", "metric_id": "scan", "observed_at": NOW.isoformat(),
            "created_at": NOW.isoformat(), "value": {"status": "ok"}},
            {"id": 10, "objective_id": "kc", "metric_id": "scan", "observed_at": (NOW - timedelta(hours=5)).isoformat(),
                "created_at": (NOW + timedelta(minutes=1)).isoformat(), "value": {"status": "failed", "source_observed_at": (NOW - timedelta(hours=5)).isoformat()}}]}
        self.assertEqual(reconcile.latest_metric(data, "kc", "scan")["value"]["status"], "failed")

    def test_late_backfilled_generic_facts_and_provider_budgets_keep_observation_order(self):
        for current, backfill in ((12, 99), ({"remaining_percent": 35}, {"remaining_percent": 90})):
            data = {"metrics": [{"id": 9, "objective_id": "portfolio", "metric_id": "fact", "observed_at": NOW.isoformat(),
                "created_at": NOW.isoformat(), "value": current},
                {"id": 10, "objective_id": "portfolio", "metric_id": "fact", "observed_at": (NOW - timedelta(days=2)).isoformat(),
                    "created_at": (NOW + timedelta(minutes=1)).isoformat(), "value": backfill}]}
            self.assertEqual(reconcile.latest_metric(data, "portfolio", "fact")["value"], current)

    def test_retry_has_bounded_backoff_and_permanent_failures_stop(self):
        attempts, sleeps = [], []
        def transient():
            attempts.append(1)
            raise reconcile.RemoteError("transient", True)
        with self.assertRaises(reconcile.RemoteError):
            reconcile.retry(transient, sleeps.append)
        self.assertEqual(len(attempts), 3)
        self.assertEqual(sleeps, [1, 2])
        attempts.clear()
        def permanent():
            attempts.append(1)
            raise reconcile.RemoteError("bad auth")
        with self.assertRaises(reconcile.RemoteError):
            reconcile.retry(permanent, sleeps.append)
        self.assertEqual(len(attempts), 1)

    def test_overlap_lock_and_corrupt_state_fail_closed(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory)
            with reconcile.run_lock(path) as first:
                with reconcile.run_lock(path) as second:
                    self.assertTrue(first)
                    self.assertFalse(second)
            with reconcile.run_lock(path) as third:
                self.assertTrue(third)
            (path / "state.json").write_text("not json")
            with self.assertRaisesRegex(reconcile.RemoteError, "unreadable"):
                reconcile.load_state(path / "state.json")

    def test_graphql_partial_errors_do_not_count_as_success(self):
        with patch.dict(reconcile.os.environ, {"LINEAR_API_KEY": "test-only"}), patch.object(reconcile, "request_json", return_value={"data": {"i0": {}}, "errors": [{"message": "failed"}]}):
            with self.assertRaisesRegex(reconcile.RemoteError, "GraphQL errors"):
                reconcile.linear_snapshot(["STR-92000"])

    def test_failed_run_writes_failure_snapshot_without_secrets(self):
        with tempfile.TemporaryDirectory() as directory, patch.object(reconcile.sys, "argv", ["reconcile.py", "--state-dir", directory]), patch.object(reconcile, "rpc", side_effect=reconcile.RemoteError("credential unavailable")), contextlib.redirect_stdout(io.StringIO()) as output:
            # Constructor defaults are bound at definition time; replace its class for this test.
            original = reconcile.Reconciler
            def make(state, save):
                return original(state, save, call=lambda *_: (_ for _ in ()).throw(reconcile.RemoteError("credential unavailable")))
            with patch.object(reconcile, "Reconciler", side_effect=make):
                self.assertEqual(reconcile.main(), 1)
            self.assertEqual(json.loads((Path(directory) / "latest.json").read_text())["status"], "failed")
            self.assertEqual(json.loads(output.getvalue())["error"], "credential unavailable")


if __name__ == "__main__":
    unittest.main()
