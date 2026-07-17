# 2026-07-12 — Workflow / orchestration vision (dictation capture)

> NOT directive. Verbatim-faithful capture of the owner's spoken vision for
> the orchestration fabric + expanded dashboard. Becomes canon only through a
> strandworks-ops VISION re-bless + SPEC intake. Captured here first to
> protect against input loss.

## Owner's words (structured, faithful)

**Orchestrator, with vendor failover (load-bearing caveat).**
Fable 5 remains the main orchestrator. BUT it must NOT be hard-coded — given
the inconsistency of Anthropic's access/permission, hard-coding all company
architecture onto one LLM is foolish. There must be a caveat allowing another
top-tier LLM to step into the orchestrator seat if there is another lockdown.

**Tier consolidation.**
As projects reach a solid foundation, multiple Max-plan tiers become less
justified. One top ("Max/Pro/Ultra") tier LLM should suffice — Fable 5 for
now. The top LLM holds the macro view, solidifies + reviews plans, and parses
issues out to the most appropriate sub.

**Coder tier: GLM 5.2 on Shadow, constantly.**
GLM 5.2 seems capable at general coding and SHOULD run constantly on the
Shadow VM. Owner has not worked with it — open unknowns he named: does it need
compaction? does it need its context window cleared? (research, not decision.)

**Capability-matched delegation, esp. "hero" tasks.**
Delegated tasks that still need high skill (e.g. rigging 3D models in
Cascadeur) go to the most capable model — ESPECIALLY if client-facing ("hero"
tasks). Alternative pattern: framed by a lower LLM, then polished by a higher.

**The layered org chart.**
- High-powered VM on Shadow runs it.
- **Fable 5** = overview of ALL projects + the grand company vision + each
  project's vision.
- Beneath: research layer, coding layer, front-end, back-end management,
  "social media"/content, business/numbers side, etc.
- **Owner** = the "vision verifier": are the projects becoming what he
  actually wants? — mediated by the dashboard.

**Dashboard = the verification + control surface (expanded).**
Not just decision pages like today — also interactive examples, visual
representations, mockups, reports, status updates.

**Infrastructure + asset + business tracking, per project.**
Close track of what infra each project uses: Supabase, Vercel, Namecheap,
CGTrader, etc. — where the project lives, what runs it, where the assets are,
when/where it was last touched. Linear has been good for issues. Should handle
every aspect: LLC/business side, assets, social media, the numbers.

**Prior art.** Earlier dashboards (e.g. `Projects/media_manager`) attempted
this but none had the full functionality and scope.

## Autonomy model (owner's answer, 2026-07-12)

Once the vision is locked securely, the orchestrator may dispatch + monitor
sub-agents as necessary, INCLUDING spinning up the heavy systems for
processing assets / generating visuals / models / research / scenes as needed.
If version control + branches are managed appropriately, work can progress
WITHOUT the owner's explicit approval. Inside blessed scopes, work continues
autonomously.

**Graduated oversight (owner's idea):** a pre-sprint alert system — the owner
gets alerts of upcoming work that could need eyes-on or hands-on testing;
opens the alert and selects his OVERSIGHT LEVEL for that item. Example given:
HUD design → HIGH involvement (very human-facing design integration).
Pairs with the "hero task" axis: human/client-facing ⇒ higher default
oversight; internal plumbing ⇒ runs autonomously.

## Orchestrator notes (for the interview / draft — not owner's words)
- Portfolio-touching: "Fable 5 has overview of ALL projects" is a
  PORTFOLIO-level statement; the fabric may warrant a PORTFOLIO line + a
  strandworks-ops vision expansion.
- The failover caveat has a real design consequence: the orchestrator must be
  specified as a ROLE/CONTRACT any top-tier LLM can fill, not Fable-5-specific
  behavior. Good forcing function.
- Substitution check: today's coders were Claude sub-agents under an
  adversarial review gate. GLM-as-coder is a swap into a slot that already
  exists (implementer), with Fable 5 as reviewer/orchestrator — consistent
  with what shipped today, IF the review gate stays.
