# Diagram acceptance & restore notes

## Status (2026-10-16)

- Motion diagrams are on `main` for teaching courses (38 sections with `lw-*` classes).
- Player updaters are wired and verified (P/S speed differential, orbit vectors, machines, etc.).
- Caption hierarchy CSS is on `main` ("What this shows", keyboard hints).

## One-command desktop restore (recommended)

Some course **reading bodies** were shortened when motion was pushed through the API. Views may still use a CDN bridge until pinned.

```sh
git pull
node scripts/fix-and-apply-all.mjs
node serve.mjs
```

That runs:
1. `pin-views.mjs` — full in-repo `views.mjs` with caption polish
2. `restore-full-bodies.mjs` — full reading text from last-good commits + keep current motion diagrams

## Phone smoke path (hard-refresh first)

1. Plate tectonics → earthquakes (cyan P ahead of purple S)
2. Rockets → orbit (satellite + locked vectors)
3. Engines → cycle
4. Simple machines → lever / screw
5. Sound → timbre
6. Genetics → inheritance
7. Probability → outcomes

## Known intentional limits

- Flashcards stay static (`fc-diagram`).
- CDN `views.mjs` bridge works online; pin with `pin-views.mjs` for offline/forks.
