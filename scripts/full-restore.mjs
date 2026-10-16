#!/usr/bin/env node
/**
 * Full remote restore for Learnway after placeholder commits.
 * Downloads last-good bases from jsDelivr, then applies P/S earthquake diagram.
 */
import { writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const GOOD = '6e190d334a1c91e3e03e26659c0745feac0f9998';

async function fetchText(path) {
  const url = `https://cdn.jsdelivr.net/gh/scomofo/learnway@${GOOD}/${path}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fetch ${path}: ${res.status}`);
  return await res.text();
}

console.log('Fetching last-good plate-tectonics.json and author-illustrations.mjs…');
const [pt, ai] = await Promise.all([
  fetchText('courses/plate-tectonics.json'),
  fetchText('scripts/author-illustrations.mjs'),
]);
if (pt.trim() === 'see-local' || ai.trim() === 'see-local') {
  throw new Error('CDN still serving placeholders for that commit; try again later.');
}

await writeFile(join(root, 'courses/plate-tectonics.json'), pt);
await writeFile(join(root, 'scripts/author-illustrations.mjs'), ai);
console.log('Restored bases from', GOOD);

await new Promise((resolve, reject) => {
  const p = spawn(process.execPath, [join(root, 'scripts/restore-ps-waves.mjs')], { stdio: 'inherit' });
  p.on('exit', code => code === 0 ? resolve() : reject(new Error('restore-ps-waves exit ' + code)));
});
console.log('Done.');
