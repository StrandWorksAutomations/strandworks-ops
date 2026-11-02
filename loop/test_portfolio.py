"""Exercise the real migration in an isolated local PostgreSQL cluster; no live credentials."""
import argparse
import concurrent.futures
import importlib.machinery
import importlib.util
import json
from pathlib import Path
import shutil
import socket
import subprocess
import tempfile
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
loader = importlib.machinery.SourceFileLoader("swd", str(ROOT / "loop/swd"))
spec = importlib.util.spec_from_loader(loader.name, loader)
swd = importlib.util.module_from_spec(spec)
loader.exec_module(swd)
TOKEN = "test-only-portfolio-token"


def sql_string(value):
    return "'" + value.replace("'", "''") + "'"


class PortfolioDatabaseTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        if not all(shutil.which(cmd) for cmd in ("initdb", "pg_ctl", "psql")):
            raise unittest.SkipTest("local PostgreSQL tools required")
        cls.tmp = tempfile.TemporaryDirectory(prefix="portfolio-control-test-")
        cls.data = Path(cls.tmp.name) / "data"
        with socket.socket() as sock:
            sock.bind(("127.0.0.1", 0))
            cls.port = sock.getsockname()[1]
        subprocess.run(["initdb", "-D", str(cls.data), "-A", "trust", "-U", "postgres", "--no-locale", "-E", "UTF8"], check=True, capture_output=True)
        subprocess.run(["pg_ctl", "-D", str(cls.data), "-l", str(Path(cls.tmp.name) / "postgres.log"), "-o", f"-k {cls.tmp.name} -p {cls.port} -h '' -c shared_buffers=16MB -c max_connections=10", "-w", "start"], check=True, capture_output=True)
        cls.psql = ["psql", "-X", "-q", "-t", "-A", "-v", "ON_ERROR_STOP=1", "-h", cls.tmp.name, "-p", str(cls.port), "-U", "postgres", "postgres"]
        try:
            cls.run_sql("create role anon; create role authenticated; create role service_role bypassrls; create schema extensions;")
            for filename in sorted(("20261024_owner_loop_v1.sql", "20261024_owner_loop_v2_review_fixes.sql", "20261102_portfolio_control_v1.sql", "20261102_portfolio_project_alias.sql", "20261102_portfolio_reporting_compaction.sql")):
                cls.run_sql((ROOT / "supabase/migrations" / filename).read_text())
            cls.run_sql(f"insert into owner_loop_agent_tokens(token_sha256,label) values(encode(extensions.digest('{TOKEN}','sha256'),'hex'),'test');")
        except BaseException:
            cls.tearDownClass()
            raise

    @classmethod
    def tearDownClass(cls):
        subprocess.run(["pg_ctl", "-D", str(cls.data), "-m", "immediate", "-w", "stop"], capture_output=True)
        cls.tmp.cleanup()

    @classmethod
    def run_sql(cls, sql, fail=False):
        result = subprocess.run(cls.psql, input=sql, text=True, capture_output=True)
        if fail:
            if result.returncode == 0:
                raise AssertionError("SQL unexpectedly succeeded")
            return result.stderr
        if result.returncode:
            raise AssertionError(result.stderr)
        return result.stdout.strip()

    def rpc(self, fn, *args):
        values = [sql_string(TOKEN)] + ["null" if x is None else sql_string(json.dumps(x) if isinstance(x, dict) else x) for x in args]
        return json.loads(self.run_sql(f"select {fn}({','.join(values)});"))

    def objective(self, key):
        return self.rpc("portfolio_objective_upsert", {"id": key, "project": "test-project", "title": "Demonstrate acceptance", "outcome": "A verified result", "metric_definitions": [{"id": "verified", "label": "Verified outcomes"}], "issue_ids": ["STR-91001"]})

    def claim(self, issue, objective, session, recovery=None):
        return self.rpc("portfolio_claim", {"issue_id": issue, "objective_id": objective, "agent": "codex", "session_id": session, "branch": "test", "worktree": "/tmp/test"}, recovery)

    def test_atomic_first_claim_and_session_fencing(self):
        self.objective("concurrency")
        def attempt(session):
            work = {"issue_id": "STR-91001", "objective_id": "concurrency", "agent": "codex", "session_id": session}
            return subprocess.run(self.psql, input=f"begin; select portfolio_claim('{TOKEN}',{sql_string(json.dumps(work))}); select pg_sleep(0.1); commit;", text=True, capture_output=True)
        with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
            attempts = list(pool.map(attempt, ["one", "two"]))
        self.assertEqual(sum(r.returncode == 0 for r in attempts), 1)
        self.assertIn("already claimed", " ".join(r.stderr for r in attempts))
        winner = self.run_sql("select session_id from portfolio_work_leases where issue_id='STR-91001';")
        first = self.claim("STR-91001", "concurrency", winner)
        second = self.claim("STR-91001", "concurrency", winner)
        self.assertEqual(first, second)
        error = self.run_sql(f"select portfolio_checkpoint('{TOKEN}','STR-91001',null,'bad',null);", fail=True)
        self.assertIn("does not own", error)
        self.assertIn("does not own", self.run_sql(f"select portfolio_release('{TOKEN}','STR-91001','intruder','bad');", fail=True))

    def test_expiry_requires_recovery_and_preserves_checkpoint(self):
        self.objective("recovery")
        self.claim("STR-91002", "recovery", "original")
        self.assertEqual(self.run_sql("select extract(epoch from expires_at-renewed_at)::int from portfolio_work_leases where issue_id='STR-91002';"), "3600")
        self.rpc("portfolio_checkpoint", "STR-91002", "original", "Build passed; not deployed", "Inspect browser")
        self.run_sql("update portfolio_work_leases set expires_at=now()-interval '1 second' where issue_id='STR-91002';")
        self.assertIn("expired", self.run_sql(f"select portfolio_checkpoint('{TOKEN}','STR-91002','original','unsafe',null);", fail=True))
        work = {"issue_id": "STR-91002", "objective_id": "recovery", "agent": "claude", "session_id": "recovery-session"}
        self.assertIn("recovery acknowledgment", self.run_sql(f"select portfolio_claim('{TOKEN}',{sql_string(json.dumps(work))});", fail=True))
        recovered = self.rpc("portfolio_claim", work, "Inspected Linear, branch and prior checkpoint; no running writer")
        self.assertEqual(recovered["checkpoint"], "Build passed; not deployed")
        self.assertEqual(recovered["next_action"], "Inspect browser")
        self.assertIn("does not own", self.run_sql(f"select portfolio_checkpoint('{TOKEN}','STR-91002','original','old writer',null);", fail=True))

    def test_reports_retry_concurrently_and_reject_conflicting_reuse(self):
        self.objective("reporting")
        report = {"issue_id": "STR-91003", "objective_id": "reporting", "session_id": "closed-chat", "agent": "codex", "result": "Review build", "evidence": ["https://example.com/review"], "validation": "browser checked", "remaining": "owner acceptance", "next_action": "collect feedback", "idempotency_key": "reporting-attempt-1"}
        with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
            results = list(pool.map(lambda _: self.rpc("portfolio_report", report), range(2)))
        self.assertEqual(results[0]["id"], results[1]["id"])
        changed = {**report, "result": "different"}
        self.assertIn("different report", self.run_sql(f"select portfolio_report('{TOKEN}',{sql_string(json.dumps(changed))});", fail=True))
        self.assertIn("append-only", self.run_sql("update portfolio_work_reports set result='rewritten' where objective_id='reporting';", fail=True))

    def test_metrics_unknown_history_and_fresh_bootstrap(self):
        self.objective("metrics")
        observation = {"objective_id": "metrics", "metric_id": "verified", "value": None, "observed_at": "2026-11-01T12:00:00Z", "source": "unavailable: scanner offline", "evidence": [], "idempotency_key": "metrics-unknown-1"}
        one = self.rpc("portfolio_metric", observation)
        self.assertEqual(one["id"], self.rpc("portfolio_metric", observation)["id"])
        self.rpc("portfolio_metric", {**observation, "value": 4, "source": "verified source", "observed_at": "2026-11-01T13:00:00Z", "idempotency_key": "metrics-verified-2"})
        self.claim("STR-91004", "metrics", "idle-chat")
        self.rpc("portfolio_checkpoint", "STR-91004", "idle-chat", "Build artifact retained", "Review on phone")
        self.rpc("portfolio_report", {"issue_id": "STR-91004", "objective_id": "metrics", "session_id": "idle-chat", "agent": "codex", "result": "Local build only", "evidence": ["https://example.com/build"], "next_action": "Review on phone", "idempotency_key": "idle-chat-report-1"})
        self.run_sql("update portfolio_work_leases set expires_at=now()-interval '48 hours' where issue_id='STR-91004';")
        focus = self.rpc("portfolio_focus", "test-project")
        history = [m for m in focus["metrics"] if m["objective_id"] == "metrics"]
        self.assertEqual([m["value"] for m in history], [4])
        history = self.rpc("portfolio_history", "metrics", "metrics")
        self.assertEqual([m["value"] for m in history["items"]], [4, None])
        self.assertIn("owner_loop", focus)
        self.assertTrue(any(r["session_id"] == "idle-chat" and r["result"] == "Local build only" for r in focus["reports"]))
        self.assertTrue(any(l["session_id"] == "idle-chat" and l["checkpoint"] == "Build artifact retained" for l in focus["leases"]))
        self.assertIn("RECOVERY REQUIRED", swd.focus_text(focus))
        self.assertIn("append-only", self.run_sql("delete from portfolio_metrics where objective_id='metrics';", fail=True))

    def test_authorization_and_unavailable_are_not_empty_success(self):
        self.assertIn("invalid agent token", self.run_sql("select portfolio_focus('wrong','portfolio');", fail=True))
        self.assertIn("permission denied", self.run_sql("set role anon; select * from portfolio_objectives;", fail=True))
        self.assertIn("permission denied", self.run_sql("set role anon; select * from portfolio_latest_metrics;", fail=True))
        self.assertIn("permission denied", self.run_sql("set role authenticated; select * from portfolio_latest_metrics;", fail=True))
        self.assertIn("permission denied", self.run_sql("set role anon; select * from portfolio_recent_reports;", fail=True))
        self.assertIn("permission denied", self.run_sql("set role authenticated; select * from portfolio_recent_reports;", fail=True))
        self.assertIn("invalid agent token", self.run_sql("select portfolio_history('wrong','metrics');", fail=True))
        with patch.object(swd, "rpc", side_effect=swd.LoopError("network unavailable")):
            with self.assertRaisesRegex(swd.LoopError, "unavailable"):
                swd.cmd_focus(argparse.Namespace(project="portfolio", json=True))

    def test_compact_focus_and_paged_history_preserve_all_baselines(self):
        for key in ("compact-a", "compact-b"):
            self.objective(key)
            for number in range(1, 6):
                self.rpc("portfolio_report", {"issue_id": "STR-91010", "objective_id": key,
                    "session_id": "idle", "agent": "codex", "result": f"Receipt {number}",
                    "evidence": [f"https://example.com/{number}"], "idempotency_key": f"{key}-report-{number}"})
        self.run_sql(f"""select portfolio_metric('{TOKEN}',jsonb_build_object(
          'objective_id','compact-a','metric_id','verified','value',n,
          'observed_at',timestamptz '2026-11-01T00:00:00Z'+n*interval '1 minute',
          'source','verified baseline','idempotency_key','compact-a-metric-'||n))
          from generate_series(1,25) n;""")
        for issue in ("STR-91011", "STR-91012", "STR-91013"):
            self.claim(issue, "compact-a", "compact-session")
        self.run_sql("update portfolio_work_leases set expires_at=now()-interval '1 hour' where issue_id='STR-91012';")
        self.rpc("portfolio_release", "STR-91013", "compact-session", "completed")
        focus = self.rpc("portfolio_focus", "test-project")
        self.assertEqual([m["value"] for m in focus["metrics"] if m["objective_id"] == "compact-a"], [25])
        for key in ("compact-a", "compact-b"):
            self.assertEqual(len([r for r in focus["reports"] if r["objective_id"] == key]), 3)
        self.assertEqual(self.run_sql("set role service_role; select count(*) from portfolio_recent_reports where objective_id='compact-a';"), "3")
        self.assertEqual(self.run_sql("select count(*) from information_schema.columns where table_schema='public' and table_name='portfolio_recent_reports' and column_name='payload_hash';"), "0")
        self.assertEqual({l["issue_id"] for l in focus["leases"]} & {"STR-91011", "STR-91012", "STR-91013"}, {"STR-91011", "STR-91012"})
        default = self.rpc("portfolio_history", "compact-a", "metrics")
        self.assertEqual(len(default["items"]), 20)
        self.assertIsNotNone(default["next_before_id"])
        items, cursor = [], None
        while True:
            page = self.rpc("portfolio_history", "compact-a", "metrics", "4", str(cursor) if cursor else None)
            items += page["items"]
            if cursor is None:
                # A concurrent new publication belongs before this page, never
                # duplicated into or shifted through already-cursored history.
                self.rpc("portfolio_metric", {"objective_id": "compact-a", "metric_id": "verified", "value": 26,
                    "observed_at": "2026-11-01T00:26:00Z", "source": "new publication", "idempotency_key": "compact-a-metric-26"})
            cursor = page["next_before_id"]
            if cursor is None:
                break
        self.assertEqual([m["value"] for m in items], list(range(25, 0, -1)))
        self.assertEqual(len({m["id"] for m in items}), 25)
        self.assertTrue(all("payload_hash" not in m for m in items))
        all_items = self.rpc("portfolio_history", "compact-a", "metrics", "100")
        self.assertEqual(len(all_items["items"]), 26)
        self.assertIsNone(all_items["next_before_id"])
        report_page = self.rpc("portfolio_history", "compact-a", "reports", "2")
        older = self.rpc("portfolio_history", "compact-a", "reports", "100", str(report_page["next_before_id"]))
        self.assertEqual([r["result"] for r in report_page["items"] + older["items"]], [f"Receipt {n}" for n in range(5, 0, -1)])
        self.assertIn("1..100", self.run_sql(f"select portfolio_history('{TOKEN}','compact-a','metrics',101);", fail=True))
        self.assertIn("history kind", self.run_sql(f"select portfolio_history('{TOKEN}','compact-a','other');", fail=True))

    def test_latest_view_ranks_generic_facts_and_derived_health_by_source_contract(self):
        self.objective("ranking")
        for key, value, observed in (("facts-new", 20, "2026-11-01T12:00:00Z"),
                                    ("facts-backfill", 10, "2026-10-30T12:00:00Z")):
            self.rpc("portfolio_metric", {"objective_id": "ranking", "metric_id": "facts", "value": value,
                "observed_at": observed, "source": "provider facts", "idempotency_key": key})
        for key, status, observed in (("health-first", "ok", "2026-11-01T12:00:00Z"),
                                      ("health-later", "stale", "2026-10-30T12:00:00Z")):
            self.rpc("portfolio_metric", {"objective_id": "ranking", "metric_id": "health",
                "value": {"status": status, "source_observed_at": observed}, "observed_at": observed,
                "source": "derived receipt", "idempotency_key": key})
        rows = [m for m in self.rpc("portfolio_focus", "test-project")["metrics"] if m["objective_id"] == "ranking"]
        self.assertEqual(next(m["value"] for m in rows if m["metric_id"] == "facts"), 20)
        health = next(m for m in rows if m["metric_id"] == "health")
        self.assertEqual(health["value"]["status"], "stale")
        self.assertTrue(health["observed_at"].startswith("2026-10-30"))
        self.assertEqual(self.run_sql("set role service_role; select value from portfolio_latest_metrics where objective_id='ranking' and metric_id='facts';"), "20")

    def test_nested_project_alias_preserves_both_owner_loop_spellings(self):
        for suffix, project in (("canonical", "3rdrider"), ("legacy", "3rd-rider")):
            self.rpc("portfolio_objective_upsert", {"id": "third-" + suffix, "project": project, "title": suffix, "outcome": "Verified observation"})
            self.run_sql(f"insert into owner_loop_items(project,title,kind) values('{project}','Third Rider {suffix}','decision');")
        self.claim("STR-91005", "third-canonical", "nested-chat")
        for project in ("3rdrider", "3rd-rider"):
            snapshot = self.rpc("portfolio_focus", project)
            self.assertEqual({o["id"] for o in snapshot["objectives"]}, {"third-canonical", "third-legacy"})
            self.assertEqual({i["project"] for i in snapshot["owner_loop"]}, {"3rdrider", "3rd-rider"})
            self.assertEqual(snapshot["leases"][0]["session_id"], "nested-chat")
        self.assertEqual(self.rpc("portfolio_focus", "unrelated-project")["objectives"], [])


