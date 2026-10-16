#!/usr/bin/env node
/** Pin full views, restore full course bodies, keep motion diagrams. */
import { writeFile, readFile, access } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

async function run(script) {
  const path = join(root, 'scripts', script);
  try { await access(path); } catch { console.warn('skip missing', script); return; }
  await new Promise((res, rej) => {
    const p = spawn(process.execPath, [path], { stdio: 'inherit', cwd: root });
    p.on('exit', c => c === 0 ? res() : rej(new Error(script + ' failed')));
  });
}

await run('pin-views.mjs');
await run('restore-full-bodies.mjs');

console.log('\nHigh-value restore complete:');
console.log('  - views.mjs pinned in-repo (no CDN runtime dependency)');
console.log('  - full reading bodies restored; motion diagrams kept');
console.log('Hard-refresh the app, then scrub earthquakes → orbit → lever.');
