// Learnway views: the five Learn-Your-Way representations rendered from course JSON.
export { disposeDiagrams } from './diagram-player.mjs';
import { wireDiagrams } from './diagram-player.mjs';

function esc(s) {
  return String(s ?? '').replace(/&/g, '&').replace(/</g, '<').replace(/>/g, '>').replace(/"/g, '"');
}

function md(s) {
  const t = esc(s);
  return t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/\*([^*]+)\*/g, '<em>$1</em>').split(/\n\n+/).map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');
}

function sanitizeDiagram(svg) {
  if (!svg || typeof svg !== 'string') return '';
  if (!svg.includes('<svg')) return '';
  return svg
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/\son[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '')
    .replace(/javascript:/gi, '');
}

export function diagramFigure(s, cls = '') {
  const svg = sanitizeDiagram(s.diagram || '');
  const classes = cls ? `diagram ${cls}` : 'diagram';
  if (svg) {
    const caption = s.visual
      ? `<figcaption class="diagram-caption"><span class="diagram-caption-label">What this shows</span><div class="diagram-caption-body">${md(s.visual)}</div></figcaption>`
      : '';
    if (cls === 'fc-diagram') return `<figure class="${classes}"><div class="diagram-art">${svg}</div>${caption}</figure>`;
    const animated = /class="[^"]*\blw-[a-z0-9-]+/.test(svg);
    const keys = `<span class="diagram-keys" title="Keyboard: Space play/pause, arrows scrub"><kbd>Space</kbd> play · <kbd>←</kbd><kbd>→</kbd> scrub</span>`;
    const motion = animated ? `<div class="diagram-controls">
      <button type="button" class="btn diagram-play" data-diagram-play aria-pressed="false">Play</button>
      <label class="diagram-scrub"><span class="diagram-scrub-label">Inspect</span><input type="range" min="0" max="100" value="0" aria-label="Animation progress" data-diagram-seek></label>
      <span class="diagram-status" data-diagram-status role="status">Paused · drag to inspect</span>
      ${keys}
    </div>` : '';
    return `<figure class="${classes}" data-diagram${animated ? ' data-animated="true"' : ''}>
      <div class="diagram-toolbar"><span class="diagram-kind"><span class="diagram-dot" aria-hidden="true"></span>${animated ? 'Motion study' : 'Visual explanation'}</span><button type="button" class="btn ghost diagram-expand" data-diagram-expand aria-label="Enlarge illustration">Enlarge ↗</button></div>
      <div class="diagram-art">${svg}</div>${motion}${caption}</figure>`;
  }
  if (s.visual) {
    return `<figure class="${cls ? 'visual ' + cls : 'visual'}">
        <figcaption class="visual-title">Picture this</figcaption>
        <div class="visual-body">${md(s.visual)}</div>
      </figure>`;
  }
  return '';
}

export function renderHome(state) {
  return `<div class="wrap"><div class="hero"><h1>Learn your way</h1>
    <p class="muted">Short courses with motion diagrams you can scrub.</p>
    <div class="hero-actions"><button class="btn primary" data-go="library">Browse courses</button></div></div></div>`;
}

export function renderLibrary(state, courses) {
  const cards = (courses || []).map(c => {
    const meta = c.meta || {};
    return `<button class="lib-card" data-open-course="${esc(c.id || meta.slug || '')}">
      <div class="lib-title">${esc(meta.title || c.id)}</div>
      <div class="lib-meta">${esc(meta.level || '')} · ${esc(String(meta.estimatedMinutes || ''))} min</div>
    </button>`;
  }).join('');
  return `<div class="wrap"><h1>Library</h1><div class="lib-grid">${cards || '<p class="muted">No courses loaded.</p>'}</div></div>`;
}

export function renderCourse(state, course) {
  if (!course) return `<div class="wrap"><p class="err">Course not found.</p></div>`;
  const meta = course.meta || {};
  const sections = (course.reading && course.reading.sections) || [];
  const body = sections.map((s, i) => `
    <section class="card reading-sec" id="sec-${esc(s.id)}">
      <div class="sec-head"><span class="sec-num">${i + 1}</span>
        <div><div class="sec-kicker">Section</div><h3>${esc(s.heading || s.id)}</h3></div></div>
      <div class="prose">${md(s.body || '')}</div>
      ${diagramFigure(s)}
    </section>`).join('');
  setTimeout(() => { try { wireDiagrams(document); } catch (e) {} }, 0);
  return `<div class="wrap course-wrap">
    <div class="course-head"><p class="muted">${esc(meta.topic || '')}</p>
      <h1>${esc(meta.title || '')}</h1>
      <p class="hook">${esc((course.plan && course.plan.hook) || '')}</p></div>
    ${body}</div>`;
}

export function renderWizard() {
  return `<div class="wrap narrow"><h1>Create</h1><p class="muted">Course authoring wizard placeholder.</p></div>`;
}

export function renderSettings() {
  return `<div class="wrap narrow"><h1>Settings</h1><p class="muted">Preferences placeholder.</p></div>`;
}