class PortfolioCliTests(unittest.TestCase):
    def test_owner_time_preserves_eastern_calendar_day_and_orientation_hour(self):
        self.assertEqual(swd.owner_time("2026-11-04T05:00:00Z"), "2026-11-04 00:00 EST")
        self.assertEqual(swd.owner_time("2026-11-03T14:00:00Z"), "2026-11-03 09:00 EST")
        self.assertEqual(swd.owner_time("2026-07-04T04:00:00Z"), "2026-07-04 00:00 EDT")
    def test_human_focus_is_compact_but_json_and_history_retain_full_evidence(self):
        long = "receipt-detail " * 1000
        value = {"status": "stale", "source_observed_at": "2026-11-01T12:00:00Z",
                 "summary": {"scheduled": 19, "drafts": 15}, "issues": [{"detail": long}], "raw": long}
        snapshot = {"checked_at": "2026-11-02T12:00:00Z", "objectives": [], "metrics": [], "leases": [], "reports": []}
        for key, owner in (("one", "Jonathan"), ("two", "Educator lane")):
            snapshot["objectives"].append({"id": key, "project": key, "status": "active", "title": key,
                "outcome": long, "accountable_owner": owner, "target_at": "2026-11-04T05:00:00Z",
                "review_at": "2026-11-03T22:00:00Z", "metric_definitions": [{"id": "health"}]})
            snapshot["metrics"].append({"id": 1, "objective_id": key, "metric_id": "health", "value": value,
                "observed_at": "2026-11-01T12:00:00Z", "created_at": "2026-11-02T12:00:00Z"})
            for n in range(4):
                snapshot["reports"].append({"id": n, "objective_id": key, "issue_id": "STR-91001",
                    "created_at": "2026-11-02T12:00:00Z", "result": long, "next_action": long})
        rendered = swd.focus_text(snapshot)
        self.assertLessEqual(len(swd.metric_preview(value)), 180)
        self.assertIn("status=stale", rendered)
        self.assertIn("scheduled=19", rendered)
        self.assertIn("drafts=15", rendered)
        self.assertIn("source_observed_at=2026-11-01T12:00:00Z", rendered)
        self.assertIn("owner: Jonathan", rendered)
        self.assertIn("owner: Educator lane", rendered)
        self.assertIn("target: 2026-11-04 00:00 EST", rendered)
        self.assertIn("next review: 2026-11-03 17:00 EST", rendered)
        self.assertEqual(rendered.count("- report "), 6)
        self.assertLess(len(rendered), 5000)
        self.assertNotIn(long, rendered)
        with patch.object(swd, "rpc", return_value=snapshot), patch("builtins.print") as printed:
            swd.cmd_focus(argparse.Namespace(project="portfolio", json=True))
        self.assertEqual(json.loads(printed.call_args.args[0]), snapshot)
        snapshot["owner_loop"] = [{"ref": "D-9999", "status": "ruled", "project": "portfolio",
            "kind": "decision", "origin_agent": "codex", "created_at": "2026-11-02T12:00:00Z",
            "title": "Keep the owner ruling", "body": long, "ruling": "A", "ruling_note": "Approved scope",
            "ruled_at": "2026-11-02T12:00:00Z", "ruled_via": "chat:codex", "options": []}]
        with patch.object(swd, "rpc", return_value=snapshot), patch("builtins.print") as printed:
            swd.cmd_focus(argparse.Namespace(project="portfolio", json=False))
        human = "\n".join(call.args[0] for call in printed.call_args_list)
        self.assertNotIn(long, human)
        self.assertIn("RULING: A — Approved scope", human)
        self.assertIn("Full owner context: swd show REF", human)
        page = {"items": [snapshot["reports"][0]], "next_before_id": 12}
        with patch.object(swd, "rpc", return_value=page), patch("builtins.print") as printed:
            swd.cmd_history(argparse.Namespace(objective="one", kind="reports", limit=20, before_id=None))
        self.assertEqual(json.loads(printed.call_args.args[0]), page)

    def test_history_cli_preserves_page_cursor_and_propagates_unavailable(self):
        args = argparse.Namespace(objective="ranking", kind="metrics", limit=20, before_id=42)
        with patch.object(swd, "rpc", return_value={"items": [], "next_before_id": None}) as rpc, patch("builtins.print"):
            swd.cmd_history(args)
        self.assertEqual(rpc.call_args.args, ("portfolio_history", {"p_objective_id": "ranking", "p_kind": "metrics", "p_limit": 20, "p_before_id": 42}))
        with patch.object(swd, "rpc", side_effect=swd.LoopError("network unavailable")):
            with self.assertRaisesRegex(swd.LoopError, "unavailable"):
                swd.cmd_history(args)
        args.limit = 101
        with self.assertRaisesRegex(swd.LoopError, "1..100"):
            swd.cmd_history(args)

    def test_cli_uses_same_generic_and_derived_order_as_database(self):
        first = {"id": 1, "value": 20, "observed_at": "2026-11-01T12:00:00Z", "created_at": "2026-11-02T12:00:00Z"}
        backfill = {**first, "id": 2, "value": 10, "observed_at": "2026-10-30T12:00:00Z", "created_at": "2026-11-02T13:00:00Z"}
        self.assertGreater(swd.observation_rank(first), swd.observation_rank(backfill))
        first["value"] = {"source_observed_at": first["observed_at"], "status": "ok"}
        backfill["value"] = {"source_observed_at": backfill["observed_at"], "status": "stale"}
        self.assertGreater(swd.observation_rank(backfill), swd.observation_rank(first))

    def test_nested_git_detection_uses_canonical_portfolio_identity(self):
        with patch.object(swd.subprocess, "run", return_value=argparse.Namespace(stdout="/tmp/3rd-rider/.git\n")):
            self.assertEqual(swd.detect_project("/tmp/3rd-rider/frontend"), "3rdrider")

    def test_fresh_nested_hook_reads_objective_and_historical_ruling_in_one_call(self):
        snapshot = {"checked_at": "2026-11-02T12:00:00Z", "objectives": [{"id": "third-rider-reset-push", "status": "active", "project": "3rdrider", "title": "Reproduce prototype", "outcome": "Verified demo"}], "metrics": [], "leases": [], "reports": [],
            "owner_loop": [{"ref": "D-9001", "status": "ruled", "project": "3rd-rider", "kind": "decision", "origin_agent": "codex", "created_at": "2026-11-02T10:00:00Z", "ruled_at": "2026-11-02T11:00:00Z", "title": "Historical nested decision", "ruling": "A", "options": []}]}
        with tempfile.TemporaryDirectory() as directory, patch.object(swd, "STATE_DIR", Path(directory)), patch.object(swd.subprocess, "run", return_value=argparse.Namespace(stdout="/tmp/3rd-rider/.git\n")), patch.object(swd, "rpc", return_value=snapshot) as rpc:
            context = swd.hook_context("session-start", {"cwd": "/tmp/3rd-rider/frontend", "session_id": "fresh-nested-chat"})
        self.assertIn("third-rider-reset-push", context)
        self.assertIn("D-9001", context)
        self.assertEqual(rpc.call_count, 1)
        self.assertEqual(rpc.call_args.args[1]["p_project"], "3rdrider")

    def test_report_file_session_is_used_without_live_session_environment(self):
        payload = {"session_id": "saved-session", "agent": "claude", "result": "saved evidence"}
        with patch.object(swd, "json_input", return_value=payload), patch.object(swd, "rpc", return_value={}) as rpc, patch.object(swd, "detect_session", return_value=None):
            swd.cmd_report(argparse.Namespace(file=None, session=None, agent=None))
        self.assertEqual(rpc.call_args.args[1]["p_report"]["session_id"], "saved-session")

    def test_missing_session_fails_before_claim(self):
        with patch.object(swd, "detect_session", return_value=None):
            with self.assertRaisesRegex(swd.LoopError, "session ID required"):
                swd.work_session(argparse.Namespace(session=None))


if __name__ == "__main__":
    unittest.main()
