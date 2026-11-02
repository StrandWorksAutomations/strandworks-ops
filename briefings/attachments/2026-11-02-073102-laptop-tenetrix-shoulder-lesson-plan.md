[Start here](/briefings/2026-11-02-073105-laptop-tenetrix-structural-anatomy-concepts) · [Course roadmap](/briefings/2026-11-02-073104-laptop-tenetrix-course-roadmap) · [Lesson format](/briefings/2026-11-02-073103-laptop-tenetrix-lesson-standard) · [Shoulder lesson](/briefings/2026-11-02-073102-laptop-tenetrix-shoulder-lesson-plan) · [Narration and activities](/briefings/2026-11-02-073101-laptop-tenetrix-narration-and-activities)

**Owner review draft · 2 November 2026.** The current shoulder-girdle demonstration uses a draft synthetic voice, eleven prerecorded narration parts and learner-paced activities. Anatomy, educator, actual voice and rendered/device review remain pending. Production app integration, billing and release remain separate decisions.

This dashboard review copy is adapted from the project material at commit `47263b4`. The authoring packet is draft 0.1; the executable narration and activities are draft 0.2.0. Production-planning requirements below remain review requirements rather than approval evidence.

# Shoulder girdle lesson packet

**Draft 0.1 teaching packet for review.** This packet describes the shared six-stage beginner lesson. The compact spoken specimen below is the original authoring draft; the current eleven-part executable script is in the narration/activity chapter. Educator and anatomy review remain open. The local demonstration does not approve production integration or release.

Build continuation: on 1 November Jonathan authorized the next local review demonstration. Its executable draft script and tasks are in [narration.json](/briefings/2026-11-02-073101-laptop-tenetrix-narration-and-activities) and [tasks.json](/briefings/2026-11-02-073101-laptop-tenetrix-narration-and-activities). This packet remains the teaching/review reference; the local build does not imply independent content approval or production app/release approval.

## Lesson metadata

| Field | Draft specification |
|---|---|
| Course / lesson | Upper-limb skeleton / Shoulder girdle |
| Planning identity | `upper-limb-skeleton / shoulder-girdle / draft-0.1` |
| Audience | Health-professions students learning anatomy for the first time |
| Entry knowledge | None assumed; orientation, names and controls are taught here |
| Purchase prerequisite | None; a separate Foundations purchase is not required by this plan |
| Scope | Whole-bone identity, anatomical side, viewpoint and neighboring bone relationships |
| Excluded | Fine surface identification, movement, injury, procedures and clinical assessment |
| Delivery proposal | Reviewed model states plus spoken explanation, equivalent transcript and learner pauses |
| Time | To be measured in learner review; no accepted duration or narration-speed target |
| Sources checked | 30 October 2026; exact sections in the source map below |
| Relationship to existing pilot | Replaces neither its content nor its checks; a worked teaching plan for review alongside [the series plan](/briefings/2026-11-02-073104-laptop-tenetrix-course-roadmap) |

### Exact model targets

These registrations were checked against `assets/skeleton/manifest.json`. The FMA ID is also the exact glTF mesh name. No substitute geometry is permitted. Only the first four are identification targets; humeri supply context.

| Source name | FMA ID / mesh name | Role |
|---|---|---|
| Left clavicle | `FMA13323` | Primary |
| Right clavicle | `FMA13322` | Primary |
| Left scapula | `FMA13396` | Primary |
| Right scapula | `FMA13395` | Primary |
| Left humerus | `FMA23131` | Context |
| Right humerus | `FMA23130` | Context |

Retain neutral surrounding skeleton for orientation. Review framing and occlusion for every teaching and task view. This packet specifies no new camera coordinates, submesh surfaces or precise joint markers.

## Outcomes and independent evidence

