// Run against `node serve.mjs`. Gemini is intercepted; no real key or API usage.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { validateCourse } from '../pipeline.mjs';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const fixture = JSON.parse(await readFile(new URL('../sample-course.json', import.meta.url)));
const bundled = JSON.parse(await readFile(new URL('../courses/index.json', import.meta.url)));
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
const page = await context.newPage();
const errors = [];
page.on('pageerror', error => errors.push(error.message));
const replies = [];
let calls = 0;
await page.route('https://generativelanguage.googleapis.com/**', async route => {
  if (route.request().method() === 'OPTIONS') {
    await route.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': '*' } });
    return;
  }
  calls++;
  if (!replies.length) errors.push('Unexpected duplicate Gemini request');
  await route.fulfill({ json: { candidates: [{ content: { parts: [{ text: JSON.stringify(replies.shift() ?? {}) }] } }] } });
});

const library = () => page.getByRole('button', { name: 'Learnway', exact: true }).click();
const settings = () => page.getByRole('button', { name: 'Settings', exact: true }).click();
const storage = () => page.evaluate(() => localStorage.getItem('learnway:courses'));
const importText = async (text, name = 'course.json') => {
  const chooser = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Import course JSON', exact: true }).click();
  await (await chooser).setFiles({ name, mimeType: 'application/json', buffer: Buffer.from(text) });
};
const checkViews = async course => {
  assert.equal(await page.locator('h1').textContent(), course.meta.title);
  for (const [name, selector, count] of [
    ['Read', '.reading-sec', course.reading.sections.length],
    ['Quiz', '.quiz-sec', course.quizzes.sections.length],
    ['Slides', '.slide', course.slides.sections.length],
    ['Audio', '.turn', course.enrichment.turns.length],
    ['Mind map', '.mnode', course.enrichment.nodes.length],
  ]) {
    await page.getByRole('button', { name, exact: true }).click();
    assert.equal(await page.locator(selector).count(), count, name);
  }
  await page.getByRole('button', { name: 'Quiz', exact: true }).click();
  const first = page.locator('.quiz-q').first();
  await first.locator('.choice').nth(course.quizzes.sections[0].questions[0].answer).click();
  assert.equal(await first.locator('.choice.right').count(), 1);
  assert.equal(await first.locator('.quiz-explain').isVisible(), true);
  await page.getByRole('button', { name: 'Read', exact: true }).click();
};

