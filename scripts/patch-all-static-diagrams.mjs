#!/usr/bin/env node
/**
 * Apply motion diagrams to every course that still has static figures.
 * Prefer the split patches; fall back to specialized genetics/machine scripts.
 */
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

try {
  await access(join(dir, 'pb0.b64'));
  await run('assemble-patch-b.mjs');
} catch { /* no chunks */ }

await run('patch-static-a.mjs');
await run('patch-static-b.mjs');
try { await access(join(dir, 'patch-static-b.mjs')); }
catch {
  await run('patch-genetics-diagrams.mjs');
  await run('patch-machine-diagrams.mjs');
}
console.log('All available static-diagram patches applied.');