| ID | Observable outcome | Evidence without answer cues |
|---|---|---|
| O1 | Locate and name the two primary whole bones on a requested side. | T1a: name two unlabelled marked targets before any task supplies their names. T1b: locate two named targets. Record naming, localization and side separately. |
| O2 | Reconstruct the two taught bone-to-bone relationships and distinguish lesson targets from upper-arm context. | T2: an original connection sketch or spoken reconstruction, with the requested pair marked; evaluate with the short rubric. |
| O3 | Find the corresponding primary bones on the opposite side after a deliberate view change and explain whether identity changed. | T3: new-side selections from a posterior start, then anterior recheck, before labels or feedback. |

Listening, opening a model and reaching Recap supply no independent outcome evidence. Report each outcome separately; no numerical pass threshold or competency claim is proposed.

## Entry support and small vocabulary

Teach these terms when first encountered. Display the plain explanation beside the formal word; do not add a second list of surface landmarks.

| Term | Plain-language meaning | Source |
|---|---|---|
| Anatomical position | A standard reference: upright, facing forward, arms at the sides and palms forward. | S1 |
| Anatomical left / right | The represented person's side, retained when the viewer moves. | S1 |
| Anterior / posterior | Toward the body's front / back. | S1 |
| Clavicle | Collarbone. | S2 |
| Scapula | Shoulder blade. | S2 |
| Humerus | Upper-arm bone. | S3 |
| Shoulder girdle | The paired-bone arrangement introduced in this lesson. | S2; membership taught in Explain |
| Articulation | A connection where bones meet. | S2 |

**Ungraded entry attempt:** show a full-body anterior view with a labeled person-side marker; ask the learner to point to the represented person's left and restore the requested front/back view. Offer “unsure.” A side error triggers a brief person-side demonstration; a control error triggers one reset-and-view rehearsal. Then retry with the side marker present. This is preparation, not O1 evidence.

For name confusion, compare one primary target at a time with its name, then hide the name and ask again. For repeated orientation confusion, return to the whole body before reframing the region. A link to the free Anatomical orientation lesson is optional help; this lesson remains self-contained. Let learners continue by an accessible reviewed image/text alternative, recording the response mode accurately. A text response cannot be reported as successful 3D localization.

## Six-stage storyboard

The numbered order is **Orient → Explain → Predict → Guided practice → Independent transfer → Recap**. Within Explain/Predict, a submitted prediction may return to a short explanation and a fresh prediction. Do not reveal an answer before its first response. The following spoken passages total approximately 300 original words; visual directions and learner cues are separate production-planning fields.

### 1. Orient

**Draft spoken copy**

> Begin with the whole person in view. Use the orientation marker to check whose side we mean. Turning the camera changes our view; it does not change the person's left or right. Try the front and back controls, then return to the front. Choose unsure whenever you need another explanation.

**Visual directions:** full-body anterior state, person-side marker and clear view indicator. After the entry rehearsal, frame both shoulders; no answer highlight. Keep model posture fixed.

**Learner cues:** perform the ungraded entry attempt; pause or read the same explanation silently. Resume after the requested view is restored.

### 2. Explain

**Draft spoken copy**

> On each side, the shoulder girdle contains a clavicle and a scapula. First inspect the highlighted collarbone at the front. Next, change the view to inspect the shoulder blade behind it. Keep the upper-arm bone visible as context. We are learning whole bones today. No small surface feature needs a separate name.

**Visual directions:** sequential whole-mesh highlights of `FMA13323` and `FMA13396`, with their exact names outside the canvas; reviewed anterior then posterior frame. Retain `FMA23131` neutrally. No joint motion or surface highlight.

**Learner cues:** compare the two taught states; describe one difference in your own words. Exploration pauses the proposed narration; return to the reviewed state before continuing.

### 3. Predict

**Draft spoken copy**

> Before the next explanation, decide which of these two bones connects with the upper-arm bone. Commit to your choice, or choose unsure. Then inspect the explanation. The scapula connects with the humerus; the clavicle also connects with the scapula. Compare your first answer with that account. Explain what you would change, if anything.

**Visual directions:** separate the question from its reveal. Before submission, clear all answer labels and target highlights. After submission, highlight the relevant whole bones in sequence; use S2/S3-supported relationship text, without marking a joint surface.

