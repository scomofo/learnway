#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const dir = dirname(fileURLToPath(import.meta.url));
for (const s of ['patch-static-a.mjs', 'patch-static-b.mjs']) {
  await new Promise((res, rej) => {
    const p = spawn(process.execPath, [join(dir, s)], { stdio: 'inherit' });
    p.on('exit', c => c === 0 ? res() : rej(new Error(s + ' failed')));
  });
}
console.log('All static diagrams patched.');
