// decision-card.ts — file an owner alert when the revise loop is exhausted.
//
// When the adversarial review keeps returning FLAGS through the whole revise
// budget, the loop STOPS and never merges. It files a decision card into
// _governance/decisions/ so the owner sees it in the cockpit queue — same card
// conventions as the spend gate's over-ceiling cards (frontmatter id / filed /
// filed-by / question / ruling: PENDING, then context + owner-token options).
// Agents FILE; only the owner RULES.

import { writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

export interface RevisionExhaustedInput {
  decisionsDir: string; // absolute path to _governance/decisions/
  date: string; // YYYY-MM-DD
  branch: string;
  slug: string;
  reviseCycles: number; // the budget that was exhausted
  runFile: string; // path to the run's audit JSONL, for the owner to inspect
  lastFindings: string; // the reviewer's final findings
}

export interface FiledCard {
  id: string;
  path: string;
}

/**
 * Write the review-exhausted decision card. Returns its id + path. A numeric
 * suffix is added if a same-id card already exists, so a pending decision is
 * never clobbered.
 */
export function fileRevisionExhaustedCard(input: RevisionExhaustedInput): FiledCard {
  const { decisionsDir, date, branch, slug, reviseCycles, runFile, lastFindings } =
    input;

  mkdirSync(decisionsDir, { recursive: true });

  let id = `${date}-review-exhausted-${slug}`;
  let path = join(decisionsDir, `${id}.md`);
  let n = 2;
  while (existsSync(path)) {
    id = `${date}-review-exhausted-${slug}-${n}`;
    path = join(decisionsDir, `${id}.md`);
    n++;
  }

  const findings = lastFindings.trim().length > 0
    ? lastFindings.trim()
    : "(reviewer returned no findings text — treated as FLAGS by fail-closed rule)";

  const body = `---
id: ${id}
filed: ${date}
filed-by: orchestrator (fabric, dispatch loop)
question: Branch "${branch}" failed adversarial review after ${reviseCycles} revise ${reviseCycles === 1 ? "cycle" : "cycles"}. It was NOT merged. How should it proceed?
ruling: PENDING
---

**The dispatch loop stopped without merging.** The coder revised
${reviseCycles} ${reviseCycles === 1 ? "time" : "times"} and the adversarial
review still returned \`VERDICT: FLAGS\` (or an unparseable verdict, which is
fail-closed to FLAGS). The review gate is non-optional, so the branch was left
unmerged.

- **Branch:** ${branch}
- **Revise cycles exhausted:** ${reviseCycles}
- **Audit trail:** ${runFile}

**Final reviewer findings:**

${findings}

**Options:**
- **APPROVE** — merge this branch despite the flags (a one-off owner override;
  re-run or merge manually after approving).
- **REVISE** — the findings need a different approach or a corrected work-order;
  adjust and re-dispatch.
- **PARK** — do not merge; hold the branch as-is.

Reply APPROVE / REVISE / PARK.
`;

  writeFileSync(path, body);
  return { id, path };
}
