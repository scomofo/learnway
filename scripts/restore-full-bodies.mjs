#!/usr/bin/env node
/**
 * Restore full reading bodies from last-good full commits, keep motion diagrams from current main.
 * Usage: node scripts/restore-full-bodies.mjs
 */
import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const FULL = {
  'ap-biology-foundations.json': '97bb0d1ed46f068935cdbad74878e9ccc0e1761b',
  'ap-chemistry-foundations.json': '97bb0d1ed46f068935cdbad74878e9ccc0e1761b',
  'electrical-wiring-fundamentals.json': '97bb0d1ed46f068935cdbad74878e9ccc0e1761b',
  'how-gps-works.json': '97bb0d1ed46f068935cdbad74878e9ccc0e1761b',
  'sound-and-music.json': '97bb0d1ed46f068935cdbad74878e9ccc0e1761b',
  'hs-genetics.json': '97bb0d1ed46f068935cdbad74878e9ccc0e1761b',
  'hs-simple-machines.json': '97bb0d1ed46f068935cdbad74878e9ccc0e1761b',
  'everyday-probability.json': '300d3abf060986ce5c320f64310da610c2e45057',
  'plate-tectonics.json': '6e190d334a1c91e3e03e26659c0745feac0f9998',
  'how-engines-work.json': '97bb0d1ed46f068935cdbad74878e9ccc0e1761b',
  'intro-rocket-science.json': '97bb0d1ed46f068935cdbad74878e9ccc0e1761b',
};

function classes(svg = '') {
  return new Set([...(svg.matchAll(/\blw-[a-z0-9-]+/g) || [])].map(m => m[0]));
}

for (const [file, sha] of Object.entries(FULL)) {
  const path = join(root, 'courses', file);
  let main;
  try {
    main = JSON.parse(await readFile(path, 'utf8'));
  } catch {
    console.warn('skip missing', file);
    continue;
  }
  const url = `https://cdn.jsdelivr.net/gh/scomofo/learnway@${sha}/courses/${file}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fetch ${file} ${res.status}`);
  const full = JSON.parse(await res.text());
  const mainById = Object.fromEntries((main.reading?.sections || []).map(s => [s.id, s]));
  let n = 0;
  for (const s of full.reading?.sections || []) {
    const m = mainById[s.id];
    if (!m?.diagram) continue;
    const mc = classes(m.diagram);
    const fc = classes(s.diagram);
    if (mc.size && (fc.size === 0 || mc.size >= fc.size || [...mc].some(c => !fc.has(c)))) {
      s.diagram = m.diagram;
      n++;
      if ((m.visual || '').length > (s.visual || '').length + 20) s.visual = m.visual;
    }
  }
  await writeFile(path, JSON.stringify(full, null, 2) + '\n');
  console.log(file, 'diagrams kept', n, 'body restored');
}
console.log('Done. Full reading text restored; motion diagrams preserved.');