**Learner cues:** save first response before reveal. Permit an explanation replay and a fresh, separately recorded prediction; keep the original answer.

### 4. Guided practice

**Draft spoken copy**

> Now find each named target with its label hidden. Make a selection before asking for help. If you need it, request an orientation hint first, then a comparison with the teaching view. Submit again after the feedback. Keep track of what you found independently and what became clear only after help.

**Visual directions:** begin with the practiced left-side frame and neutral context. Use a neutral selection outline without an answer name. Staged help: restore whole-body orientation; narrow the region; finally show the teaching highlight and explanation.

**Learner cues:** find each primary left target; request help explicitly. A revealed target is assisted completion. Guided work rehearses the rubric; it does not substitute for T1–T3.

### 5. Independent transfer

**Draft spoken copy**

> Start a fresh attempt. There are no answer highlights or hints in this set. You will identify structures, reconstruct the connections, and work from another view on the opposite side. Record unsure instead of guessing if you prefer. Feedback comes after submission. A later corrected answer will remain separate from this first attempt.

**Visual directions:** deliver T1–T3 in their specified states. No revealing hover names, search results, selection labels, transcript answers or prior feedback in the task panel. Keep neutral person-side/view indicators. An accessible alternative requires an equivalently reviewed task form.

**Learner cues:** complete each task before feedback; requesting help closes that independent attempt as assisted/incomplete and opens remediation.

### 6. Recap

**Draft spoken copy**

> Review your first answers beside any corrections. State one relationship without looking at the teaching highlight. Then describe what helped you recognize a target after the view changed. Identify one thing this model cannot teach. Mark the part that needs another attempt; the next lesson can begin with that retrieval check.

**Visual directions:** show the outcome record and learner-requested review states after tasks close. Keep source/model limits available. No completion badge based on playback.

**Learner cues:** explain an error or uncertainty; select a later retrieval target. Do not erase unsuccessful attempts when reviewing.

### Script caption and cue crosswalk

Use the six spoken passages above as script sections `sg-sp-01` through `sg-sp-06`, in stage order. Their verbatim spoken text is the draft transcript; captions reference those sections without duplicating or paraphrasing the anatomical qualifiers. Sentence segmentation and timestamps await a reviewed recording. Caption-only learners receive the same question/reveal separation. Expanded visual descriptions are separately marked text, not extra narration silently inserted into captions.

The following semantic cue IDs supply a common authoring structure. They are not executable commands or final timecodes. Every scene uses the skeleton model, fixed anatomical pose, neutral surrounding context and one reviewed selected target or none. Labels are shown only for teaching/review; task-specific concealment overrides them. A table row is a complete intended scene under these shared settings, not an instruction to preserve an unknown previous state. Framing names below are proposed review presets; their actual poses, visibility and occlusion must be approved before production.

| Cue ID and script section | Stage / outcome | Intended scene and caption | Pause or evidence boundary |
|---|---|---|---|
| `sg-cue-orient`, `sg-sp-01` | Orient; prepares O1/O3 | Whole-person front view, no target, person-side/view marker only; caption uses the Orient passage. | Pause for the entry rehearsal and restore requested view. |
| `sg-cue-clavicle`, opening of `sg-sp-02` | Explain; O1/O2 | Left-shoulder front frame, `FMA13323`, exact name visible, neutral context; caption follows the corresponding spoken sentences. | Exploration pauses guidance. |
| `sg-cue-scapula`, remainder of `sg-sp-02` | Explain; O1/O2 | Left-shoulder posterior frame, `FMA13396`, exact name visible, humerus neutral; caption follows the corresponding spoken sentences. | No body/joint movement is implied by the view change. |
| `sg-cue-predict-ask`, first part of `sg-sp-03` | Predict; O2 | Practiced regional frame, no selected target or answer labels; caption stops at the response request. | Save response or unsure before any reveal text/audio. |
| `sg-cue-predict-feedback`, second part of `sg-sp-03` | Predict feedback; O2 | Reviewed relationship states for the named whole bones; highlights change one at a time, with names visible. | Each highlight needs its own complete cue row when the final script is segmented; no unresolved multi-highlight behavior is assumed. |
| `sg-cue-guided`, `sg-sp-04` | Guided practice; O1/O3 | Left-side practiced frame, no target/name initially; each hint or reveal becomes a separately specified complete scene. | First attempt precedes revealing help; record assistance. |
| `sg-cue-independent`, `sg-sp-05` | Independent transfer; O1/O2/O3 | Initial target/view/label state comes from T1a, T1b, T2 or T3. Each task gets a complete scene row before implementation; no prior answer state carries over. | Instructions only; narration stops during responses and feedback remains withheld as specified. |
| `sg-cue-recap`, `sg-sp-06` | Recap; O1/O2/O3 | Neutral regional overview, no target initially; requested review states may reveal names after assessment closes. | Record explanation/uncertainty and later retrieval choice separately. |

