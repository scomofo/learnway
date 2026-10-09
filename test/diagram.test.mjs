import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validateCourse, sanitizeDiagram } from '../pipeline.mjs';
import { renderView, getFlashcards, diagramFigure } from '../views.mjs';

const fixture = JSON.parse(await readFile(new URL('../sample-course.json', import.meta.url)));

const GOOD_SVG = `<svg viewBox="0 0 400 300"><rect x="10" y="10" width="120" height="60" fill="#7cc7ff"/><text x="20" y="45" font-family="sans-serif" font-size="12" fill="#e8ecf1">Crust</text></svg>`;

// ---------- sanitizer ----------

test('sanitizeDiagram passes a clean diagram through unchanged', () => {
  assert.equal(sanitizeDiagram(GOOD_SVG), GOOD_SVG);
});

test('sanitizeDiagram strips scripts and event handlers', () => {
  const dirty = `<svg viewBox="0 0 400 300" onload="evil()"><script>alert(1)</script><rect x="1" y="1" width="10" height="10" fill="#7cc7ff" onclick="evil()"/></svg>`;
  const clean = sanitizeDiagram(dirty);
  assert.ok(clean.startsWith('<svg'), 'still an svg');
  assert.ok(!clean.includes('<script'), 'no script element');
  assert.ok(!/on(load|click)=/i.test(clean), 'no event handlers');
  assert.ok(clean.includes('<rect'), 'shapes kept');
});

test('sanitizeDiagram strips external references and foreign content', () => {
  const dirty = `<svg viewBox="0 0 400 300"><image href="https://evil.example/p.png"/><foreignObject><div>hi</div></foreignObject><a xlink:href="https://evil.example"><text>click</text></a></svg>`;
  const clean = sanitizeDiagram(dirty);
  assert.ok(!clean.includes('<image'), 'no image elements');
  assert.ok(!clean.includes('<foreignObject'), 'no foreignObject');
  assert.ok(!clean.includes('href'), 'no hrefs');
});

