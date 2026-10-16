#!/usr/bin/env node
/**
 * Full remote restore for Learnway after placeholder commits.
 * Downloads last-good bases from jsDelivr, then applies patches.
 */
import { writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const GOOD = '6e190d334a1c91e3e03e26659c0745feac0f9998';
const VIEWS_GOOD = '97bb0d1ed46f068935cdbad74878e9ccc0e1761b';

async function fetchText(path, sha = GOOD) {
  const url = `https://cdn.jsdelivr.net/gh/scomofo/learnway@${sha}/${path}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fetch ${path}: ${res.status}`);
  return await res.text();
}

console.log('Fetching last-good course files and views…');
const [pt, ai, views] = await Promise.all([
  fetchText('courses/plate-tectonics.json'),
  fetchText('scripts/author-illustrations.mjs'),
  fetchText('views.mjs', VIEWS_GOOD),
]);
for (const [name, body] of [['pt', pt], ['ai', ai], ['views', views]]) {
  if (body.trim() === 'see-local' || body.includes('recovery stub') || body.includes('SEE_ARTIFACTS')) {
    throw new Error(`${name} still looks broken on CDN; try again later.`);
  }
}

await writeFile(join(root, 'courses/plate-tectonics.json'), pt);
await writeFile(join(root, 'scripts/author-illustrations.mjs'), ai);
await writeFile(join(root, 'views.mjs'), views);
console.log('Restored plate-tectonics, author-illustrations, views');

function run(script) {
  return new Promise((resolve, reject) => {
    const p = spawn(process.execPath, [join(root, 'scripts', script)], { stdio: 'inherit' });
    p.on('exit', code => code === 0 ? resolve() : reject(new Error(script + ' exit ' + code)));
  });
}

try { await run('restore-ps-waves.mjs'); } catch (e) { console.warn(e.message); }
try { await run('patch-views-keys.mjs'); } catch (e) { console.warn(e.message); }
console.log('Done.');
