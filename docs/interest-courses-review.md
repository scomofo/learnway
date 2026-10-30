# Five expanded included courses

Reviewed on 2026-10-29. Implementation starts from main commit
`7822487929acc14629031704e01d9c613a9f0367`.

## Delivered curriculum

The catalog grows from 12 to 17 included courses. Each addition has six reading
lessons, two check-ins per lesson, three scored questions per lesson, a captioned
SVG per lesson, six slides with speaker notes, a teacher/student dialogue, a rooted
mind map, visual flashcards and a practical capstone. The five additions provide
30 lessons, 60 reading check-ins, 90 explained scored questions and 30 figures.
No generation, credential or external service is needed to open them.

| Course | Lesson sequence | Capstone |
| --- | --- | --- |
| Precision Agriculture | Solution quality; correction chain; antenna/tool geometry; section timing; field data; acceptance | Design an acceptance test that measures the completed operation |
| Music Theory | Tonal centre; chord function; voice leading; rhythm; melodic phrasing; song sketch | Play or hum and revise an original eight-bar arrangement |
| Hybrid & Electric Vehicles | Architecture; energy/power; regeneration; low-voltage control; winter loads; symptom reasoning | Produce a factual service question with competing hypotheses |
| Stellar Evolution | Formation/support; lifetime; H–R diagram; Sun-like evolution; massive-star evolution; branching evidence | Explain a path with mechanisms and stated limits |
| AI Agents | Success contract; tool boundary; retrieval/memory; recovery; evaluation; study-assistant design | Write auditable successful and failure traces for mocked tools |

Course JSON is the canonical authored content. The existing renderers consume
it directly; there is no additional runtime dependency, API call or installation
step. Search, level filtering, notes, exports and all six study views use the
existing application flow. Estimated times include the suggested exercises.

## Technical and pedagogical review

- Explanations introduce the mechanism before equations, define symbols and units,
  state assumptions beside worked examples, and end with prediction or application.
- RTK distinguishes fixed ambiguity resolution, accuracy, repeatability, reference
  alignment and actual implement placement. The mast calculation uses a rigid-mast
  model, not a residual guidance-accuracy claim. Timing examples convert km/h to
  m/s and describe perpendicular constant-speed geometry. Product-specific timing,
  sign conventions and correction holdover are not assigned universal values.
- Music distinguishes the G-major chord from the key of G major, contextual tonal
  tendencies from universal rules, and an upper voicing from the complete bass
  texture. Every note and rest in the original eight-bar melody sums to four beats.
  Scientific pitch notation and durations are defined. Learners supply instrumental
  performance or humming; the app's dialogue narration is not instrumental audio.
- Vehicle examples distinguish kW from kWh, define energy-accounting boundaries,
  calculate kinetic energy before a hypothetical recovery fraction, and keep
  traction charge separate from auxiliary readiness. Cold-weather effects and
  charging strategies are model-dependent. Symptom exercises preserve uncertainty
  and do not prescribe high-voltage probing, isolation or repair.
- Stellar evolution separates pressure-gradient support from fusion energy supply,
  and surface temperature from core temperature and luminosity. It includes core
  helium burning in the Sun-like branch, a cooling white dwarf rather than a
  universal supernova ending, and uncertain retained-core outcomes in massive
  stars. The H–R sketch is a qualitative population map, not a universal age track.
  Diagram leaders point into the intended nested regions of the massive-star sketch.
- AI examples distinguish proposed actions from observed results, schema shape
  from semantics and permission, and retrieved evidence from authority. Unknown
  write completion, service-specific idempotency and bounded evaluation are explicit.
  The study assistant's tools are fictional design examples, not live integrations.

Primary and authored educational references are linked in each course and survive
Markdown export: ESA Navipedia, John Deere documentation, the correction-system
and equipment guides, Music Theory for the 21st-Century Classroom, DOE/AFDC,
NHTSA, Transport Canada, Argonne, NASA, OpenStax, University of Nebraska astronomy,
Anthropic, JSON Schema, OWASP, Microsoft and AWS. Numerical examples, exercises,
dialogues and SVGs are authored for these courses.

## Regression coverage

`test/interest-courses.test.mjs` checks that all five catalog entries match their
course metadata and validate against the production schema. It exercises every
renderer and Markdown export, ensures every figure survives the SVG boundary,
and checks visual flashcards and feedback. Independent calculations verify the
worked RTK distance/area, vehicle energy, stellar lifetime ratio and AI evaluation
score. A duration check counts every note and rest in the eight-bar music sketch.

`scripts/interest-courses-acceptance.mjs` uses actual desktop controls to find all
five courses, reveal all 60 reading answers, answer all 90 scored questions,
exercise a wrong-answer/new-attempt path for each course and compare every
Markdown download with the complete exported course. It also checks panel label
containment and keyboard enlargement of static figures. Gemini calls are blocked.

The full browser acceptance covers all 17 catalog courses in all six views,
imports/exports, saved notes and generation failure/recovery with mocked responses.
The visual suite checks all 71 included diagrams in Read and Slides, label clipping
and overlap, independent players, native slider seeking, actual orbital-vector
geometry, bounded longitudinal particle movement, reduced motion, focus dialogs
and static visual flashcards. CI runs all three browser scripts.

Broader acceptance exposed a pre-existing shared keyboard issue: a figure's
keydown handler intercepted native range keys and focusable caption/code content.
Playback shortcuts now apply only to a motion figure or its play button. Static
figures and other descendants retain their native keyboard behaviour. The browser
generation mocks now account for the pipeline's existing single validation-repair
retry; motion assertions inspect the actual drawn geometry and current particles
rather than obsolete CSS transforms or a no-longer-existing particle index.

Automated checks establish course integrity, selected numerical answers and UI
behaviour. They do not constitute independent subject-expert certification or
verification of audible speech synthesis quality.

## Recorded local results

Node 24.22.1 and Chromium 153.0.8010.0, desktop viewports of 1440 × 1000 and
1440 × 1100; no real Gemini key or model requests for included course checks.

| Check | Result |
| --- | --- |
| `node --test` | 110 passed, 0 failed |
| JavaScript syntax for application and changed browser scripts | Passed |
| `node scripts/browser-acceptance.mjs` | All 17 included courses in six views and full existing application regression flow passed |
| `node scripts/interest-courses-acceptance.mjs` | Five searches, 60 reading reveals, 90 correct quiz answers, five wrong-answer paths, five complete Markdown downloads, panel containment and native enlargement passed |
| `node scripts/visual-acceptance.mjs` | All 71 diagrams passed layout checks; motion, focus, native slider and flashcard checks passed |
| Manual review | All 30 new figures inspected as course sheets; adjusted label spacing, H–R annotation placement and nested-region leaders |
| `git diff --check` | Passed |
