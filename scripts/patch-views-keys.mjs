#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const path = join(dirname(fileURLToPath(import.meta.url)), '..', 'views.mjs');
let text = await readFile(path, 'utf8');
if (text.trim() === 'SEE_ARTIFACTS_views.mjs' || text.trim() === 'PLACEHOLDER') {
  console.error('views.mjs is still a placeholder. Restore it first:');
  console.error('  curl -sL https://cdn.jsdelivr.net/gh/scomofo/learnway@97bb0d1ed46f068935cdbad74878e9ccc0e1761b/views.mjs -o views.mjs');
  console.error('  node scripts/patch-views-keys.mjs');
  process.exit(1);
}
if (text.includes('diagram-keys')) {
  console.log('views.mjs already has keyboard hints');
  process.exit(0);
}
const old = `    const motion = animated ? \`<div class="diagram-controls">
      <button type="button" class="btn diagram-play" data-diagram-play aria-pressed="false">Play</button>
      <label class="diagram-scrub">Inspect motion<input type="range" min="0" max="100" value="0" aria-label="Animation progress" data-diagram-seek></label>
      <span class="diagram-status" data-diagram-status role="status">Paused · drag to inspect</span>
    </div>\` : '';
    return \`<figure class="\${classes}" data-diagram>
      <div class="diagram-toolbar"><span class="diagram-kind"><span class="diagram-dot" aria-hidden="true"></span>\${animated ? 'Motion study' : 'Visual explanation'}</span><button type="button" class="btn ghost diagram-expand" data-diagram-expand aria-label="Enlarge illustration">Enlarge ↗</button></div>
      <div class="diagram-art">\${svg}</div>\${motion}\${caption}</figure>\`;`;
const neu = `    const motion = animated ? \`<div class="diagram-controls" role="group" aria-label="Motion controls">
      <button type="button" class="btn diagram-play" data-diagram-play aria-pressed="false" aria-keyshortcuts="Space">Play</button>
      <label class="diagram-scrub">Inspect<input type="range" min="0" max="100" value="0" step="1" aria-label="Animation progress" data-diagram-seek></label>
      <span class="diagram-status" data-diagram-status role="status">Paused · drag to inspect</span>
      <span class="diagram-keys" aria-hidden="true"><kbd>Space</kbd> play · <kbd>←</kbd><kbd>→</kbd> scrub</span>
    </div>\` : '';
    return \`<figure class="\${classes}" data-diagram tabindex="0" aria-label="\${animated ? 'Motion study' : 'Visual explanation'}. Use Space to play, arrow keys to scrub.">
      <div class="diagram-toolbar"><span class="diagram-kind"><span class="diagram-dot" aria-hidden="true"></span>\${animated ? 'Motion study' : 'Visual explanation'}</span><button type="button" class="btn ghost diagram-expand" data-diagram-expand aria-label="Enlarge illustration">Enlarge ↗</button></div>
      <div class="diagram-art">\${svg}</div>\${motion}\${caption}</figure>\`;`;
if (!text.includes('Inspect motion')) {
  console.error('Could not find diagram controls block to patch');
  process.exit(1);
}
text = text.replace(old, neu);
if (!text.includes('diagram-keys')) {
  console.error('Patch did not apply');
  process.exit(1);
}
await writeFile(path, text);
console.log('Patched views.mjs with keyboard hints');
