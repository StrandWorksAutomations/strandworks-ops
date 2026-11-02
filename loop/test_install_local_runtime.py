"""Filesystem-only installation and scheduler-preservation regression checks."""
import importlib.util
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

spec = importlib.util.spec_from_file_location("install_local_runtime", Path(__file__).with_name("install_local_runtime.py"))
installer = importlib.util.module_from_spec(spec)
spec.loader.exec_module(installer)


def runner():
    jobs = "\n".join(f'if should_run_interval "{job}" 3600; then\n  execute_job "{job}" /bin/true\nfi\n' for job in installer.RETIRED)
    return ("#!/bin/bash\nPROJECTS_DIR=/example\n"
            "should_run_interval() { return 0; }\nexecute_job() { :; }\n"
            "# 3. Sequential Job Declarations\n\n" + jobs +
            'if should_run_interval "cmd_center_ingest" 1800; then\n  execute_job "cmd_center_ingest" /bin/true\nfi\n'
            '# Job-watch remains paused by owner.\n# if should_run_interval "job_watch" 3600; then\n#   execute_job "job_watch" /bin/true\n# fi\n'
            'if should_run_interval "tech_scout" 172800; then\n  execute_job "tech_scout" /bin/true\nfi\n')


class RuntimeInstallationTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        self.addCleanup(self.temporary.cleanup)
        self.base = Path(self.temporary.name)
        self.repo, self.projects = self.base / "source repo", self.base / "projects"
        self.backups = self.base / "backups"
        self.runtime = self.projects / "_ops/portfolio-control"
        self.master = self.projects / "_ops/lib/master_run.sh"
        self.master.parent.mkdir(parents=True)
        self.master.write_text(runner())
        (self.repo / "loop").mkdir(parents=True)
        for name in installer.FILES:
            (self.repo / "loop" / name).write_text("# harmless fixture: " + name + "\n")
        (self.repo / "loop/swd").chmod(0o755)
        (self.repo / "loop/portfolio-push.json").write_text(json.dumps({"objectives": [{"id": f"goal-{i}"} for i in range(8)]}))
        (self.repo / "registers").mkdir()
        self.marketing = self.repo / "registers/marketing-snapshot.json"
        self.marketing.write_text('{"checked_at_utc":"2026-10-30T15:47:57Z","summary":{"drafts":2}}\n')
        (self.repo / "briefings").mkdir()
        self.scout = self.repo / "briefings/2026-11-02-150649-droplet-tech-scout.md"
        self.scout.write_text("---\ndate: 2026-11-02\ntime: 09:06 CST\n---\nSaved research, not a new run.\n")
        os.utime(self.marketing, ns=(1600000000000000000, 1600000000000000000))
        os.utime(self.scout, ns=(1600000001000000000, 1600000001000000000))

    def apply(self):
        return installer.install(self.repo, self.projects, self.backups, apply=True)

    def test_exactly_one_hook_and_only_named_jobs_retired(self):
        original = self.master.read_text()
        result = installer.rewrite_master(original)
        self.assertEqual(installer.active_jobs(result), [installer.JOB, "cmd_center_ingest", "tech_scout"])
        self.assertIn('# Job-watch remains paused by owner.\n# if should_run_interval "job_watch" 3600; then\n#   execute_job "job_watch" /bin/true\n# fi', result)
        for job in installer.RETIRED:
            self.assertIn(f"# Retired 2026-11-02: {job}", result)
        self.assertIn('--tech-scout-glob "$PROJECTS_DIR/_ops/portfolio-control/inputs/tech-scout/*tech-scout*.md"', result)
        self.assertEqual(result, installer.rewrite_master(result))
        installer.bash_check(result)

    def test_duplicate_old_publishers_collapse_without_unrelated_job_changes(self):
        old = '\n# Portfolio receipt publisher: reads existing evidence; no scans, browser or LLM.\nif should_run_interval "portfolio_receipt_publish" 900; then\n  execute_job "portfolio_receipt_publish" /old/publish_local.py\nfi\n'
        result = installer.rewrite_master(runner() + old + old)
        self.assertEqual(installer.active_jobs(result).count(installer.JOB), 1)
        self.assertNotIn("/old/publish_local.py", result)
        self.assertEqual(result, installer.rewrite_master(result))

    def test_saved_inputs_keep_bytes_original_dates_and_mtimes_with_sha_receipt(self):
        original_master = self.master.read_bytes()
        self.apply()
        receipt = json.loads((self.runtime / "runtime-install.json").read_bytes())
        for name, digest in receipt["files"].items():
            self.assertEqual(installer.sha((self.runtime / name).read_bytes()), digest)
        self.assertEqual(receipt["marketing_checked_at_utc"], "2026-10-30T15:47:57Z")
        self.assertEqual(receipt["tech_scout"]["source_observed_at"], "2026-11-02T15:06:49+00:00")
        self.assertEqual((self.runtime / "marketing-snapshot.json").read_bytes(), self.marketing.read_bytes())
        self.assertEqual((self.runtime / "marketing-snapshot.json").stat().st_mtime_ns, self.marketing.stat().st_mtime_ns)
        copied_scout = self.runtime / "inputs/tech-scout" / self.scout.name
        self.assertEqual(copied_scout.read_bytes(), self.scout.read_bytes())
        self.assertEqual(copied_scout.stat().st_mtime_ns, self.scout.stat().st_mtime_ns)
        self.assertEqual(receipt["master_sha256"], installer.sha(self.master.read_bytes()))
        self.assertEqual(next(self.backups.glob("*--master_run.sh.bak")).read_bytes(), original_master)
        self.assertFalse(receipt["scheduler_created"])

    def test_public_cli_second_install_is_byte_identical_and_has_no_changes(self):
        command = [sys.executable, str(Path(installer.__file__)), "--source-repo", str(self.repo), "--projects-root", str(self.projects), "--backup-dir", str(self.backups), "--apply"]
        subprocess.run(command, capture_output=True, check=True)
        before = {str(p): p.read_bytes() for p in self.runtime.rglob("*") if p.is_file()}
        master = self.master.read_bytes()
        backup_names = sorted(p.name for p in self.backups.iterdir())
        result = subprocess.run(command, capture_output=True, text=True, check=True)
        self.assertEqual(json.loads(result.stdout)["changed_paths"], [])
        self.assertEqual(before, {str(p): p.read_bytes() for p in self.runtime.rglob("*") if p.is_file()})
        self.assertEqual(master, self.master.read_bytes())
        self.assertEqual(backup_names, sorted(p.name for p in self.backups.iterdir()))

    def test_mixed_job_or_unrecognized_active_retirement_refuses_without_writes(self):
        for bad in [runner().replace('execute_job "qa_inbox_sweep"', 'execute_job "unrelated"', 1), runner() + '\nexecute_job "qa_inbox_sweep" /bin/true\n']:
            self.master.write_text(bad)
            with self.assertRaises(ValueError):
                self.apply()
            self.assertEqual(self.master.read_text(), bad)
            self.assertFalse(self.runtime.exists())
            self.assertFalse(self.backups.exists())

    def test_invalid_bash_and_unpaired_markers_refuse_without_writes(self):
        for bad in [runner() + "\nif true; then\n", runner() + "\n" + installer.BEGIN + "\n"]:
            self.master.write_text(bad)
            with self.assertRaises(ValueError):
                self.apply()
            self.assertEqual(self.master.read_text(), bad)
            self.assertFalse(self.runtime.exists())

    def test_newer_installed_scout_is_preserved_and_refuses_regression(self):
        target = self.runtime / "inputs/tech-scout/2026-11-03-150649-droplet-tech-scout.md"
        target.parent.mkdir(parents=True)
        target.write_text("Newer saved research")
        with self.assertRaisesRegex(ValueError, "refusing regression"):
            self.apply()
        self.assertEqual(target.read_text(), "Newer saved research")
        self.assertFalse((self.runtime / "swd").exists())

    def test_dry_run_is_read_only_and_apply_requires_external_backups(self):
        self.assertEqual(installer.install(self.repo, self.projects)["status"], "plan")
        self.assertFalse(self.runtime.exists())
        self.assertFalse(self.backups.exists())
        for invalid_backup in [None, self.repo / "backups", self.runtime / "backups"]:
            with self.assertRaises(ValueError):
                installer.install(self.repo, self.projects, invalid_backup, apply=True)
            self.assertFalse(self.runtime.exists())

    def test_missing_original_source_times_or_wrong_goal_count_refuse_before_write(self):
        self.marketing.write_text('{"checked_at_utc":"2026-11-02T15:00:00"}')
        with self.assertRaises(ValueError):
            self.apply()
        self.marketing.write_text('{"checked_at_utc":"2026-11-02T15:00:00Z"}')
        (self.repo / "loop/portfolio-push.json").write_text('{"objectives":[{"id":"only-one"}]}')
        with self.assertRaises(ValueError):
            self.apply()
        self.assertFalse(self.runtime.exists())


if __name__ == "__main__":
    unittest.main()
