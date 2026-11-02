from datetime import datetime, timezone
import unittest
from meter import verdict

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

if __name__ == "__main__":
    unittest.main()
