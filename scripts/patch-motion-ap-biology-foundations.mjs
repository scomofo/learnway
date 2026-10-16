#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const path = join(root, 'courses/ap-biology-foundations.json');
const diagrams = {"inheritance": "<svg viewBox=\"0 0 800 400\" xmlns=\"http://www.w3.org/2000/svg\" role=\"img\" aria-label=\"Aa × Aa: possible outcomes, not a quota\"><title>Aa × Aa: possible outcomes, not a quota</title><rect x=\"0\" y=\"0\" width=\"800\" height=\"400\" rx=\"16\" fill=\"#101923\"/><text x=\"28\" y=\"35\" fill=\"#e8ecf1\" font-size=\"21\" font-family=\"sans-serif\">Aa × Aa: possible outcomes, not a quota</text><path d=\"M28 51 L772 51\" fill=\"none\" stroke=\"#344253\" stroke-width=\"2\"/><text class=\"lw-step\" x=\"278\" y=\"125\" fill=\"#7cc7ff\" font-size=\"22\" text-anchor=\"middle\">A</text><text class=\"lw-step\" x=\"393\" y=\"125\" fill=\"#7cc7ff\" font-size=\"22\" text-anchor=\"middle\">a</text><text class=\"lw-step\" x=\"196\" y=\"190\" fill=\"#7cc7ff\" font-size=\"22\" text-anchor=\"middle\">A</text><text class=\"lw-step\" x=\"196\" y=\"273\" fill=\"#7cc7ff\" font-size=\"22\" text-anchor=\"middle\">a</text><rect class=\"lw-punnett-cell lw-step\" x=\"220\" y=\"139\" width=\"115\" height=\"83\" fill=\"#172331\" stroke=\"#7ee2a8\" stroke-width=\"2\"/><text x=\"277\" y=\"190\" fill=\"#7ee2a8\" font-size=\"28\" text-anchor=\"middle\">AA</text><rect class=\"lw-punnett-cell lw-step\" x=\"335\" y=\"139\" width=\"115\" height=\"83\" fill=\"#172331\" stroke=\"#7ee2a8\" stroke-width=\"2\"/><text x=\"392\" y=\"190\" fill=\"#7ee2a8\" font-size=\"28\" text-anchor=\"middle\">Aa</text><rect class=\"lw-punnett-cell lw-step\" x=\"220\" y=\"222\" width=\"115\" height=\"83\" fill=\"#172331\" stroke=\"#7ee2a8\" stroke-width=\"2\"/><text x=\"277\" y=\"273\" fill=\"#7ee2a8\" font-size=\"28\" text-anchor=\"middle\">Aa</text><rect class=\"lw-punnett-cell lw-step\" x=\"335\" y=\"222\" width=\"115\" height=\"83\" fill=\"#172331\" stroke=\"#b39dff\" stroke-width=\"2\"/><text x=\"392\" y=\"273\" fill=\"#b39dff\" font-size=\"28\" text-anchor=\"middle\">aa</text><text x=\"560\" y=\"200\" fill=\"#ffd479\" font-size=\"18\">1 : 2 : 1 genotypes</text><text x=\"560\" y=\"235\" fill=\"#9aa6b8\" font-size=\"16\">3 : 1 phenotypes</text><path d=\"M28 350 L772 350\" fill=\"none\" stroke=\"#344253\" stroke-width=\"2\"/><text x=\"28\" y=\"379\" fill=\"#9aa6b8\" font-size=\"15\">Ratios are probabilities · small families need not match</text></svg>"};
const course = JSON.parse(await readFile(path, 'utf8'));
let n=0;
for (const s of course.reading?.sections||[]) {
  if (diagrams[s.id]) { s.diagram = diagrams[s.id]; n++; }
}
if (!n) throw new Error('no sections matched');
await writeFile(path, JSON.stringify(course, null, 2) + '\n');
console.log('ap-biology-foundations', n, 'diagrams');
