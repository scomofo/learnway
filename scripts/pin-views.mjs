#!/usr/bin/env node
/** Pin full views.mjs in-repo (no CDN runtime dependency). */
import { writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = 'https://cdn.jsdelivr.net/gh/scomofo/learnway@97bb0d1ed46f068935cdbad74878e9ccc0e1761b/views.mjs';
let text = await (await fetch(SRC)).text();

const oldCaption = "const caption = s.visual ? `<figcaption class=\"diagram-caption\">${md(s.visual)}</figcaption>` : '';";
const newCaption = `const caption = s.visual
      ? \`<figcaption class="diagram-caption"><span class="diagram-caption-label">What this shows</span><div class="diagram-caption-body">\${md(s.visual)}</div></figcaption>\`
      : '';`;
if (text.includes(oldCaption)) text = text.replace(oldCaption, newCaption);

const oldMotion = `const motion = animated ? \`<div class="diagram-controls">
      <button type="button" class="btn diagram-play" data-diagram-play aria-pressed="false">Play</button>
      <label class="diagram-scrub">Inspect motion<input type="range" min="0" max="100" value="0" aria-label="Animation progress" data-diagram-seek></label>
      <span class="diagram-status" data-diagram-status role="status">Paused · drag to inspect</span>
    </div>\` : '';
    return \`<figure class="\${classes}" data-diagram>
      <div class="diagram-toolbar"><span class="diagram-kind"><span class="diagram-dot" aria-hidden="true"></span>\${animated ? 'Motion study' : 'Visual explanation'}</span><button type="button" class="btn ghost diagram-expand" data-diagram-expand aria-label="Enlarge illustration">Enlarge ↗</button></div>
      <div class="diagram-art">\${svg}</div>\${motion}\${caption}</figure>\`;`;

const newMotion = `const keys = \`<span class="diagram-keys" title="Keyboard: Space play/pause, arrows scrub"><kbd>Space</kbd> play · <kbd>←</kbd><kbd>→</kbd> scrub</span>\`;
    const motion = animated ? \`<div class="diagram-controls">
      <button type="button" class="btn diagram-play" data-diagram-play aria-pressed="false">Play</button>
      <label class="diagram-scrub"><span class="diagram-scrub-label">Inspect</span><input type="range" min="0" max="100" value="0" aria-label="Animation progress" data-diagram-seek></label>
      <span class="diagram-status" data-diagram-status role="status">Paused · drag to inspect</span>
      \${keys}
    </div>\` : '';
    return \`<figure class="\${classes}" data-diagram\${animated ? ' data-animated="true"' : ''}>
      <div class="diagram-toolbar"><span class="diagram-kind"><span class="diagram-dot" aria-hidden="true"></span>\${animated ? 'Motion study' : 'Visual explanation'}</span><button type="button" class="btn ghost diagram-expand" data-diagram-expand aria-label="Enlarge illustration">Enlarge ↗</button></div>
      <div class="diagram-art">\${svg}</div>\${motion}\${caption}</figure>\`;`;

if (text.includes('Inspect motion')) text = text.replace(oldMotion, newMotion);

await writeFile(join(root, 'views.mjs'), text);
console.log('Pinned full views.mjs,', text.length, 'bytes');
