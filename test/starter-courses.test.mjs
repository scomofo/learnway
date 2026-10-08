import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { getFlashcards, courseToMarkdown } from '../views.mjs';

const index = JSON.parse(await readFile(new URL('../courses/index.json', import.meta.url)));

test('included catalog has unique files, matching searchable metadata and ten complete new starters', async () => {
  assert.equal(new Set(index.map(entry => entry.file)).size, index.length);
  const starters = [];
  const identities = new Set();
  for (const entry of index) {
    assert.match(entry.file, /^courses\/[a-z0-9-]+\.json$/);
    const course = JSON.parse(await readFile(new URL('../' + entry.file, import.meta.url)));
    for (const key of ['title', 'topic', 'level']) assert.equal(entry[key], course.meta[key], `${entry.file}: ${key}`);
    const identity = course.meta.topic + '|' + course.meta.createdAt;
    assert.ok(!identities.has(identity)); identities.add(identity);
    if (course.meta.model !== 'Learnway authored starter') continue;
    starters.push(course);
    assert.equal(course.plan.sections.length, 3);
    assert.equal(course.quizzes.sections.flatMap(section => section.questions).length, 6);
    for (const section of [...course.reading.sections, ...course.slides.sections]) assert.ok(section.visual.trim());
    assert.ok(course.enrichment.turns.length >= 14);
    assert.ok(getFlashcards(course).length >= 9);
    assert.ok(course.sources.length);
    for (const source of course.sources) {
      assert.equal(new URL(source.url).protocol, 'https:');
      assert.ok(source.title.trim());
    }
    const guide = courseToMarkdown(course);
    for (const source of course.sources) assert.ok(guide.includes(source.url));
    for (const section of course.reading.sections) assert.ok(guide.includes(section.body));
    for (const q of course.quizzes.sections.flatMap(section => section.questions)) assert.ok(guide.includes(q.explain));
  }
  assert.equal(starters.length, 10);
  assert.ok(index.some(entry => entry.file === 'courses/hs-genetics.json'));
  assert.ok(index.some(entry => entry.file === 'courses/hs-simple-machines.json'));
});
