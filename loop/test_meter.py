from datetime import datetime, timezone, timedelta
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

    def test_one_second_precision_requires_explicit_fixed_configuration(self):
        for seconds in (-1, 1):
            snapshot = {**self.snapshot, "reset_at": (meter.stamp(self.snapshot["reset_at"]) + timedelta(seconds=seconds)).isoformat()}
            self.assertFalse(verdict(snapshot, self.budget, self.now)["allowed"])
            result = verdict(snapshot, {**self.budget, "reset_jitter_seconds": 1}, self.now)
            self.assertTrue(result["allowed"])
            self.assertEqual(result["reset_at"], snapshot["reset_at"])
            self.assertEqual(result["expected_reset_at"], self.budget["reset_at"])
            self.assertEqual(result["stop_at_used"], 93.2)
            self.assertEqual(result["points_until_stop"], 27.2)

    def test_precision_does_not_admit_larger_shifts_or_new_periods(self):
        budget = {**self.budget, "reset_jitter_seconds": 1}
        for seconds in (-604800, -2, 2, 604800):
            snapshot = {**self.snapshot, "reset_at": (meter.stamp(self.snapshot["reset_at"]) + timedelta(seconds=seconds)).isoformat()}
            self.assertFalse(verdict(snapshot, budget, self.now)["allowed"])
        for invalid in (None, True, -1, 2, 60, "1", float("nan"), float("inf")):
            self.assertFalse(verdict(self.snapshot, {**self.budget, "reset_jitter_seconds": invalid}, self.now)["allowed"])

    def test_precision_preserves_freshness_reserve_and_earlier_verified_cutoff(self):
        budget = {**self.budget, "reset_jitter_seconds": 1}
        snapshot = {**self.snapshot, "reset_at": "2026-11-04T06:35:26Z"}
        self.assertFalse(verdict({**snapshot, "used_percent": 93.2}, budget, self.now)["allowed"])
        self.assertFalse(verdict(snapshot, budget, self.now + timedelta(hours=2))["allowed"])
        cutoff = datetime(2026, 11, 4, 6, 5, 26, tzinfo=timezone.utc)
        result = verdict({**snapshot, "observed_at": cutoff.isoformat()}, budget, cutoff)
        self.assertFalse(result["allowed"])
        self.assertEqual(meter.stamp(result["stop_at"]), cutoff)

    def test_minute_match_preserves_raw_reset_and_rejects_other_minutes_and_periods(self):
        budget = {**self.budget, "reset_match_precision": "minute"}
        for second in (0, 27, 29, 59):
            snapshot = {**self.snapshot, "reset_at": "2026-11-04T06:35:%02dZ" % second}
            result = verdict(snapshot, budget, self.now)
            self.assertTrue(result["allowed"])
            self.assertEqual(result["reset_at"], snapshot["reset_at"])
            self.assertEqual(result["stop_at_used"], 93.2)
        for reset in ("2026-11-04T06:34:59Z", "2026-11-04T06:36:00Z", "2026-11-05T06:35:27Z", "2026-11-11T06:35:27Z"):
            self.assertFalse(verdict({**self.snapshot, "reset_at": reset}, budget, self.now)["allowed"])
        for precision in (None, True, "hour", "day"):
            self.assertFalse(verdict(self.snapshot, {**budget, "reset_match_precision": precision}, self.now)["allowed"])

    def test_minute_match_keeps_reserve_freshness_and_earliest_cutoff(self):
        budget = {**self.budget, "reset_match_precision": "minute"}
        snapshot = {**self.snapshot, "reset_at": "2026-11-04T01:35:00-05:00"}
        self.assertTrue(verdict(snapshot, budget, self.now)["allowed"])
        self.assertFalse(verdict({**snapshot, "used_percent": 93.2}, budget, self.now)["allowed"])
        self.assertFalse(verdict(snapshot, budget, self.now + timedelta(hours=2))["allowed"])
        cutoff = datetime(2026, 11, 4, 6, 5, tzinfo=timezone.utc)
        self.assertFalse(verdict({**snapshot, "observed_at": cutoff.isoformat()}, budget, cutoff)["allowed"])

    def test_portfolio_midnight_close_precedes_codex_provider_cutoff(self):
        for current, permitted in ((datetime(2026,11,4,4,59,tzinfo=timezone.utc), True),
                                   (datetime(2026,11,4,5,0,tzinfo=timezone.utc), False)):
            snapshot = {**self.snapshot, "observed_at": current.isoformat()}
            with patch.object(meter, "provider_snapshot", return_value=snapshot), patch("builtins.print") as output:
                code = meter.main(["codex"], now=current)
            result = json.loads(output.call_args.args[0])
            self.assertEqual(result["allowed"], permitted)
            self.assertEqual(code, 0 if permitted else 2)
            self.assertEqual(meter.stamp(result["stop_at"]), datetime(2026,11,4,5,tzinfo=timezone.utc))

    def claude(self):
        budget = json.loads((Path(__file__).parent / "portfolio-push.json").read_text())["quota"]["claude"]
        snapshot = copy.deepcopy(budget["verified_snapshot"])
        return snapshot, budget, meter.stamp(snapshot["observed_at"]) + timedelta(minutes=1)

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
        self.assertEqual(result["reset_at"], "2026-11-03T05:00:00-05:00")
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
        same = metric_observation("claude", snapshot, verdict(snapshot, budget, now + timedelta(minutes=10)))
        stale = metric_observation("claude", snapshot, verdict(snapshot, budget, now + timedelta(hours=3)))
        self.assertEqual(first["idempotency_key"], same["idempotency_key"])
        self.assertNotEqual(first["idempotency_key"], stale["idempotency_key"])
        self.assertEqual(first["observed_at"], stale["observed_at"])
        self.assertFalse(stale["value"]["allowed"])
        changed = copy.deepcopy(first["value"])
        changed["additional_limits"]["fable"]["source"] += " corrected source"
        self.assertNotEqual(first["idempotency_key"], metric_observation("claude", snapshot, changed)["idempotency_key"])

if __name__ == "__main__":
    unittest.main()
