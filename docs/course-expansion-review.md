# Ten-course expansion review

Reviewed October 30, 2026 (local date), against main
`3175f3a` after the restored catalogue was merged. Course JSON is the canonical
authored content. No runtime dependencies or renderer changes are introduced.

## Scope and learning progression

The catalogue grows from 27 to 37 included courses. The additions contain 60
lessons, 120 reading check-ins, 180 explained scored questions, 60 captioned SVGs,
60 slides with notes, ten teacher/student review dialogues, ten rooted mind maps
and ten worked capstones. They use the existing six views and JSON/Markdown
exports without generation or an API key. Study estimates include exercises.

| Course | Progression | Capstone evidence |
| --- | --- | --- |
| Soil & Water | Pores → root-zone capacity → budget → entry rate → landscape causes | Closed water ledger and a measurement that distinguishes run-on from a profile restriction |
| Hydraulic Systems | Pressure → effective area → flow/speed → circuit paths → power | Two-cylinder comparison against force and speed requirements, with an energy cross-check |
| Feedback Control | Loop sign → response metrics → PID → saturation → sampled evidence | Nominal and fault-test plan with recorded initial controller state |
| Sensors & Electronics | Measurement chain → divider → ADC → filtering → driver boundary | Two-point calibration and an independently held-out residual |
| Remote Sensing | Footprints → reflectance → NDVI → quality/timing → field checks | Comparable band calculations and matched scouting for competing explanations |
| Digital Audio | Sampling → storage → headroom → EQ/dynamics → latency | Source-size calculation, documented routing and level-matched export checks |
| Spacecraft Systems | Requirements → power → thermal → attitude → communications | Separate eclipse-energy and sustained-data verdicts |
| Thermodynamics | Temperature/energy → first law → transfer → engines → heat pumps | Equal-service heating comparison with explicit whole-system COP |
| Experiments & Statistics | Population/summary → independent units → design → intervals → tests | All four paired block effects, their mean and a bounded inference |
| Computer Networks | Layers → DNS → transport → performance → trust | Authentication diagnosis and bounded handling of an uncertain transaction |

## Technical and pedagogical review

Explanations introduce the physical or informational quantity before notation.
Worked examples show conversions and distinguish amounts from rates. Every
capstone includes a task, a worked solution and criteria for checking the result.
Questions test calculation, misconceptions and transfer to a new case. Answer
positions vary, and wrong choices retain an explained correct answer.

- Soil examples distinguish total pores, available capacity, current storage,
  entry rate and surface runoff. A budget uses a fixed area, depth and interval;
  ponded excess is not automatically called runoff. Root restrictions and
  omitted run-on remain explicit limits.
- Hydraulics uses chamber pressure times its own effective area. Rod and cap
  areas are not interchangeable. Force/speed tradeoffs conserve ideal power;
  return pressure, friction, leakage and actual delivered flow remain separate.
- Control distinguishes measured error from physical accuracy and current effort
  from stored integral state. The time-constant example is explicitly first-order;
  derivative action does not predict unknown events. Fault cases are simulated.
- Sensor examples separate resolution from accuracy. Divider loading and ADC
  endpoint conventions are stated. The calibration verification point is held
  out of the fit; stale or out-of-range values are not silently made plausible.
- Remote sensing uses compatible reflectance quantities. NDVI is a spectral
  contrast, not a nutrient prescription; cloud masks stay missing rather than
  becoming measured zeros. Ground checks test more than one causal account.
- Audio distinguishes frames from channel samples, decimal MB from binary units,
  amplitude dB from power ratios, internal processing range from final output,
  and one-buffer duration from round-trip latency. It supplies a written mix
  exercise and dialogue narration, not instrumental audio.
- Spacecraft examples distinguish usable battery energy, cycle recharge and peak
  power. Vacuum removes ambient-air convection, not conduction or radiation.
  Reaction wheels exchange angular momentum rather than creating linear thrust.
  Useful radio rate is explicitly distinguished from a raw channel rate.
