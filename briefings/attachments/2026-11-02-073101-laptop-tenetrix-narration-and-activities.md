[Start here](/briefings/2026-11-02-073105-laptop-tenetrix-structural-anatomy-concepts) · [Course roadmap](/briefings/2026-11-02-073104-laptop-tenetrix-course-roadmap) · [Lesson format](/briefings/2026-11-02-073103-laptop-tenetrix-lesson-standard) · [Shoulder lesson](/briefings/2026-11-02-073102-laptop-tenetrix-shoulder-lesson-plan) · [Narration and activities](/briefings/2026-11-02-073101-laptop-tenetrix-narration-and-activities)

**Owner review draft · 2 November 2026.** The current shoulder-girdle demonstration uses a draft synthetic voice, eleven prerecorded narration parts and learner-paced activities. Anatomy, educator, actual voice and rendered/device review remain pending. Production app integration, billing and release remain separate decisions.

This dashboard review copy is adapted from the project material at commit `47263b4`. The authoring packet is draft 0.1; the executable narration and activities are draft 0.2.0. Production-planning requirements below remain review requirements rather than approval evidence.

# Current draft narration and learner activities

**Executable review draft 0.2.0 · Not a finished course recording.** These are the exact spoken words and complete scene states from the current local demonstration. The eleven recorded parts total approximately 130 seconds. Activities are learner-paced and add time. Voice pronunciation, factual/editorial review and actual rendered views remain open.

## How the walkthrough behaves

- Play starts only after a learner action and a ready model scene.
- Each part carries a complete view state; replay and seeking reconstruct it directly.
- Manual model exploration pauses the narration. Return to guided view restores the scene and waits for the learner to resume.
- Prediction explanations remain unavailable until the response. Independent tasks remove answer cues.
- First, assisted and corrected attempts remain separate. Written explanations use educator review, not automatic free-text grading.
- Model failure offers a text route; text-supported responses are not reported as visual localization evidence.

The transcript below includes teaching answers for owner review. It is not an independent learner assessment page. No audio or interactive model is hosted on these Markdown pages.

## Eleven spoken parts and their model states

### 1. Whose side and which view?

**Stage:** Orient · **Part:** `sg-orient`

> Begin with the whole person in view. Use the orientation marker to check whose side we mean. Turning the camera changes our view; it does not change the person's left or right. Try the front and back controls, then return to the front. Choose unsure whenever you need another explanation.

| Model field | Complete state |
|---|---|
| Model / view | Skeleton / front |
| Frame | `body` |
| Selected teaching target | None |
| Names visible | No |
| Isolated | No; context retained |

**Learner boundary:** `orientation`. Activity progress is separate from playback.

**Source IDs:** S1, S4

### 2. Two shoulder-girdle bones

**Stage:** Explain · **Part:** `sg-explain-overview`

> On each side, the shoulder girdle contains a clavicle and a scapula. We will inspect one whole bone at a time.

| Model field | Complete state |
|---|---|
| Model / view | Skeleton / front |
| Frame | `chest` |
| Selected teaching target | None |
| Names visible | No |
| Isolated | No; context retained |

**Source IDs:** S2, S4

### 3. Clavicle: collarbone

**Stage:** Explain · **Part:** `sg-explain-clavicle`

> First inspect the highlighted collarbone, called the clavicle, at the front. Follow this same whole bone as you inspect the model.

| Model field | Complete state |
|---|---|
| Model / view | Skeleton / front |
| Frame | `left-arm` |
| Selected teaching target | Left clavicle (`FMA13323`) |
| Names visible | Yes |
| Isolated | No; context retained |

**Source IDs:** S2, S4

### 4. Scapula: shoulder blade

**Stage:** Explain · **Part:** `sg-explain-scapula`

> Next, change the view to inspect the highlighted shoulder blade, called the scapula, behind it. The camera changed our view; the model has not moved a joint.

| Model field | Complete state |
|---|---|
| Model / view | Skeleton / back |
| Frame | `left-arm` |
| Selected teaching target | Left scapula (`FMA13396`) |
| Names visible | Yes |
| Isolated | No; context retained |

**Source IDs:** S1, S2, S4

### 5. Humerus: upper-arm context

**Stage:** Explain · **Part:** `sg-explain-humerus`

> The highlighted upper-arm bone is the humerus. It supplies context for the two shoulder-girdle bones. We are learning whole bones today. No small surface feature needs a separate name.

| Model field | Complete state |
|---|---|
| Model / view | Skeleton / front |
| Frame | `left-arm` |
| Selected teaching target | Left humerus (`FMA23131`) |
| Names visible | Yes |
| Isolated | No; context retained |

**Source IDs:** S2, S3, S4

### 6. Predict before the explanation

**Stage:** Predict · **Part:** `sg-predict-ask`

> Before the next explanation, decide which of the two shoulder-girdle bones connects with the upper-arm bone. Commit to your choice, or choose unsure. The explanation comes after your response.

| Model field | Complete state |
|---|---|
| Model / view | Skeleton / front |
| Frame | `left-arm` |
| Selected teaching target | None |
| Names visible | No |
| Isolated | No; context retained |

