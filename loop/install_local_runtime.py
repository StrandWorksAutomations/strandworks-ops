#!/usr/bin/env python3
"""Install existing portfolio receipts/helpers into the existing local master.

No credentials, source jobs, remote services, scheduler creation or research.
Default is a read-only plan; --apply requires an explicit external backup folder.
"""
import argparse
from datetime import datetime, timezone
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import stat
import subprocess
import tempfile


FILES = ("swd", "reconcile.py", "publish_local.py", "meter.py", "portfolio-push.json")
RETIRED = (
    "qa_inbox_sweep", "drift_gmail_sweep", "drift_appstore_sweep",
    "drift_morning_brief", "drift_morning_ingest_sweep",
    "drift_morning_ingest", "drift_evening_push",
)
JOB = "portfolio_receipt_publish"
ANCHOR = "# 3. Sequential Job Declarations"
BEGIN = "# BEGIN portfolio-control receipt publisher"
END = "# END portfolio-control receipt publisher"
OLD_COMMENT = "# Portfolio receipt publisher: reads existing evidence; no scans, browser or LLM."
SCHEDULE = re.compile(r'''^\s*if\s+should_run_(?:interval(?:_backoff)?|daily|weekly)\s+["']([^"']+)["'].*;\s*then\s*$''')
EXECUTE = re.compile(r'''\bexecute_job\s+["']([^"']+)["']''')
SCOUT = re.compile(r"^(\d{4}-\d{2}-\d{2})-(\d{6})-.*tech-scout.*\.md$")
GUIDANCE_BEGIN = "<!-- BEGIN portfolio-control quota handoff -->"
GUIDANCE_END = "<!-- END portfolio-control quota handoff -->"
QUOTA_GUIDANCE = """## Portfolio quota handoff — approved November 2–4, 2026

For portfolio packets, use the fixed kickoff provider allocations in
`~/PROJECTS/_ops/portfolio-control/portfolio-push.json` and the canonical
`meter.py` beside it. Run `swd focus -p portfolio --json` for current shared
goals, source-dated quota metrics and handoffs; these global instructions route
the checks and do not record live percentages or grant additional allowance.

- Before sustained provider work, after every packet, and at least every two
  hours while active, run the correct provider meter. Include provider usage
  from other chats; a packet's token totals or estimated dollars are not quota.
- Codex: `python3 ~/PROJECTS/_ops/portfolio-control/meter.py codex --publish`
  reads actual provider rate-limit reports across local sessions.
- Claude: obtain the latest native `/usage` snapshot through the existing
  built-in route, retaining every exposed limit row, then run
  `python3 ~/PROJECTS/_ops/portfolio-control/meter.py claude --claude-snapshot /path/to/latest-native-usage.json --publish`.
  Keep additional limit rows in the snapshot; never infer allowance from
  tokens or dollars. Ask Jonathan for a snapshot only if the built-in route
  is unavailable.
- Unknown, invalid, older-than-two-hours or newly reset allowance blocks work
  by that provider. Refresh through the built-in route when available; proceed
  only when the meter permits every exposed limit. A reset grants no new
  allocation. Preserve the default model and speed.
- Stop at the earliest approved cap, 30 minutes before any verified provider
  reset, or this plan's close: November 4, 2026 at 00:00 America/New_York.
  Later allocations require Jonathan's explicit authorization.
"""


def rewrite_guidance(text):
    """Maintain only this installer's marked quota block, preserving the rest."""
    block = GUIDANCE_BEGIN + "\n" + QUOTA_GUIDANCE.rstrip() + "\n" + GUIDANCE_END
    if text.count(GUIDANCE_BEGIN) != text.count(GUIDANCE_END) or text.count(GUIDANCE_BEGIN) > 1:
        raise ValueError("ambiguous quota guidance markers")
    if GUIDANCE_BEGIN in text:
        start = text.index(GUIDANCE_BEGIN)
        end = text.index(GUIDANCE_END)
        if end < start:
            raise ValueError("reversed quota guidance markers")
        return text[:start] + block + text[end + len(GUIDANCE_END):]
    separator = "" if not text or text.endswith("\n\n") else "\n" if text.endswith("\n") else "\n\n"
    return text + separator + block + "\n"