test('SVG CSS and SMIL cannot change the app or load remote resources', () => {
  const dirty = `<svg viewBox="0 0 800 400"><style>@import "https://example.com/track.css"; body{display:none}</style><rect x="5" y="5" width="50" height="50" style="fill:url(https://example.com/x)" fill="url(&#104;ttps://example.com/x)" class="btn lw-flow"/><animate attributeName="href" values="https://example.com/x"/><set attributeName="onload" to="evil()"/></svg>`;
  const clean = sanitizeDiagram(dirty);
  assert.ok(clean.includes('<rect'));
  assert.doesNotMatch(clean, /style|@import|https:|animate|<set|class="btn/);
  assert.match(clean, /class="lw-flow"/);
});

test('SVG sanitizer rejects nested roots, trailing markup and mismatched tags', () => {
  for (const svg of [
    '<svg><svg><text>x</text></svg></svg>',
    '<svg><text>x</text></svg><svg></svg>',
    '<svg><g><rect/></svg>',
    '<svg><text>x</text></svg><div>outside</div>',
  ]) assert.equal(sanitizeDiagram(svg), '');
});

test('viewer controls exist only for motion and never inside a flashcard', () => {
  const animated = GOOD_SVG.replace('<rect ', '<rect class="lw-engine-piston" ');
  const html = diagramFigure({ diagram: animated });
  assert.match(html, /Animation progress/);
  assert.match(html, /Enlarge illustration/);
  assert.doesNotMatch(diagramFigure({ diagram: GOOD_SVG }), /data-diagram-play/);
  const card = diagramFigure({ diagram: animated }, 'fc-diagram');
  assert.doesNotMatch(card, /<button|<input/);
});

test('sanitizeDiagram rejects non-SVG, oversized, and javascript: payloads', () => {
  assert.equal(sanitizeDiagram('just a string'), '');
  assert.equal(sanitizeDiagram('<div>nope</div>'), '');
  assert.equal(sanitizeDiagram('<svg viewBox="0 0 1 1"><text>unclosed'), '');
  // Dangerous hrefs are stripped, leaving safe output behind.
  const delinked = sanitizeDiagram(`<svg viewBox="0 0 1 1"><a href="javascript:alert(1)"><text>x</text></a></svg>`);
  assert.ok(!/javascript:/i.test(delinked), 'no javascript: URLs survive');
  assert.equal(sanitizeDiagram('<svg viewBox="0 0 1 1">' + 'x'.repeat(32001) + '</svg>'), '');
  assert.equal(sanitizeDiagram(null), '');
});

// ---------- validation ----------

function courseWithDiagram(diagram) {
  const course = JSON.parse(JSON.stringify(fixture));
  course.reading.sections[0].diagram = diagram;
  return course;
}

test('reading section with a good diagram validates', () => {
  assert.deepEqual(validateCourse(courseWithDiagram(GOOD_SVG)), []);
});

test('reading section with a hostile diagram fails validation', () => {
  const problems = validateCourse(courseWithDiagram('<svg viewBox="0 0 1 1"><script>alert(1)</script></svg>'));
  assert.ok(problems.some(p => p.includes('diagram')), `expected a diagram problem, got: ${problems.join('; ')}`);
});

test('reading section with a non-SVG diagram fails validation', () => {
  const problems = validateCourse(courseWithDiagram('draw a circle'));
  assert.ok(problems.some(p => p.includes('diagram')), `expected a diagram problem, got: ${problems.join('; ')}`);
});

test('sections without a diagram still validate (older courses)', () => {
  assert.deepEqual(validateCourse(fixture), []);
});

// ---------- views ----------

test('diagramFigure renders the SVG with its caption', () => {
  const html = diagramFigure({ diagram: GOOD_SVG, visual: 'A blue plate.' });
  assert.ok(html.includes('<svg viewBox="0 0 400 300">'), 'svg embedded');
  assert.ok(html.includes('class="diagram"'), 'diagram class present');
  assert.ok(html.includes('A blue plate.'), 'caption rendered');
});

test('diagramFigure falls back to the Picture-this card without a diagram', () => {
  const html = diagramFigure({ visual: 'Picture a crowded elevator.' });
  assert.ok(!html.includes('<svg'), 'no svg');
  assert.ok(html.includes('Picture this'), 'text fallback rendered');
});

test('diagramFigure sanitizes hostile SVG at the render boundary', () => {
  const html = diagramFigure({ diagram: '<svg viewBox="0 0 1 1" onload="evil()"><text>x</text></svg>' });
  assert.ok(!/onload=/i.test(html), 'handler stripped in rendered output');
});

test('reading view shows the diagram figure when present', () => {
  const html = renderView('reading', courseWithDiagram(GOOD_SVG));
  assert.ok(html.includes('class="diagram"'), 'diagram figure present');
  assert.ok(html.includes('<svg viewBox="0 0 400 300">'), 'svg rendered');
});

test('slides view shows the reading section diagram', () => {
  const course = courseWithDiagram(GOOD_SVG);
  const html = renderView('slides', course);
  assert.ok(html.includes('<svg viewBox="0 0 400 300">'), 'diagram rendered on the matching slide');
});

test('flashcard Visual card carries the diagram', () => {
  const cards = getFlashcards(courseWithDiagram(GOOD_SVG));
  const visual = cards.filter(c => c.category === 'Visual');
  assert.equal(visual.length, 1);
  assert.ok(visual[0].backHtml.includes('<svg viewBox="0 0 400 300">'), 'diagram in card back');
});

test('flashcards view renders with a diagram in the deck', () => {
  const html = renderView('flashcards', courseWithDiagram(GOOD_SVG));
  assert.ok(html.includes('flashcards-card'), 'flashcards view renders');
  assert.ok(html.includes('1</span> /'), 'card counter present');
});
