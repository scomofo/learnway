import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { getFlashcards, courseToMarkdown, renderView } from '../views.mjs';

const fixture = JSON.parse(await readFile(new URL('../sample-course.json', import.meta.url)));

test('getFlashcards extracts questions, mnemonics, and mind map nodes', () => {
  const cards = getFlashcards(fixture);
  assert.ok(cards.length > 0, 'Flashcards should be generated');
  const categories = new Set(cards.map(c => c.category));
  assert.ok(categories.has('Mnemonic'), 'Should contain Mnemonic card');
  assert.ok(categories.has('Concept'), 'Should contain Concept card');

  const sampleCard = cards[0];
  assert.ok(typeof sampleCard.front === 'string');
  assert.ok(typeof sampleCard.back === 'string');
});

test('courseToMarkdown generates clean Markdown summary', () => {
  const md = courseToMarkdown(fixture);
  assert.ok(md.includes(`# ${fixture.meta.title}`));
  assert.ok(md.includes('## Course Content'));
  assert.ok(md.includes('## Practice Quizzes'));
  assert.ok(md.includes('## Lecture Slides'));
  assert.ok(md.includes('## Audio Dialogue'));
});

test('renderView renders reading view with notes map', () => {
  const notesMap = { s1: 'Remember to revise transistor equations' };
  const html = renderView('reading', fixture, { notesMap });
  assert.ok(html.includes('My Study Notes'));
  assert.ok(html.includes('Remember to revise transistor equations'));
});
