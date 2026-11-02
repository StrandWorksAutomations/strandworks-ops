[Start here](/briefings/2026-11-02-073105-laptop-tenetrix-structural-anatomy-concepts) · [Course roadmap](/briefings/2026-11-02-073104-laptop-tenetrix-course-roadmap) · [Lesson format](/briefings/2026-11-02-073103-laptop-tenetrix-lesson-standard) · [Shoulder lesson](/briefings/2026-11-02-073102-laptop-tenetrix-shoulder-lesson-plan) · [Narration and activities](/briefings/2026-11-02-073101-laptop-tenetrix-narration-and-activities)

**Owner review draft · 2 November 2026.** The current shoulder-girdle demonstration uses a draft synthetic voice, eleven prerecorded narration parts and learner-paced activities. Anatomy, educator, actual voice and rendered/device review remain pending. Production app integration, billing and release remain separate decisions.

This dashboard review copy is adapted from the project material at commit `47263b4`. The authoring packet is draft 0.1; the executable narration and activities are draft 0.2.0. Production-planning requirements below remain review requirements rather than approval evidence.

# Structural anatomy curriculum and lesson standard

Draft 0.1 for review. Jonathan agreed on 30 October 2026 that the lessons need a shared plan, desired outcomes and script structure so they form one curriculum. This standard defines that authoring approach for first-time health-professions anatomy learners. It does not approve individual teaching content, audio production, a player or app integration. The production app integration and release hold remains in effect; the local demonstration was authorized separately on 1 November.

Use this standard with the [lesson authoring template](/briefings/2026-11-02-073103-laptop-tenetrix-lesson-standard) and the [worked shoulder-girdle lesson plan](/briefings/2026-11-02-073102-laptop-tenetrix-shoulder-lesson-plan). These are authoring and review documents. Compare the current executable demonstration with the linked narration/activity chapter; its implementation does not establish educator or anatomy approval.

## Curriculum purpose

The learner should build a usable mental map of anatomical structures and relationships. A lesson contributes a small, observable part of that map. The course revisits earlier structures as it introduces the next region, then checks the combined map from more than one viewpoint.

