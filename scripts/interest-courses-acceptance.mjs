// Run against serve.mjs. Authored lessons require no Gemini key or live tools.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { courseToMarkdown } from '../views.mjs';

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const catalog = JSON.parse(await readFile(new URL('../courses/index.json', import.meta.url)));
const names = new Set(['precision-agriculture-rtk', 'music-theory-songwriting', 'hybrid-electric-vehicles', 'life-death-stars', 'ai-agents-workflows']);
const entries = catalog.filter(entry => names.has(entry.file.split('/').pop().replace('.json', '')));
assert.equal(entries.length, 5);
const browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {}) });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
const page = await context.newPage();
const errors = [];
page.on('pageerror', error => errors.push(error.message));
let apiRequests = 0;
await page.route('https://generativelanguage.googleapis.com/**', async route => { apiRequests++; await route.abort(); });

try {
  await page.goto(process.env.LEARNWAY_URL || 'http://127.0.0.1:8130');
  let checkins = 0, questions = 0;
  for (const entry of entries) {
    const course = JSON.parse(await readFile(new URL('../' + entry.file, import.meta.url)));
    await page.getByRole('searchbox', { name: 'Search courses' }).fill(entry.title);
    const card = page.locator('.lib-card').filter({ hasText: entry.title });
    assert.equal(await card.count(), 1, 'full-title search discovers one course');
    await card.getByRole('button', { name: 'Open course', exact: true }).click();
    await page.locator('h1').filter({ hasText: entry.title }).waitFor();
    const overflow = await page.locator('[data-diagram] svg').evaluateAll(svgs => svgs.flatMap((svg, section) =>
      [...svg.querySelectorAll('rect')].filter(r => Number(r.getAttribute('height')) >= 70 && r.getAttribute('fill') === 'none').flatMap(r => {
        const x = Number(r.getAttribute('x')), y = Number(r.getAttribute('y')), w = Number(r.getAttribute('width')), h = Number(r.getAttribute('height'));
        return [...svg.querySelectorAll('text')].flatMap(t => {
          const b = t.getBBox();
          return b.x >= x && b.y >= y && b.y + b.height <= y + h && b.x < x + w && b.x + b.width > x + w - 4 ? [{ section, text: t.textContent }] : [];
        });
      })));
    assert.deepEqual(overflow, [], 'diagram panel labels remain inside their own panels');
    const staticFigure = page.locator('[data-diagram]').first();
    await staticFigure.focus();
    await staticFigure.press('ArrowRight');
    assert.equal(await staticFigure.getAttribute('data-progress'), '0', 'static figures do not consume playback shortcuts');
    await staticFigure.getByRole('button', { name: 'Enlarge illustration' }).press('Space');
    const dialog = page.getByRole('dialog', { name: 'Enlarged illustration' });
    await dialog.waitFor();
    await page.getByRole('button', { name: 'Close illustration' }).click();
    const allChecks = course.reading.sections.flatMap(s => s.questions);
    assert.equal(await page.locator('details.checkin').count(), allChecks.length);
    for (const [i, q] of allChecks.entries()) {
      const check = page.locator('details.checkin').nth(i);
      await check.locator('summary').click();
      assert.ok((await check.innerText()).includes(q.hint));
      assert.ok((await check.innerText()).includes(q.answer));
      checkins++;
    }
    await page.getByRole('button', { name: 'Quiz', exact: true }).click();
    const allQuestions = course.quizzes.sections.flatMap(s => s.questions);
    for (const [i, q] of allQuestions.entries()) {
      const question = page.locator('.quiz-q').nth(i);
      await question.locator('.choice').nth(q.answer).click();
      assert.equal(await question.locator('.choice.right').count(), 1);
      assert.ok((await question.locator('.quiz-explain').innerText()).includes(q.explain));
      questions++;
    }
    assert.equal(await page.locator('[data-score]').textContent(), `${allQuestions.length} / ${allQuestions.length}`);

    // Reopening Quiz starts a new attempt; wrong answers still reveal the right
    // choice and explanation, without incrementing the correct-answer count.
    await page.getByRole('button', { name: 'Read', exact: true }).click();
    await page.getByRole('button', { name: 'Quiz', exact: true }).click();
    const first = page.locator('.quiz-q').first();
    await first.locator('.choice').nth((allQuestions[0].answer + 1) % 4).click();
    assert.equal(await page.locator('[data-score]').textContent(), '0 / 1');
    assert.equal(await first.locator('.choice.right').count(), 1);
    assert.equal(await first.locator('.quiz-explain').isVisible(), true);

    await page.getByRole('button', { name: 'Export Markdown', exact: true }).click({ trial: true });
    const downloadEvent = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Export Markdown', exact: true }).click();
    const chunks = [];
    for await (const chunk of await (await downloadEvent).createReadStream()) chunks.push(chunk);
    assert.equal(Buffer.concat(chunks).toString(), courseToMarkdown(course));
    await page.locator('.brand').click();
    await page.getByRole('searchbox', { name: 'Search courses' }).fill('');
  }
  assert.equal(checkins, 60);
  assert.equal(questions, 90);
  assert.equal(apiRequests, 0);
  assert.deepEqual(errors, []);
  console.log(`PASS: five authored courses discovered by search; ${checkins} reading reveals; ${questions} correct quiz answers; five wrong-answer/retry paths; five complete Markdown downloads; no API requests or page errors`);
} finally {
  await browser.close();
}
