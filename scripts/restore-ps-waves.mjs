#!/usr/bin/env node
// One-shot restore: write P/S earthquake diagram into plate-tectonics course + author script.
import { readFile, writeFile } from "node:fs/promises";

const svg = "<svg viewBox=\"0 0 800 400\" xmlns=\"http://www.w3.org/2000/svg\" role=\"img\" aria-label=\"P arrives first; S follows\"><title>P arrives first; S follows</title><desc>A locked fault can accumulate elastic strain as plates continue moving. Sudden slip releases energy as body waves: faster compressional P waves and slower shear S waves. S waves need a solid; they cannot cross the liquid outer core. Rings are schematic, not travel-time calibrated.</desc><rect x=\"0\" y=\"0\" width=\"800\" height=\"400\" rx=\"16\" fill=\"#101923\"/><text x=\"28\" y=\"35\" fill=\"#e8ecf1\" font-size=\"21\" font-family=\"sans-serif\" text-anchor=\"start\">P arrives first; S follows</text><path d=\"M28 51 L772 51\" fill=\"none\" stroke=\"#344253\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M57 153 L322 153 L349 198 L378 152 L739 152 V312 H57 Z\" fill=\"#172331\" stroke=\"#344253\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M349 198 L404 312\" fill=\"none\" stroke=\"#ff9d9d\" stroke-width=\"5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M275 254 L331 230\" fill=\"none\" stroke=\"#ffd479\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M324.7 237.7 L331 230 L321.0 229.2\" fill=\"none\" stroke=\"#ffd479\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M451 205 L409 232\" fill=\"none\" stroke=\"#ffd479\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><path d=\"M414.0 223.3 L409 232 L419.0 231.1\" fill=\"none\" stroke=\"#ffd479\" stroke-width=\"3\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><circle cx=\"376\" cy=\"251\" r=\"7\" fill=\"#ff9d9d\" stroke=\"#ff9d9d\" stroke-width=\"2\"/><circle cx=\"376\" cy=\"251\" r=\"28\" fill=\"none\" stroke=\"#7cc7ff\" stroke-width=\"2\" class=\"lw-wave-p\"/><circle cx=\"376\" cy=\"251\" r=\"28\" fill=\"none\" stroke=\"#7cc7ff\" stroke-width=\"2\" class=\"lw-wave-p-late\"/><circle cx=\"376\" cy=\"251\" r=\"28\" fill=\"none\" stroke=\"#b39dff\" stroke-width=\"2\" class=\"lw-wave-s\"/><circle cx=\"376\" cy=\"251\" r=\"28\" fill=\"none\" stroke=\"#b39dff\" stroke-width=\"2\" class=\"lw-wave-s-late\"/><text x=\"91\" y=\"113\" fill=\"#ffd479\" font-size=\"20\" font-family=\"sans-serif\" text-anchor=\"start\">Stress accumulates</text><text x=\"497\" y=\"112\" fill=\"#ff9d9d\" font-size=\"19\" font-family=\"sans-serif\" text-anchor=\"start\">Sudden slip releases energy</text><text x=\"500\" y=\"245\" fill=\"#ff9d9d\" font-size=\"17\" font-family=\"sans-serif\" text-anchor=\"start\">Focus: rupture starts here</text><text x=\"60\" y=\"289\" fill=\"#7cc7ff\" font-size=\"16\" font-family=\"sans-serif\" text-anchor=\"start\">P (compressional) faster</text><text x=\"60\" y=\"312\" fill=\"#b39dff\" font-size=\"16\" font-family=\"sans-serif\" text-anchor=\"start\">S (shear) slower · solids only</text><path d=\"M28 350 L772 350\" fill=\"none\" stroke=\"#344253\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/><text x=\"28\" y=\"379\" fill=\"#9aa6b8\" font-size=\"15\" font-family=\"sans-serif\" text-anchor=\"start\">Illustrative cross-section · P ≈ 1.7× faster than S in typical crust</text></svg>";
const visual = "A locked fault can accumulate elastic strain as plates continue moving. Sudden slip releases energy as body waves: faster compressional P waves and slower shear S waves. S waves need a solid; they cannot cross the liquid outer core. Rings are schematic, not travel-time calibrated.";
const diagramTitle = "P arrives first; S follows";

const coursePath = new URL("../courses/plate-tectonics.json", import.meta.url);
const course = JSON.parse(await readFile(coursePath, "utf8"));
for (const s of course.reading.sections) {
  if (s.id === "earthquakes") {
    s.diagram = svg;
    s.visual = visual;
    s.diagramTitle = diagramTitle;
  }
}
for (const s of course.slides?.sections || []) {
  if (s.id === "earthquakes") s.visual = visual;
}
await writeFile(coursePath, JSON.stringify(course, null, 2) + "\n");
console.log("Updated courses/plate-tectonics.json earthquakes diagram (P/S waves).");

const aiPath = new URL("./author-illustrations.mjs", import.meta.url);
let ai = await readFile(aiPath, "utf8");
if (ai.trim() === "see-local" || !ai.includes("let quake")) {
  console.error("scripts/author-illustrations.mjs is damaged; restore it from git history first:");
  console.error("  git checkout 6e190d3 -- scripts/author-illustrations.mjs");
  console.error("Then re-run this script, or run: node scripts/author-illustrations.mjs");
  process.exit(1);
}
if (!ai.includes("lw-wave-p")) {
  console.log("Patch author-illustrations by running: node scripts/author-illustrations.mjs after restoring from git if needed.");
} else {
  console.log("author-illustrations.mjs already has P/S classes");
}