def guidance_targets(projects_root):
    """Use existing portfolio/global guidance only; custom roots stay isolated."""
    return (projects_root / "AGENTS.md", projects_root / "CLAUDE.md",
            projects_root.parent / ".codex/AGENTS.md",
            projects_root.parent / ".claude/CLAUDE.md")


def sha(data):
    return hashlib.sha256(data).hexdigest()


def bash_check(text):
    result = subprocess.run(["/bin/bash", "-n"], input=text, text=True, capture_output=True)
    if result.returncode:
        raise ValueError("master runner fails bash -n; no files installed")


def hook():
    base = '"$PROJECTS_DIR/_ops/portfolio-control/'
    return "\n".join((
        BEGIN,
        "# Reads saved receipts only; preserves source times; no scans, browser or LLM.",
        f'if should_run_interval "{JOB}" 900; then',
        f'  execute_job "{JOB}" /usr/bin/python3 {base}publish_local.py" '
        f'--marketing {base}marketing-snapshot.json" '
        f'--tech-scout-glob {base}inputs/tech-scout/*tech-scout*.md"',
        "fi", END,
    ))


def active_jobs(text):
    return [match.group(1) for line in text.splitlines()
            if not line.lstrip().startswith("#")
            for match in EXECUTE.finditer(line)]


def rewrite_master(text):
    """Replace only recognized, standalone blocks for the eight named jobs.

    Refuse ambiguous/nested multi-job blocks instead of deleting unrelated work.
    All other lines, including intentionally paused jobs, stay intact.
    """
    bash_check(text)
    if text.count(ANCHOR) != 1:
        raise ValueError("expected one existing sequential-job anchor")
    if text.count(BEGIN) != text.count(END) or text.count(BEGIN) > 1:
        raise ValueError("ambiguous publisher markers")
    lines, output = text.splitlines(keepends=True), []
    index = 0
    while index < len(lines):
        line = lines[index]
        if line.strip() in (BEGIN, END, OLD_COMMENT) or line.strip() == "# Reads saved receipts only; preserves source times; no scans, browser or LLM.":
            index += 1
            continue
        match = SCHEDULE.match(line.rstrip("\n"))
        if not match or match.group(1) not in (*RETIRED, JOB):
            output.append(line)
            index += 1
            continue
        job, start, depth = match.group(1), index, 1
        index += 1
        while index < len(lines) and depth:
            clean = lines[index].lstrip()
            if re.match(r"if\b", clean):
                depth += 1
            if re.match(r"fi(?:\s|;|$)", clean):
                depth -= 1
            index += 1
        if depth:
            raise ValueError("unterminated managed job block")
        block = "".join(lines[start:index])
        names = active_jobs(block)
        if not names or any(name != job for name in names):
            raise ValueError("managed block contains unrelated or missing job")
        if job in RETIRED:
            output.append(f"# Retired 2026-11-02: {job} (owner portfolio plan; use swd/portfolio records).\n")
    result = "".join(output)
    before, after = result.split(ANCHOR, 1)
    result = before + ANCHOR + "\n\n" + hook() + "\n\n" + after.lstrip("\n")
    jobs = active_jobs(result)
    if jobs.count(JOB) != 1 or any(job in jobs for job in RETIRED):
        raise ValueError("unrecognized active managed job; no files installed")
    # Comparing every unrelated invocation prevents silent removal/reordering.
    if [job for job in active_jobs(text) if job not in (*RETIRED, JOB)] != [job for job in jobs if job != JOB]:
        raise ValueError("unrelated job changed")
    bash_check(result)
    return result


