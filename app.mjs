// Learnway app shell: library, generation wizard, settings, view switching.
'use strict';
import { DEFAULT_MODEL, MODELS, LEVELS, DEPTHS, generatePlan, generateCourse, validateCourse, PipelineError } from './pipeline.mjs';
import { VIEWS, renderView, wireView, esc } from './views.mjs';

const LS = { key: 'learnway:key', model: 'learnway:model', courses: 'learnway:courses' };
const $ = sel => document.querySelector(sel);

const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  // Throws if the write fails or doesn't stick, so the UI can say so
  // instead of showing a fake "Saved."
  set(k, v) {
    const raw = JSON.stringify(v);
    localStorage.setItem(k, raw);
    if (localStorage.getItem(k) !== raw) throw new Error('storage write did not stick');
  },
};

let state = {
  screen: 'library',       // library | wizard | course | settings
  course: null,            // loaded course object
  view: 'reading',
  draft: null,             // approved plan awaiting generation
  generating: false,
};

/* ---------------- library ---------------- */

function getCourses() { return store.get(LS.courses, []); }
function saveCourses(list) { store.set(LS.courses, list); }

function upsertCourse(course) {
  const list = getCourses();
  const key = course.meta.topic + '|' + course.meta.createdAt;
  const i = list.findIndex(c => (c.meta.topic + '|' + c.meta.createdAt) === key);
  if (i >= 0) list[i] = course; else list.unshift(course);
  saveCourses(list.slice(0, 50));
}

/* ---------------- rendering ---------------- */

function render() {
  const app = $('#app');
  if (state.screen === 'library') app.innerHTML = viewLibrary();
  else if (state.screen === 'wizard') app.innerHTML = viewWizard();
  else if (state.screen === 'course') app.innerHTML = viewCourse();
  else if (state.screen === 'settings') app.innerHTML = viewSettings();
  wire(app);
  window.scrollTo(0, 0);
}

function header(active) {
  return `<header class="topbar">
    <button class="brand" data-nav="library">Learnway</button>
    <nav>
      <button data-nav="wizard" class="${active === 'wizard' ? 'active' : ''}">New course</button>
      <button data-nav="settings" class="${active === 'settings' ? 'active' : ''}">Settings</button>
    </nav>
  </header>`;
}

function viewLibrary() {
  const courses = getCourses();
  const cards = courses.map((c, i) => `
    <button class="lib-card" data-open="${i}">
      <div class="lib-title">${esc(c.meta.title)}</div>
      <div class="lib-meta">${esc(c.meta.topic)} · ${esc(levelLabel(c.meta.level))} · ${new Date(c.meta.createdAt).toLocaleDateString()}</div>
    </button>`).join('');
  const bundledCards = (state.bundled || []).map((b, i) => `
    <button class="lib-card bundled" data-bundled="${i}">
      <div class="lib-title">${esc(b.title)}</div>
      <div class="lib-meta">${esc(b.topic)} · included course</div>
    </button>`).join('');
  return `${header('library')}
  <main class="wrap">
    <div class="hero">
      <h1>Courses on whatever catches your interest.</h1>
      <p class="muted">Type a topic. Get a reading, quizzes, slides, an audio dialogue, and a mind map — all tuned to your level and interests.</p>
      <div class="hero-actions">
        <button class="btn primary" data-nav="wizard">New course</button>
        <button class="btn ghost" data-sample>Try the sample course</button>
      </div>
    </div>
    ${bundledCards ? `<h2>Included courses</h2><div class="lib-grid">${bundledCards}</div>` : ''}
    ${courses.length ? `<h2>Your courses</h2><div class="lib-grid">${cards}</div>` : (bundledCards ? '' : `
      <div class="empty">No courses yet. ${store.get(LS.key, '') ? 'Make your first one.' : 'Add your Gemini API key in Settings first — it takes a minute.'}</div>`)}
  </main>`;
}

function levelLabel(id) { return (LEVELS.find(l => l.id === id) || {}).label || id; }

function viewWizard() {
  const key = store.get(LS.key, '');
  if (!key) return `${header('wizard')}<main class="wrap"><div class="card"><h2>One thing first</h2>
    <p class="muted">Learnway calls the Gemini API from your browser. Paste a key from <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener">Google AI Studio</a> (free tier works) in Settings, then come back.</p>
    <button class="btn primary" data-nav="settings">Open Settings</button></div></main>`;
  const d = state.draft;
  if (d) return viewPlanApproval(d);
  return `${header('wizard')}
  <main class="wrap narrow">
    <h2>New course</h2>
    <div class="card form">
      <label>Topic
        <input id="f-topic" placeholder="e.g. How GPS satellites keep time, The fall of the Bronze Age, Sourdough fermentation" autocomplete="off">
      </label>
      <label>Your level
        <select id="f-level">${LEVELS.map(l => `<option value="${l.id}">${l.label} — ${l.hint}</option>`).join('')}</select>
      </label>
      <label>Your interests <span class="muted">(analogies will be drawn from these)</span>
        <input id="f-interests" placeholder="e.g. synthesizers, spaceflight history, hockey, cooking" autocomplete="off">
      </label>
      <label>Depth
        <select id="f-depth">${DEPTHS.map(x => `<option value="${x.id}">${x.label} — ${x.hint}</option>`).join('')}</select>
      </label>
      <div class="form-actions">
        <button class="btn primary" data-action="plan">Sketch a plan</button>
      </div>
      <p class="muted small">First you'll approve a short plan — then the full course gets written (4 generation steps).</p>
      <div class="err" id="wiz-err" hidden></div>
    </div>
  </main>`;
}

