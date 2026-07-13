// decision-card.ts — file an owner alert when a charge is refused.
//
// When the gate refuses (cumulative sum would exceed the ceiling) it writes a
// decision card into _governance/decisions/ so the owner sees it in the cockpit
// queue (SPEC Slice-1 #4 / WS-B). The card names the amount, the current
// month-to-date autonomous total, the ceiling, and the purpose. Options are
// APPROVE / REVISE / PARK. Agents FILE; only the owner RULES.

import { writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { centsToDollarString } from "./money.ts";

export interface DecisionCardInput {
  decisionsDir: string;   // absolute path to _governance/decisions/
  date: string;           // YYYY-MM-DD
  month: string;          // YYYY-MM
  amountCents: number;    // the refused charge
  monthToDateCents: number; // allowed autonomous total so far this month
  ceilingCents: number;
  project: string;
  purpose: string;
  requestedBy: string;
}

/** Turn arbitrary text into a filesystem-safe slug. */
export function slugify(text: string): string {
  const s = text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/g, "");
  return s.length > 0 ? s : "charge";
}

export interface FiledCard {
  id: string;
  path: string;
}

/**
 * Write the over-ceiling decision card. Returns its id + path.
 * If a card with the same id already exists, a numeric suffix is added so an
 * existing pending decision is never clobbered.
 */
export function fileOverCeilingCard(input: DecisionCardInput): FiledCard {
  const {
    decisionsDir,
    date,
    month,
    amountCents,
    monthToDateCents,
    ceilingCents,
    project,
    purpose,
    requestedBy,
  } = input;

  mkdirSync(decisionsDir, { recursive: true });

  const slugBase = slugify(purpose || project);
  let id = `${date}-spend-over-ceiling-${slugBase}`;
  let path = join(decisionsDir, `${id}.md`);
  let n = 2;
  while (existsSync(path)) {
    id = `${date}-spend-over-ceiling-${slugBase}-${n}`;
    path = join(decisionsDir, `${id}.md`);
    n++;
  }

  const amount = centsToDollarString(amountCents);
  const mtd = centsToDollarString(monthToDateCents);
  const ceiling = centsToDollarString(ceilingCents);
  const wouldBe = centsToDollarString(monthToDateCents + amountCents);

  const body = `---
id: ${id}
filed: ${date}
filed-by: spend-gate (fabric, mechanical)
question: Approve autonomous spend of $${amount} for "${purpose}" (${project})? It would push this month's autonomous total to $${wouldBe}, over the $${ceiling} ceiling.
ruling: PENDING
---

**Mechanical spend gate REFUSED this charge.** The gate compares the cumulative
month-to-date allowed autonomous total plus the proposed charge against the
ceiling — it never judges a charge in isolation.

- **Proposed charge:** $${amount}
- **Autonomous spend this month (${month}) so far, allowed:** $${mtd}
- **This charge would make the month-to-date total:** $${wouldBe}
- **Ceiling (fabric/spend-gate/ceiling.json):** $${ceiling}
- **Project:** ${project}
- **Purpose:** ${purpose}
- **Requested by:** ${requestedBy}

The charge was NOT spent. It is logged as \`refused\` in
registers/autonomous-spend.csv. Existing blessed subscriptions are outside this
ceiling; this figure governs only NEW autonomous spend.

**Options:**
- **APPROVE** — authorize this specific charge despite the ceiling (a one-off
  owner override; re-run the charge after approving).
- **REVISE** — adjust the ceiling in fabric/spend-gate/ceiling.json, or change
  the charge, then re-run.
- **PARK** — do not spend; hold the item.

Reply APPROVE / REVISE / PARK.
`;

  writeFileSync(path, body);
  return { id, path };
}
