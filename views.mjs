// Learnway views: the five Learn-Your-Way representations rendered from course JSON.
// renderView(name, course) -> HTML string. wireView(name, root) attaches interactivity.
'use strict';

import { sanitizeDiagram } from './pipeline.mjs';

export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function courseSources(course) {
  if (!Array.isArray(course?.sources)) return [];
  return course.sources.flatMap(source => {
    if (!source || typeof source.title !== 'string' || !source.title.trim() || typeof source.url !== 'string') return [];
    try {
      const url = new URL(source.url);
      if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) return [];
      return [{ title: source.title, url: url.href }];
    } catch { return []; }
  });
}

export function renderSources(course) {
  const links = courseSources(course).map(source => `<li><a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${esc(source.title)}</a></li>`);
  return links.length ? `<section class="card course-sources" aria-label="Further reading"><h2>Further reading</h2><ul>${links.join('')}</ul></section>` : '';
}

/** Minimal Markdown, including escaped fenced diagrams with intact spacing. */
export function md(src) {
  const lines = String(src ?? '').replace(/\r\n?/g, '\n').split('\n');
  let html = '', inList = false;
  let fence = null, codeLines = [];
  const emitCode = () => {
    html += `<pre class="code-block" tabindex="0" role="region" aria-label="Code or diagram"><code>${esc(codeLines.join('\n'))}</code></pre>`;
    fence = null; codeLines = [];
  };
  const inline = t => esc(t)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>');
  for (const raw of lines) {
    if (fence) {
      const end = raw.match(/^ {0,3}(`{3,}|~{3,})\s*$/);
      if (end && end[1][0] === fence[0] && end[1].length >= fence.length) emitCode();
      else codeLines.push(raw);
      continue;
    }
    const start = raw.match(/^ {0,3}(`{3,}|~{3,})(.*)$/);
    if (start) {
      if (inList) { html += '</ul>'; inList = false; }
      fence = start[1];
      continue;
    }
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
  if (fence) emitCode();
  if (inList) html += '</ul>';
  return html;
}

function sectionHead(n, heading, kicker) {
  return `<div class="sec-head"><span class="sec-num">${n}</span><div><div class="sec-kicker">${esc(kicker)}</div><h3>${esc(heading)}</h3></div></div>`;
}

/**
 * The section's diagram as a figure. The SVG is sanitized at the render
 * boundary, so imported or hand-edited courses cannot inject scripts.
 * Falls back to the "Picture this" text card when there is no diagram yet
 * (older courses), and to nothing when there is neither.
 */
export function diagramFigure(s, cls = '') {
  const svg = sanitizeDiagram(s.diagram || '');
  const classes = cls ? `diagram ${cls}` : 'diagram';
  if (svg) {
    const caption = s.visual ? `<figcaption class="diagram-caption">${md(s.visual)}</figcaption>` : '';
    return `<figure class="${classes}"><div class="diagram-art">${svg}</div>${caption}</figure>`;
  }
  if (s.visual) {
    const vclasses = cls ? `visual ${cls}` : 'visual';
    return `<figure class="${vclasses}">
        <figcaption class="visual-title">Picture this</figcaption>
        <div class="visual-body">${md(s.visual)}</div>
      </figure>`;
  }
  return '';
}

/* ---------------- Reading ---------------- */

export function courseToMarkdown(course) {
  if (!course) return '';
  const lines = [];
  lines.push(`# ${course.meta?.title || 'Course'}`);
  lines.push('');
  lines.push(`**Topic:** ${course.meta?.topic || ''}  `);
  if (course.meta?.level) lines.push(`**Level:** ${course.meta.level}  `);
  if (course.plan?.hook) {
    lines.push('');
    lines.push(`> ${course.plan.hook}`);
    lines.push('');
  }
  if (course.plan?.objectives?.length) {
    lines.push('## Learning Objectives');
    for (const obj of course.plan.objectives) lines.push(`- ${obj}`);
    lines.push('');
  }
  if (course.plan?.prerequisites?.length) {
    lines.push('## Prerequisites');
    for (const p of course.plan.prerequisites) lines.push(`- ${p}`);
    lines.push('');
  }

  if (course.reading?.sections?.length) {
    lines.push('## Course Content');
    lines.push('');
    for (const s of course.reading.sections) {
      lines.push(`### ${s.heading}`);
      lines.push('');
      lines.push(s.body);
      lines.push('');
      if (s.visual) {
        lines.push('*Visual representation:*', '', s.visual);
        lines.push('');
      }
      const cleanSvg = sanitizeDiagram(s.diagram || '');
      if (cleanSvg) {
        lines.push(cleanSvg);
        lines.push('');
      }
      if (s.questions?.length) {
        lines.push('**Check-in Questions:**');
        for (const q of s.questions) {
          lines.push(`- **Q:** ${q.q}`);
          if (q.hint) lines.push(`  - *Hint:* ${q.hint}`);
          lines.push(`  - **Answer:** ${q.answer}`);
        }
        lines.push('');
      }
    }
  }

  if (course.enrichment?.mnemonics?.length) {
    lines.push('## Memory Aids');
    for (const m of course.enrichment.mnemonics) {
      lines.push(`- **${m.for}:** ${m.aid}`);
    }
    lines.push('');
  }

  if (course.quizzes?.sections?.length) {
    lines.push('## Practice Quizzes');
    lines.push('');
    for (const s of course.quizzes.sections) {
      for (const q of s.questions) {
        lines.push(`**Q:** ${q.q}`);
        for (let i = 0; i < q.choices.length; i++) {
          const marker = i === q.answer ? '[x]' : '[ ]';
          lines.push(`- ${marker} ${q.choices[i]}`);
        }
        lines.push(`*Explanation:* ${q.explain}`);
        lines.push('');
      }
    }
  }

  if (course.slides?.sections?.length) {
    lines.push('## Lecture Slides');
    lines.push('');
    for (const s of course.slides.sections) {
      lines.push(`### ${s.title}`);
      for (const b of s.bullets) lines.push(`- ${b}`);
      if (s.notes) lines.push(`\n*Speaker Notes:* ${s.notes}`);
      if (s.visual) lines.push('', '*Visual representation:*', '', s.visual);
      lines.push('');
    }
  }

  if (course.enrichment?.turns?.length) {
    lines.push('## Audio Dialogue');
    lines.push('');
    for (const t of course.enrichment.turns) {
      const spk = t.speaker === 'teacher' ? 'Teacher' : 'Student';
      lines.push(`**${spk}:** ${t.line}`);
      lines.push('');
    }
  }

  const sources = courseSources(course);
  if (sources.length) {
    lines.push('## Further reading', '');
    for (const source of sources) lines.push(`- ${source.title.replace(/[\r\n]/g, ' ')}: <${source.url}>`);
    lines.push('');
  }
  return lines.join('\n');
}

/* ---------------- Reading ---------------- */

export function renderReading(course, notesMap = {}, unsavedNotes = {}) {
  const secs = course.reading.sections.map((s, i) => `
    <section class="card reading-sec" data-sec="${esc(s.id)}">
      ${sectionHead(i + 1, s.heading, 'Reading')}
      <div class="prose">${md(s.body)}</div>
      ${diagramFigure(s)}
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
      <div class="sec-notes">
        <details class="notes-wrapper" ${notesMap[s.id] ? 'open' : ''}>
          <summary>My Study Notes ${notesMap[s.id] ? '✏️' : ''}</summary>
          <textarea class="note-input" data-sec-note="${esc(s.id)}" placeholder="Type your personal section notes here...">${esc(notesMap[s.id] || '')}</textarea>
          <p class="note-status muted small" role="status">${Object.prototype.hasOwnProperty.call(unsavedNotes, s.id) ? 'Not saved. Your draft is kept in this tab; edit again to retry or copy it before closing.' : ''}</p>
        </details>
      </div>
    </section>`).join('');
  const mn = (course.enrichment.mnemonics?.length) ? `
    <section class="card"><div class="sec-kicker">Memory aids</div>
      ${course.enrichment.mnemonics.map(m => `
        <div class="mnemonic"><div class="mn-for">${esc(m.for)}</div><div class="mn-aid">${esc(m.aid)}</div></div>`).join('')}
    </section>` : '';
  return secs + mn;
}

function wireReading(root, course, onSaveNote) {
  if (!onSaveNote) return;
  root.querySelectorAll('[data-sec-note]').forEach(textarea => {
    textarea.addEventListener('input', () => {
      const secId = textarea.dataset.secNote;
      const status = textarea.parentElement.querySelector('.note-status');
      try {
        onSaveNote(secId, textarea.value);
        if (status) status.textContent = 'Saved in this browser.';
      } catch {
        if (status) status.textContent = 'Not saved. Your draft is kept in this tab; edit again to retry or copy it before closing.';
      }
    });
  });
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
  const readingById = new Map((course.reading?.sections || []).map(s => [s.id, s]));
  return `<div class="slides">` + course.slides.sections.map((s, i) => {
    const reading = readingById.get(s.id) || {};
    // The slide shows its reading section's diagram, captioned by the slide's own visual cue.
    const fig = diagramFigure({ visual: s.visual, diagram: reading.diagram }, 'slide-visual');
    return `
    <section class="card slide">
      <div class="slide-top"><span class="sec-num">${i + 1}</span><h3>${esc(s.title)}</h3></div>
      <ul class="slide-bullets">${s.bullets.map(b => `<li>${esc(b)}</li>`).join('')}</ul>
      ${fig}
      <details class="notes"><summary>Speaker notes</summary><p>${esc(s.notes)}</p></details>
    </section>`;}).join('') + `</div>`;
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
  const stack = [];
  for (let i = roots.length - 1; i >= 0; i--) stack.push({ n: roots[i], depth: 0 });
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
      stack.push('</ul>');
      for (let i = children.length - 1; i >= 0; i--) stack.push({ n: children[i], depth: depth + 1 });
    }
  }
  return `<section class="card">
    <div class="sec-kicker">Mind map</div>
    <p class="muted">The whole course on one page. Expand any node for its one-line essence.</p>
    <ul class="mindmap">${tree}</ul>
  </section>`;
}

