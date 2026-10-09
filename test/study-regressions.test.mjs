import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import * as pipeline from '../pipeline.mjs';
import * as views from '../views.mjs';

const source = (await readFile(new URL('../app.mjs', import.meta.url), 'utf8')).replace(/^import .*;\n/gm, '');
const fixture = JSON.parse(await readFile(new URL('../sample-course.json', import.meta.url)));
const index = JSON.parse(await readFile(new URL('../courses/index.json', import.meta.url)));
const shipped = await Promise.all(index.map(async entry => JSON.parse(await readFile(new URL('../' + entry.file, import.meta.url)))));

function harness() {
  const values = new Map();
  const status = { textContent: '' };
  const note = { dataset: { secNote: fixture.reading.sections[0].id }, value: '', parentElement: { querySelector: () => status }, addEventListener(type, fn) { this[type] = fn; } };
  const app = { innerHTML: '', handlers: {}, addEventListener(type, fn) { this.handlers[type] = fn; }, querySelector() { return this.innerHTML.includes('id="view-root"') ? { querySelectorAll: selector => selector === '[data-sec-note]' ? [note] : [] } : null; } };
  const storage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
  const fetched = [];
  const context = vm.createContext({ ...pipeline, ...views,
    document: { querySelector: () => app, addEventListener() {}, getElementById() { return null; } },
    window: { scrollTo() {} }, localStorage: storage, fixture, index,
    fetch: async file => { fetched.push(file); return { json: async () => structuredClone(shipped[index.findIndex(entry => entry.file === file)]) }; },
    alert(message) { throw new Error(message); },
  });
  vm.runInContext(source, context);
  const run = expression => vm.runInContext(expression, context);
  run('state.bundled = index; wire(document.querySelector("#app"));');
  return { run, values, status, note, app, storage, fetched };
}

test('filtered included-course button opens the course it displays', async () => {
  const h = harness();
  h.run('state.searchQuery = "Six Ways"');
  const html = h.run('viewLibrary()');
  const selected = html.match(/data-bundled="(\d+)"/)[1];
  await h.app.handlers.click({ target: { closest: selector => selector === '[data-bundled]' ? { dataset: { bundled: selected } } : null } });
  assert.equal(h.fetched[0], 'courses/hs-simple-machines.json');
  assert.match(h.app.innerHTML, /Simple Machines: Six Ways/);
});

test('level filter includes matching bundled courses and gives an honest empty state', () => {
  const h = harness();
  h.run('state.levelFilter = "highschool"');
  const html = h.run('viewLibrary()');
  assert.equal((html.match(/data-bundled=/g) || []).length, index.filter(entry => entry.level === 'highschool').length);
  assert.match(html, /Simple Machines/);
  h.run('state.searchQuery = "no-course-matches-this"');
  assert.match(h.run('viewLibrary()'), /No courses match your filter/);
  assert.doesNotMatch(h.run('viewLibrary()'), /Add your Gemini API key/);
});

test('library search tolerates legacy malformed metadata and retains original saved indices', () => {
  const h = harness();
  h.values.set('learnway:courses', JSON.stringify([null, { meta: { title: {}, topic: [], interests: 3 } }, fixture]));
  h.run('state.searchQuery = fixture.meta.title');
  const html = h.run('viewLibrary()');
  assert.match(html, /data-open="2"/);
  assert.equal(JSON.parse(h.values.get('learnway:courses')).length, 3);
});

