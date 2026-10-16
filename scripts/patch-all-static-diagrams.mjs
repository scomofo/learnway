#!/usr/bin/env node
/** Apply motion diagrams across all courses that still had static figures. */
import { spawn } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = dirname(fileURLToPath(import.meta.url));
await new Promise((res, rej) => {
  const p = spawn(process.execPath, [join(dir, 'fix-and-apply-all.mjs')], { stdio: 'inherit' });
  p.on('exit', c => c === 0 ? res() : rej(new Error('fix-and-apply-all failed')));
});