function viewPlanApproval(d) {
  const p = d.plan;
  return `${header('wizard')}
  <main class="wrap narrow">
    <h2>${esc(p.title)}</h2>
    <p class="hook">${esc(p.hook)}</p>
    <div class="card">
      <div class="sec-kicker">You'll be able to</div>
      <ul class="tight">${p.objectives.map(o => `<li>${esc(o)}</li>`).join('')}</ul>
      ${p.prerequisites.length ? `<div class="sec-kicker">Assumes</div><ul class="tight">${p.prerequisites.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}
    </div>
    ${p.sections.map((s, i) => `
      <div class="card"><div class="sec-kicker">Section ${i + 1}</div><h3>${esc(s.heading)}</h3>
      <ul class="tight">${s.points.map(pt => `<li>${esc(pt)}</li>`).join('')}</ul></div>`).join('')}
    <div class="form-actions sticky">
      <button class="btn primary" data-action="generate">Looks good — write it</button>
      <button class="btn ghost" data-action="replan">Redraft plan</button>
    </div>
    <div class="progress" id="gen-progress" hidden><div class="bar"></div><div class="msg">Starting…</div></div>
    <div class="err" id="wiz-err" hidden></div>
  </main>`;
}

function viewCourse() {
  const c = state.course;
  if (!c) return viewLibrary();
  const tabs = VIEWS.map(v => `<button class="tab ${state.view === v.id ? 'active' : ''}" data-view="${v.id}">${v.label}</button>`).join('');
  return `${header('course')}
  <main class="wrap">
    <div class="course-head">
      <button class="btn ghost small" data-nav="library">← Library</button>
      <h1>${esc(c.meta.title)}</h1>
      <p class="muted">${esc(c.meta.topic)} · ${esc(levelLabel(c.meta.level))} · ${c.meta.interests ? esc(c.meta.interests) : 'no interests given'} · ${esc(c.meta.model)}</p>
      <div class="course-actions">
        <button class="btn ghost small" data-action="export">Export JSON</button>
        ${state.course.bundled ? '' : '<button class="btn ghost small danger" data-action="delete">Delete</button>'}
      </div>
    </div>
    <div class="objectives card"><div class="sec-kicker">By the end</div>
      <ul class="tight">${c.plan.objectives.map(o => `<li>${esc(o)}</li>`).join('')}</ul></div>
    <div class="tabs">${tabs}</div>
    <div id="view-root">${renderView(state.view, c)}</div>
  </main>`;
}

function viewSettings() {
  const key = store.get(LS.key, '');
  const model = store.get(LS.model, DEFAULT_MODEL);
  return `${header('settings')}
  <main class="wrap narrow">
    <h2>Settings</h2>
    <div class="card form">
      <label>Gemini API key
        <input id="s-key" type="password" value="${esc(key)}" placeholder="AIza…" autocomplete="off">
      </label>
      <p class="muted small">Get one free at <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener">Google AI Studio</a>. Stored only in this browser's localStorage — never sent anywhere but Google's API.</p>
      <p class="muted small">Keys are kept per address — you're at ${esc(location.origin)}, so always open Learnway here. A private window or a browser that clears site data on exit will forget the key.</p>
      <label>Model
        <select id="s-model">${MODELS.map(m => `<option ${m === model ? 'selected' : ''}>${m}</option>`).join('')}</select>
      </label>
      <div class="form-actions">
        <button class="btn primary" data-action="save-settings">Save</button>
        <button class="btn ghost" data-action="import">Import course JSON</button>
        <input type="file" id="import-file" accept=".json,application/json" hidden>
      </div>
      <div class="err" id="set-err" hidden></div>
      <div class="ok" id="set-ok" hidden>Saved.</div>
    </div>
  </main>`;
}

/* ---------------- events ---------------- */

function showErr(id, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = msg;
  el.hidden = false;
}

function wire(root) {
  root.addEventListener('click', async e => {
    const nav = e.target.closest('[data-nav]');
    if (nav) { state.screen = nav.dataset.nav; state.draft = null; render(); return; }

    const view = e.target.closest('[data-view]');
    if (view) {
      state.view = view.dataset.view;
      render();
      return;
    }

    const open = e.target.closest('[data-open]');
    if (open) {
      state.course = getCourses()[Number(open.dataset.open)];
      state.view = 'reading';
      state.screen = 'course';
      render();
      return;
    }

    const bundled = e.target.closest('[data-bundled]');
    if (bundled) {
      const entry = (state.bundled || [])[Number(bundled.dataset.bundled)];
      try {
        const res = await fetch(entry.file);
        const course = await res.json();
        const problems = validateCourse(course);
        if (problems.length) throw new Error(problems.join('; '));
        course.bundled = true;
        state.course = course; state.view = 'reading'; state.screen = 'course';
        render();
      } catch {
        alert('Could not load the included course.');
      }
      return;
    }

    if (e.target.closest('[data-sample]')) {
      try {
        const res = await fetch('sample-course.json');
        const course = await res.json();
        const problems = validateCourse(course);
        if (problems.length) throw new Error(problems.join('; '));
        state.course = course; state.view = 'reading'; state.screen = 'course';
      } catch {
        showErr('wiz-err', 'Sample course failed to load.');
        return;
      }
      render();
      return;
    }

    const action = e.target.closest('[data-action]');
    if (!action) return;
    const a = action.dataset.action;

    if (a === 'plan') {
      const topic = $('#f-topic').value.trim();
      if (!topic) { showErr('wiz-err', 'Give me a topic first.'); return; }
      action.disabled = true; action.textContent = 'Sketching…';
      try {
        state.draft = await generatePlan({
          apiKey: store.get(LS.key, ''),
          model: store.get(LS.model, DEFAULT_MODEL),
          topic,
          level: $('#f-level').value,
          interests: $('#f-interests').value.trim(),
          depth: $('#f-depth').value,
        });
        render();
      } catch (err) {
        action.disabled = false; action.textContent = 'Sketch a plan';
        showErr('wiz-err', err instanceof PipelineError ? err.message : String(err));
      }
      return;
    }

    if (a === 'replan') { state.draft = null; render(); return; }

    if (a === 'generate') {
      if (state.generating) return;
      state.generating = true;
      const prog = $('#gen-progress');
      prog.hidden = false;
      const msg = prog.querySelector('.msg');
      const setMsg = t => { msg.textContent = t; };
      action.disabled = true;
      try {
        const course = await generateCourse(state.draft, {
          apiKey: store.get(LS.key, ''),
          model: store.get(LS.model, DEFAULT_MODEL),
        }, setMsg);
        const problems = validateCourse(course);
        if (problems.length) throw new Error('Course failed validation: ' + problems.join('; '));
        upsertCourse(course);
        state.course = course; state.view = 'reading'; state.screen = 'course'; state.draft = null;
        render();
      } catch (err) {
        showErr('wiz-err', err instanceof PipelineError ? err.message : String(err));
        action.disabled = false;
      } finally {
        state.generating = false;
      }
      return;
    }

    if (a === 'save-settings') {
      $('#set-ok').hidden = true;
      try {
        store.set(LS.key, $('#s-key').value.trim());
        store.set(LS.model, $('#s-model').value);
        $('#set-ok').hidden = false;
        $('#set-err').hidden = true;
      } catch {
        showErr('set-err', 'Could not save — this browser is blocking site storage. Check privacy settings, or use a normal (non-private) window.');
      }
      return;
    }

    if (a === 'export' && state.course) {
      const blob = new Blob([JSON.stringify(state.course, null, 2)], { type: 'application/json' });
      const aEl = document.createElement('a');
      aEl.href = URL.createObjectURL(blob);
      aEl.download = state.course.meta.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase() + '.json';
      aEl.click();
      URL.revokeObjectURL(aEl.href);
      return;
    }

    if (a === 'delete' && state.course) {
      if (!confirm('Delete this course?')) return;
      const key = state.course.meta.topic + '|' + state.course.meta.createdAt;
      saveCourses(getCourses().filter(c => (c.meta.topic + '|' + c.meta.createdAt) !== key));
      state.course = null; state.screen = 'library';
      render();
      return;
    }

    if (a === 'import') { $('#import-file').click(); return; }
  });

  root.addEventListener('change', async e => {
    if (e.target.id === 'import-file' && e.target.files[0]) {
      try {
        const course = JSON.parse(await e.target.files[0].text());
        const problems = validateCourse(course);
        if (problems.length) throw new Error(problems.join('; '));
        upsertCourse(course);
        state.course = course; state.view = 'reading'; state.screen = 'course';
        render();
      } catch (err) {
        showErr('set-err', 'Import failed: ' + err.message);
      }
    }
  });

  // View-specific interactivity (quiz answering, audio playback).
  const viewRoot = root.querySelector('#view-root');
  if (viewRoot && state.screen === 'course') wireView(state.view, viewRoot, state.course);
}

async function boot() {
  try {
    const res = await fetch('courses/index.json');
    if (res.ok) state.bundled = await res.json();
  } catch { /* no bundled courses — fine */ }
  render();
}

document.addEventListener('DOMContentLoaded', boot);
