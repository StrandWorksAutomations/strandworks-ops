# 2026-07-13 — source-side register secret scanner (idea, not directive)

An idea that surfaced while reworking the cockpit's render-time redactor. Not a
requirement; the owner decides via Intake in a later session.

## The observation

The render-time redactor (`cockpit/src/lib/redact.ts`) was rebuilt to do only
display hygiene — truncate long digit runs to last-4, mask known key-prefix
tokens — and deliberately stopped trying to be a universal free-text secret
scanner. A per-render scanner over adversarial free text is the wrong shape for a
guarantee: to catch everything it must guess entropy, and guessing entropy
destroys the legitimate identifiers the dashboard exists to show (commit SHAs,
dashless UUIDs, env-var names, bucket/path names). That trade cannot be won at
render time, so render-time hygiene is defense-in-depth, NOT the secret floor.

## The idea

The real secret-floor guarantee could live at the SOURCE instead, because the
input there is finite and owner-controlled — unlike per-render adversarial input.
A mechanical register-content scanner could run over the finite `registers/*.csv`
at `generate.py` time and in CI, and flag any cell that contains:

- a known key/credential prefix (`ghp_`, `gho_`, `ghu_`, `ghs_`, `github_pat_`,
  `sk-`, `sk-ant-`, `xoxb-`, `xoxp-`, `AKIA`, `ASIA`, `eyJ`, `-----BEGIN`);
- a long digit run (beyond the last-4 that a `payment_last4`-style column is
  allowed to hold) outside the columns explicitly whitelisted for last-4;
- a high-entropy token that isn't an expected identifier shape.

On a hit it would file a decision alert rather than pass silently. Because the
register set is small, curated, and owner-controlled, a source scanner can be
strict without collateral damage — a flagged cell is a real problem to fix at the
source, not a false positive to suppress. That is the opposite of the per-render
situation, and it is why the guarantee belongs there.

## Notes

- The render-time hygiene already merged is intended as defense-in-depth, not the
  guarantee. The two layers are complementary.
- The registers are verified clean today; this scanner would keep them that way
  mechanically as they grow, and would fail CI loudly rather than leak quietly.
- Scope, exact rules, whitelist columns, and whether it blocks or only alerts are
  all open questions for the owner at Intake.