try {
  await page.goto(process.env.LEARNWAY_URL || 'http://127.0.0.1:8130');
  await page.getByRole('button', { name: 'Try the sample course' }).click();
  await page.locator('h1').filter({ hasText: fixture.meta.title }).waitFor();
  await checkViews(fixture);
  for (const entry of bundled) {
    const course = JSON.parse(await readFile(new URL('../' + entry.file, import.meta.url)));
    await library();
    await page.getByRole('button').filter({ hasText: entry.title }).click();
    await page.locator('h1').filter({ hasText: course.meta.title }).waitFor();
    await checkViews(course);
  }
  console.log('PASS: sample and both bundled courses, five views and quiz interaction');

  await settings();
  await importText(JSON.stringify(fixture));
  await page.locator('h1').filter({ hasText: fixture.meta.title }).waitFor();
  const saved = await storage();
  assert.equal(JSON.parse(saved).length, 1);
  await settings();
  for (const mutate of [
    c => { delete c.plan; },
    c => { c.quizzes.sections[0].questions[0].choices = null; },
    c => { c.quizzes.sections[0].questions[0].answer = 99; },
    c => { c.reading.sections[0].id = 'missing'; },
    c => { c.enrichment.nodes[1].parent = c.enrichment.nodes[1].id; },
  ]) {
    const invalid = structuredClone(fixture);
    mutate(invalid);
    await importText(JSON.stringify(invalid));
    await page.locator('#set-err:not([hidden])').waitFor();
    assert.match(await page.locator('#set-err').textContent(), /Import failed:/);
    assert.equal(await storage(), saved, 'invalid import must preserve the saved library');
  }
  await importText('{truncated');
  await page.locator('#set-err:not([hidden])').waitFor();
  assert.equal(await storage(), saved);
  await page.reload();
  await page.getByRole('button').filter({ hasText: fixture.meta.title }).click();
  await checkViews(fixture);
  console.log('PASS: valid import/reload and invalid imports preserve the existing library');

  // Repeated rendering must not multiply delegated click handlers.
  for (let i = 0; i < 4; i++) { await settings(); await library(); }
  await settings();
  await page.getByLabel('Gemini API key').fill('browser-test-key');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await page.locator('#set-ok:not([hidden])').waitFor();
  await page.locator('.topbar').getByRole('button', { name: 'New course', exact: true }).click();
  await page.getByLabel('Topic', { exact: true }).fill('Desktop generation test');
  await page.getByLabel('Depth', { exact: true }).selectOption('quick');
  replies.push({ title: 'Incomplete plan' });
  await page.getByRole('button', { name: 'Sketch a plan', exact: true }).click();
  await page.locator('#wiz-err:not([hidden])').waitFor();
  assert.match(await page.locator('#wiz-err').textContent(), /plan.*incomplete/);
  assert.equal(calls, 1);

  const plan = { ...fixture.plan, title: 'Desktop generation test' };
  replies.push(plan);
  await page.getByRole('button', { name: 'Sketch a plan', exact: true }).click();
  await page.getByRole('heading', { name: plan.title, exact: true }).waitFor();
  assert.equal(calls, 2);
  replies.push({ sections: [] });
  await page.getByRole('button', { name: 'Looks good — write it' }).click();
  await page.locator('#wiz-err:not([hidden])').waitFor();
  assert.match(await page.locator('#wiz-err').textContent(), /reading.*incomplete/);
  assert.equal(calls, 3, 'invalid reading stops the remaining API calls');
  assert.equal(await storage(), saved);

  replies.push(fixture.reading, fixture.quizzes, fixture.slides, fixture.enrichment);
  await page.getByRole('button', { name: 'Looks good — write it' }).click();
  await page.locator('h1').filter({ hasText: plan.title }).waitFor();
  assert.equal(calls, 7, 'one valid plan plus four content calls, with two rejected attempts');
  const courses = JSON.parse(await storage());
  assert.equal(courses.length, 2);
  const generated = courses[0];
  assert.deepEqual(validateCourse(generated), []);
  await checkViews(generated);
  console.log('PASS: one request per action, invalid generation stops early, retry saves a complete course');

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export JSON', exact: true }).click();
  const download = await downloadPromise;
  const chunks = [];
  for await (const chunk of await download.createReadStream()) chunks.push(chunk);
  const exported = Buffer.concat(chunks).toString();
  assert.deepEqual(JSON.parse(exported), generated);
  await settings();
  await importText(exported, download.suggestedFilename());
  await page.locator('h1').filter({ hasText: plan.title }).waitFor();
  assert.equal(JSON.parse(await storage()).length, 2, 'reimport replaces the matching course');
  await page.reload();
  await page.getByRole('button').filter({ hasText: plan.title }).click();
  await checkViews(generated);
  // A legacy malformed record must not prevent opening intact saved courses.
  await page.evaluate(() => {
    const courses = JSON.parse(localStorage.getItem('learnway:courses'));
    courses.push(null, { meta: { title: { toString: 'broken' }, topic: { toString: 'broken' } } });
    localStorage.setItem('learnway:courses', JSON.stringify(courses));
  });
  const legacyLibrary = await storage();
  await page.reload();
  assert.equal(await page.getByText('This saved course is incomplete and cannot be opened. Import a complete copy.', { exact: true }).count(), 2);
  assert.equal(await storage(), legacyLibrary, 'unreadable saved records must not be deleted');
  await page.getByRole('button').filter({ hasText: plan.title }).click();
  await checkViews(generated);
  assert.deepEqual(errors, [], 'browser must have no uncaught errors or duplicate requests');
  if (process.env.LEARNWAY_SCREENSHOT) await page.screenshot({ path: process.env.LEARNWAY_SCREENSHOT, fullPage: true });
  console.log('PASS: export/reimport/reload, no uncaught browser errors');
} finally {
  await context.close();
  await browser.close();
}
