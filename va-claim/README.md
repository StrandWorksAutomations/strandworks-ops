# VA Disability Claim — case file

> Owner case file. Not canon, not directive for agents. Agents maintain this
> directory and the calendar register; the OWNER files every form and makes
> every claim decision. Nothing here is legal advice; an accredited VSO or
> VA-accredited attorney reviews before anything is submitted.
>
> PII rule (repo hard rule): no SSN / VA file number / DOB / account numbers
> in any file here. Source documents stay in Google Drive; this directory
> holds the index, the strategy, the drafts, and the tracker.

Opened: 2026-09-02. Owner target in `registers/calendar.csv`: 2026-09-30.

## The facts (from the DD214 in Drive, verified 2026-09-02)

| Item | Value |
|---|---|
| Branch / component | Army / Regular Army |
| Entered active duty | 2003-12-30, Troy MI (MEPS), age 18 |
| Separated | 2004-07-21, Fort Stewart GA |
| Net active service | 6 months 22 days |
| MOS | 19K10 M1 Armor Crewman (0 yrs 3 mos) |
| Last unit | Troop A, 3rd Squadron, 7th Cavalry (3rd Infantry Division) |
| Grade | PV2 / E-2 (effective 2004-06-30) |
| Character of service | **Honorable** |
| Separation authority | AR 635-200, para 5-13 |
| Separation code (SPD) | LFX |
| Narrative reason | **Personality Disorder** |
| Reentry code | RE-3 |
| Foreign / sea service | none |
| Awards | NDSM, GWOT Service Medal, Army Service Ribbon |
| Remarks | "Member has not completed first full term of service" |
| Separation dental exam | No (block 17) |

VA status (Benefit Summary letter, 2024-03-23): Veteran, Honorable, **no
service-connected disabilities**, no monetary benefits. VA.gov / My HealtheVet
account exists (2025 transition emails) — health-care enrollment to confirm.

## Theory of the case (one paragraph)

An 18-year-old with a clean entrance exam was diagnosed with a "personality
disorder" and discharged within seven months, about three months after
arriving at a line cavalry unit that had just returned from the Iraq
invasion. VA cannot compensate a personality disorder as such (38 CFR
3.303(c), 4.9, 4.127), so the claim is NOT "personality disorder". The claim is
**an acquired psychiatric disorder (depression / anxiety / adjustment-type
disorder, whatever the current diagnosis is) that began in service and was
mislabeled as a personality disorder in 2004** — and, in the alternative, a
mental disorder superimposed on a personality disorder (4.127 allows that).
The presumption of soundness (38 USC 1111) puts the burden on VA to prove
by clear and unmistakable evidence that the condition pre-existed service
AND was not aggravated. The Army's own 2004 mental-status evaluation is the
in-service evidence; a current diagnosis plus a nexus opinion completes the
three elements. Full analysis: `03-theory-of-the-case.md`.

Second lane, independent of the first: **tinnitus / hearing loss** from
19K armor-crewman noise exposure (VA's Duty MOS Noise Exposure Listing
rates armor crewman "highly probable") — only if the owner actually has
symptoms. See `07-questions-for-owner.md`.

## Status board

| # | Step | Owner | Status | Detail |
|---|---|---|---|---|
| 1 | **Intent to File (VA 21-0966)** — locks the effective date for 12 months | owner | TODO NOW | 5 min on VA.gov; do before anything else |
| 2 | Order OMPF + service treatment records (5-13 packet, mental-status eval, entrance exam) | owner | TODO | `04-forms-and-filing.md` §2 |
| 3 | Appoint an accredited VSO (VA 21-22) | owner | TODO | needs current state of residence — see questions |
| 4 | Establish a CURRENT diagnosis (VA mental-health intake, free; or private) | owner | TODO | no current diagnosis = no claim |
| 5 | Personal statement (21-4138) | owner drafts from template; agent edits | DRAFT | `05-statements/personal-statement-draft.md` |
| 6 | Buddy statements (21-10210) — mother, a pre-service friend, a post-service colleague | owner requests | TODO | template in `05-statements/` |
| 7 | Nexus opinion from a psychologist/psychiatrist (+ Mental Disorders DBQ) | owner | TODO | request letter in `05-statements/` |
| 8 | File 21-526EZ (Fully Developed Claim) with everything attached | owner + VSO | TODO | target 2026-09-30, but ITF makes the date safe — file when the evidence is in hand |
| 9 | C&P exam | owner | — | prep sheet in `05-statements/cp-exam-prep.md` |
| 10 | Rating decision → if service-connected at ANY percent (0% counts) → SBA VetCert SDVOSB | owner | — | `registers/calendar.csv` |
| P | Parallel, optional: ABCMR record correction of the narrative reason (DD-149) | owner | OPTIONAL | `06-abcmr-record-correction.md` |

Paperwork tracker with dates: `tracker.csv`. Deadlines: `registers/calendar.csv`.

## Files

- `01-evidence-index.md` — every document that exists, where it lives, what is missing and how to get it
- `02-timeline.md` — service and post-service chronology
- `03-theory-of-the-case.md` — legal framework, arguments, rating criteria, risks
- `04-forms-and-filing.md` — every form, in order, with what it does
- `05-statements/` — personal statement draft, buddy statement template, nexus letter request, C&P prep
- `06-abcmr-record-correction.md` — optional parallel track
- `07-questions-for-owner.md` — the answers only the owner has; the case cannot be filed without them
- `tracker.csv` — paperwork tracker
