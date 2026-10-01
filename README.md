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

Then open the URL, go to **Settings**, and paste a Gemini API key from
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
4. **Five views** — Read, Quiz (interactive scoring), Slides, Audio
   (read aloud in-browser with two voices), Mind map.
5. Courses save to the browser's localStorage; export/import as JSON.

## Files

- `index.html`, `styles.css` — shell
- `app.mjs` — library, wizard, settings, navigation
- `pipeline.mjs` — Gemini client, pedagogy prompts, JSON schemas
- `views.mjs` — the five renderers + quiz/audio interactivity
- `sample-course.json` — a fixture course (Moog ladder filter) so you can
  try every view without an API key: Library → "Try the sample course"
- `serve.mjs` — tiny static server for local use

## Notes

- Default model is `gemini-3.5-flash`; alternatives in Settings. If a model
  404s (Google retires names), pick another — the error will say so.
- Personalization: every prompt carries your level and interests, so
  analogies come from your world. It never dumbs down — rigor is in the
  system prompt.
- The audio view uses your browser's built-in speech synthesis. No cost,
  works offline once loaded.
