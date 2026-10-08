#!/usr/bin/env node
// Backfill SVG diagrams for course sections that don't have one yet.
// The generation pipeline fills diagrams for new courses automatically;
// run this once per existing course file (e.g. the ten starter lessons).
//
// Usage:
//   GEMINI_API_KEY=... node scripts/backfill-diagrams.mjs courses/plate-tectonics.json [more files...]
//   node scripts/backfill-diagrams.mjs --key <api-key> [--model gemini-3.8-flash] <files...>
//
// Only sections missing a diagram are illustrated; existing diagrams are kept.
// The file is rewritten in place after passing full course validation.

import { readFile, writeFile } from 'node:fs/promises';
import { generateDiagrams, validateCourse } from '../pipeline.mjs';

function usage() {
  console.error('Usage: GEMINI_API_KEY=... node scripts/backfill-diagrams.mjs [--key <api-key>] [--model <model>] <course.json...>');
  process.exit(2);
}

const args = process.argv.slice(2);
let apiKey = process.env.GEMINI_API_KEY || '';
let model = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
const files = [];
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--key') apiKey = args[++i] || '';
  else if (args[i] === '--model') model = args[++i] || model;
  else if (args[i].startsWith('-')) usage();
  else files.push(args[i]);
}
if (!apiKey || !files.length) usage();

let failed = 0;
for (const file of files) {
  try {
    const course = JSON.parse(await readFile(file, 'utf8'));
    const sections = course?.reading?.sections || [];
    const missing = sections.filter(s => !s.diagram);
    if (!missing.length) {
      console.log(`${file}: all ${sections.length} sections already have diagrams — skipping`);
      continue;
    }
    const pointsById = new Map((course?.plan?.sections || []).map(p => [p.id, p.points || []]));
    console.log(`${file}: illustrating ${missing.length} of ${sections.length} sections…`);
    const svgs = await generateDiagrams({
      apiKey, model,
      sections: missing.map(s => ({
        id: s.id, heading: s.heading,
        points: pointsById.get(s.id) || [],
        visual: s.visual || '',
      })),
    }, msg => console.log(`  ${msg}`));
    for (const s of missing) {
      if (svgs.has(s.id)) s.diagram = svgs.get(s.id);
    }
    const problems = validateCourse(course);
    if (problems.length) throw new Error(`validation failed: ${problems.slice(0, 3).join('; ')}`);
    await writeFile(file, JSON.stringify(course, null, 2) + '\n');
    console.log(`${file}: done, validated, saved`);
  } catch (err) {
    failed++;
    console.error(`${file}: FAILED — ${err.message}`);
  }
}
process.exit(failed ? 1 : 0);