The standalone course supplies its own orientation and remediation. The free Anatomical orientation lesson may provide additional help; purchasing Foundations is not a proposed prerequisite. Course packaging, price and entitlement implementation remain governed separately by [Foundations purchase architecture](https://github.com/StrandWorksAutomations/Badgemedia/blob/47263b4/docs/foundations-purchases.md).

### Common outcome families

| Outcome family | Observable performance | Evidence that is insufficient by itself |
|---|---|---|
| Identify | Locate and name a reviewed structure without an answer label. | Recognize a highlighted name or select a printed name from a list. |
| Orient | State the anatomical side/view and use the specified reference position. | Memorize the structure's screen position. |
| Relate | Describe or reconstruct a taught spatial or neighboring-structure relationship. | List names without the relationship. |
| Transfer | Identify or relate the same structure after a reviewed view/side change. | Repeat the identical teaching image. |
| Explain | Give a short explanation containing the lesson's required relationship and qualifier. | Repeat the narration verbatim without addressing the question. |

Each lesson selects the outcome families relevant to its scope. It need not assess all five equally. Use verbs such as identify, locate, distinguish, describe, compare or reconstruct. Avoid outcomes stated only as understand, learn or become familiar with. Every stated outcome must have independent evidence and an answer/correction rubric.

## Course progression

The first course is provisionally Upper-limb skeleton. Its six proposed lessons share a way of examining anatomy: establish the region and view, identify the named structure, compare relevant neighbors, then test the relationship from another view. Detailed anatomy and assessments still require lesson-specific source and asset review.

| Proposed lesson | Main contribution | Connection to prior learning | Cumulative evidence to plan |
|---|---|---|---|
| Shoulder girdle | Establish the first regional map and a consistent way to inspect a structure. | Provides the course's beginner orientation. | Identify the taught structures from two reviewed views and explain a taught relationship. |
| Humerus | Extend the map through the arm region. | Recall the previously taught shoulder relationship before adding new material. | Locate the new structure and connect it to the prior regional map. |
| Radius and ulna | Compare two named structures within the forearm. | Retrieve the arm-region map and directional vocabulary. | Distinguish the pair using the taught anatomical reference, then link regions. |
| Carpal groups | Organize multiple named wrist structures into a manageable regional grouping. | Retrieve the forearm-to-wrist context. | Identify the selected taught set and explain the reviewed grouping. Scope follows geometry/source audit. |
| Metacarpals | Extend the wrist-to-hand organization. | Reconstruct the preceding regional grouping. | Associate taught structures with their reviewed regional relationships. |
| Digits and integrated review | Complete the course's regional sequence and combine earlier learning. | Retrieve shoulder, arm, forearm, wrist and hand content. | Integrated identification and relationship reconstruction with changed views. |

Retrieval from a prior lesson must be brief and purposeful, followed by feedback or an exact replay/remediation link. It should not become a surprise test of material the learner has not been taught. The final review combines the agreed outcomes; it does not introduce an unannounced body of new terminology.

## Shared lesson sequence

Use these six stage names and this instructional order across the course. Repeat the Explain and Predict cycle when an additional relationship needs it. A narration segment should end at a meaningful teaching boundary; the number of segments and questions follows the outcomes.

| Stage | Required function | Common transition |
|---|---|---|
| **Orient** | State the task/outcomes, establish anatomical viewpoint and check entry knowledge. Teach or remediate essential vocabulary. | Learner can use the reference frame needed for the first explanation. |
| **Explain** | Present one relationship with synchronized, relevant model evidence. Define a new term when it is first needed. | The discussed scene remains available for inspection or replay. |
| **Predict** | Ask the learner to commit to a prediction or retrieve a taught relationship before revealing the answer. | Feedback explains the relationship and directs the next observation. |
| **Guided practice** | Require an action with graduated support. Record the attempt before providing a revealing hint. | Learner can retry and inspect the correction. |
| **Independent transfer** | Require the outcome with answer cues removed and a reviewed view, side or relationship change. | Record independent evidence separately from assisted completion. |
| **Recap** | Reconstruct the main relationship, revisit uncertainty and connect to the next lesson or later recall. | Summarize evidence accurately; listening time cannot establish mastery. |

Duration is a planning estimate. Consistency comes from the learning sequence, language and controls, not identical lesson lengths, speaking rates or question counts. Split an overloaded lesson when its objectives, vocabulary or model complexity exceed what beginners can reasonably practice together; educator and learner review determines that boundary.

## Script and presentation conventions

### Teaching voice

- Speak directly to the learner in calm, clear language. Explain why an observation matters to the current task.
- Introduce the anatomical term with an appropriate everyday equivalent once, then use the same term consistently. Avoid switching synonyms to create variety.
- Name the anatomical side and reference view when they affect the task. Use the person's anatomical left/right rather than screen-left/screen-right as the identity.
- Explain a relationship before adding more detail. Distinguish an observation, a prediction request, feedback and an instruction to explore.
- Use short spoken sentences and purposeful pauses. Do not read the whole interface aloud or add music, praise, trivia or repeated introductions that compete with the teaching point.
- Keep safety/model qualifiers attached to the claim they qualify. Do not add unsupported procedural, diagnostic or functional claims to make a structural lesson feel more clinical.

The opening establishes the regional question, intended outcome and reference frame. The closing reconstructs the relationship and points forward. Reuse that purpose and sequence without forcing the same stock sentences into every lesson.

### Separate editorial channels

Keep four linked columns in the storyboard: **spoken narration**, **on-screen caption/text**, **model state/cue**, and **learner action/evidence**. Link each row to an objective and claim where applicable. Stage directions, filenames, target IDs and author notes are never spoken narration. Captions preserve the spoken meaning and essential qualifiers; an optional expanded transcript may add clearly marked descriptions of visual information.

The recording follows an approved script. Pronunciation notes identify words requiring a voice check; an anatomy reviewer checks the actual recording. Final caption and cue times are aligned to that recording, not guessed from word count. Edited audio and translated audio require their own timing review.

### Shared model language and controls

Use the same selected-structure treatment, contextual anatomy treatment and orientation display throughout a course. Match the app's established palette when the presentation is eventually implemented. Name a highlighted structure in text as well as visually. Hide revealing labels/highlights before independent responses. Do not draw an anatomical connection that is absent from the verified model.

Proposed recurring control labels are **Play**, **Pause**, **Replay explanation**, **Explore**, **Return to guided view**, **Hint**, **Check answer**, **Continue**, and **Review explanation**. Keep these labels stable wherever their behavior is the same. Changing the camera manually pauses guidance; returning to guidance restores the expected scene before playback resumes. The [series playback contract](https://github.com/StrandWorksAutomations/Badgemedia/blob/47263b4/docs/structural-anatomy-series.md#playback-contract-to-settle-before-implementation) defines proposed interruption and failure behavior.

Every visual cue describes a complete reviewed scene: model/version, exact selected structure, mode, framing, orientation, labels, context and isolation. It is not a log of clicks. Seeking or replaying must reconstruct the scene without replaying preceding UI operations. Fine landmarks need reviewed targets; a whole-bone ID does not establish a separately selectable joint surface.

## Evidence and feedback rules

Keep the initial response, hint requests, feedback exposure and corrected response as distinct records. A correct response after a revealing hint is assisted completion, not an independent first success. Do not convert confidence ratings or viewing time into mastery scores.

Separate naming from localization when both are outcomes. A prompt that gives a structure's name can test locating it, but repeating the supplied name is not independent naming. An unnamed target marker may specify which structure to name; that task supplies naming evidence, not evidence that the learner found the location unaided.

Feedback follows a consistent pattern: identify the mismatch, explain the required relationship, direct attention to relevant evidence, and offer a retry or a precise review link. For a correct response, explain why it fits the task; a color change alone is insufficient. Distractors should represent plausible confusions within taught content, rather than trick wording or unrelated trivia.

Define a small rubric for each task: required structure/relationship, accepted terminology, essential qualifier, common error and correction. Passing thresholds and the amount of independent evidence remain provisional until educator review and formative learner trials. Preserve the distinction between completing an activity and meeting its learning criteria.

Accessible alternatives must teach the same objective and produce meaningful evidence in the available response mode. A text path may support the relationship outcome without proving a visual-location task. Record that distinction accurately and review equivalent assessment design; do not penalize disability or silently claim identical visual evidence. An open explanation uses an educator rubric initially; automatic speech or free-text grading is not proposed for the first course.

## Authoring record and revision control

Maintain one canonical lesson packet with stable course, lesson, stage, objective, claim, assessment and cue IDs. Use separate content revisions for changed teaching/answer meaning and presentation revisions for audio/caption/cue changes. Never reuse an ID for a different concept or question. An accepted translation can retain concept IDs but needs its own script, recording, caption/cue timing and language review.

Before an eventual release, freeze one reviewed combination of lesson text, claims/sources, locale, recording hash/duration, captions, cues, assessment revision and model-manifest identity. A change reopens the affected review. Changed answer keys must not silently rescore historical first answers. A new recording/cue revision requires an explicit playback-resume migration or a clear restart of presentation; prior learning records remain preserved according to their original revision.

## Review gates and definition of ready

1. **Curriculum review:** confirm audience, course progression, entry knowledge, outcome coverage and appropriate scope. Check that a lesson adds meaningful learning and connects to its neighbors.
2. **Content and anatomy review:** trace each taught claim and answer to an exact supporting source; verify terminology, laterality, target identity, visible relationship and omissions. AI source checking is not independent educator/anatomy approval.
3. **Storyboard review:** read the spoken script with its visual states and response points. Check cue relevance, answer concealment, pronunciation notes, caption meaning and the silent/text route.
4. **Assessment review:** verify independent evidence for every outcome, plausible distractors, answer/rubric clarity, feedback and first-versus-assisted semantics. No arbitrary pass percentage is set solely to fill a template.
5. **Formative learner review:** observe intended beginners, measure help needed and actual duration, inspect misconceptions and revise. This is formative evidence, not accreditation or proof of institutional demand.
6. **Implementation and media approval:** only after the planning packet is accepted, authorize a bounded local demonstration. Native integration and release remain separate owner decisions under the existing hold.

A lesson is ready for the next agreed stage only when its packet contains the objectives/evidence map, storyboard, sources, model inventory/omissions, task keys/rubrics, accessibility route, reviewer dispositions and revision identity. A shared template is not a substitute for these reviews. Lesson and course approval must not be inferred from agreement on this authoring standard.


---

# Lesson authoring template

Use this template to plan one lesson in a consistent curriculum. Copy its sections into the lesson plan and replace the author instructions with reviewed decisions, scripts and evidence. Instructions in this document are **author directions**, not narration, captions or finished lesson content.

The [structural anatomy series plan](/briefings/2026-11-02-073104-laptop-tenetrix-course-roadmap) supplies the current audience, scope and planning hold. This template proposes a shared authoring format. Accepting the format does not approve an individual lesson, authorize audio production or authorize app/player integration. Each requires its own explicit approval. Existing previews are presentation specimens, not approved curriculum.

## 1. Lesson identity and entry knowledge

| Field | Author direction |
|---|---|
| Course and lesson IDs | Assign stable IDs and a learner-facing title. Preserve IDs when revising wording; use a new item ID when the assessed skill or answer meaning changes. |
| Audience and setting | State the learner's actual entry level and the intended individual/instructor use. Do not infer anatomy knowledge from profession, app ownership or previous navigation. |
| Lesson purpose | Name the specific question this lesson helps the learner answer. Explain its place between the preceding and following lessons. |
| Scope and exclusions | Specify the content and model depth. State what this lesson cannot establish, including any practical competence or clinical inference outside its objectives. |
| Versions | Record lesson, source-map, model/manifest, script, caption and audio versions. Before recording, mark audio and timing as not produced. |
| Planning state | Start as **Draft plan — not approved for production or app integration**. Track format, lesson, demonstration and implementation approvals separately. |
| Time estimate | Estimate explanation, learner practice and independent work separately. Label the estimate provisional; replace it with observed learner ranges when available. |

Document entry knowledge as specific actions or terms, not a list of prior purchases. Provide a brief, ungraded diagnostic with an **unsure** response. Record what a mistaken response suggests and the short refresher that addresses it. Returning from remediation must offer a fresh attempt without treating the diagnostic as a lesson outcome score.

If the course is advertised for beginners, provide the required orientation within the course. Link earlier resources as additional support; do not create an unstated purchase or knowledge prerequisite.

## 2. Outcomes, evidence and vocabulary

Plan a small set of observable outcomes, **usually two to four**. A narrower lesson may justify one; do not invent an extra objective to satisfy a count. Use actions such as locate, distinguish, compare, reconstruct or explain. Specify the conditions: labels shown or hidden, familiar or changed view, permitted help and response mode. Avoid outcomes consisting only of “understand” or “know.” If the scope needs many unrelated outcomes, split the lesson.

Complete one row per outcome before writing narration:

| Outcome ID and observable performance | Teaching event and reviewed model state | Independent evidence | Feedback and recovery |
|---|---|---|---|
| Give the action, conditions and required accuracy or rubric criterion. | Identify the explanation, observation or guided attempt that prepares the learner. | Name the task and response that demonstrate the action without the answer cue. A name-recognition MCQ alone does not establish model localization. | Identify the misconception, relevant explanation/cue to revisit and a fresh attempt that can show recovery. |

Set any passing criterion with educator review of the actual task difficulty. Completion, assisted practice and independent performance have different meanings. Do not manufacture a percentage threshold or extra question simply to fill a template.

Create a vocabulary ledger with **term, beginner definition, first spoken use, display spelling, pronunciation and later reuse**. Define necessary terms before relying on them in a question. Reuse the course's accepted definitions and naming conventions. Put additional terminology in an optional depth section when it is not required for the outcomes.

## 3. Shared stage sequence

Every lesson follows these six named stages. The structure is fixed; the amount of explanation and practice follows the objectives.

| Stage | Required learner experience | Author check |
|---|---|---|
| **Orient** | Understand the regional question, current viewpoint, controls, limits and needed entry terms. Attempt the ungraded diagnostic if entry knowledge matters. | Can a beginner start without relying on information hidden in another lesson? |
| **Explain** | Hear/read a concise explanation while the actual reviewed model shows the discussed content. One segment addresses one coherent relationship. | Does the visual support the spoken claim, and does the learner have enough context to interpret it? |
| **Predict** | Commit to a prediction or comparison before its answer is revealed. Allow uncertainty and give causal feedback after submission. | Does the task require applying the explanation rather than repeating the immediately displayed answer? |
| **Guided practice** | Manipulate or identify with optional staged help. Receive explanation after an attempt. | Are hints sequenced from orientation toward the answer, and is assisted success recorded honestly? |
| **Independent transfer** | Apply the outcome to another reviewed view, side, arrangement or example without revealing cues. | Is this independent evidence for each outcome rather than a replay of the same cued item? |
| **Recap** | Explain the central relationship, inspect errors and choose what to revisit. See how this lesson connects to the next one. | Does the recap distinguish remaining uncertainty from completed practice and offer a precise return point? |

Explain and Predict may contain multiple short segments or repeat as a paired cycle before Guided practice. Remediation can return to a previous stage. Preserve the distinction between explanation, supported work and an independent attempt; do not turn the lesson into one uninterrupted recording followed by a quiz.

## 4. Script and model storyboard

Write the spoken script and visual direction together. Each row is one meaningful beat, not necessarily one sentence or one question. Duplicate the row pattern as needed. **Do not read production directions aloud.**

| Cue, stage and outcome | Spoken narration | Exact model direction | Caption, pause and learner control | Evidence and source linkage |
|---|---|---|---|---|
| Assign a stable cue ID, stage and outcome ID. Use an untimed semantic cue until a reviewed recording exists. | Write the final spoken words verbatim. Use **SILENT — learner action** when there is no narration. Put alternate feedback in separately named rows. | Specify manifest/model version, exact target ID/name or explicitly no target, view/frame preset, camera transition, retained context, labels and highlight state. “Show the relevant area” is insufficient. | Reference the exact caption/transcript segment. State whether playback pauses, what answer cues are cleared, what the learner can inspect and what explicit action continues. | Link claim/source IDs and assessment item ID where applicable. Define the required response, first-attempt evidence, hint behavior and feedback/retry destination. |

After recording, add reviewed audio intervals to the cue identifiers. Do not invent final timecodes from a word count. Seeking or replaying a cue must reconstruct its complete expected view, not rely on a preceding series of clicks. A requested precise landmark needs a reviewed target; a whole-structure mesh is not proof of a registered substructure or joint surface.

Narration uses a plain, consistent voice, defines new terms and states what to inspect and why. Avoid describing an action the model does not perform. Separate an anatomical change from a camera change. Do not imply that a highlight measures physiology, predicts an individual patient or establishes a safe procedure location.

The caption/transcript is the reviewed spoken content, including questions and meaningful feedback. Instruction labels and persistent model labels are separate interface text. Record any essential visual information that needs a text equivalent. A silent path must teach the same outcomes; record a different assessment response mode accurately rather than calling it completed visual identification.

## 5. Assessment and attempt records

For every item, specify its outcome, task type, reviewed prompt, expected response or rubric, rationale, source IDs and retry variant. Use MCQs when they fit the outcome; use localization, comparison, ordering or explanation when those are the intended skills. A free response needs an educator-reviewed rubric; this template does not authorize automatic speech or essay grading.

Keep these records distinct in the proposed design:

- **First:** the first submitted response before help, with item/version and response mode. Preserve it across retry.
- **Hinted:** help requested, the highest hint used and any response submitted with assistance. A reveal is assistance, even without a button named Hint.
- **Corrected:** the later response and correction path. Do not overwrite the first attempt or present a corrected response as independent first-attempt success.

An independent task starts without answer labels, residual highlights, a spoken answer or a remembered selection that gives it away. If help is requested, allow it, mark the attempt assisted and offer another appropriate transfer task when independent evidence is needed. Do not use listening time, reaching the recap or viewing an explanation as a substitute for the required response.

Feedback identifies the relevant relationship or misconception, directs attention to a reviewed model state and offers a specific next attempt. Keep the course's feedback wording consistent: response, explanation, review action, fresh attempt. Avoid punitive language and unsupported claims of mastery or competence.

## 6. Learner controls and accessibility plan

Specify Play/Pause, replay segment, rewind/seek, speed, exploration, return to guided view and exit/resume behavior in the lesson plan. User manipulation pauses guided narration; returning restores the reviewed scene before an explicit resume action. Questions pause narration and conceal answer cues. The model must be ready before a guided segment begins; a missing target or failed load requires a clear fallback rather than an invented substitution.

Plan captions, transcript, silent use, readable controls, large text, screen-reader/keyboard interaction and Reduced Motion. Name the selected structure outside the canvas and do not rely on color alone. Reduced Motion uses reviewed static or immediate view changes. Describe the text route when 3D or audio fails, including which assessment evidence that route can and cannot supply.

List interruption, offline and resume cases for later implementation review. These are design requirements to approve and test, not claims that a player or storage service already supports them.

## 7. Claims, geometry and voice review

Maintain a claim map covering spoken facts, captions, labels, questions, correct answers and feedback. Map each claim to an accessible source, edition/revision, exact supporting section, checked date and content location. Record conflicts, uncertainty and the reviewer's decision. Bibliography presence alone is insufficient. Separate factual citation from rights to reproduce text, figures, recordings or assets.

Maintain a model ledger with asset version/hash, exact target IDs and source names, laterality, available views, highlighted relationships and known omissions. State what is schematic or absent and what the lesson must not infer. Assign a reviewer to verify each requested view and highlight; do not infer fine anatomy from a skin outline or unregistered coordinate.

Before audio production, maintain a pronunciation sheet for technical terms, abbreviations and names. Record accepted pronunciation, stress, spoken expansion and approving reviewer. Review a short voice sample for clarity, pace and pronunciation; record voice origin, consent/usage rights and any generated-voice disclosure required for the intended use. No audio is approved merely because the script is approved.

## 8. Editorial review, approvals and revision

| Gate | Evidence required | Approval boundary |
|---|---|---|
| **Shared format** | Consistent stages, script/cue distinction, terminology and evidence records. | Accepts the authoring pattern; approves no particular lesson. |
| **Individual lesson plan** | Complete outcomes map, script/storyboard, checks, rationales, claim map, target review, omissions and accessibility path. | Approves that lesson's content plan; does not authorize production or integration automatically. |
| **Local demonstration/production** | Explicit owner authorization for the defined sample, reviewed pronunciation, final audio/caption/cue alignment and stated verification. | Applies only to the agreed local work or recording. |
| **App implementation/release** | Separately approved access, native/offline integration, acceptance plan and release decision. | No app or store action follows from a planning approval alone. |

Assign educator, anatomy/content, accessibility and technical reviewers as appropriate. Record reviewer identity/role, scope checked, unresolved findings and dated disposition. AI/source checking is not independent educator or clinical approval. If learner review is conducted, record entry level, help needed, misunderstood instructions, transfer performance and observed duration; do not convert formative feedback into an efficacy or institutional-demand claim.

For each revision, record version, changed outcome/claim/cue/item IDs, reason, source or reviewer evidence, affected audio/captions/model cues and approvals invalidated. Re-recording can invalidate timing; changing a model can invalidate highlights; changing an answer meaning can invalidate score comparisons. Define the required re-review before resuming production.

### Mandatory consistency and permitted variation

**Mandatory:** stable identity, explicit entry support, a justified set of observable outcomes, the six-stage sequence, outcome-to-independent-evidence mapping, separated spoken/caption/model directions, source/target review, accessible learner control, honest attempt records and separate approval states.

**Flexible:** segment length and count, total duration, question count and format, amount of practice, optional depth, response mode and provisional passing criteria. Justify these choices through the outcomes and educator/learner review. Consistency should make lessons recognizable as one curriculum without forcing unrelated topics into arbitrary timing or identical quizzes.


## Review-copy provenance

Project snapshot: `Badgemedia@47263b4`. Canonical source material remains in the project repository:

- [docs/structural-anatomy-series.md](https://github.com/StrandWorksAutomations/Badgemedia/blob/47263b4/docs/structural-anatomy-series.md) — SHA-256 `98191c64f569070e98cd7640491d5ee6c8af182ff5cf0b21d259f8510a9fbeef`.
- [docs/learning/curriculum-standard.md](https://github.com/StrandWorksAutomations/Badgemedia/blob/47263b4/docs/learning/curriculum-standard.md) — SHA-256 `7a6b8dfd0d421df92a625c19e605f20b5476f574aa30e25c9b1c990e620358fb`.
- [docs/learning/lesson-authoring-template.md](https://github.com/StrandWorksAutomations/Badgemedia/blob/47263b4/docs/learning/lesson-authoring-template.md) — SHA-256 `97386b490ad4689c749a0638bb479ca3f1e6cbeb81689dbfe43bb6aa80ea515d`.
- [docs/learning/shoulder-girdle-lesson-plan.md](https://github.com/StrandWorksAutomations/Badgemedia/blob/47263b4/docs/learning/shoulder-girdle-lesson-plan.md) — SHA-256 `c26e5c0d7fc24bb4757a0ef004361b7c8467dd18b98bf4296637c1ff606422fa`.
- [web-prototype/structural-anatomy/narration.json](https://github.com/StrandWorksAutomations/Badgemedia/blob/47263b4/web-prototype/structural-anatomy/narration.json) — SHA-256 `e72ac5e36196e83081955aab0da4912a7ddb4bceac3ebda6f9ebf4bc7d69f910`.
- [web-prototype/structural-anatomy/tasks.json](https://github.com/StrandWorksAutomations/Badgemedia/blob/47263b4/web-prototype/structural-anatomy/tasks.json) — SHA-256 `864cb320ee0c0b84bce579fc7739679c751d39a42f760a5119aacc3db8ce8199`.


[Start here](/briefings/2026-11-02-073105-laptop-tenetrix-structural-anatomy-concepts) · [Course roadmap](/briefings/2026-11-02-073104-laptop-tenetrix-course-roadmap) · [Lesson format](/briefings/2026-11-02-073103-laptop-tenetrix-lesson-standard) · [Shoulder lesson](/briefings/2026-11-02-073102-laptop-tenetrix-shoulder-lesson-plan) · [Narration and activities](/briefings/2026-11-02-073101-laptop-tenetrix-narration-and-activities)
