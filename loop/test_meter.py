from datetime import datetime, timezone
import copy
import json
from pathlib import Path
import unittest
from unittest.mock import patch
import meter
from meter import verdict, metric_observation

class MeterTests(unittest.TestCase):
    def setUp(self):
        self.now = datetime(2026, 11, 2, 18, tzinfo=timezone.utc)
        self.budget = {"stop_at_used": 93.2, "reset_at": "2026-11-04T06:35:27Z", "stop_at": "2026-11-04T06:05:27Z"}
        self.snapshot = {"used_percent": 66, "observed_at": "2026-11-02T17:00:00Z", "reset_at": self.budget["reset_at"]}
    def test_reserve_is_fixed_not_recomputed_each_packet(self):
        self.assertEqual(verdict(self.snapshot, self.budget, self.now)["points_until_stop"], 27.2)
        self.assertFalse(verdict({**self.snapshot, "used_percent": 93.2}, self.budget, self.now)["allowed"])
    def test_missing_stale_reset_and_cutoff_fail_closed(self):
        self.assertFalse(verdict(None, self.budget, self.now)["allowed"])
        self.assertFalse(verdict({**self.snapshot, "observed_at": "2026-11-02T15:00:00Z"}, self.budget, self.now)["allowed"])
        self.assertFalse(verdict({**self.snapshot, "reset_at": "2026-11-11T06:35:27Z"}, self.budget, self.now)["allowed"])
        self.assertFalse(verdict(self.snapshot, self.budget, datetime(2026, 11, 4, 6, 6, tzinfo=timezone.utc))["allowed"])

    def claude(self):
        budget = json.loads((Path(__file__).parent / "portfolio-push.json").read_text())["quota"]["claude"]
        return copy.deepcopy(budget["verified_snapshot"]), budget, datetime(2026, 11, 2, 18, 20, tzinfo=timezone.utc)

    def test_verified_default_uses_36_used_without_expanding_original_cap(self):
        snapshot, budget, now = self.claude()
        self.assertIsNone(budget["used_at_kickoff"])
        self.assertIsNone(budget["remaining_at_kickoff"])
        self.assertFalse(budget["kickoff_usage_verified"])
        self.assertEqual(budget["allowed_points"], 28.8)
        self.assertEqual(budget["stop_at_used"], 64.8)
        with patch("builtins.print") as output:
            status = meter.main(["claude"], now=now)
        result = json.loads(output.call_args.args[0])
        self.assertEqual(status, 0)
        self.assertEqual(result["used_percent"], 36)
        self.assertEqual(result["points_until_stop"], 28.8)
        self.assertEqual(result["additional_limits"]["fable"]["used_percent"], 5)
        self.assertEqual(result["additional_limits"]["fable"]["stop_at_used"], 81)
        self.assertEqual(result["reset_at"], "2026-11-03T04:59:00-05:00")
        self.assertEqual(budget["stop_at"], "2026-11-03T04:29:00-05:00")

    def test_either_claude_reserve_stops_work(self):
        snapshot, budget, now = self.claude()
        snapshot["additional_limits"]["fable"]["used_percent"] = 81
        result = verdict(snapshot, budget, now)
        self.assertFalse(result["allowed"])
        self.assertIn("fable", result["reason"])
        snapshot, budget, now = self.claude()
        snapshot["used_percent"] = 64.8
        self.assertFalse(verdict(snapshot, budget, now)["allowed"])

    def test_configured_extra_limit_missing_stale_new_period_or_invalid_fails_closed(self):
        for change in ("missing", "stale", "new_period", "invalid"):
            with self.subTest(change=change):
                snapshot, budget, now = self.claude()
                fable = snapshot["additional_limits"]["fable"]
                if change == "missing":
                    snapshot.pop("additional_limits")
                elif change == "stale":
                    fable["observed_at"] = "2026-11-02T15:00:00Z"
                elif change == "new_period":
                    fable["reset_at"] = "2026-11-10T04:59:00-05:00"
                else:
                    fable["used_percent"] = "5"
                self.assertFalse(verdict(snapshot, budget, now)["allowed"])

    def test_invalid_percentages_and_observation_times_are_rejected(self):
        for bad in (-1, 101, True, "66", float("nan"), float("inf")):
            with self.subTest(used_percent=bad):
                self.assertFalse(verdict({**self.snapshot, "used_percent": bad}, self.budget, self.now)["allowed"])
        for bad in (None, "invalid", "2026-11-02T17:00:00", "2026-11-02T20:00:00Z"):
            with self.subTest(observed_at=bad):
                self.assertFalse(verdict({**self.snapshot, "observed_at": bad}, self.budget, self.now)["allowed"])
        self.assertFalse(verdict("invalid snapshot", self.budget, self.now)["allowed"])

    def test_new_limit_needs_its_own_fixed_configuration(self):
        snapshot, budget, now = self.claude()
        snapshot["additional_limits"]["new_window"] = snapshot["additional_limits"]["fable"]
        self.assertFalse(verdict(snapshot, budget, now)["allowed"])

    def test_default_does_not_fabricate_kickoff_snapshot_when_unverified(self):
        self.assertIsNone(meter.provider_snapshot("claude", {"used_at_kickoff": 64}, Path("unused")))

    def test_stable_full_payload_hash_changes_when_same_observation_becomes_stale(self):
        snapshot, budget, now = self.claude()
        first = metric_observation("claude", snapshot, verdict(snapshot, budget, now))
        same = metric_observation("claude", snapshot, verdict(snapshot, budget, now.replace(minute=30)))
        stale = metric_observation("claude", snapshot, verdict(snapshot, budget, now.replace(hour=21)))
        self.assertEqual(first["idempotency_key"], same["idempotency_key"])
        self.assertNotEqual(first["idempotency_key"], stale["idempotency_key"])
        self.assertEqual(first["observed_at"], stale["observed_at"])
        self.assertFalse(stale["value"]["allowed"])
        changed = copy.deepcopy(first["value"])
        changed["additional_limits"]["fable"]["source"] += " corrected source"
        self.assertNotEqual(first["idempotency_key"], metric_observation("claude", snapshot, changed)["idempotency_key"])

if __name__ == "__main__":
    unittest.main()
