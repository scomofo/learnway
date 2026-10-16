// Learnway views — full module loaded from last-good commit so main works without a local restore script.
export { disposeDiagrams } from './diagram-player.mjs';

const SRC = 'https://cdn.jsdelivr.net/gh/scomofo/learnway@97bb0d1ed46f068935cdbad74878e9ccc0e1761b/views.mjs';

const text = await (await fetch(SRC)).text();
const blob = new Blob([text], { type: 'text/javascript' });
const url = URL.createObjectURL(blob);
const mod = await import(url);
URL.revokeObjectURL(url);

function enhanceFigure(html) {
  if (!html || typeof html !== 'string') return html;
  let out = html;
  if (out.includes('class="diagram-caption"') && !out.includes('diagram-caption-label')) {
    out = out
      .replace(
        '<figcaption class="diagram-caption">',
        '<figcaption class="diagram-caption"><span class="diagram-caption-label">What this shows</span><div class="diagram-caption-body">'
      )
      .replace('</figcaption>', '</div></figcaption>');
  }
  if (out.includes('Motion study') && !out.includes('data-animated')) {
    out = out.replace('data-diagram>', 'data-diagram data-animated="true">');
  }
  if (out.includes('diagram-controls') && !out.includes('diagram-keys')) {
    out = out.replace(
      'Paused · drag to inspect</span>',
      'Paused · drag to inspect</span><span class="diagram-keys" title="Keyboard: Space play/pause, arrows scrub"><kbd>Space</kbd> play · <kbd>←</kbd><kbd>→</kbd> scrub</span>'
    );
  }
  if (out.includes('Inspect motion') && !out.includes('diagram-scrub-label')) {
    out = out.replace(
      '>Inspect motion<input',
      '><span class="diagram-scrub-label">Inspect</span><input'
    );
  }
  return out;
}

export const esc = mod.esc;
export const md = mod.md;
export const VIEWS = mod.VIEWS;
export const courseToMarkdown = mod.courseToMarkdown;
export const renderSources = mod.renderSources;
export const renderReading = mod.renderReading;
export const renderQuiz = mod.renderQuiz;
export const renderSlides = mod.renderSlides;
export const renderAudio = mod.renderAudio;
export const renderMindmap = mod.renderMindmap;
export const getFlashcards = mod.getFlashcards;
export const renderFlashcards = mod.renderFlashcards;
export const wireView = mod.wireView;

export function diagramFigure(s, cls = '') {
  return enhanceFigure(mod.diagramFigure(s, cls));
}

export function renderView(name, course, options = {}) {
  const html = mod.renderView(name, course, options);
  if (typeof html !== 'string') return html;
  // Enhance every diagram caption block in the view HTML
  return html.replace(/<figure class="diagram[\s\S]*?<\/figure>/g, (block) => enhanceFigure(block));
}
