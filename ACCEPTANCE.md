# Diagram acceptance pass (2026-10-16)

Review of motion studies after caption/hierarchy polish. Findings are ordered by severity.

## Must-fix before teaching

| Course | Section | Issue | Severity |
|--------|---------|-------|----------|
| **Remote vs local** | many | `main` still has static SVGs for GPS solution/quality, genetics (most), machines ramp/wedge/screw, chem particles/stoich, bio inheritance, electrical protection, sound timbre until `node scripts/fix-and-apply-all.mjs` is run | High |
| **hs-genetics** | dna-code, inheritance, variation, genetics-wild | Static on `main` until genetics patch applied; updaters exist in player | High |
| **how-gps-works** | solution, quality | Static on `main`; grow-ring / step updaters ready after patch | High |

## Motion quality (after patches applied)

| Course | Section | Notes |
|--------|---------|-------|
| how-engines-work / cycle | Strong | Crank–slider is scrubbable and educational |
| intro-rocket-science / orbit | Strong | Vectors stay locked to satellite |
| sound-and-music / waves | Strong | Local oscillation vs travelling pattern is clear |
| sound-and-music / resonance | Strong | Standing-wave modes scrub cleanly |
| sound-and-music / timbre | Good | Bars + step labels; caption should stress “three different questions” |
| plate-tectonics / earthquakes | Good | P vs S speed differential is the teaching point — scrub to show lag |
| plate-tectonics / plates | OK | Step highlight is light; fine for a catalog of pieces |
| everyday-probability / * | Good | Step walk-throughs match the pedagogy |
| hs-simple-machines / lever, pulley | Strong | Kinematics match ideal ratios |
| hs-simple-machines / inclined, wedge, screw | Good | After patch; ramp blocks and screw pitch are the teachable motions |
| how-gps-works / solution | Good after patch | Expanding rings; caption should say “2D analogy, four unknowns” |
| how-gps-works / quality | OK | Step list is conceptual; less “physics motion” than geometry |
| ap-chemistry / particles, stoichiometry | OK | Step narrative; not particle simulation |
| ap-biology / inheritance | Good | Punnett highlight order matches 1:2:1 |

## Caption hierarchy checklist

- [x] Toolbar: Motion study vs Visual explanation
- [x] Caption label: **What this shows**
- [x] Lead sentence of `visual` reads as the primary takeaway
- [x] SVG footer stays secondary (schematic / ideal assumptions)
- [x] Keyboard hints on motion controls (`Space`, arrows)
- [x] Reduced-motion: no badge pulse; player starts paused

## Weak spots to watch on scrub

1. **Screw** — rotation origin depends on view-box; if it orbits oddly, pin `transform-origin` to shaft center in SVG.
2. **DNA base pairs** — sequential glow is clear; avoid implying replication fork unless caption says so.
3. **GPS quality** — ensure visual text still distinguishes precision vs accuracy after any diagram rewrite.
4. **Flashcards** — diagrams stay static by design (`fc-diagram`); do not expect Play there.

## Suggested manual scrub path (5–7 min)

1. Engines → cycle (play + arrow scrub)  
2. Rockets → orbit  
3. Sound → waves, resonance, timbre  
4. Plate tectonics → earthquakes (P ahead of S)  
5. Genetics → gene-to-trait particle, inheritance Punnett  
6. Simple machines → lever, inclined plane, screw  
7. Probability → outcomes → evidence  

If any of those fail to move, re-run `node scripts/fix-and-apply-all.mjs` and hard-refresh.