### Editorial and revision record

Lesson/script/assessment draft: `0.1`; locale: English; model source: the checked-in skeletal manifest and its pinned asset record. The local draft recording and complete cue states have now been produced for demonstration revision 0.2.0, documented in the narration/activity chapter. Actual voice/pronunciation, framing, accessibility and educator review remain pending. Freeze reviewed recording, caption, cue and model identities before production integration. No historical assessment or resume migration is authorized by this packet.

Vocabulary spelling is in the ledger above. Pronunciation review is pending for clavicle, scapula, humerus, anatomical position, anterior, posterior and articulation. Record accepted pronunciation and the reviewer before recording; no unreviewed pronunciation guide is supplied as settled teaching copy.

## Objective → practice → assessment → feedback

| Outcome | Teaching and guided practice | Independent task | Feedback and next action |
|---|---|---|---|
| O1 | Explain target sequence; hidden-label left-side rehearsal. | T1 | Show selected versus keyed target and side. Revisit only the confused pair, hide labels, then use a new reviewed task form. |
| O2 | Predict before relationship reveal; reconstruct once with support. | T2 | Compare submitted links with the key; identify the missing or extra link. Learner redraws or restates it after explanation. |
| O3 | Orient rehearsal; supervised front/back comparison. | T3 | Separate side error, identity error and camera explanation. Restore full-body context, then retry with a different reviewed frame. |

## Independent task forms, keys and rubric

These task forms specify educator-review intent. The current local activity implements naming, picking and structured relationship responses; its actual prompts appear in the narration/activity chapter. Free-text explanations remain ungraded pending educator review. Prepare and approve the task images/model states separately from the teaching states. Examiner keys stay hidden until the first response is saved.

### T1 — `sg-identify-left-v1`

**T1a state:** show a reviewed left clavicle view and a reviewed left scapula view in an order varied between task forms. Mark the whole bone neutrally without a name, search result or audio answer. The mark specifies which object to name; it does not count as localization evidence. Save both naming responses before T1b supplies either name or any feedback is shown.

**T1a prompt:** “Name the marked bone and state the represented person's anatomical side. Submit before revealing its label.”

**T1a key:** each marked target maps to its exact name and side in the target table: `FMA13323` or `FMA13396`. Accept the taught plain-language synonyms. The marker's color or presentation order cannot encode the answer.

**T1b state:** reviewed bilateral anterior shoulder frame; neutral context; all target marks and labels cleared; controlled camera rotation allowed. A selection outline does not display its name before submission.

**T1b prompt:** “On the represented person's left, select the clavicle and then the scapula. Submit both selections.”

**T1b key:** ordered targets `FMA13323`, `FMA13396`. The prompt supplies the names, so this is named-target localization evidence only.

**Record separately:** T1a name and side; T1b mesh and side. A right-side counterpart is an identity/side distinction, not the same target. Report each criterion without treating one response mode as another. Correct mismatches after the independent task set is submitted.

