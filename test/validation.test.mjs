import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { generatePlan, generateCourse, validateCourse, PipelineError } from '../pipeline.mjs';
import { VIEWS, renderView } from '../views.mjs';

const fixture = JSON.parse(await readFile(new URL('../sample-course.json', import.meta.url)));
const input = { apiKey: 'test-key', model: 'test-model', topic: 'Filters', level: 'highschool', interests: '', depth: 'quick' };
const draft = { ...input, plan: fixture.plan };
const response = payload => ({ status: 200, ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text: JSON.stringify(payload) }] } }] }) });

test('all shipped courses validate and render in all five views', async () => {
  for (const file of ['sample-course.json', 'courses/hs-genetics.json', 'courses/hs-simple-machines.json']) {
    const course = JSON.parse(await readFile(new URL('../' + file, import.meta.url)));
    assert.deepEqual(validateCourse(course), [], file);
    for (const view of VIEWS) assert.ok(renderView(view.id, course).length > 0, `${file}: ${view.id}`);
  }
});

const invalid = [
  ['missing plan', c => { delete c.plan; }, /plan/],
  ['null metadata', c => { c.meta = null; }, /meta/],
  ['blank title', c => { c.meta.title = '  '; }, /meta.title/],
  ['invalid display metadata', c => { c.meta.interests = { toString: 'broken' }; }, /meta.interests/],
  ['missing storage identity', c => { delete c.meta.topic; }, /meta.topic/],
  ['invalid date', c => { c.meta.createdAt = 'not a date'; }, /meta.createdAt/],
  ['empty objectives', c => { c.plan.objectives = []; }, /objectives/],
  ['empty plan', c => { c.plan.sections = []; }, /plan.sections/],
  ['empty teaching points', c => { c.plan.sections[0].points = []; }, /points/],
  ['duplicate plan ids', c => { c.plan.sections[1].id = c.plan.sections[0].id; }, /duplicate id/],
  ['missing reading section', c => { c.reading.sections.pop(); }, /match the approved plan/],
  ['out-of-order sections', c => { c.slides.sections.reverse(); }, /match the approved plan/],
  ['unknown section', c => { c.quizzes.sections[0].id = 'unknown'; }, /match the approved plan/],
  ['duplicate content sections', c => { c.reading.sections[1].id = c.reading.sections[0].id; }, /duplicate id/],
  ['null section', c => { c.reading.sections[0] = null; }, /reading.sections\[0\]/],
  ['empty reading', c => { c.reading.sections = []; }, /must not be empty/],
  ['blank body', c => { c.reading.sections[0].body = ''; }, /body/],
  ['invalid check-in', c => { c.reading.sections[0].questions = [null]; }, /questions/],
  ['empty check-ins', c => { c.reading.sections[0].questions = []; }, /questions/],
  ['missing quiz questions', c => { delete c.quizzes.sections[0].questions; }, /questions/],
  ['null choices', c => { c.quizzes.sections[0].questions[0].choices = null; }, /choices/],
  ['empty choices', c => { c.quizzes.sections[0].questions[0].choices = []; }, /choices/],
  ['too many choices for the four-label renderer', c => { c.quizzes.sections[0].questions[0].choices.push('E'); }, /choices/],
  ['negative answer', c => { c.quizzes.sections[0].questions[0].answer = -1; }, /answer/],
  ['out-of-range answer', c => { c.quizzes.sections[0].questions[0].answer = 4; }, /answer/],
  ['fractional answer', c => { c.quizzes.sections[0].questions[0].answer = 0.5; }, /answer/],
  ['string answer', c => { c.quizzes.sections[0].questions[0].answer = '0'; }, /answer/],
  ['null slide bullets', c => { c.slides.sections[0].bullets = null; }, /bullets/],
  ['empty slide bullets', c => { c.slides.sections[0].bullets = []; }, /bullets/],
  ['null audio turn', c => { c.enrichment.turns[0] = null; }, /turns/],
  ['unknown speaker', c => { c.enrichment.turns[0].speaker = 'other'; }, /speaker/],
  ['empty audio', c => { c.enrichment.turns = []; }, /turns/],
  ['invalid mnemonic', c => { c.enrichment.mnemonics = [null]; }, /mnemonics/],
  ['empty map', c => { c.enrichment.nodes = []; }, /nodes/],
  ['duplicate node', c => { c.enrichment.nodes.push({ ...c.enrichment.nodes[0] }); }, /duplicate id/],
  ['unknown parent', c => { c.enrichment.nodes[1].parent = 'missing'; }, /unknown parent/],
  ['multiple roots', c => { c.enrichment.nodes[1].parent = null; }, /exactly one root/],
  ['missing root', c => { c.enrichment.nodes[0].parent = c.enrichment.nodes[0].id; }, /exactly one root/],
  ['self cycle', c => { c.enrichment.nodes[1].parent = c.enrichment.nodes[1].id; }, /cycle/],
  ['disconnected cycle', c => {
    c.enrichment.nodes[1].parent = c.enrichment.nodes[2].id;
    c.enrichment.nodes[2].parent = c.enrichment.nodes[1].id;
  }, /cycle/],
];