def scout_time(path):
    match = SCOUT.match(path.name)
    if not match:
        raise ValueError("scout receipt needs original dated publisher-compatible filename")
    return datetime.strptime("".join(match.groups()), "%Y-%m-%d%H%M%S").replace(tzinfo=timezone.utc).isoformat()


def git_value(repo, *args):
    result = subprocess.run(["git", "-C", str(repo), *args], capture_output=True, text=True)
    return result.stdout.strip() if result.returncode == 0 else None


def backup(path, directory):
    if not path.exists():
        return
    data = path.read_bytes()
    target = directory / (sha(data)[:16] + "--" + path.name + ".bak")
    directory.mkdir(parents=True, exist_ok=True)
    if target.exists():
        if target.read_bytes() != data:
            raise ValueError("backup collision")
    else:
        shutil.copy2(path, target)


def replace(path, data, mode, backup_dir, source_info=None):
    if path.exists() and path.read_bytes() == data and stat.S_IMODE(path.stat().st_mode) == mode:
        return False
    backup(path, backup_dir)
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, temporary = tempfile.mkstemp(prefix=".portfolio-install-", dir=path.parent)
    try:
        with os.fdopen(fd, "wb") as stream:
            stream.write(data)
        os.chmod(temporary, mode)
        if source_info:
            os.utime(temporary, ns=(source_info.st_atime_ns, source_info.st_mtime_ns))
        os.replace(temporary, path)
    finally:
        if os.path.exists(temporary):
            os.unlink(temporary)
    return True