### T2 — `sg-connect-whole-bones-v1`

**State:** three movable name cards—clavicle, scapula, humerus—without prejoined lines, answer order or highlights. No precise surface target is offered.

**Prompt:** “Draw or describe the two bone-to-bone connections taught here. Mark the two bones belonging to the shoulder girdle. Explain why the remaining bone is included in this view.”

**Key:** links clavicle–scapula and scapula–humerus; girdle membership: clavicle and scapula; humerus supplies upper-arm context. This task does not test every articulation of these bones. [S2, S3]

**Rubric:** evaluate each taught link, membership choice and context explanation separately as demonstrated, unclear or not demonstrated. Accept an accurate spoken sketch description. An unsupported extra connection requires clarification; do not infer knowledge from a memorized list. Feedback identifies the exact criterion to revise, with a brief return to Explain.

### T3 — `sg-transfer-right-view-v1`

**State:** start with a reviewed bilateral posterior frame, unlike T1. Remove prior answer selections; keep a neutral orientation indicator. Any required rotation is learner-controlled camera motion only.

**Prompt:** “Find the corresponding two primary bones on the represented person's right. Select and name them. Restore the anterior view and locate those same two targets again. What changed when the view changed, and what stayed the same?”

**Key:** `FMA13322`, `FMA13395` in both views. Explanation: viewpoint changed; target identity and anatomical side remained. [S1; local target registration]

**Rubric:** record each view's mesh/side/name criteria and the explanation separately. No target label or answer-bearing feedback appears between the two views. Reviewer confirms both views are usable and do not depend on an occluded target. Different correct inspection routes are acceptable.

### Attempt and correction record

For every response retain task/form version, model revision, initial view, response mode, first selection or explanation, unsure, hint level, feedback shown, corrected response and any later independent form. Mark independent versus assisted evidence explicitly. A replay or correction never overwrites the initial response. A later reassessment is a new record, not a replacement score. The entry check remains ungraded and distinct.

## Model omissions and limits

The six registrations identify whole bones; they do not register a separate joint surface, cartilage, ligament or attachment target. No movement is articulated. Surrounding anatomy is orientation context, not an assessment target or a claim of complete coverage. Geometry comes from one source adult model; it does not represent every person's variation. The packet teaches neither examination findings nor practical skill. Use a reviewed static alternative if an intended view fails, and record that mode. [S4; local manifest and provenance]

Required asset credit: **BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International**. Preserve existing attribution, source hashes and license records.

## Source-to-claim map

Live source pages checked **30 October 2026**. Factual support is separate from permission to reproduce a textbook. This packet uses original wording and prompts; no source figure, passage, activity or assessment item is copied. Reuse of an illustration or substantial adaptation requires its own license review.