**Learner boundary:** `prediction`. Activity progress is separate from playback.

**Source IDs:** S2, S3

### 7. Compare with the relationship

**Stage:** Predict · **Part:** `sg-predict-answer-scapula`

> The scapula connects with the humerus. Compare your first answer with that account.

| Model field | Complete state |
|---|---|
| Model / view | Skeleton / back |
| Frame | `left-arm` |
| Selected teaching target | Left scapula (`FMA13396`) |
| Names visible | Yes |
| Isolated | No; context retained |

**Reveal boundary:** unavailable until the learner submits the prediction response.

**Source IDs:** S2, S3

### 8. Connect the other girdle bone

**Stage:** Predict · **Part:** `sg-predict-answer-clavicle`

> The clavicle also connects with the scapula. Explain what you would change in your first account, if anything.

| Model field | Complete state |
|---|---|
| Model / view | Skeleton / front |
| Frame | `left-arm` |
| Selected teaching target | Left clavicle (`FMA13323`) |
| Names visible | Yes |
| Isolated | No; context retained |

**Reveal boundary:** unavailable until the learner submits the prediction response.

**Source IDs:** S2

### 9. Find the targets with support

**Stage:** Guided practice · **Part:** `sg-guided`

> Now find each named target with its label hidden. Make a selection before asking for help. If you need it, request an orientation hint first, then a comparison with the teaching view. Submit again after the feedback. Keep track of what you found independently and what became clear only after help.

| Model field | Complete state |
|---|---|
| Model / view | Skeleton / front |
| Frame | `left-arm` |
| Selected teaching target | None |
| Names visible | No |
| Isolated | No; context retained |

**Learner boundary:** `guided`. Activity progress is separate from playback.

**Source IDs:** Activity instruction; no anatomical claim.

### 10. Fresh attempt without answer cues

**Stage:** Independent transfer · **Part:** `sg-independent`

> Start a fresh attempt. There are no answer highlights or hints in this set. First, name each marked bone and its anatomical side. Save both naming responses before the later tasks supply names. Then locate named targets, reconstruct the connections, and work from another view on the opposite side. Record unsure if you prefer. Feedback comes after submission. A corrected answer remains separate from this first attempt.

| Model field | Complete state |
|---|---|
| Model / view | Skeleton / front |
| Frame | `chest` |
| Selected teaching target | None |
| Names visible | No |
| Isolated | No; context retained |

**Learner boundary:** `independent`. Activity progress is separate from playback.

**Source IDs:** S1

### 11. Review the evidence and uncertainty

**Stage:** Recap · **Part:** `sg-recap`

> Review your first answers beside any corrections. State one relationship without looking at the teaching highlight. Then describe what helped you recognize a target after the view changed. Identify one thing this model cannot teach. Mark the part that needs another attempt; the next lesson can begin with that retrieval check.

| Model field | Complete state |
|---|---|
| Model / view | Skeleton / front |
| Frame | `chest` |
| Selected teaching target | None |
| Names visible | No |
| Isolated | No; context retained |

**Learner boundary:** `recap`. Activity progress is separate from playback.

**Source IDs:** S4

## Current learner activities, in order

Both naming tasks precede named-target localization. Guided tasks provide feedback after submission; the independent set withholds the recap/answer key until its submissions are complete. Reviewing teaching material before finishing the set marks unfinished responses as assisted. A correct later correction never replaces the original attempt.

This owner copy shows keyed target metadata so the design can be inspected. In the local learner flow, target names and hints are concealed as appropriate to the task.

### Activity 1: `guided-clavicle`

**Guided practice · locate**

> Find the person's left clavicle. Select it in the model, then check your answer.

**Reviewer key:** Left clavicle (`FMA13323`). View: front; frame: `chest`.

**Feedback:** Compare the left clavicle with the teaching highlight. Anatomical left belongs to the person, even when the camera moves.

### Activity 2: `guided-scapula`

**Guided practice · locate**

> Find the person's left scapula. Rotate the model if you need another view.

**Reviewer key:** Left scapula (`FMA13396`). View: back; frame: `chest`.

**Feedback:** The source label identifies the left scapula. Inspect its shape in this posterior view, then compare the opposite view.

### Activity 3: `name-clavicle`

**Independent transfer · name**

> Name the marked bone and state the person's anatomical side.

**Reviewer key:** Left clavicle (`FMA13323`). View: front; frame: `selection`.

### Activity 4: `name-scapula`

**Independent transfer · name**

> Name this marked bone and state the person's anatomical side.

**Reviewer key:** Left scapula (`FMA13396`). View: back; frame: `selection`.

### Activity 5: `locate-clavicle`

**Independent transfer · locate**

> Select the person's left clavicle, then submit your selection.

**Reviewer key:** Left clavicle (`FMA13323`). View: front; frame: `chest`.

### Activity 6: `locate-scapula`

**Independent transfer · locate**

> Select the person's left scapula, then submit your selection.

**Reviewer key:** Left scapula (`FMA13396`). View: back; frame: `chest`.

### Activity 7: `relationships`

**Independent transfer · relations**

