#!/usr/bin/env node
/** Apply motion diagrams across courses that still had static figures. */
import { spawn } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { access } from 'node:fs/promises';

const dir = dirname(fileURLToPath(import.meta.url));

async function run(script) {
  const path = join(dir, script);
  try { await access(path); } catch { console.warn('skip missing', script); return; }
  await new Promise((res, rej) => {
    const p = spawn(process.execPath, [path], { stdio: 'inherit' });
    p.on('exit', c => c === 0 ? res() : rej(new Error(script + ' exit ' + c)));
  });
}

const scripts = [
  'patch-static-a.mjs',              // bio, chem, electrical, GPS
  'patch-static-sound-prob.mjs',     // timbre + probability
  'patch-genetics-diagrams.mjs',     // genetics
  'patch-machine-diagrams.mjs',      // inclined / wedge / screw
];

for (const s of scripts) await run(s);
console.log('All available static-diagram patches applied.');
