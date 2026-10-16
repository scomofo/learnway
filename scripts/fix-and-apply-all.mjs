#!/usr/bin/env node
/** Restore broken course files, then apply all motion diagram patches. */
import { writeFile, readFile, access } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const GOOD = {
  'plate-tectonics.json': '6e190d334a1c91e3e03e26659c0745feac0f9998',
};

async function run(script) {
  const path = join(root, 'scripts', script);
  try { await access(path); } catch { console.warn('skip missing', script); return; }
  await new Promise((res, rej) => {
    const p = spawn(process.execPath, [path], { stdio: 'inherit', cwd: root });
    p.on('exit', c => c === 0 ? res() : rej(new Error(script + ' failed')));
  });
}

for (const [file, sha] of Object.entries(GOOD)) {
  const path = join(root, 'courses', file);
  let body = '';
  try { body = await readFile(path, 'utf8'); } catch { body = ''; }
  if (body.trim() === 'PLACEHOLDER_WILL_FAIL' || body.trim() === 'see-local' || body.includes('SEE_ARTIFACTS')) {
    const url = `https://cdn.jsdelivr.net/gh/scomofo/learnway@${sha}/courses/${file}`;
    console.log('Restoring', file, 'from', sha);
    const res = await fetch(url);
    if (!res.ok) throw new Error('fetch ' + file + ' ' + res.status);
    await writeFile(path, await res.text());
  }
}

const scripts = [
  'patch-static-a.mjs',
  'patch-static-sound-prob.mjs',
  'patch-genetics-diagrams.mjs',
  'patch-machine-diagrams.mjs',
  'patch-motion-how-gps-works.mjs',
  'patch-motion-ap-biology-foundations.mjs',
  'patch-motion-ap-chemistry-foundations.mjs',
  'patch-motion-electrical-wiring-fundamentals.mjs',
  'patch-motion-sound-and-music.mjs',
  'patch-motion-hs-genetics.mjs',
  'patch-motion-hs-simple-machines.mjs',
];

for (const s of scripts) await run(s);
console.log('All remaining section animations applied.');