> Reconstruct the two connections taught here. Mark the shoulder-girdle bones, then explain why the upper-arm bone was shown.


**Reviewer edges:** ["clavicle-scapula", "scapula-humerus"]

**Reviewer members:** ["clavicle", "scapula"]

### Activity 8: `right-clavicle-back`

**Independent transfer · locate**

> From this posterior start, find the person's right clavicle. You may rotate the camera.

**Reviewer key:** Right clavicle (`FMA13322`). View: back; frame: `chest`.

### Activity 9: `right-scapula-back`

**Independent transfer · locate**

> Find the corresponding primary shoulder blade on the person's right.

**Reviewer key:** Right scapula (`FMA13395`). View: back; frame: `chest`.

### Activity 10: `right-clavicle-front`

**Independent transfer · locate**

> The anterior view is restored. Find the same right clavicle again.

**Reviewer key:** Right clavicle (`FMA13322`). View: front; frame: `chest`.

### Activity 11: `right-scapula-front`

**Independent transfer · locate**

> Locate the same right shoulder blade again. Rotate if it is obscured.

**Reviewer key:** Right scapula (`FMA13395`). View: front; frame: `chest`.

### Activity 12: `view-explanation`

**Independent transfer · explain**

> What changed when the view changed, and what stayed the same? Explain one relationship in your own words.


**Reviewer rubric:** "The viewpoint changed; structure identity and anatomical side remained. The relationship explanation must match the two taught connections. An educator reviews this explanation; the preview does not grade free text."

## Source map and model credit

| ID | Source | Role |
|---|---|---|
| S1 | [OpenStax A&P 2e §1.6](https://openstax.org/books/anatomy-and-physiology-2e/pages/1-6-anatomical-terminology) | Anatomical reference position, side and viewpoint terminology. |
| S2 | [OpenStax A&P 2e §8.1](https://openstax.org/books/anatomy-and-physiology-2e/pages/8-1-the-pectoral-girdle) | Clavicle/scapula membership and taught whole-bone relationships. |
| S3 | [OpenStax A&P 2e §8.2](https://openstax.org/books/anatomy-and-physiology-2e/pages/8-2-bones-of-the-upper-limb) | Humerus context and relationship. |
| S4 | [BodyParts3D database description](https://dbarchive.biosciencedbc.jp/en/bodyparts3d/desc.html) and pinned project manifest | Whole-bone registrations, source model and geometry limitations. |

Source pages were checked for the authoring packet on 30 October 2026; publishing this dashboard copy is not a new independent anatomy review. The whole-bone model does not register precise joint surfaces or articulated movement and does not represent every person’s variation.

**BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International.**


## Review-copy provenance

Project snapshot: `Badgemedia@47263b4`. Canonical source material remains in the project repository:

- [docs/structural-anatomy-series.md](https://github.com/StrandWorksAutomations/Badgemedia/blob/47263b4/docs/structural-anatomy-series.md) — SHA-256 `98191c64f569070e98cd7640491d5ee6c8af182ff5cf0b21d259f8510a9fbeef`.
- [docs/learning/curriculum-standard.md](https://github.com/StrandWorksAutomations/Badgemedia/blob/47263b4/docs/learning/curriculum-standard.md) — SHA-256 `7a6b8dfd0d421df92a625c19e605f20b5476f574aa30e25c9b1c990e620358fb`.
- [docs/learning/lesson-authoring-template.md](https://github.com/StrandWorksAutomations/Badgemedia/blob/47263b4/docs/learning/lesson-authoring-template.md) — SHA-256 `97386b490ad4689c749a0638bb479ca3f1e6cbeb81689dbfe43bb6aa80ea515d`.
- [docs/learning/shoulder-girdle-lesson-plan.md](https://github.com/StrandWorksAutomations/Badgemedia/blob/47263b4/docs/learning/shoulder-girdle-lesson-plan.md) — SHA-256 `c26e5c0d7fc24bb4757a0ef004361b7c8467dd18b98bf4296637c1ff606422fa`.
- [web-prototype/structural-anatomy/narration.json](https://github.com/StrandWorksAutomations/Badgemedia/blob/47263b4/web-prototype/structural-anatomy/narration.json) — SHA-256 `e72ac5e36196e83081955aab0da4912a7ddb4bceac3ebda6f9ebf4bc7d69f910`.
- [web-prototype/structural-anatomy/tasks.json](https://github.com/StrandWorksAutomations/Badgemedia/blob/47263b4/web-prototype/structural-anatomy/tasks.json) — SHA-256 `864cb320ee0c0b84bce579fc7739679c751d39a42f760a5119aacc3db8ce8199`.


[Start here](/briefings/2026-11-02-073105-laptop-tenetrix-structural-anatomy-concepts) · [Course roadmap](/briefings/2026-11-02-073104-laptop-tenetrix-course-roadmap) · [Lesson format](/briefings/2026-11-02-073103-laptop-tenetrix-lesson-standard) · [Shoulder lesson](/briefings/2026-11-02-073102-laptop-tenetrix-shoulder-lesson-plan) · [Narration and activities](/briefings/2026-11-02-073101-laptop-tenetrix-narration-and-activities)
