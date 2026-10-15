#!/usr/bin/env node
// Backfill SVG diagrams for course sections that don't have one yet.
// The generation pipeline fills diagrams for new courses automatically;
// run this once per existing course file (e.g. the ten starter lessons).
//
// Usage:
//   GEMINI_API_KEY=... node scripts/backfill-diagrams.mjs courses/plate-tectonics.json [more files...]
//   node scripts/backfill-diagrams.mjs --key <api-key> [--model gemini-3.8-flash] <files...>
//
// Preflight — check the key once, cheaply, before any generation:
//   node scripts/backfill-diagrams.mjs --preflight [--key <api-key>] [--model <model>]
// A normal run also preflights first and stops if the key cannot succeed.
//
// Only sections missing a diagram are illustrated; existing diagrams are kept.
// The file is rewritten in place after passing full course validation.

import { readFile, writeFile } from 'node:fs/promises';
import { generateDiagrams, validateCourse } from '../pipeline.mjs';

const API_HOST = 'https://generativelanguage.googleapis.com';

/**
 * One minimal generateContent call that exercises key + model + billing,
 * classified into a single plain-language line. Makes no network call at
 * all when there is no key. Never prints the key.
 */
async function preflight(apiKey, model) {
  if (!apiKey) {
    return { ready: false, line: 'No key: no Gemini key is configured (pass --key or set GEMINI_API_KEY).' };
  }
  let res;
  try {
    res = await fetch(`${API_HOST}/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: 'Reply with the word ok.' }] }],
        generationConfig: { maxOutputTokens: 1 },
      }),
    });
  } catch {
    return { ready: false, line: 'Could not reach the Gemini API.' };
  }
  if (res.ok) return { ready: true, line: 'Ready: the key works and the model answered.' };
  const detail = await res.text().catch(() => '');
  const blocked = `Blocked: billing or quota — the key's Google Cloud project needs billing enabled or its free quota has run out (HTTP ${res.status}).`;
  if (res.status === 402 || res.status === 429 || /RESOURCE_EXHAUSTED/i.test(detail)) {
    return { ready: false, line: blocked };
  }
  if (res.status === 404 || (/model/i.test(detail) && /not found/i.test(detail))) {
    return { ready: false, line: 'Bad model: the configured model name was not accepted.' };
  }
  if (res.status === 401 || /API_KEY_INVALID/i.test(detail) || /api key/i.test(detail)) {
    return { ready: false, line: 'Bad key: the API key was rejected.' };
  }
  if (res.status === 403) {
    return /quota|billing/i.test(detail)
      ? { ready: false, line: blocked }
      : { ready: false, line: 'Bad key: the API key was rejected.' };
  }
  return { ready: false, line: `Could not reach the Gemini API (HTTP ${res.status}).` };
}

function usage() {
  console.error('Usage: GEMINI_API_KEY=... node scripts/backfill-diagrams.mjs [--key <api-key>] [--model <model>] [--preflight] <course.json...>');
  process.exit(2);
}

const args = process.argv.slice(2);
let apiKey = process.env.GEMINI_API_KEY || '';
let model = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
let preflightOnly = false;
const files = [];
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--key') apiKey = args[++i] || '';
  else if (args[i] === '--model') model = args[++i] || model;
  else if (args[i] === '--preflight') preflightOnly = true;
  else if (args[i].startsWith('-')) usage();
  else files.push(args[i]);
}

if (preflightOnly) {
  const check = await preflight(apiKey, model);
  console.log(check.line);
  process.exit(check.ready ? 0 : 1);
}
if (!files.length) usage();

// Every run preflights first: one cheap call, and no generation at all
// when the key cannot succeed.
const check = await preflight(apiKey, model);
console.log(check.line);
if (!check.ready) process.exit(1);

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
