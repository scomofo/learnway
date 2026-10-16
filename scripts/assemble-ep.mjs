#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const dir = dirname(fileURLToPath(import.meta.url));
let b64 = '';
for (let i = 0; i < 3; i++) b64 += await readFile(join(dir, `ep${i}.b64`), 'utf8');
const json = Buffer.from(b64, 'base64').toString('utf8');
JSON.parse(json);
await writeFile(join(dir, '..', 'courses', 'everyday-probability.json'), json + '\n');
console.log('Wrote everyday-probability.json', json.length, 'bytes');
