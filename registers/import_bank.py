#!/usr/bin/env python3
"""
import_bank.py — reconcile a Schwab checking export against registers/subscriptions.csv.

The money register goes stale because every row is typed by hand. This reads the
bank's own export, finds the recurring charges, and (a) reports what matches the
register, what is recurring but unknown, and what the register lists but the bank
never charged; (b) with --apply, writes the observed cost + next renewal back into
subscriptions.csv and regenerates DASHBOARD.md.

Owner step (browser/auth — cannot be automated): Schwab → Accounts → History →
Export (JSON or CSV) → save into  registers/bank-inbox/  (git-ignored). Then:

    python3 registers/import_bank.py            # report only, newest file in bank-inbox
    python3 registers/import_bank.py --apply    # also update subscriptions.csv + DASHBOARD.md
    python3 registers/import_bank.py path/to/export.json

Hard rules (registers/README + owner ruling 2026-07-11): last-4 only, no balances,
no account numbers. Descriptions are scrubbed of digit runs before anything is
written. Personal one-off spend is never written to the repo — only charges that
recur at a steady amount on a monthly/annual cadence are reported.
"""
from __future__ import annotations

import argparse
import csv
import json
import re
import statistics
import subprocess
import sys
from collections import defaultdict
from datetime import date, datetime, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
REGISTER = ROOT / "registers" / "subscriptions.csv"
INBOX = ROOT / "registers" / "bank-inbox"
REPORTS = ROOT / "_governance" / "reports"

# merchant-string fragment (uppercase) → register `service` name. Extend as the
# bank shows new names; unmatched recurring charges are listed in the report.
ALIASES: dict[str, str] = {
    "ANTHROPIC": "Claude Max",
    "OPENAI": "ChatGPT Plus",
    "GOOGLE WORKSPACE": "Google Workspace",
    "GOOGLE ONE": "Google One",
    "GOOGLE AI": "Google AI Plus",
    "SUPABASE": "Supabase",
    "VERCEL": "Vercel",
    "RUNPOD": "RunPod",
    "NAMECHEAP": "Namecheap",
    "GITHUB": "GitHub",
    "DIGITALOCEAN": "DigitalOcean",
    "LINEAR": "Linear",
    "ELEVENLABS": "ElevenLabs",
    "CASCADEUR": "Cascadeur",
    "MESHY": "Meshy",
    "RUNWAY": "Runway",
    "SHADOW": "ShadowVM",
    "CURSOR": "Cursor",
    "EXPO": "Expo",
    "APPLE.COM/BILL": "Apple",
    "APPLE DEVELOPER": "Apple Developer Program",
    "MIDJOURNEY": "Midjourney",
    "LEONARDO": "Leonardo AI",
    "WALMART+": "Walmart+",
    "AMAZON PRIME": "Amazon Prime",
}


# Personal / household merchants: counted, never listed (this repo is business-only;
# the register keeps one "PERSONAL recurring" fyi row). Fragments are uppercase.
PERSONAL_PATTERNS = [
    "MTG", "MORTGAGE", "VENMO", "ZELLE", "PAYPAL *", "LIFE INS", "INSURANCE", "NFCU", "BRIDGECREST",
    "USAA", "T MOBILE", "ENERGY", "UTIL", "REVCO", "T-MOBILE", "TELLO", "MAGGARD", "AMEREN", "FIBERNET", "AMEX",
    "CREDIT UN", "PRUDENTIAL", "SALLIE", "ASCENT", "LOTTERY", "SCHNUCKS", "CIRCLE K", "CIRCLEK",
    "USCONNECT", "WASTE", "CASEYS", "HARDEES", "MCDONALD", "LIQUOR", "SPIRITS", "WALMART.COM",
    "AMAZON.COM", "CONSUME", "ACCCPMNT", "KROGER", "WALGREENS", "CVS", "SHELL", "BP ", "GROCER",
    "VET", "PET INS", "GYM", "PLANET FIT", "NETFLIX", "HULU", "SPOTIFY", "DISNEY", "STEAM",
]


def is_personal(key: str) -> bool:
    return any(frag in key for frag in PERSONAL_PATTERNS)


def money(s: str) -> float:
    """Lenient: '$1,234.56', '5.99+', '~20' → number; anything unparseable → 0."""
    m = re.search(r"-?\d+(?:\.\d+)?", (s or "").replace(",", ""))
    return float(m.group(0)) if m else 0.0


def scrub(desc: str) -> str:
    """Display-safe merchant text: digit runs of 4+ become '…' (no phone/acct/ids)."""
    d = re.sub(r"\d{4,}", "…", desc)
    d = re.sub(r"\s+", " ", d).strip()
    return d


def merchant_key(desc: str) -> str:
    d = desc.upper()
    d = re.sub(r"[*#].*?(\s|$)", " ", d)  # drop *ref tokens
    d = re.sub(r"\.\.\.\S*", " ", d)
    d = re.sub(r"[^A-Z./+& ]", " ", d)
    d = re.sub(r"\s+", " ", d).strip()
    words = d.split(" ")
    return " ".join(words[:3])


