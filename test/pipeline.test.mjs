import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { generatePlan, generateCourse, parseJsonLoose, validateCourse, PipelineError } from '../pipeline.mjs';

const fixture = JSON.parse(await readFile(new URL('../sample-course.json', import.meta.url)));
const input = { apiKey: 'test-key', model: 'test-model', topic: 'Filters', level: 'highschool', interests: 'music', depth: 'quick' };
const response = text => ({ status: 200, ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text }] } }] }) });

test('approved plan generates a complete course and sends a Gemini-compatible nullable schema', async t => {
  const GOOD_SVG = `<svg viewBox="0 0 400 300"><rect x="10" y="10" width="120" height="60" fill="#7cc7ff"/><text x="20" y="45" font-family="sans-serif" font-size="12" fill="#e8ecf1">Crust</text></svg>`;
  const diagramPayload = { diagrams: fixture.reading.sections.map(s => ({ id: s.id, svg: GOOD_SVG })) };
  const payloads = [fixture.plan, fixture.reading, fixture.quizzes, fixture.slides, fixture.enrichment, diagramPayload];
  const requests = [];
  t.mock.method(globalThis, 'fetch', async (url, init) => {
    requests.push(JSON.parse(init.body));
    assert.equal(init.headers['x-goog-api-key'], input.apiKey);
    assert.match(url, /test-model:generateContent$/);
    return response(JSON.stringify(payloads.shift()));
  });
  const draft = await generatePlan(input);
  const progress = [];
  const course = await generateCourse(draft, input, message => progress.push(message));
  assert.equal(requests.length, 6);
  assert.equal(progress.length, 5);
  assert.equal(course.meta.depth, input.depth);
  assert.equal(course.meta.topic, input.topic);
  assert.equal(course.meta.model, input.model);
  assert.equal(course.meta.title, fixture.plan.title);
  assert.ok(Number.isFinite(Date.parse(course.meta.createdAt)));
  for (const key of ['plan', 'quizzes', 'slides', 'enrichment']) assert.deepEqual(course[key], fixture[key]);
  // Reading sections gain their diagrams from step 5.
  assert.equal(course.reading.sections.length, fixture.reading.sections.length);
  course.reading.sections.forEach((s, i) => {
    const { diagram, ...rest } = s;
    assert.deepEqual(rest, fixture.reading.sections[i]);
    assert.equal(diagram, GOOD_SVG);
  });
  assert.deepEqual(validateCourse(course), []);
  const parent = requests[4].generationConfig.responseSchema.properties.nodes.items.properties.parent;
  assert.equal(parent.type, 'string');
  assert.equal(parent.nullable, true);
  const inspect = value => {
    if (!value || typeof value !== 'object') return;
    if ('type' in value) assert.equal(typeof value.type, 'string');
    Object.values(value).forEach(inspect);
  };
  requests.forEach(request => inspect(request.generationConfig.responseSchema));
});

test('loose JSON accepts plain, fenced, and chatter-wrapped payloads', () => {
  for (const text of ['{"a":1}', '```json\n{"a":1}\n```', '```\n{"a":1}\n```', 'Here is the result: {"a":1} Thanks.']) {
    assert.deepEqual(parseJsonLoose(text), { a: 1 });
  }
  for (const text of ['garbage', '{"a":', '```json\n{"a":\n```']) assert.throws(() => parseJsonLoose(text));
});

test('generation uses loose parsing and exposes actionable malformed-output errors', async t => {
  t.mock.method(globalThis, 'fetch', async () => response('```json\n' + JSON.stringify(fixture.plan) + '\n```'));
  assert.deepEqual((await generatePlan(input)).plan, fixture.plan);
  for (const text of ['garbage', '{"title":']) {
    globalThis.fetch = async () => response(text);
    await assert.rejects(generatePlan(input), error => error instanceof PipelineError && error.code === 'parse' && /malformed JSON/.test(error.message));
  }
});

test('HTTP 400 distinguishes request errors from rejected API keys', async t => {
  t.mock.method(globalThis, 'fetch', async () => ({ status: 400, text: async () => 'Unknown name "type"' }));
  await assert.rejects(generatePlan(input), error => error.code === 'bad-request' && /Unknown name/.test(error.message));
  globalThis.fetch = async () => ({ status: 400, text: async () => 'API key not valid' });
  await assert.rejects(generatePlan(input), error => error.code === 'bad-key');
});

test('HTTP 402 explains the billing requirement', async t => {
  t.mock.method(globalThis, 'fetch', async () => ({ status: 402, ok: false }));
  await assert.rejects(generatePlan(input), error => error instanceof PipelineError && error.code === 'billing' && /billing/i.test(error.message));
});