/* ---------------- Flashcards ---------------- */

export function getFlashcards(course) {
  const cards = [];
  if (course?.reading?.sections) {
    for (const s of course.reading.sections) {
      if (s.questions) {
        for (const q of s.questions) {
          cards.push({
            front: q.q,
            back: q.answer,
            hint: q.hint || '',
            category: s.heading || 'Check-in'
          });
        }
      }
      if (s.visual || s.diagram) {
        cards.push({
          front: `Picture this: ${s.heading || 'a key idea'}`,
          back: s.visual || '',
          backHtml: diagramFigure(s, 'fc-diagram'),
          hint: '',
          category: 'Visual'
        });
      }
    }
  }
  if (course?.enrichment?.mnemonics) {
    for (const m of course.enrichment.mnemonics) {
      if (m.for && m.aid) {
        cards.push({
          front: m.for,
          back: m.aid,
          hint: '',
          category: 'Mnemonic'
        });
      }
    }
  }
  if (course?.enrichment?.nodes) {
    for (const n of course.enrichment.nodes) {
      if (n.label && n.note) {
        cards.push({
          front: `What is ${n.label}?`,
          back: n.note,
          hint: '',
          category: 'Concept'
        });
      }
    }
  }
  return cards;
}

export function renderFlashcards(course) {
  const cards = getFlashcards(course);
  if (!cards.length) {
    return `<section class="card"><p class="muted">No flashcards available for this course.</p></section>`;
  }
  return `<section class="card flashcards-card">
    <div class="fc-head">
      <div><div class="sec-kicker">Study Mode</div><h3>Flashcards</h3></div>
      <div class="fc-stats">
        <span class="fc-counter"><span id="fc-idx">1</span> / ${cards.length}</span>
        <span class="fc-mastered-tag">Mastered: <span id="fc-mastered-count">0</span>/${cards.length}</span>
      </div>
    </div>
    <div class="fc-stage">
      <div class="fc-card-container" id="fc-card" tabindex="0" role="button" aria-label="Flashcard. Click to flip.">
        <div class="fc-card-inner">
          <div class="fc-card-front">
            <span class="tag fc-cat" id="fc-cat">${esc(cards[0].category)}</span>
            <div class="fc-content" id="fc-front">${esc(cards[0].front)}</div>
            <div class="fc-hint-box" id="fc-hint-box" hidden><span class="tag">Hint</span> <span id="fc-hint-text">${esc(cards[0].hint)}</span></div>
            <div class="fc-flip-prompt">Click card or press Enter to reveal answer</div>
          </div>
          <div class="fc-card-back">
            <span class="tag good fc-cat">Answer</span>
            <div class="fc-content" id="fc-back">${cards[0].backHtml || esc(cards[0].back)}</div>
            <div class="fc-flip-prompt">Click card to flip back</div>
          </div>
        </div>
      </div>
    </div>
    <div class="fc-controls">
      <button class="btn ghost" id="fc-prev" disabled>← Previous</button>
      ${cards[0].hint ? `<button class="btn ghost" id="fc-hint-btn">Show Hint</button>` : `<button class="btn ghost" id="fc-hint-btn" hidden>Show Hint</button>`}
      <button class="btn ghost" id="fc-shuffle">Shuffle</button>
      <button class="btn primary" id="fc-next">Next →</button>
    </div>
    <div class="fc-mastery-actions">
      <button class="btn small danger" id="fc-again-btn">Need Practice ✗</button>
      <button class="btn small primary" id="fc-mastered-btn">Mastered ✓</button>
    </div>
  </section>`;
}

