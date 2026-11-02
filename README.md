# Learnway

A Learn-Your-Way-style AI course pipeline: type a topic, get a full course —
immersive reading, section quizzes, slides with narration, an audio dialogue,
and a mind map — personalized to your level and interests.

Pure static site. The Gemini API is called from your browser; your key never
leaves your machine except to Google.

## Run it

```sh
node serve.mjs        # serves on http://localhost:8130
```

Open an **Included course** immediately—no key or generation required. To generate
your own course, go to **Settings**, and paste a Gemini API key from
[Google AI Studio](https://aistudio.google.com/apikey) (free tier works fine).

No build step, no dependencies.

## How it works

1. **New course** — topic, your level, your interests, depth.
2. **Plan** — a short outline is generated first. Approve it or redraft.
3. **Generate** — five generation steps, all as structured JSON:
   - immersive reading with embedded check-in questions
   - section quizzes (application, not recall; plausible distractors)
   - slides + speaker notes
   - audio-lesson dialogue, mind map, mnemonics
   - labelled SVG illustrations for each section
4. **Six views** — Read, Quiz (interactive scoring), Slides, Audio
   (read aloud in-browser with two voices), Mind map, Flashcards.
5. Courses save to the browser's localStorage; export/import as JSON.
   Export Markdown for a study guide including visuals and further-reading links.

## Included courses

The catalog contains **37 included courses**, all available without generation
or an API key. The original twelve courses, five interest courses and ten restored
October additions are joined by the ten expanded courses described below.
Each of the ten mini-courses has three reading sections, visual mental models, check-in
questions, six explained quiz questions, slides with notes, an audio dialogue,
a mind map and automatically derived flashcards. They open from Library without
an API call. Search and level filters apply to the entire included catalog.

| Lesson | Focus |
| --- | --- |
| AP Biology | Membranes, enzyme catalysis, Mendelian inheritance |
| AP Chemistry | Ions, limiting reactants, dynamic equilibrium |
| Intro to Rocket Science | Thrust, ideal rocket equation, orbital motion |
| How Engines Work | Four strokes, torque and power, energy balance |
| Electrical Wiring Fundamentals | Low-voltage DC models, circuit topology, protection roles |
| How GPS Works | Signal timing, four unknowns, position quality |
| Weather | Wind, cloud formation, fronts and uncertainty |
| Plate Tectonics | Lithosphere, boundary types, earthquakes |
| Sound & Music | Waves, pitch and timbre, string resonance |
| Everyday Probability | Outcome counting, combined events, conditional evidence |

The AP lessons are focused introductions, not complete AP courses or official
College Board resources. Electrical examples are conceptual and do not give
household installation procedures. Lessons state model assumptions alongside
worked examples and include further reading from sources such as NASA, NOAA,
USGS, GPS.gov, OpenStax, CCOHS and the US Department of Energy.

### Five expanded courses

Each expanded course has six lessons, twelve reading check-ins, eighteen scored
questions with explained answers, six slides with speaker notes, a teacher/student
audio dialogue, a mind map, visual flashcards and a practical capstone. All thirty
new lessons have captioned, accessible SVG explanations. They use the same six
study views, notes and JSON/Markdown exports as the rest of the catalog, and open
without an API key. Time estimates include the suggested exercises.

| Course | Focus and final exercise | Estimated study time |
| --- | --- | --- |
| Precision Agriculture: From RTK to Automated Fieldwork | RTK quality, corrections, geometry, section timing and field data; design a whole-operation acceptance test | 65 minutes |
| Music Theory for Songwriting & Arrangement | Tonal centre, harmony, voice leading, groove and melody; write and revise an original eight-bar sketch | 70 minutes |
| How Hybrid & Electric Vehicles Work | Energy paths, power versus energy, regeneration, 12V/DC–DC roles and cold-weather loads; prepare an evidence-based service question | 60 minutes |
| The Life & Death of Stars | Pressure support, fuel, lifetimes, H–R diagrams and branching evolution; defend a Sun-like or massive-star path | 65 minutes |
| AI Agents: From Prompt to Reliable Workflow | Tool contracts, retrieval, permissions, failure recovery and evaluation; design a mocked study-plan assistant | 65 minutes |

These are conceptual courses with worked examples and explicit model limits.
The music course supplies notation to hum or play, rather than instrumental
audio. Vehicle lessons do not provide high-voltage repair procedures. The AI
course uses fictional tools and makes no live calls. Source links are available
in the course and its Markdown export. Editorial and acceptance evidence is in
[`docs/interest-courses-review.md`](docs/interest-courses-review.md).

### Ten more expanded courses

Each of these courses contains six lessons, twelve reading check-ins, eighteen
explained scored questions, six captioned SVG illustrations, slides with speaker
notes, a teacher/student dialogue, a mind map, visual flashcards and a worked
capstone. Together they add **60 lessons, 120 check-ins, 180 scored questions and
60 illustrations**. Each has an estimated 65-minute study time including exercises.

| Course | Focus and final exercise |
| --- | --- |
| Soil & Water: Infiltration, Storage & Drainage | Pores, root-zone storage, water budgets and landscape evidence; defend a field-water investigation |
| Hydraulic Systems: Pressure, Flow & Work | Cylinder areas, flow paths, force, speed and power; compare two cylinder choices |
| Feedback Control: From Error to Stable Motion | Loop sign, response, PID, saturation and sampling; write a simulated acceptance plan |
| Sensors & Electronics: From Signal to Measurement | Calibration, dividers, ADCs, filtering and output drivers; verify a fictional sensor against a held-out reference |
| Remote Sensing: From Pixels to Field Decisions | Resolution, reflectance, NDVI, quality flags and ground checks; prepare a matched scouting plan |
| Digital Audio: Sampling, Signal Flow & Mixing | Sample formats, gain, dynamics, routing and latency; document a repeatable mix and export |
| Spacecraft Systems: Power, Heat, Pointing & Data | Coupled resource budgets; distinguish an eclipse-energy pass from a sustained-data failure |
| Everyday Thermodynamics: Heat, Work & Refrigeration | Energy boundaries, heat transfer, engine efficiency and COP; compare an equal heating requirement |
| Experiments & Statistics: From Comparison to Evidence | Experimental units, blocking, uncertainty and hypothesis tests; report a randomized blocked comparison |
| Computer Networks: Packets, Names & Trust | DNS, transport, latency, TLS and permissions; diagnose a fictional service incident |

These use paper, simulated or fictional scenarios. Hardware lessons develop
conceptual reasoning; they do not provide equipment service or installation
procedures. The audio-production course supplies a written session exercise,
diagrams and speech narration. Course JSON is the canonical content, including
primary-source further reading and all worked answers. Review and acceptance
evidence is recorded in [`docs/course-expansion-review.md`](docs/course-expansion-review.md).

The restored October courses also cover Apollo guidance, ADAPT/ISOXML, harmony,
North Korean history, sleight-of-hand theory, orbital rendezvous, Canadian
personal finance, subtractive synthesis, rhythm and the Manhattan Project.

Personal section notes save in this browser. If storage fails, the app shows an
error and keeps the draft while navigating within the current tab; edit again
to retry, or copy it before closing/reloading. Notes are separate from course
JSON and Markdown exports. Flashcard mastery tracks the current study session
and resets when that view is reopened.

## Visual explanations

All 181 included reading sections have authored SVG illustrations, shared with
their slides and visual flashcards. The new 800 × 400 drawings use consistent labels,
colour roles and model-limit annotations. They show mechanisms and quantities:
connected pistons and crank pins, supporting pulley strands, orbit vectors,
oscillating sound particles, reaction counts and probability denominators.

Reading and Slides offer **Enlarge** for a keyboard-accessible focus view. Motion
studies start paused; **Play** runs one eight-second demonstration, **Pause**
holds the current state, and the **Inspect motion** slider seeks independently.
Offscreen or background-tab playback freezes. Reduced-motion preferences pause
playback; the learner can still explicitly play or scrub. Labels stay still.
Flashcard illustrations remain static and retain their captions.

SVGs are embedded in course JSON and Markdown exports as complete static
drawings; Learnway supplies the interactive motion. Older text-only courses
keep their text fallback. Older embedded SVG CSS is removed at rendering time,
so old pulse effects stop but the drawings remain. The render boundary allows
only basic SVG shapes and text; it removes CSS, links, external images, scripts,
event handlers and SMIL. Generated courses receive the same spacious drawing
brief, but still require human review for subject accuracy and visual quality.

The authored SVGs and captions are stored in the course JSON and need no API calls.
To check the drawings and controls
in Chromium, run `node scripts/visual-acceptance.mjs` against the local server.
`LEARNWAY_VISUAL_OUTPUT` optionally saves the 181 figure screenshots and a layout
verdict. All three browser scripts accept `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`
for an existing Chromium binary. CI runs all three browser suites.

## Files

- `index.html`, `styles.css` — shell
- `app.mjs` — library, wizard, settings, navigation
- `pipeline.mjs` — Gemini client, pedagogy prompts, JSON schemas
- `views.mjs` — six renderers, study interactions and Markdown export
- `courses/index.json`, `courses/*.json` — searchable included catalog and course data
- `sample-course.json` — a fixture course (Moog ladder filter) so you can
  try every view without an API key: Library → "Try the sample course"
- `serve.mjs` — tiny static server for local use

## Notes

- Default model is `gemini-3.8-flash`; alternatives in Settings. If the API
  returns 404, try another model in Settings; the error reports the HTTP status.
- Personalization: every prompt carries your level and interests, so
  analogies come from your world. It never dumbs down — rigor is in the
  system prompt.
- The audio view uses your browser's built-in speech synthesis. No cost,
  works offline once loaded.

## Regression checks

Run `node --test` (Node 22 or newer). The dependency-free suite checks the full
generation pipeline with mocked Gemini responses, the nullable enrichment
schema, model JSON parsing and errors, and Settings storage failures. GitHub
Actions runs these checks and JavaScript syntax checks on pushes and PRs.

Course validation checks the fields consumed by every view, nonempty learning
content, unique section IDs in plan order, quiz choices and answer indices, and
a single rooted mind map without cycles or missing parents. Empty prerequisites
and mnemonics are allowed. Generation validates each step before requesting the
next one; invalid imports leave saved courses unchanged. Older incomplete saved
courses are shown as unavailable without deleting their data.

Desktop browser acceptance runs separately in GitHub Actions with Chromium at
1440 × 1000. It covers the sample and every included course in all six views,
quiz and flashcard interactions, search result identity, level filtering,
note-save failure/recovery/reload, Markdown download, valid/invalid imports,
generation failure/retry, bounded validation retries without duplicated action
handlers after repeated navigation,
and JSON export/reimport. It also checks fenced diagram whitespace and keyboard
scrolling with `toReversed` and `Object.hasOwn` disabled. That compatibility
exercise is not a complete old-browser certification. Gemini
responses are mocked: this proves browser wiring, not live API availability,
generated lesson accuracy, or audible speech quality.

To run browser acceptance locally, start `node serve.mjs` in one terminal, then:

```sh
npm install --no-save --package-lock=false playwright@1.62.1
npx playwright install chromium
node scripts/browser-acceptance.mjs
node scripts/interest-courses-acceptance.mjs
```

`LEARNWAY_URL` overrides the default `http://127.0.0.1:8130` test address.
`PLAYWRIGHT_MODULE` can point to an existing Playwright installation's `index.mjs`.
No real API key is needed; the script uses a new isolated browser context.