| ID | Exact source section | Bounded use in this packet |
|---|---|---|
| S1 | [OpenStax Anatomy and Physiology 2e §1.6, Anatomical Position and Directional Terms](https://openstax.org/books/anatomy-and-physiology-2e/pages/1-6-anatomical-terminology) | Entry definitions, camera-versus-anatomical-orientation explanation and T3 key. |
| S2 | [OpenStax A&P 2e §8.1, opening overview, Clavicle and Scapula](https://openstax.org/books/anatomy-and-physiology-2e/pages/8-1-the-pectoral-girdle) | Primary names, paired girdle membership, front/back comparison and the two whole-bone relationships in Explain/Predict and T2. No named surface assessment. |
| S3 | [OpenStax A&P 2e §8.2, opening overview and Humerus](https://openstax.org/books/anatomy-and-physiology-2e/pages/8-2-bones-of-the-upper-limb) | Humerus vocabulary/context and arm-side relationship; no forearm, wrist or hand teaching. |
| S4 | [BodyParts3D database description, Database description](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/desc.html); [local skeletal manifest](https://github.com/StrandWorksAutomations/Badgemedia/blob/47263b4/assets/skeleton/manifest.json); [skeletal provenance](https://github.com/StrandWorksAutomations/Badgemedia/blob/47263b4/assets/skeleton/README.md) | Source-adult context, six exact FMA/name/mesh registrations and shipped asset limitations. Geometry registration does not validate a teaching view or assessment. |

## Review checklist before production integration

- [ ] Owner accepts outcomes, vocabulary depth, six-stage sequence and independent evidence.
- [ ] Anatomy reviewer checks factual wording, whole-bone connections, laterality and every proposed view against the cited sections and actual targets.
- [ ] Educator checks beginner instructions, each task's alignment/ambiguity, staged remediation and criterion-level rubric. Review first/assisted/later evidence separately.
- [ ] Draft narration, transcript, visual directions and pause/reveal points agree; target names and pronunciation are reviewed before recording.
- [ ] Teaching highlights are distinct from independent task states; captions, transcripts, hover labels and search cannot leak assessment answers.
- [ ] Review revised-view/opposite-side forms and accessible alternatives; distinguish localization evidence from verbal/text evidence.
- [ ] Check omissions, source/license records and attribution; add no inferred surface target, arbitrary joint coordinates or movement.
- [ ] Trial the reviewed plan with intended beginners to identify confusion, help required and actual duration. Treat results as formative feedback, not classroom validation.
- [x] Local demonstration authorized on 1 November. App integration, production audio and release still require later explicit scope.

This draft supplies no clinical/educator approval, CE credit, LMS compatibility, classroom-effectiveness validation or institutional endorsement.


## Review-copy provenance

Project snapshot: `Badgemedia@47263b4`. Canonical source material remains in the project repository:

- [docs/structural-anatomy-series.md](https://github.com/StrandWorksAutomations/Badgemedia/blob/47263b4/docs/structural-anatomy-series.md) — SHA-256 `98191c64f569070e98cd7640491d5ee6c8af182ff5cf0b21d259f8510a9fbeef`.
- [docs/learning/curriculum-standard.md](https://github.com/StrandWorksAutomations/Badgemedia/blob/47263b4/docs/learning/curriculum-standard.md) — SHA-256 `7a6b8dfd0d421df92a625c19e605f20b5476f574aa30e25c9b1c990e620358fb`.
- [docs/learning/lesson-authoring-template.md](https://github.com/StrandWorksAutomations/Badgemedia/blob/47263b4/docs/learning/lesson-authoring-template.md) — SHA-256 `97386b490ad4689c749a0638bb479ca3f1e6cbeb81689dbfe43bb6aa80ea515d`.
- [docs/learning/shoulder-girdle-lesson-plan.md](https://github.com/StrandWorksAutomations/Badgemedia/blob/47263b4/docs/learning/shoulder-girdle-lesson-plan.md) — SHA-256 `c26e5c0d7fc24bb4757a0ef004361b7c8467dd18b98bf4296637c1ff606422fa`.
- [web-prototype/structural-anatomy/narration.json](https://github.com/StrandWorksAutomations/Badgemedia/blob/47263b4/web-prototype/structural-anatomy/narration.json) — SHA-256 `e72ac5e36196e83081955aab0da4912a7ddb4bceac3ebda6f9ebf4bc7d69f910`.
- [web-prototype/structural-anatomy/tasks.json](https://github.com/StrandWorksAutomations/Badgemedia/blob/47263b4/web-prototype/structural-anatomy/tasks.json) — SHA-256 `864cb320ee0c0b84bce579fc7739679c751d39a42f760a5119aacc3db8ce8199`.


[Start here](/briefings/2026-11-02-073105-laptop-tenetrix-structural-anatomy-concepts) · [Course roadmap](/briefings/2026-11-02-073104-laptop-tenetrix-course-roadmap) · [Lesson format](/briefings/2026-11-02-073103-laptop-tenetrix-lesson-standard) · [Shoulder lesson](/briefings/2026-11-02-073102-laptop-tenetrix-shoulder-lesson-plan) · [Narration and activities](/briefings/2026-11-02-073101-laptop-tenetrix-narration-and-activities)