def install(source_repo, projects_root, backup_dir=None, apply=False):
    source_repo, projects_root = Path(source_repo).resolve(), Path(projects_root).resolve()
    runtime = projects_root / "_ops/portfolio-control"
    master = projects_root / "_ops/lib/master_run.sh"
    original_master = master.read_text()
    rewritten = rewrite_master(original_master)
    sources = {name: source_repo / "loop" / name for name in FILES}
    marketing = source_repo / "registers/marketing-snapshot.json"
    scouts = sorted((p for p in (source_repo / "briefings").glob("*tech-scout*.md") if p.is_file() and SCOUT.match(p.name)), key=lambda p: (scout_time(p), p.name))
    if not scouts:
        raise ValueError("no dated saved scout receipt; no files installed")
    scout = scouts[-1]
    existing = sorted((runtime / "inputs/tech-scout").glob("*tech-scout*.md"))
    if any(SCOUT.match(path.name) and scout_time(path) > scout_time(scout) for path in existing):
        raise ValueError("saved runtime scout is newer than checkout; refusing regression")
    sources.update({"marketing-snapshot.json": marketing, "inputs/tech-scout/" + scout.name: scout})
    # Read all approved payloads before the first write; none are credential files.
    payloads, source_info = {}, {}
    for name, path in sources.items():
        before = path.stat()
        payloads[name] = path.read_bytes()
        source_info[name] = after = path.stat()
        if (before.st_mtime_ns, before.st_size) != (after.st_mtime_ns, after.st_size):
            raise ValueError("source changed during preflight; retry against a stable snapshot")
    marketing_data = json.loads(payloads["marketing-snapshot.json"])
    checked = marketing_data.get("checked_at_utc")
    if not isinstance(checked, str) or datetime.fromisoformat(checked.replace("Z", "+00:00")).tzinfo is None:
        raise ValueError("marketing snapshot lacks an original timezone-aware check time")
    manifest = json.loads(payloads["portfolio-push.json"])
    objectives = [item["id"] for item in manifest["objectives"]]
    if len(objectives) != 8 or len(set(objectives)) != 8:
        raise ValueError("expected eight distinct approved portfolio objectives")
    guidance = {}
    for path in guidance_targets(projects_root):
        if path.is_file():
            original = path.read_bytes()
            guidance[path] = (original, rewrite_guidance(original.decode()).encode())
    receipt = {
        "version": 3, "source_repo": "StrandWorksAutomations/strandworks-ops",
        "source_branch": git_value(source_repo, "branch", "--show-current"),
        "source_commit": git_value(source_repo, "rev-parse", "HEAD"),
        "source_dirty": bool(git_value(source_repo, "status", "--porcelain", "--", "loop", "registers/marketing-snapshot.json", "briefings/" + scout.name)),
        "installer_sha256": sha(Path(__file__).read_bytes()),
        "files": {name: sha(data) for name, data in payloads.items()},
        "objective_ids": objectives,
        "marketing_checked_at_utc": checked,
        "tech_scout": {"original_filename": scout.name, "source_observed_at": scout_time(scout),
                       "scope": "Existing saved receipt only; no new research executed"},
        "master_sha256": sha(rewritten.encode()), "publisher_interval_seconds": 900,
        "retired_jobs": list(RETIRED), "scheduler_created": False,
        "guidance_sha256": {str(path): sha(updated) for path, (_, updated) in guidance.items()},
    }
    receipt_path = runtime / "runtime-install.json"
    previous = json.loads(receipt_path.read_bytes()) if receipt_path.exists() else {}
    prior_content = {key: value for key, value in previous.items() if key != "installed_at_utc"}
    receipt["installed_at_utc"] = previous.get("installed_at_utc") if prior_content == receipt else datetime.now(timezone.utc).isoformat()
    receipt_bytes = (json.dumps(receipt, indent=2, sort_keys=True) + "\n").encode()
    planned = [str(runtime / name) for name, data in payloads.items()
               if not (runtime / name).exists() or (runtime / name).read_bytes() != data]
    if original_master != rewritten:
        planned.append(str(master))
    planned.extend(str(path) for path, (original, updated) in guidance.items() if original != updated)
    if not receipt_path.exists() or receipt_path.read_bytes() != receipt_bytes:
        planned.append(str(receipt_path))
    if apply:
        if backup_dir is None:
            raise ValueError("--apply requires --backup-dir outside the repository")
        backup_dir = Path(backup_dir).resolve()
        if backup_dir.is_relative_to(source_repo) or backup_dir.is_relative_to(runtime):
            raise ValueError("backups must be outside source repository and runtime")
        if any(path.read_bytes() != original for path, (original, _) in guidance.items()):
            raise ValueError("guidance changed during preflight; retry against a stable snapshot")
        # Backups precede each replacement. Source files are never changed.
        for name, data in payloads.items():
            replace(runtime / name, data, 0o755 if name == "swd" else stat.S_IMODE(source_info[name].st_mode), backup_dir, source_info[name])
        replace(master, rewritten.encode(), stat.S_IMODE(master.stat().st_mode), backup_dir)
        for path, (_, updated) in guidance.items():
            replace(path, updated, stat.S_IMODE(path.stat().st_mode), backup_dir)
        replace(receipt_path, receipt_bytes, 0o644, backup_dir)
        bash_check(master.read_text())
    return {"status": "installed" if apply else "plan", "changed_paths": planned,
            "runtime": str(runtime), "receipt": str(receipt_path),
            "objective_count": len(objectives), "publisher_interval_seconds": 900,
            "marketing_checked_at_utc": checked, "tech_scout_source_observed_at": scout_time(scout),
            "source_jobs_executed": False, "scheduler_created": False}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source-repo", type=Path, default=Path(__file__).resolve().parent.parent)
    parser.add_argument("--projects-root", type=Path, default=Path.home() / "PROJECTS")
    parser.add_argument("--backup-dir", type=Path)
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()
    try:
        result = install(args.source_repo, args.projects_root, args.backup_dir, args.apply)
    except (OSError, ValueError, KeyError, TypeError) as error:
        parser.exit(1, "Install refused: " + type(error).__name__ + ": " + str(error) + "\n")
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
