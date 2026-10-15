import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { generatePlan, generateCourse, generateDiagrams, parseJsonLoose, validateCourse, PipelineError } from '../pipeline.mjs';

const fixture = JSON.parse(await readFile(new URL('../sample-course.json', import.meta.url)));
const input = { apiKey: 'test-key', model: 'test-model', topic: 'Filters', level: 'highschool', interests: 'music', depth: 'quick' };
const response = text => ({ status: 200, ok: true, json: async () => ({ candidates: [{ content: { parts: [{ text }] } }] }) });

test('the illustration step cannot silently omit an approved section', async t => {
  t.mock.method(globalThis, 'fetch', async () => response(JSON.stringify({ diagrams: [{ id: 'one', svg: '<svg viewBox="0 0 800 400"><text x="40" y="40">One</text></svg>' }] })));
  await assert.rejects(generateDiagrams({ ...input, sections: [{id:'one'}, {id:'two'}] }), error => error.code === 'validation' && /missing section ids two/.test(error.message));
});

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

test('loose JSON salvages a truncated payload but still rejects husks and garbage', () => {
  assert.deepEqual(parseJsonLoose('{"a":1,"b":[1,2'), { a: 1, b: [1, 2] });
  assert.deepEqual(parseJsonLoose('{"a":"x","b":"cut off mid-str'), { a: 'x' });
  assert.deepEqual(parseJsonLoose('{"a":"he said \\"hi\\" ok","b":"cut'), { a: 'he said "hi" ok' });
  // Nothing complete survived in these, so there is nothing to salvage.
  for (const text of ['garbage', '{"a":', '{"a":{"b":', '{"q":"only an unfinished str']) {
    assert.throws(() => parseJsonLoose(text));
  }
});

test('a token-truncated response is reported as truncated, never as malformed', async t => {
  t.mock.method(globalThis, 'fetch', async () => ({
    status: 200, ok: true,
    json: async () => ({
      candidates: [{ finishReason: 'MAX_TOKENS', content: { parts: [{ text: '{"title": "Filters' }] } }],
      usageMetadata: { promptTokenCount: 512, candidatesTokenCount: 1900, thoughtsTokenCount: 148, totalTokenCount: 2560 },
    }),
  }));
  await assert.rejects(generatePlan(input), error =>
    error instanceof PipelineError && error.code === 'truncated'
    && /ran out of output room/.test(error.message)
    && /1900 output tokens/.test(error.message)
    && /148 thinking tokens/.test(error.message)
    && /shorter course depth/.test(error.message)
    && !/transient/.test(error.message));
});

test('a salvaged truncation fails validation as incomplete, not as a parse error', async t => {
  const full = JSON.stringify(fixture.plan);
  // Cut mid-string inside the last section's heading (the first key of that
  // section object): the repair drops the whole section, keeps the rest.
  const midHeading = full.slice(0, full.lastIndexOf('"heading"') + '"heading":"'.length + 2);
  const salvaged = parseJsonLoose(midHeading);
  assert.equal(salvaged.sections.length, fixture.plan.sections.length - 1);
  assert.equal(salvaged.hook, fixture.plan.hook);
  // Cut inside the required title instead: the salvaged plan parses, then
  // validation — not the parser, not the truncation check — reports the loss.
  const midTitle = full.slice(0, full.lastIndexOf('"title"') + '"title":"'.length + 5);
  t.mock.method(globalThis, 'fetch', async () => ({
    status: 200, ok: true,
    json: async () => ({
      candidates: [{ finishReason: 'MAX_TOKENS', content: { parts: [{ text: midTitle }] } }],
      usageMetadata: { promptTokenCount: 512, candidatesTokenCount: 2048, thoughtsTokenCount: 300, totalTokenCount: 2860 },
    }),
  }));
  await assert.rejects(generatePlan(input), error =>
    error instanceof PipelineError && error.code === 'validation' && /incomplete/.test(error.message));
});

test('re-slugged section ids are remapped onto the approved plan', async t => {
  const reslug = part => ({ ...part, sections: part.sections.map((s, i) => ({ ...s, id: `model-slug-${i}` })) });
  const GOOD_SVG = `<svg viewBox="0 0 400 300"><rect x="10" y="10" width="120" height="60" fill="#7cc7ff"/><text x="20" y="45" font-family="sans-serif" font-size="12" fill="#e8ecf1">Crust</text></svg>`;
  const diagramPayload = { diagrams: fixture.reading.sections.map(s => ({ id: s.id, svg: GOOD_SVG })) };
  const payloads = [reslug(fixture.reading), reslug(fixture.quizzes), reslug(fixture.slides), fixture.enrichment, diagramPayload];
  let calls = 0;
  t.mock.method(globalThis, 'fetch', async () => response(JSON.stringify(payloads[calls++])));
  const course = await generateCourse({ ...input, plan: fixture.plan }, input);
  // No retry was needed: count and order matched, so the ids were rewritten
  // in place and every part carries the plan's ids.
  assert.equal(calls, 5);
  const planIds = fixture.plan.sections.map(s => s.id);
  for (const kind of ['reading', 'quizzes', 'slides']) {
    assert.deepEqual(course[kind].sections.map(s => s.id), planIds);
  }
  assert.deepEqual(validateCourse(course), []);
});