for (const [name, mutate, expected] of invalid) {
  test(`rejects ${name} without throwing`, () => {
    const course = structuredClone(fixture);
    mutate(course);
    assert.match(validateCourse(course).join('; '), expected);
  });
}

test('rejects JSON primitives and arrays without throwing', () => {
  for (const value of [null, true, 1, 'course', [], {}]) assert.ok(validateCourse(value).length);
});

test('allows empty optional lists and unknown extension fields without changing the course', () => {
  const course = structuredClone(fixture);
  course.plan.prerequisites = [];
  course.enrichment.mnemonics = [];
  course.extension = { future: true };
  const before = JSON.stringify(course);
  assert.deepEqual(validateCourse(course), []);
  assert.equal(JSON.stringify(course), before);
});

test('valid mind maps support arbitrary string ids and deep parent chains', () => {
  const course = structuredClone(fixture);
  course.enrichment.nodes = [{ id: '__root__', parent: null, label: 'Root', note: 'Root note' }];
  for (let i = 0; i < 12000; i++) {
    course.enrichment.nodes.push({ id: String(i), parent: i ? String(i - 1) : '__root__', label: `Node ${i}`, note: 'Note' });
  }
  assert.deepEqual(validateCourse(course), []);
  const rendered = renderView('mindmap', course);
  assert.equal((rendered.match(/class="mnode"/g) || []).length, 12001);
});

test('invalid approved plan fails before any course API requests', async t => {
  let calls = 0;
  t.mock.method(globalThis, 'fetch', async () => { calls++; return response({}); });
  await assert.rejects(generateCourse({ ...draft, plan: {} }, input), e => e instanceof PipelineError && e.code === 'validation' && /plan/.test(e.message));
  assert.equal(calls, 0);
});

test('valid JSON with an invalid plan produces a recoverable pipeline error', async t => {
  t.mock.method(globalThis, 'fetch', async () => response({ title: 'Incomplete' }));
  await assert.rejects(generatePlan(input), e => e.code === 'validation' && /plan.objectives/.test(e.message));
});

for (const [index, stage] of ['reading', 'quizzes', 'slides', 'enrichment'].entries()) {
  test(`invalid ${stage} stops generation at that stage`, async t => {
    const payloads = [fixture.reading, fixture.quizzes, fixture.slides, fixture.enrichment];
    payloads[index] = {};
    let calls = 0;
    t.mock.method(globalThis, 'fetch', async () => response(payloads[calls++]));
    await assert.rejects(generateCourse(draft, input), e => e.code === 'validation' && e.message.includes(stage));
    assert.equal(calls, index + 1);
  });
}