- Thermodynamics declares the work sign convention, uses kelvin for the ideal
  engine bound and includes source heat in heat-pump accounting. The heating
  comparison assumes a specified interval and whole-system COP, not a product
  claim, actual tariff or seasonal guarantee.
- Statistics identifies the assigned experimental unit, avoiding pixel-level
  pseudoreplication. The interval exercise states a normal model with known
  population deviation and independent observations. Coverage, p-values,
  practical magnitude, bias and generalization remain distinct questions.
- Networks separates radio reach, DNS, transport, TLS and application outcomes.
  TCP delivery does not certify a transaction commit; a timeout can require
  status queries or application idempotency. Diagnostic examples exclude secrets.

The lessons are original conceptual explanations and fictional exercises.
Primary-source further-reading links point to agencies, standards, textbook
publishers and tool authors. They are references for deeper study, not claims
that a hypothetical result applies to a specific product or site. Hardware
topics do not provide installation, high-energy testing or repair procedures.

## Formatting, style and editorial integrity

The additions use the current course schema, matching plan/reading/quiz/slide
section identities. Each mind map has one root and three nodes per lesson.
Slides condense the argument; speaker notes review worked check-ins. Dialogue
turns ask and answer conceptual or diagnostic questions from each lesson.
Visual flashcards and Markdown retain the original SVG and its caption.

The figures are native static SVGs in an 800 × 400 view box. Shared visual
conventions distinguish observations, reference values and losses while labels
also carry meaning without colour alone. Graphs identify quantities and either
give numeric units or explicitly mark conceptual axes. New static diagrams do
not claim interactive simulation. The existing Enlarge control remains usable.

The full visual run also exposed nine pre-existing clipped or overlapping label
layouts in five restored courses: Harmony (two), North Korea (two), Canadian
Finance (three), Rhythm (one) and Manhattan Project (one). The fixes wrap or
reposition SVG text and, for the crowded timeline, move its annotation panel.
Only those diagram strings change; the other data in all five courses is
identical to main. This keeps the existing full-catalogue CI check passing.

## Validation

`test/interest-courses.test.mjs` now covers all fifteen expanded authored courses,
including the original five. It validates the data at the same boundary used by
imports and generation, renders all six representations, checks exported figures,
body text and answer explanations, and independently recomputes selected numeric
answers across every new subject. Capstones retain tasks, worked solutions and
checking criteria; scored prompts are not duplicated within a course.

The existing authored-course browser script now covers all fifteen expanded
courses: search identity, every reading reveal and scored answer, wrong-answer
feedback, keyboard enlargement, diagram-panel containment and exact Markdown
downloads. The general browser suite continues to walk every catalogue entry.
CI already runs both scripts plus the full visual suite.

| Check | Result |
| --- | --- |
| `node --test` | 122 passed |
| JavaScript syntax and `git diff --check` | Passed |
| Full desktop application acceptance | All 37 courses in all six views; imports, notes, exports and mocked generation/recovery passed |
| Authored-course browser acceptance | All 15 expanded courses: 180 reading reveals, 270 scored answers, 15 wrong-answer paths and 15 exact Markdown downloads; zero API requests or page errors |
| Full SVG layout acceptance | All 181 illustrations in Read/Slides; no clipped or overlapping labels; motion controls, reduced motion, keyboard seeking, focus dialog and static flashcards passed |
| Manual visual inspection | All 60 new figures inspected, with follow-up checks of adjusted figures and the nine repaired older layouts |

Local browser validation uses Playwright with portable Chromium 153. The standard
browser download service was unavailable, so the browser was obtained as a
temporary test dependency outside the repository. The app retains zero runtime
dependencies. Browser exercises prove wiring and deterministic feedback, not live
API availability, audible speech quality or product-specific engineering validity.
