import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validateCourse } from '../pipeline.mjs';
import { renderView } from '../views.mjs';

const fixture = JSON.parse(await readFile(new URL('../sample-course.json', import.meta.url)));

test('sections with a visual element validate', () => {
  const course = JSON.parse(JSON.stringify(fixture));
  course.reading.sections[0].visual = 'Picture a crowded elevator: everyone facing the door is a spin aligned with the field.';
  course.slides.sections[0].visual = 'A compass needle swinging to north.';
  assert.deepEqual(validateCourse(course), []);
});

test('sections without a visual element still validate (older courses)', () => {
  assert.deepEqual(validateCourse(fixture), []);
  const html = renderView('reading', fixture);
  assert.ok(!html.includes('Picture this'), 'no visual card rendered when absent');
});

test('reading view renders the visual element as a "Picture this" card', () => {
  const course = JSON.parse(JSON.stringify(fixture));
  course.reading.sections[0].visual = 'Picture a crowded elevator.';
  const html = renderView('reading', course);
  assert.ok(html.includes('Picture this'), 'visual card present');
  assert.ok(html.includes('crowded elevator'), 'visual text rendered');
  assert.ok(html.includes('class="visual"'), 'visual class present');
});

test('slides view renders the visual cue when present', () => {
  const course = JSON.parse(JSON.stringify(fixture));
  course.slides.sections[0].visual = 'A compass needle swinging to north.';
  const html = renderView('slides', course);
  assert.ok(html.includes('Picture this'), 'visual cue present');
  assert.ok(html.includes('compass needle'), 'visual text rendered');
});

test('non-string visual fails validation', () => {
  const course = JSON.parse(JSON.stringify(fixture));
  course.reading.sections[0].visual = { text: 'not a string' };
  const problems = validateCourse(course);
  assert.ok(problems.some(p => p.includes('visual')), `expected a visual problem, got: ${problems.join('; ')}`);
});