function wireFlashcards(root, course) {
  let cards = getFlashcards(course);
  if (!cards.length) return;
  let idx = 0;
  let isFlipped = false;
  const mastered = new Set();

  const cardEl = root.querySelector('#fc-card');
  const catEl = root.querySelector('#fc-cat');
  const frontEl = root.querySelector('#fc-front');
  const backEl = root.querySelector('#fc-back');
  const hintBoxEl = root.querySelector('#fc-hint-box');
  const hintTextEl = root.querySelector('#fc-hint-text');
  const hintBtn = root.querySelector('#fc-hint-btn');
  const idxEl = root.querySelector('#fc-idx');
  const prevBtn = root.querySelector('#fc-prev');
  const nextBtn = root.querySelector('#fc-next');
  const shuffleBtn = root.querySelector('#fc-shuffle');
  const masteredCountEl = root.querySelector('#fc-mastered-count');
  const againBtn = root.querySelector('#fc-again-btn');
  const masteredBtn = root.querySelector('#fc-mastered-btn');

  function updateCard() {
    isFlipped = false;
    cardEl?.classList.remove('flipped');
    const card = cards[idx];
    if (catEl) catEl.textContent = card.category;
    if (frontEl) frontEl.textContent = card.front;
    if (backEl) {
      // backHtml is only ever produced by diagramFigure(), whose SVG is sanitized.
      if (card.backHtml) backEl.innerHTML = card.backHtml;
      else backEl.textContent = card.back;
    }
    if (idxEl) idxEl.textContent = String(idx + 1);

    if (hintBoxEl) hintBoxEl.hidden = true;
    if (hintBtn) {
      if (card.hint) {
        hintBtn.hidden = false;
        hintBtn.textContent = 'Show Hint';
      } else {
        hintBtn.hidden = true;
      }
    }
    if (hintTextEl) hintTextEl.textContent = card.hint || '';

    if (prevBtn) prevBtn.disabled = idx === 0;
    if (nextBtn) nextBtn.disabled = idx === cards.length - 1;

    if (masteredBtn) {
      if (mastered.has(card.front)) {
        masteredBtn.classList.add('good');
      } else {
        masteredBtn.classList.remove('good');
      }
    }
  }

  cardEl?.addEventListener('click', () => {
    isFlipped = !isFlipped;
    cardEl.classList.toggle('flipped', isFlipped);
  });

  cardEl?.addEventListener('keydown', e => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      isFlipped = !isFlipped;
      cardEl.classList.toggle('flipped', isFlipped);
    }
  });

  hintBtn?.addEventListener('click', e => {
    e.stopPropagation();
    if (!hintBoxEl) return;
    hintBoxEl.hidden = !hintBoxEl.hidden;
    hintBtn.textContent = hintBoxEl.hidden ? 'Show Hint' : 'Hide Hint';
  });

  prevBtn?.addEventListener('click', () => {
    if (idx > 0) { idx--; updateCard(); }
  });

  nextBtn?.addEventListener('click', () => {
    if (idx < cards.length - 1) { idx++; updateCard(); }
  });

  shuffleBtn?.addEventListener('click', () => {
    for (let i = cards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [cards[i], cards[j]] = [cards[j], cards[i]];
    }
    idx = 0;
    updateCard();
  });

  masteredBtn?.addEventListener('click', () => {
    const cardId = cards[idx].front;
    mastered.add(cardId);
    if (masteredCountEl) masteredCountEl.textContent = String(mastered.size);
    if (idx < cards.length - 1) {
      idx++;
    }
    updateCard();
  });

  againBtn?.addEventListener('click', () => {
    const cardId = cards[idx].front;
    mastered.delete(cardId);
    if (masteredCountEl) masteredCountEl.textContent = String(mastered.size);
    if (idx < cards.length - 1) {
      idx++;
    }
    updateCard();
  });

  updateCard();
}

/* ---------------- dispatch ---------------- */

export const VIEWS = [
  { id: 'reading', label: 'Read' },
  { id: 'quiz', label: 'Quiz' },
  { id: 'slides', label: 'Slides' },
  { id: 'audio', label: 'Audio' },
  { id: 'mindmap', label: 'Mind map' },
  { id: 'flashcards', label: 'Flashcards' },
];

export function renderView(name, course, options = {}) {
  switch (name) {
    case 'reading': return renderReading(course, options.notesMap, options.unsavedNotes);
    case 'quiz': return renderQuiz(course);
    case 'slides': return renderSlides(course);
    case 'audio': return renderAudio(course);
    case 'mindmap': return renderMindmap(course);
    case 'flashcards': return renderFlashcards(course);
    default: return '<p class="muted">Unknown view.</p>';
  }
}

export function wireView(name, root, course, options = {}) {
  if (name === 'reading') wireReading(root, course, options.onSaveNote);
  if (name === 'quiz') wireQuiz(root);
  if (name === 'audio') wireAudio(root, course);
  if (name === 'flashcards') wireFlashcards(root, course);
}
