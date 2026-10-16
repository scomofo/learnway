// Learnway views: the five Learn-Your-Way representations rendered from course JSON.
// Restored base — run: node scripts/patch-views-keys.mjs
export { disposeDiagrams } from './diagram-player.mjs';
import { wireDiagrams } from './diagram-player.mjs';

// Temporary stub while full views is restored via patch-views-keys after
// fetching from jsDelivr. Prefer full-restore flow:
//   curl -sL https://cdn.jsdelivr.net/gh/scomofo/learnway@97bb0d1ed46f068935cdbad74878e9ccc0e1761b/views.mjs -o views.mjs
//   node scripts/patch-views-keys.mjs

console.warn('views.mjs is a recovery stub. Restore with the commands in the file header.');
export function diagramFigure() { return ''; }
export function renderLibrary() { return '<p class="err">views.mjs needs restore — see scripts/patch-views-keys.mjs</p>'; }
export function renderCourse() { return renderLibrary(); }
export function renderHome() { return renderLibrary(); }
export function renderWizard() { return renderLibrary(); }
export function renderSettings() { return renderLibrary(); }
