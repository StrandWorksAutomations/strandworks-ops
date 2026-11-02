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
        subprocess.run(["pg_ctl", "-D", str(cls.data), "-l", str(Path(cls.tmp.name) / "postgres.log"), "-o", f"-k {cls.tmp.name} -p {cls.port} -h ''", "-w", "start"], check=True, capture_output=True)
        cls.psql = ["psql", "-X", "-q", "-t", "-A", "-v", "ON_ERROR_STOP=1", "-h", cls.tmp.name, "-p", str(cls.port), "-U", "postgres", "postgres"]
        try:
            cls.run_sql("create role anon; create role authenticated; create role service_role; create schema extensions;")
            for filename in ("20261024_owner_loop_v1.sql", "20261024_owner_loop_v2_review_fixes.sql", "20261102_portfolio_control_v1.sql", "20261102_portfolio_project_alias.sql"):
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
        self.assertEqual([m["value"] for m in history], [4, None])
        self.assertIn("owner_loop", focus)
        self.assertTrue(any(r["session_id"] == "idle-chat" and r["result"] == "Local build only" for r in focus["reports"]))
        self.assertTrue(any(l["session_id"] == "idle-chat" and l["checkpoint"] == "Build artifact retained" for l in focus["leases"]))
        self.assertIn("RECOVERY REQUIRED", swd.focus_text(focus))
        self.assertIn("append-only", self.run_sql("delete from portfolio_metrics where objective_id='metrics';", fail=True))

    def test_authorization_and_unavailable_are_not_empty_success(self):
        self.assertIn("invalid agent token", self.run_sql("select portfolio_focus('wrong','portfolio');", fail=True))
        self.assertIn("permission denied", self.run_sql("set role anon; select * from portfolio_objectives;", fail=True))
        with patch.object(swd, "rpc", side_effect=swd.LoopError("network unavailable")):
            with self.assertRaisesRegex(swd.LoopError, "unavailable"):
                swd.cmd_focus(argparse.Namespace(project="portfolio", json=True))

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