def load_transactions(path: Path) -> list[dict]:
    rows: list[dict] = []
    if path.suffix.lower() == ".json":
        data = json.loads(path.read_text())
        raw = data.get("PostedTransactions", data if isinstance(data, list) else [])
        for t in raw:
            amt = money(t.get("Withdrawal", ""))
            if amt <= 0:
                continue
            rows.append({
                "date": datetime.strptime(t["Date"], "%m/%d/%Y").date(),
                "desc": t.get("Description", ""),
                "amount": amt,
                "type": t.get("Type", ""),
            })
    else:
        with path.open(newline="") as f:
            for t in csv.DictReader(f):
                amt = money(t.get("Withdrawal", "") or t.get("Withdrawal (-)", ""))
                if amt <= 0 or not t.get("Date"):
                    continue
                rows.append({
                    "date": datetime.strptime(t["Date"], "%m/%d/%Y").date(),
                    "desc": t.get("Description", ""),
                    "amount": amt,
                    "type": t.get("Type", ""),
                })
    rows.sort(key=lambda r: r["date"])
    return rows


def cadence_of(dates: list[date]) -> str | None:
    if len(dates) < 2:
        return None
    gaps = [(b - a).days for a, b in zip(dates, dates[1:])]
    med = statistics.median(gaps)
    if 25 <= med <= 35:
        return "monthly"
    if 84 <= med <= 98:
        return "quarterly"
    if 350 <= med <= 380:
        return "annually"
    if 6 <= med <= 8:
        return "weekly"
    return None


def period_days(cadence: str) -> int:
    return {"weekly": 7, "monthly": 30, "quarterly": 91, "annually": 365}.get(cadence, 30)


def find_recurring(tx: list[dict]) -> list[dict]:
    groups: dict[str, list[dict]] = defaultdict(list)
    for t in tx:
        groups[merchant_key(t["desc"])].append(t)
    out = []
    for key, items in groups.items():
        if len(items) < 2:
            continue
        # cluster by amount (±12%) around the most common rounded amount
        amounts = [i["amount"] for i in items]
        centre = statistics.median(amounts)
        steady = [i for i in items if abs(i["amount"] - centre) <= max(0.12 * centre, 0.5)]
        if len(steady) < 2:
            continue
        dates = [i["date"] for i in steady]
        cad = cadence_of(dates)
        if cad is None and len(steady) < 3:
            continue
        if cad is None:
            continue
        out.append({
            "key": key,
            "display": scrub(steady[-1]["desc"]),
            "n": len(steady),
            "amount": round(statistics.median(i["amount"] for i in steady), 2),
            "cadence": cad,
            "first": dates[0],
            "last": dates[-1],
            "next": dates[-1] + timedelta(days=period_days(cad)),
        })
    out.sort(key=lambda r: (-r["amount"] * (12 if r["cadence"] == "monthly" else 1), r["key"]))
    return out


def monthly_equiv(amount: float, cadence: str) -> float:
    return round({"weekly": amount * 52 / 12, "monthly": amount, "quarterly": amount / 3, "annually": amount / 12}[cadence], 2)


def match_service(key: str, amount_monthly: float, reg: list[dict]) -> str | None:
    """Candidates: alias hit (first token of the alias target starts a service name)
    or a service whose first ≥4-letter token appears in the merchant key. Several
    candidates ⇒ the one whose register cost is closest to what the bank shows."""
    cands: list[str] = []
    for frag, target in ALIASES.items():
        if frag in key:
            head = re.split(r"[^A-Za-z0-9]+", target)[0].lower()
            cands += [r["service"] for r in reg if r["service"].lower().startswith(head)]
    for r in reg:
        tokens = [w for w in re.split(r"[^A-Za-z0-9]+", r["service"]) if len(w) >= 4]
        if tokens and tokens[0].upper() in key and r["service"] not in cands:
            cands.append(r["service"])
    if not cands:
        return None
    if len(cands) == 1:
        return cands[0]

    def distance(svc: str) -> float:
        row = next(r for r in reg if r["service"] == svc)
        c = money(row.get("cost_monthly_usd", ""))
        return abs(c - amount_monthly) if c else 1e9

    return min(cands, key=distance)


def read_register() -> tuple[list[str], list[dict]]:
    with REGISTER.open(newline="") as f:
        r = csv.DictReader(f)
        return list(r.fieldnames or []), list(r)