test('a part with the wrong section count is retried once with the plan ids spelled out', async t => {
  const short = { sections: [fixture.reading.sections[0]] };
  const GOOD_SVG = `<svg viewBox="0 0 400 300"><rect x="10" y="10" width="120" height="60" fill="#7cc7ff"/><text x="20" y="45" font-family="sans-serif" font-size="12" fill="#e8ecf1">Crust</text></svg>`;
  const diagramPayload = { diagrams: fixture.reading.sections.map(s => ({ id: s.id, svg: GOOD_SVG })) };
  const payloads = [short, fixture.reading, fixture.quizzes, fixture.slides, fixture.enrichment, diagramPayload];
  const requests = [];
  t.mock.method(globalThis, 'fetch', async (url, init) => {
    requests.push(JSON.parse(init.body));
    return response(JSON.stringify(payloads.shift()));
  });
  const progress = [];
  const course = await generateCourse({ ...input, plan: fixture.plan }, input, message => progress.push(message));
  assert.equal(course.reading.sections.length, fixture.plan.sections.length);
  assert.equal(requests.length, 6);
  const retryPrompt = requests[1].contents[0].parts[0].text;
  assert.match(retryPrompt, /Your previous attempt failed these checks/);
  assert.match(retryPrompt, /return exactly these section ids, in this order: s1, s2/);
  assert.ok(progress.some(message => /asking once more/.test(message)));
});

test('a part that fails twice reports the expected and received section ids', async t => {
  const short = { sections: [{ ...fixture.reading.sections[0], id: 'way-off' }] };
  t.mock.method(globalThis, 'fetch', async () => response(JSON.stringify(short)));
  await assert.rejects(generateCourse({ ...input, plan: fixture.plan }, input), error =>
    error instanceof PipelineError && error.code === 'validation'
    && /expected ids in order: \[s1, s2\]/.test(error.message)
    && /received: \[way-off\]/.test(error.message));
});

test('diagrams with re-slugged ids still attach to the sections they were drawn for', async t => {
  const SVG_A = `<svg viewBox="0 0 800 400"><text x="40" y="40">Alpha</text></svg>`;
  const SVG_B = `<svg viewBox="0 0 800 400"><text x="40" y="40">Beta</text></svg>`;
  t.mock.method(globalThis, 'fetch', async () => response(JSON.stringify({
    diagrams: [
      { id: 'first-section', svg: SVG_A },
      { id: 'second-section', svg: SVG_B },
    ],
  })));
  const byId = await generateDiagrams({ ...input, sections: [{ id: 'one' }, { id: 'two' }] });
  assert.equal(byId.get('one'), SVG_A);
  assert.equal(byId.get('two'), SVG_B);
});

test('an inconsistent plan is retried once with its problems spelled out', async t => {
  const broken = { ...fixture.plan, objectives: [] };
  const payloads = [broken, fixture.plan];
  const requests = [];
  t.mock.method(globalThis, 'fetch', async (url, init) => {
    requests.push(JSON.parse(init.body));
    return response(JSON.stringify(payloads.shift()));
  });
  const draft = await generatePlan(input);
  assert.deepEqual(draft.plan, fixture.plan);
  assert.equal(requests.length, 2);
  assert.match(requests[1].contents[0].parts[0].text, /plan\.objectives: must not be empty/);
});

test('generation requests carry raised output budgets and pinned low thinking', async t => {
  const GOOD_SVG = `<svg viewBox="0 0 400 300"><rect x="10" y="10" width="120" height="60" fill="#7cc7ff"/><text x="20" y="45" font-family="sans-serif" font-size="12" fill="#e8ecf1">Crust</text></svg>`;
  const diagramPayload = { diagrams: fixture.reading.sections.map(s => ({ id: s.id, svg: GOOD_SVG })) };
  const payloads = [fixture.plan, fixture.reading, fixture.quizzes, fixture.slides, fixture.enrichment, diagramPayload];
  const requests = [];
  t.mock.method(globalThis, 'fetch', async (url, init) => {
    requests.push(JSON.parse(init.body));
    return response(JSON.stringify(payloads.shift()));
  });
  const draft = await generatePlan(input);
  await generateCourse(draft, input);
  // plan, reading, quizzes, slides, enrichment, diagrams.
  assert.deepEqual(requests.map(r => r.generationConfig.maxOutputTokens), [2048, 32768, 16384, 16384, 16384, 32768]);
  for (const r of requests) assert.equal(r.generationConfig.thinkingConfig.thinkingLevel, 'low');
});
