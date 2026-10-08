// Learnway views: the five Learn-Your-Way representations rendered from course JSON.
// renderView(name, course) -> HTML string. wireView(name, root) attaches interactivity.
'use strict';

export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/** Minimal markdown: headings, bold, italic, inline code, lists, paragraphs. */
export function md(src) {
  const lines = String(src ?? '').split('\n');
  let html = '', inList = false;
  const inline = t => esc(t)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>');
  for (const raw of lines) {
    const line = raw.trim();
    if (/^#{1,3}\s/.test(line)) {
      if (inList) { html += '</ul>'; inList = false; }
      const lvl = line.match(/^#+/)[0].length;
      html += `<h${lvl + 2}>${inline(line.replace(/^#+\s*/, ''))}</h${lvl + 2}>`;
    } else if (/^[-*]\s+/.test(line)) {
      if (!inList) { html += '<ul>'; inList = true; }
      html += `<li>${inline(line.replace(/^[-*]\s+/, ''))}</li>`;
    } else if (/^\d+\.\s+/.test(line)) {
      if (!inList) { html += '<ul>'; inList = true; }
      html += `<li>${inline(line.replace(/^\d+\.\s+/, ''))}</li>`;
    } else if (line === '') {
      if (inList) { html += '</ul>'; inList = false; }
    } else {
      if (inList) { html += '</ul>'; inList = false; }
      html += `<p>${inline(line)}</p>`;
    }
  }
  if (inList) html += '</ul>';
  return html;
}

function sectionHead(n, heading, kicker) {
  return `<div class="sec-head"><span class="sec-num">${n}</span><div><div class="sec-kicker">${esc(kicker)}</div><h3>${esc(heading)}</h3></div></div>`;
}

/* ---------------- Reading ---------------- */

export function renderReading(course) {
  const secs = course.reading.sections.map((s, i) => `
    <section class="card reading-sec" data-sec="${esc(s.id)}">
      ${sectionHead(i + 1, s.heading, 'Reading')}
      <div class="prose">${md(s.body)}</div>
      ${s.visual ? `<figure class="visual">
        <div class="visual-title">Picture this</div>
        <div class="visual-body">${md(s.visual)}</div>
      </figure>` : ''}
      ${s.questions?.length ? `<div class="checkins">
        <div class="checkins-title">Check yourself</div>
        ${s.questions.map((q, qi) => `
          <details class="checkin">
            <summary><span class="q-badge">Q${qi + 1}</span> ${esc(q.q)}</summary>
            <div class="checkin-body">
              <p class="hint"><span class="tag">Hint</span> ${esc(q.hint)}</p>
              <p><span class="tag good">Answer</span> ${esc(q.answer)}</p>
            </div>
          </details>`).join('')}
      </div>` : ''}
    </section>`).join('');
  const mn = (course.enrichment.mnemonics?.length) ? `
    <section class="card"><div class="sec-kicker">Memory aids</div>
      ${course.enrichment.mnemonics.map(m => `
        <div class="mnemonic"><div class="mn-for">${esc(m.for)}</div><div class="mn-aid">${esc(m.aid)}</div></div>`).join('')}
    </section>` : '';
  return secs + mn;
}

/* ---------------- Quiz ---------------- */

export function renderQuiz(course) {
  let n = 0;
  const secs = course.quizzes.sections.map((s, si) => {
    const heading = course.reading.sections.find(r => r.id === s.id)?.heading || s.id;
    return `<section class="card quiz-sec" data-sec="${esc(s.id)}">
      ${sectionHead(si + 1, heading, 'Quiz')}
      ${s.questions.map(q => {
        const qi = n++;
        return `<div class="quiz-q" data-qi="${qi}" data-answer="${q.answer}">
          <p class="quiz-prompt">${esc(q.q)}</p>
          <div class="quiz-choices">
            ${q.choices.map((c, ci) => `<button class="choice" data-ci="${ci}"><span class="choice-key">${'ABCD'[ci]}</span> ${esc(c)}</button>`).join('')}
          </div>
          <div class="quiz-explain" hidden><span class="tag good">Why</span> ${esc(q.explain)}</div>
        </div>`;
      }).join('')}
    </section>`;
  }).join('');
  return `<div class="quiz-scorebar"><span class="quiz-score" data-score>0</span> of <span data-total>${n}</span> correct</div>` + secs;
}

function wireQuiz(root) {
  const scoreEl = root.querySelector('[data-score]');
  const total = Number(root.querySelector('[data-total]')?.textContent || 0);
  let correct = 0, answered = 0;
  root.addEventListener('click', e => {
    const btn = e.target.closest('.choice');
    if (!btn || btn.closest('.quiz-q').dataset.done) return;
    const q = btn.closest('.quiz-q');
    q.dataset.done = '1';
    answered++;
    const right = Number(q.dataset.answer);
    const picked = Number(btn.dataset.ci);
    q.querySelectorAll('.choice').forEach(c => {
      const ci = Number(c.dataset.ci);
      if (ci === right) c.classList.add('right');
      else if (ci === picked) c.classList.add('wrong');
      c.disabled = true;
    });
    if (picked === right) correct++;
    q.querySelector('.quiz-explain').hidden = false;
    if (scoreEl) scoreEl.textContent = `${correct} / ${answered}`;
  });
  void total;
}

/* ---------------- Slides ---------------- */

export function renderSlides(course) {
  return `<div class="slides">` + course.slides.sections.map((s, i) => `
    <section class="card slide">
      <div class="slide-top"><span class="sec-num">${i + 1}</span><h3>${esc(s.title)}</h3></div>
      <ul class="slide-bullets">${s.bullets.map(b => `<li>${esc(b)}</li>`).join('')}</ul>
      ${s.visual ? `<figure class="visual slide-visual">
        <div class="visual-title">Picture this</div>
        <div class="visual-body">${md(s.visual)}</div>
      </figure>` : ''}
      <details class="notes"><summary>Speaker notes</summary><p>${esc(s.notes)}</p></details>
    </section>`).join('') + `</div>`;
}

/* ---------------- Audio ---------------- */

export function renderAudio(course) {
  const turns = course.enrichment.turns.map((t, i) => `
    <div class="turn ${t.speaker}" data-turn="${i}">
      <span class="speaker">${t.speaker === 'teacher' ? 'Teacher' : 'Student'}</span>
      <p>${esc(t.line)}</p>
    </div>`).join('');
  return `
    <section class="card audio-card">
      <div class="audio-head">
        <div><div class="sec-kicker">Audio lesson</div><h3>${esc(course.enrichment.audioTitle)}</h3></div>
        <div class="audio-controls">
          <button class="btn" data-audio="play">Play</button>
          <button class="btn ghost" data-audio="stop">Stop</button>
        </div>
      </div>
      <p class="muted">Read aloud in your browser with two voices — a dialogue, not a lecture.</p>
      <div class="dialogue">${turns}</div>
    </section>`;
}

function pickVoices() {
  const voices = speechSynthesis.getVoices();
  if (!voices.length) return [null, null];
  // Prefer two distinct English voices.
  const en = voices.filter(v => v.lang.startsWith('en'));
  const pool = en.length >= 2 ? en : voices;
  const teacher = pool.find(v => /male|daniel|david|alex|fred|google uk english male/i.test(v.name)) || pool[0];
  let student = pool.find(v => v !== teacher && /female|zira|samantha|victoria|karen|moira/i.test(v.name));
  if (!student) student = pool.find(v => v !== teacher) || pool[0];
  return [teacher, student];
}

function wireAudio(root, course) {
  const playBtn = root.querySelector('[data-audio="play"]');
  const stopBtn = root.querySelector('[data-audio="stop"]');
  const say = (text, voice) => new Promise(resolve => {
    const u = new SpeechSynthesisUtterance(text);
    if (voice) u.voice = voice;
    u.rate = 1.02;
    u.onend = u.onerror = resolve;
    speechSynthesis.speak(u);
  });
  playBtn?.addEventListener('click', async () => {
    speechSynthesis.cancel();
    playBtn.disabled = true;
    playBtn.textContent = 'Playing…';
    const [teacherV, studentV] = pickVoices();
    document.querySelectorAll('.turn').forEach(t => t.classList.remove('active'));
    for (const t of course.enrichment.turns) {
      if (!playBtn.disabled) break; // stopped
      const el = root.querySelector(`[data-turn="${course.enrichment.turns.indexOf(t)}"]`);
      el?.classList.add('active');
      el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      await say(t.line, t.speaker === 'teacher' ? teacherV : studentV);
      el?.classList.remove('active');
    }
    playBtn.disabled = false;
    playBtn.textContent = 'Play';
  });
  stopBtn?.addEventListener('click', () => {
    speechSynthesis.cancel();
    if (playBtn) { playBtn.disabled = false; playBtn.textContent = 'Play'; }
    root.querySelectorAll('.turn.active').forEach(t => t.classList.remove('active'));
  });
  if ('speechSynthesis' in window) speechSynthesis.getVoices();
}

/* ---------------- Mind map ---------------- */

export function renderMindmap(course) {
  const nodes = course.enrichment.nodes;
  const byParent = new Map();
  for (const n of nodes) {
    const key = n.parent;
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key).push(n);
  }
  const roots = byParent.get(null) || [];
  // Avoid a reserved string root id and recursion limits for valid deep trees.
  const stack = roots.toReversed().map(n => ({ n, depth: 0 }));
  let tree = '';
  while (stack.length) {
    const item = stack.pop();
    if (typeof item === 'string') { tree += item; continue; }
    const { n, depth } = item;
    tree += `<li class="mnode" style="--d:${depth}"><details ${depth < 2 ? 'open' : ''}>
      <summary><span class="mlabel">${esc(n.label)}</span></summary><p class="mnote">${esc(n.note)}</p>`;
    stack.push('</details></li>');
    const children = byParent.get(n.id) || [];
    if (children.length) {
      tree += '<ul>';
      stack.push('</ul>', ...children.toReversed().map(child => ({ n: child, depth: depth + 1 })));
    }
  }
  return `<section class="card">
    <div class="sec-kicker">Mind map</div>
    <p class="muted">The whole course on one page. Expand any node for its one-line essence.</p>
    <ul class="mindmap">${tree}</ul>
  </section>`;
}

/* ---------------- dispatch ---------------- */

export const VIEWS = [
  { id: 'reading', label: 'Read' },
  { id: 'quiz', label: 'Quiz' },
  { id: 'slides', label: 'Slides' },
  { id: 'audio', label: 'Audio' },
  { id: 'mindmap', label: 'Mind map' },
];

export function renderView(name, course) {
  switch (name) {
    case 'reading': return renderReading(course);
    case 'quiz': return renderQuiz(course);
    case 'slides': return renderSlides(course);
    case 'audio': return renderAudio(course);
    case 'mindmap': return renderMindmap(course);
    default: return '<p class="muted">Unknown view.</p>';
  }
}

export function wireView(name, root, course) {
  if (name === 'quiz') wireQuiz(root);
  if (name === 'audio') wireAudio(root, course);
}