def write_register(fields: list[str], rows: list[dict]) -> None:
    with REGISTER.open("w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fields, quoting=csv.QUOTE_MINIMAL)
        w.writeheader()
        w.writerows(rows)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("path", nargs="?", help="Schwab export (.json or .csv); default newest in registers/bank-inbox/")
    ap.add_argument("--apply", action="store_true", help="write observed cost + renewal into subscriptions.csv, regenerate DASHBOARD.md")
    args = ap.parse_args()

    if args.path:
        src = Path(args.path)
    else:
        INBOX.mkdir(exist_ok=True)
        cands = sorted(INBOX.glob("*.[jJcC][sS]*"), key=lambda p: p.stat().st_mtime)
        if not cands:
            print(f"no export in {INBOX} — Schwab → History → Export → save there, then rerun", file=sys.stderr)
            return 2
        src = cands[-1]
    tx = load_transactions(src)
    if not tx:
        print("no withdrawals found in export", file=sys.stderr)
        return 1
    span = (tx[0]["date"], tx[-1]["date"])
    recurring = find_recurring(tx)
    fields, reg = read_register()
    services = [r["service"] for r in reg]

    matched, unknown, personal = [], [], []
    seen_services: set[str] = set()
    for rec in recurring:
        if is_personal(rec["key"]):
            personal.append(rec)
            continue
        svc = match_service(rec["key"], monthly_equiv(rec["amount"], rec["cadence"]), reg)
        if svc:
            row = next(r for r in reg if r["service"] == svc)
            rec["service"] = svc
            rec["register_cost"] = row.get("cost_monthly_usd", "")
            rec["register_renewal"] = row.get("renewal_date", "")
            rec["observed_monthly"] = monthly_equiv(rec["amount"], rec["cadence"])
            matched.append(rec)
            seen_services.add(svc)
        else:
            unknown.append(rec)
    unseen = [r for r in reg if r["service"] not in seen_services and (r.get("status") or "").lower() not in ("cancelled", "dead", "ended")]

    today = date.today().isoformat()
    lines = [
        f"# Bank import — {today}",
        "",
        f"Source: `{src.name}` · {len(tx)} withdrawals · {span[0]} → {span[1]} · "
        f"{len(recurring)} recurring charges found · mode: {'APPLY' if args.apply else 'report only'}",
        "",
        "Rules: last-4 only, no balances; only steady monthly/quarterly/annual charges are listed. "
        "Personal one-offs never leave the export.",
        "",
        f"## Matched to the register ({len(matched)})",
        "",
        "| service | bank shows | cadence | last charge | next (projected) | register cost/mo | Δ |",
        "|---|---|---|---|---|---|---|",
    ]
    for m in matched:
        reg_cost = money(m["register_cost"]) if m["register_cost"] else None
        delta = "" if reg_cost is None else f"{m['observed_monthly'] - reg_cost:+.2f}"
        lines.append(f"| {m['service']} | ${m['amount']:.2f} | {m['cadence']} | {m['last']} | {m['next']} | {m['register_cost'] or '—'} | {delta} |")
    personal_mo = round(sum(monthly_equiv(p["amount"], p["cadence"]) for p in personal), 2)
    lines += ["", f"## Personal / household recurring — {len(personal)} charges ≈ ${personal_mo:,.2f}/mo (not listed; out of business scope)"]
    lines += ["", f"## Recurring but NOT in the register ({len(unknown)}) — add or dismiss", "",
              "| merchant | amount | cadence | seen | last | ≈ /mo |", "|---|---|---|---|---|---|"]
    for u in unknown:
        lines.append(f"| {u['display']} | ${u['amount']:.2f} | {u['cadence']} | {u['n']}× | {u['last']} | ${monthly_equiv(u['amount'], u['cadence']):.2f} |")
    lines += ["", f"## In the register but no steady charge seen in this window ({len(unseen)})", ""]
    for r in unseen:
        lines.append(f"- {r['service']} — {r.get('plan','')} · {r.get('cost_monthly_usd','') or '—'}/mo · status {r.get('status','')} (annual, prepaid, other card, or stale)")
    lines.append("")

    REPORTS.mkdir(parents=True, exist_ok=True)
    report = REPORTS / f"{today}-bank-import.md"
    report.write_text("\n".join(lines))
    print(f"report → {report.relative_to(ROOT)}")
    print(f"matched {len(matched)} · unknown recurring {len(unknown)} · register rows unseen {len(unseen)}")

    if args.apply:
        changed = 0
        for m in matched:
            row = next(r for r in reg if r["service"] == m["service"])
            new_cost = f"{m['observed_monthly']:.2f}"
            old_cost = row.get("cost_monthly_usd", "")
            new_renewal = m["next"].isoformat()
            if old_cost != new_cost or row.get("renewal_date", "") != new_renewal:
                row["cost_monthly_usd"] = new_cost
                row["renewal_date"] = new_renewal
                note = f"bank {today}: ${m['amount']:.2f} {m['cadence']} last {m['last']}"
                row["notes"] = (row.get("notes", "") + "; " + note).strip("; ")
                changed += 1
        if changed:
            write_register(fields, reg)
            subprocess.run([sys.executable, str(ROOT / "generate.py")], cwd=ROOT, check=False)
        print(f"applied {changed} register updates" + (" + DASHBOARD.md regenerated" if changed else ""))
    return 0


if __name__ == "__main__":
    sys.exit(main())
