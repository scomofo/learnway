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
3. **Generate** — four generation steps, all as structured JSON:
   - immersive reading with embedded check-in questions
   - section quizzes (application, not recall; plausible distractors)
   - slides + speaker notes
   - audio-lesson dialogue, mind map, mnemonics
4. **Six views** — Read, Quiz (interactive scoring), Slides, Audio
   (read aloud in-browser with two voices), Mind map, Flashcards.
5. Courses save to the browser's localStorage; export/import as JSON.
   Export Markdown for a study guide including visuals and further-reading links.

## Included lessons

Ten authored mini-courses join the existing Genetics and Simple Machines courses.
Each new course has three reading sections, visual mental models, check-in
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

Personal section notes save in this browser. If storage fails, the app shows an
error and keeps the draft while navigating within the current tab; edit again
to retry, or copy it before closing/reloading. Notes are separate from course
JSON and Markdown exports. Flashcard mastery tracks the current study session
and resets when that view is reopened.

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
generation failure/retry, one API request per action after repeated navigation,
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
```

`LEARNWAY_URL` overrides the default `http://127.0.0.1:8130` test address.
`PLAYWRIGHT_MODULE` can point to an existing Playwright installation's `index.mjs`.
No real API key is needed; the script uses a new isolated browser context.
