#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const path = join(root, 'courses/electrical-wiring-fundamentals.json');
const diagrams = {"protection": "<svg viewBox=\"0 0 800 400\" xmlns=\"http://www.w3.org/2000/svg\" role=\"img\" aria-label=\"Different hazards need different protection\"><title>Different hazards need different protection</title><rect x=\"0\" y=\"0\" width=\"800\" height=\"400\" rx=\"16\" fill=\"#101923\"/><text x=\"28\" y=\"35\" fill=\"#e8ecf1\" font-size=\"21\" font-family=\"sans-serif\">Different hazards need different protection</text><path d=\"M28 51 L772 51\" fill=\"none\" stroke=\"#344253\" stroke-width=\"2\"/><g class=\"lw-step\"><rect x=\"80\" y=\"100\" width=\"200\" height=\"120\" rx=\"10\" fill=\"#172331\" stroke=\"#7cc7ff\" stroke-width=\"2\"/><text x=\"180\" y=\"155\" fill=\"#7cc7ff\" font-size=\"18\" text-anchor=\"middle\">Overcurrent</text><text x=\"180\" y=\"185\" fill=\"#9aa6b8\" font-size=\"14\" text-anchor=\"middle\">Fuse / breaker</text></g><g class=\"lw-step\"><rect x=\"300\" y=\"100\" width=\"200\" height=\"120\" rx=\"10\" fill=\"#172331\" stroke=\"#ffd479\" stroke-width=\"2\"/><text x=\"400\" y=\"155\" fill=\"#ffd479\" font-size=\"18\" text-anchor=\"middle\">Ground fault</text><text x=\"400\" y=\"185\" fill=\"#9aa6b8\" font-size=\"14\" text-anchor=\"middle\">GFCI</text></g><g class=\"lw-step\"><rect x=\"520\" y=\"100\" width=\"200\" height=\"120\" rx=\"10\" fill=\"#172331\" stroke=\"#7ee2a8\" stroke-width=\"2\"/><text x=\"620\" y=\"155\" fill=\"#7ee2a8\" font-size=\"18\" text-anchor=\"middle\">Arc fault</text><text x=\"620\" y=\"185\" fill=\"#9aa6b8\" font-size=\"14\" text-anchor=\"middle\">AFCI</text></g><g class=\"lw-step\"><text x=\"400\" y=\"280\" fill=\"#e8ecf1\" font-size=\"18\" text-anchor=\"middle\">Match the device to the hazard</text></g><path d=\"M28 350 L772 350\" fill=\"none\" stroke=\"#344253\" stroke-width=\"2\"/><text x=\"28\" y=\"379\" fill=\"#9aa6b8\" font-size=\"15\">Protection is hazard-specific, not one-size-fits-all</text></svg>"};
const course = JSON.parse(await readFile(path, 'utf8'));
let n=0;
for (const s of course.reading?.sections||[]) {
  if (diagrams[s.id]) { s.diagram = diagrams[s.id]; n++; }
}
if (!n) throw new Error('no sections matched');
await writeFile(path, JSON.stringify(course, null, 2) + '\n');
console.log('electrical-wiring-fundamentals', n, 'diagrams');
