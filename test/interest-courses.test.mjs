import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validateCourse, sanitizeDiagram } from '../pipeline.mjs';
import { courseToMarkdown, getFlashcards, renderView } from '../views.mjs';

const names = ['precision-agriculture-rtk', 'music-theory-songwriting', 'hybrid-electric-vehicles', 'life-death-stars', 'ai-agents-workflows'];
const catalog = JSON.parse(await readFile(new URL('../courses/index.json', import.meta.url)));
const courses = new Map(await Promise.all(names.map(async name => [name, JSON.parse(await readFile(new URL(`../courses/${name}.json`, import.meta.url)))])));

for (const [name, course] of courses) {
  test(`${name}: catalog entry opens a complete course in every study representation and export`, () => {
    const entries = catalog.filter(entry => entry.file === `courses/${name}.json`);
    assert.equal(entries.length, 1, 'exactly one discoverable catalog entry');
    for (const key of ['title', 'topic', 'level']) assert.equal(entries[0][key], course.meta[key]);
    assert.deepEqual(validateCourse(course), []);
    assert.equal(course.plan.sections.length, 6);
    const guide = courseToMarkdown(course);
    for (const section of course.reading.sections) {
      assert.equal(section.questions.length, 2, 'two answerable reading check-ins');
      assert.equal(sanitizeDiagram(section.diagram), section.diagram, 'complete figure survives the actual render boundary');
      assert.ok(guide.includes(section.diagram), 'export retains the figure');
      assert.ok(guide.includes(section.body), 'export retains the explanation and exercise');
      assert.ok(section.visual.length > 0, 'a caption explains what the drawing means');
    }
    for (const section of course.quizzes.sections) {
      assert.equal(section.questions.length, 3);
      for (const q of section.questions) {
        assert.equal(new Set(q.choices).size, 4, 'distinct distractors');
        assert.ok(guide.includes(q.explain), 'export includes feedback, not just answer indices');
      }
    }
    for (const view of ['reading', 'quiz', 'slides', 'audio', 'mindmap', 'flashcards']) {
      const rendered = renderView(view, course);
      assert.ok(rendered.length > 100, `${view} has usable content`);
      assert.doesNotMatch(rendered, /undefined|\[object Object\]/, `${view} has no unbound content`);
    }
    const visualCards = getFlashcards(course).filter(card => card.category === 'Visual');
    assert.equal(visualCards.length, 6);
    for (const card of visualCards) assert.match(card.backHtml, /<svg/);
    assert.ok(course.sources.length >= 3);
    for (const source of course.sources) {
      assert.equal(new URL(source.url).protocol, 'https:');
      assert.ok(guide.includes(source.url));
    }
  });
}

function answerContaining(name, fragment) {
  const q = courses.get(name).quizzes.sections.flatMap(s => s.questions).find(q => q.q.includes(fragment));
  assert.ok(q, `missing worked-example question: ${fragment}`);
  return q.choices[q.answer];
}

test('worked answers retain the physical units and independently calculated quantities', () => {
  const distance = (9 / 3.6) * 0.4;
  assert.equal(answerContaining('precision-agriculture-rtk', 'At 9 km/h'), `${distance.toFixed(1)} m`);
  assert.equal(answerContaining('precision-agriculture-rtk', '12 m active width'), `${12 * distance} m²`);
  const kineticKWh = 0.5 * 1800 * (50 / 3.6) ** 2 / 3_600_000;
  assert.equal(answerContaining('hybrid-electric-vehicles', 'kinetic energy of a 1,800'), `${kineticKWh.toFixed(3)} kWh`);
  assert.equal(answerContaining('hybrid-electric-vehicles', '20 kW average load runs'), `${20 * 30 / 60} kWh`);
  assert.equal(answerContaining('life-death-stars', 'twice the fuel and ten times'), String(2 / 10));
  assert.equal(answerContaining('ai-agents-workflows', 'Twenty requests yield'), `${(16 - 2) / 20 * 100}%`);
});

test('the original eight-bar melody counts every note and rest into complete 4/4 bars', () => {
  const body = courses.get('music-theory-songwriting').reading.sections.find(s => s.id === 'song-capstone').body;
  const bars = [...body.matchAll(/^- Bar (\d): (.+)\.$/gm)];
  assert.equal(bars.length, 8);
  const values = { quarter: 1, half: 2, 'dotted half': 3 };
  for (const [i, bar] of bars.entries()) {
    assert.equal(Number(bar[1]), i + 1);
    const durations = [...bar[2].matchAll(/(?:[A-G][#b]?\d\s+)?(dotted half|quarter|half)(?: rest)?/g)];
    assert.ok(durations.length);
    assert.equal(durations.reduce((sum, duration) => sum + values[duration[1]], 0), 4, `bar ${bar[1]} includes its rests`);
  }
});
