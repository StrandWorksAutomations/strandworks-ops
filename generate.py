#!/usr/bin/env python3
"""strandworks-ops dashboard generator — registers/*.csv -> DASHBOARD.md

Stdlib only, same pattern as the liaison analyzer: data in flat CSVs,
one command produces the current company picture. Never edits registers.
Usage: python3 generate.py
"""
import csv
import io
import os
from datetime import date

ROOT = os.path.dirname(os.path.abspath(__file__))
REG = os.path.join(ROOT, "registers")
OUT = os.path.join(ROOT, "DASHBOARD.md")


def read(name):
    path = os.path.join(REG, name)
    if not os.path.exists(path):
        return []
    with open(path, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def table(rows, cols):
    if not rows:
        return "_register empty_\n"
    out = io.StringIO()
    out.write("| " + " | ".join(cols) + " |\n")
    out.write("|" + "---|" * len(cols) + "\n")
    for r in rows:
        out.write("| " + " | ".join((r.get(c, "") or "—") for c in cols) + " |\n")
    return out.getvalue()


def main():
    subs = read("subscriptions.csv")
    services = read("services.csv")
    assets = read("assets.csv")
    access = read("access.csv")
    cal = read("calendar.csv")
    models = read("models.csv")

    # --- derived figures ---------------------------------------------------
    known_cost = 0.0
    unknown_cost_count = 0
    flags = []
    for s in subs:
        cost = (s.get("cost_monthly_usd") or "").strip()
        status = (s.get("status") or "").strip()
        if cost:
            # accept approximations like "~12", "5.99+", "$36" — count the number,
            # keep a flag so approximate figures stay visible
            cleaned = cost.strip().lstrip("~$").rstrip("+")
            try:
                known_cost += float(cleaned)
                if cleaned != cost:
                    flags.append(f"approximate cost counted: {s['service']} '{cost}'")
            except ValueError:
                flags.append(f"subscriptions: unparseable cost for {s['service']}: '{cost}'")
        elif status not in ("owned", "canceled"):
            unknown_cost_count += 1
            flags.append(f"cost unknown: {s['service']}")
        if "cancel-candidate" in (s.get("notes") or "") or status == "refund-requested":
            flags.append(f"owner decision pending: {s['service']} ({status or 'cancel-candidate'})")
        if "UNEXAMINED" in (s.get("notes") or ""):
            flags.append(f"unexamined bill: {s['service']}")

    upcoming = [c for c in cal if (c.get("action_needed") or "").strip()]
    single_copy = [a for a in assets if "only-copy" in (a.get("canonical") or "")]
    for a in single_copy:
        flags.append(f"SINGLE-COPY ASSET RISK: {a['asset']} at {a['location']}")

    # --- governance scouts across sibling repos ----------------------------
    scouts = []
    work = os.path.dirname(ROOT)
    for repo in sorted(os.listdir(work)):
        rep_dir = os.path.join(work, repo, "_governance", "reports")
        if not os.path.isdir(rep_dir):
            continue
        reports = sorted(os.listdir(rep_dir))
        latest_audit = next((r for r in reversed(reports) if r.startswith("audit-")), None)
        latest_drift = next((r for r in reversed(reports) if r.startswith("drift-")), None)
        scouts.append({"repo": repo,
                       "latest_audit": latest_audit or "never",
                       "latest_drift": latest_drift or "never"})

    # --- render -------------------------------------------------------------
    out = io.StringIO()
    out.write("# STRANDWORKS — OPERATIONS DASHBOARD\n\n")
    out.write(f"Generated {date.today().isoformat()} by generate.py — edit registers/, never this file.\n\n")

    out.write("## Money\n\n")
    out.write(f"- Known recurring spend: **${known_cost:,.2f}/mo**")
    out.write(f" — **INCOMPLETE: {unknown_cost_count} subscriptions have no cost on record**\n" if unknown_cost_count else "\n")
    out.write("\n### Subscriptions\n\n")
    out.write(table(subs, ["service", "plan", "cost_monthly_usd", "renewal_date", "status", "notes"]))

    out.write("\n## Flags (owner attention)\n\n")
    if flags:
        for f in flags:
            out.write(f"- ⚠ {f}\n")
    else:
        out.write("- none\n")

    out.write("\n## Calendar — action needed\n\n")
    out.write(table(upcoming, ["date", "item", "type", "action_needed"]))

    out.write("\n## Services → projects\n\n")
    out.write(table(services, ["service", "what_it_runs", "project", "environment", "notes"]))

    out.write("\n## Governance scouts (per repo)\n\n")
    if scouts:
        out.write(table(scouts, ["repo", "latest_audit", "latest_drift"]))
    else:
        out.write("_no governed repos found_\n")

    out.write("\n## Models & compute\n\n")
    out.write(table(models, ["name", "kind", "where", "cost_model", "notes"]))

    out.write("\n## Assets\n\n")
    out.write(table(assets, ["asset", "type", "location", "size", "project", "canonical", "notes"]))

    out.write("\n## Access map\n\n")
    out.write(table(access, ["system", "account", "machines_with_access", "key_location", "notes"]))

    with open(OUT, "w", encoding="utf-8") as f:
        f.write(out.getvalue())
    print(f"wrote {OUT}")
    if flags:
        print(f"{len(flags)} flags for owner attention")


if __name__ == "__main__":
    main()
