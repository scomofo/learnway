// Real desktop controls, deterministic seeking and every included SVG layout.
// Run against serve.mjs; no Gemini requests or saved-user state are needed.
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const browser = await chromium.launch({ headless: true, ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : {}) });
const context = await browser.newContext({ viewport: { width: 1440, height: 1100 }, reducedMotion: 'reduce' });
const page = await context.newPage();
const errors = [], layouts = [];
page.on('pageerror', error => errors.push(error.message));
await page.route('https://generativelanguage.googleapis.com/**', () => { throw new Error('Included illustrations must not use an API'); });
const index = JSON.parse(await readFile(new URL('../courses/index.json', import.meta.url)));
const output = process.env.LEARNWAY_VISUAL_OUTPUT;
if (output) await mkdir(output, { recursive: true });
const openCourse = title => page.locator('.lib-card').filter({ hasText: title }).getByRole('button', { name: 'Open course', exact: true }).click();
const library = () => page.locator('.brand').click();
try {
  await page.goto(process.env.LEARNWAY_URL || 'http://127.0.0.1:8130');
  for (const entry of index) {
    await openCourse(entry.title);
    await page.locator('h1').filter({ hasText: entry.title }).waitFor();
    const course = JSON.parse(await readFile(new URL('../'+entry.file, import.meta.url)));
    assert.equal(await page.locator('[data-diagram]').count(), course.reading.sections.length);
    for (let i=0;i<course.reading.sections.length;i++) {
      const figure=page.locator('[data-diagram]').nth(i), svg=figure.locator('svg');
      await figure.scrollIntoViewIfNeeded();
      const layout=await svg.evaluate(svg => {
        const vb=svg.viewBox.baseVal, boxes=[...svg.querySelectorAll('text')].map(el=>{
          const b=el.getBBox();return {text:el.textContent,x:b.x,y:b.y,w:b.width,h:b.height};
        });
        const outside=boxes.filter(b=>b.x<0||b.y<0||b.x+b.w>vb.width||b.y+b.h>vb.height);
        const overlap=[];
        for(let j=0;j<boxes.length;j++)for(let k=j+1;k<boxes.length;k++){
          const a=boxes[j],b=boxes[k];
          if(Math.min(a.x+a.w,b.x+b.w)-Math.max(a.x,b.x)>2 && Math.min(a.y+a.h,b.y+b.h)-Math.max(a.y,b.y)>2)overlap.push([a.text,b.text]);
        }
        return {outside,overlap};
      });
      layouts.push({course:entry.title,section:course.reading.sections[i].id,...layout});
      if(output)await figure.screenshot({path:join(output,entry.file.split('/').pop().replace('.json','')+'-'+course.reading.sections[i].id+'.png')});
    }
    await page.getByRole('button',{name:'Slides',exact:true}).click();
    assert.equal(await page.locator('[data-diagram]').count(),course.reading.sections.length);
    await page.getByRole('button',{name:'Read',exact:true}).click();
    await library();
  }
  assert.deepEqual(layouts.filter(item=>item.outside.length||item.overlap.length),[], 'every illustration label must fit without overlapping another label');
  await openCourse('How Engines Work: Fuel');
  const first=page.locator('[data-diagram]').first(),second=page.locator('[data-diagram]').nth(1);
  await first.scrollIntoViewIfNeeded();
  assert.match(await first.locator('[data-diagram-status]').textContent(),/reduced motion/);
  const initial=await first.locator('.lw-engine-piston').first().getAttribute('y');
  const slider=first.getByRole('slider',{name:'Animation progress'});
  await slider.press('End');
  assert.equal(await slider.inputValue(),'100');
  assert.notEqual(await first.locator('.lw-engine-piston').first().getAttribute('y'),initial);
  assert.equal(await second.getAttribute('data-progress'),'0','seeking one figure must not affect another');
  await first.getByRole('button',{name:'Replay',exact:true}).click();
  await page.waitForFunction(()=>Number(document.querySelector('[data-diagram]').dataset.progress)>5);
  await first.getByRole('button',{name:'Pause',exact:true}).click();
  const frozen=await slider.inputValue();
  await page.waitForTimeout(150);
  assert.equal(await slider.inputValue(),frozen,'pause holds exact progress');
  await first.getByRole('button',{name:'Enlarge illustration'}).click();
  const modal=page.getByRole('dialog',{name:'Enlarged illustration'});
  assert.equal(await modal.isVisible(),true);
  assert.equal(await modal.locator('[data-diagram]').count(),1,'focus view reuses the player');
  await page.getByRole('button',{name:'Close illustration'}).press('Escape');
  await page.locator('dialog').waitFor({state:'detached'});
  assert.equal(await page.locator('dialog').count(),0);
  assert.equal(await first.locator('[data-diagram-expand]').evaluate(el=>document.activeElement===el),true,'Escape restores keyboard focus');
  await first.getByRole('button',{name:'Play',exact:true}).click();
  await second.scrollIntoViewIfNeeded();
  await page.waitForTimeout(100);
  const offscreen=await first.getAttribute('data-progress');
  await page.waitForTimeout(150);
  assert.equal(await first.getAttribute('data-progress'),offscreen,'offscreen players freeze');
  await library();
  await openCourse('How Engines Work: Fuel');
  assert.equal(await first.getAttribute('data-progress'),'0','navigation disposes the old clock');
  // Validate what the motion teaches, beyond merely checking a moving control.
  await library();
  await openCourse('Intro to Rocket Science: Push');
  const orbit=page.locator('[data-diagram]').nth(2);
  await orbit.scrollIntoViewIfNeeded();
  await orbit.getByRole('slider',{name:'Animation progress'}).press('Home');
  for(let i=0;i<25;i++)await orbit.getByRole('slider',{name:'Animation progress'}).press('ArrowRight');
  const orbital=await orbit.locator('.lw-orbit').evaluate(el=>{
    const m=new DOMMatrix(getComputedStyle(el).transform);
    return {x:m.a,y:m.b};
  });
  assert.ok(Math.abs(orbital.x)<.01&&Math.abs(orbital.y-1)<.01,'one quarter orbit rotates the satellite and its vectors together by 90 degrees');
  await library();
  await openCourse('Sound & Music: Waves');
  const sound=page.locator('[data-diagram]').first();
  await sound.scrollIntoViewIfNeeded();
  const particle=sound.locator('.lw-air').nth(45);
  const position=()=>particle.evaluate(el=>({base:el.querySelector('circle').getAttribute('cx'),shift:new DOMMatrix(getComputedStyle(el).transform).e}));
  const a=await position();
  await sound.getByRole('slider',{name:'Animation progress'}).press('End');
  const b=await position();
  assert.equal(a.base,b.base,'particle equilibrium position does not move with the wave');
  assert.ok(Math.abs(a.shift)<=15&&Math.abs(b.shift)<=15,'local particle excursion stays bounded');
  await library();
  await openCourse('How Engines Work: Fuel');
  await page.getByRole('button',{name:'Flashcards',exact:true}).click();
  const visualIndex=courseVisualIndex(JSON.parse(await readFile(new URL('../courses/how-engines-work.json',import.meta.url))));
  for(let i=0;i<visualIndex;i++)await page.getByRole('button',{name:'Next →',exact:true}).click();
  await page.locator('#fc-card').press('Enter');
  assert.equal(await page.locator('.fc-diagram svg').count(),1);
  assert.equal(await page.locator('#fc-card button, #fc-card input').count(),0,'no nested player controls inside the flip button');
  assert.equal(await page.locator('.fc-diagram').evaluate(el=>el.getAnimations({subtree:true}).length),0,'flashcard art stays static');
  assert.equal(await page.locator('.fc-diagram .diagram-caption').isVisible(),true,'visual cards retain their explanation');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  assert.deepEqual(errors,[]);
  console.log(`PASS: ${layouts.length} illustrations in Read/Slides; no clipped or overlapping labels; keyboard seek, independent players, pause/replay, reduced motion, offscreen freeze, focus dialog and static flashcards`);
} finally {
  if(output)await writeFile(join(output,'layout-verdict.json'),JSON.stringify({layouts,errors},null,2));
  await browser.close();
}
function courseVisualIndex(course){return course.reading.sections[0].questions.length;}
