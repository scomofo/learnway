#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const path = join(root, 'courses/sound-and-music.json');
const diagrams = {"timbre": "<svg viewBox=\"0 0 800 400\" xmlns=\"http://www.w3.org/2000/svg\" role=\"img\" aria-label=\"Three different questions about a note\"><title>Three different questions about a note</title><rect x=\"0\" y=\"0\" width=\"800\" height=\"400\" rx=\"16\" fill=\"#101923\"/><text x=\"28\" y=\"35\" fill=\"#e8ecf1\" font-size=\"21\" font-family=\"sans-serif\">Three different questions about a note</text><path d=\"M28 51 L772 51\" fill=\"none\" stroke=\"#344253\" stroke-width=\"2\"/><text x=\"80\" y=\"100\" fill=\"#9aa6b8\" font-size=\"16\">Harmonic spectrum</text><rect class=\"lw-bar\" x=\"100\" y=\"140\" width=\"36\" height=\"160\" fill=\"#7cc7ff\" rx=\"4\"/><rect class=\"lw-bar\" x=\"160\" y=\"180\" width=\"36\" height=\"120\" fill=\"#7ee2a8\" rx=\"4\"/><rect class=\"lw-bar\" x=\"220\" y=\"200\" width=\"36\" height=\"100\" fill=\"#ffd479\" rx=\"4\"/><rect class=\"lw-bar\" x=\"280\" y=\"230\" width=\"36\" height=\"70\" fill=\"#b39dff\" rx=\"4\"/><rect class=\"lw-bar\" x=\"340\" y=\"250\" width=\"36\" height=\"50\" fill=\"#7cc7ff\" rx=\"4\"/><g class=\"lw-step\"><text x=\"500\" y=\"150\" fill=\"#7cc7ff\" font-size=\"18\">Pitch → fundamental</text></g><g class=\"lw-step\"><text x=\"500\" y=\"200\" fill=\"#7ee2a8\" font-size=\"18\">Loudness → amplitude</text></g><g class=\"lw-step\"><text x=\"500\" y=\"250\" fill=\"#ffd479\" font-size=\"18\">Timbre → spectrum shape</text></g><path d=\"M28 350 L772 350\" fill=\"none\" stroke=\"#344253\" stroke-width=\"2\"/><text x=\"28\" y=\"379\" fill=\"#9aa6b8\" font-size=\"15\">Same pitch can still sound different</text></svg>"};
const course = JSON.parse(await readFile(path, 'utf8'));
let n=0;
for (const s of course.reading?.sections||[]) {
  if (diagrams[s.id]) { s.diagram = diagrams[s.id]; n++; }
}
if (!n) throw new Error('no sections matched');
await writeFile(path, JSON.stringify(course, null, 2) + '\n');
console.log('sound-and-music', n, 'diagrams');