test('failed note saves stay visible, survive view changes as drafts, and recover', () => {
  const h = harness();
  h.run('state.screen = "course"; state.course = fixture; render()');
  h.note.value = 'Original note'; h.note.input();
  const saved = h.values.get('learnway:notes');
  const write = h.storage.setItem;
  h.storage.setItem = () => { throw new Error('Quota exceeded'); };
  h.note.value = 'Unsaved edited note';
  assert.doesNotThrow(() => h.note.input());
  assert.match(h.status.textContent, /Not saved/);
  assert.equal(h.values.get('learnway:notes'), saved);
  h.run('state.screen = "library"; render(); state.screen = "course"; render()');
  assert.match(h.app.innerHTML, /Unsaved edited note/);
  assert.match(h.app.innerHTML, /Not saved/);
  h.storage.setItem = write;
  h.note.input();
  assert.match(h.status.textContent, /Saved in this browser/);
  assert.match(h.values.get('learnway:notes'), /Unsaved edited note/);
  h.run('render()');
  assert.doesNotMatch(h.app.innerHTML, /Not saved/);
});

test('notes tolerate malformed storage, remain isolated by course, and allow deletion', () => {
  const h = harness();
  h.values.set('learnway:notes', 'null');
  h.run('saveCourseNote("one", "s1", "First"); saveCourseNote("two", "s1", "Second")');
  assert.equal(h.run('getCourseNotes("one").s1'), 'First');
  assert.equal(h.run('getCourseNotes("two").s1'), 'Second');
  h.run('saveCourseNote("one", "s1", "   ")');
  assert.equal(h.run('getCourseNotes("one").s1'), undefined);
  assert.equal(h.run('getCourseNotes("two").s1'), 'Second');
});

test('fenced diagrams preserve whitespace and escape HTML in reading and slides', () => {
  const diagram = 'Input    Output\n  A        B\n\n\t<script>**literal**</script>';
  const cue = 'Before\n```text onclick="bad"\n' + diagram + '\n```\nAfter';
  const course = structuredClone(fixture);
  course.reading.sections[0].visual = cue; course.slides.sections[0].visual = cue;
  for (const view of ['reading', 'slides']) {
    const html = views.renderView(view, course);
    assert.ok(html.includes('<code>' + views.esc(diagram) + '</code>'));
    assert.match(html, /<figcaption/);
    assert.doesNotMatch(html, /<script>|onclick="bad"/);
  }
  assert.match(views.md('- One\n~~~text\r\n  A\r\n~~~\n## Heading'), /<\/ul><pre.*<code>  A<\/code><\/pre><h4>Heading<\/h4>/);
  assert.ok(views.md('````\n```\n~~~\n````').includes('<code>```\n~~~</code>'));
  assert.ok(views.md('```\n<open>').includes('<code>&lt;open&gt;</code>'));
});

test('course validation and mind maps work without recent convenience APIs', t => {
  for (const [object, key] of [[Array.prototype, 'toReversed'], [Object, 'hasOwn']]) {
    const original = Object.getOwnPropertyDescriptor(object, key);
    Object.defineProperty(object, key, { value: undefined, configurable: true });
    t.after(() => original ? Object.defineProperty(object, key, original) : delete object[key]);
  }
  assert.deepEqual(pipeline.validateCourse(fixture), []);
  const before = JSON.stringify(fixture);
  assert.match(views.renderMindmap(fixture), /class="mnode"/);
  assert.equal(JSON.stringify(fixture), before);
});

test('further-reading extension fields cannot inject executable links or markup', () => {
  const html = views.renderSources({ sources: [
    { title: '<img onerror=alert(1)>', url: 'https://example.org/?q="&x=1' },
    { title: 'Bad', url: 'javascript:alert(1)' }, { title: 'Bad', url: 'data:text/html,test' },
    { title: 'Bad', url: '//example.org' }, { title: 'Bad', url: 'https://user:pass@example.org' },
    null, {}, { title: {}, url: 'https://example.org' },
  ] });
  assert.equal((html.match(/<a /g) || []).length, 1);
  assert.match(html, /&lt;img/); assert.match(html, /%22&amp;x=1/);
  assert.doesNotMatch(html, /<img|>Bad</);
  for (const course of [{}, { sources: {} }, { sources: [null] }]) assert.equal(views.renderSources(course), '');
});
