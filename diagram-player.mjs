// A single, scoped clock controls all motion in a figure.
const players = new Set();
const DURATION = 8000;
export function disposeDiagrams() { for (const dispose of [...players]) dispose(); }

export function wireDiagrams(root) {
  root.querySelectorAll('[data-diagram]').forEach(figure => {
    if (figure.dataset.wired) return;
    figure.dataset.wired = 'true';
    const art = figure.querySelector('.diagram-art');
    const play = figure.querySelector('[data-diagram-play]');
    const range = figure.querySelector('[data-diagram-seek]');
    const status = figure.querySelector('[data-diagram-status]');
    const expand = figure.querySelector('[data-diagram-expand]');
    const motion = matchMedia('(prefers-reduced-motion: reduce)');
    const animations = art.getAnimations({ subtree: true });
    animations.forEach(a => a.pause());
    let time = 0, running = false, visible = false, frame = 0, last = 0;
    let dialog = null, placeholder = null, disposed = false;
    const paint = () => {
      animations.forEach(a => { a.currentTime = time; });
      const p = time / DURATION;
      updateEngine(art, p); updateLever(art, p); updatePulley(art, p);
      updateEquilibrium(art, p); updateEnzymes(art, p); updateOrbit(art, p);
      updateSound(art, p); updateString(art, p); updateGears(art, p);
      updateFall(art, p); updateWaveRings(art, p); updateCone(art, p);
      updateFlow(art, p); updateRamp(art, p); updateWedge(art, p); updateScrew(art, p);
      updateBasePairs(art, p); updateDogma(art, p); updatePunnett(art, p);
      updateCrossover(art, p); updateSeqEdit(art, p);
      updateSteps(art, p); updateGrowRings(art, p); updateBars(art, p);
      const pct = Math.round(p * 100);
      if (range) range.value = String(pct);
      figure.dataset.progress = String(pct);
      if (status && (running || time > 0) && !motion.matches && time < DURATION) {
        status.textContent = running ? `Playing · ${pct}%` : `Inspecting · ${pct}%`;
      }
    };
    const announce = () => {
      if (play) { play.textContent = running ? 'Pause' : (time >= DURATION ? 'Replay' : 'Play'); play.setAttribute('aria-pressed', String(running)); }
      if (status) {
        const pct = Math.round((time / DURATION) * 100);
        if (running) status.textContent = `Playing · ${pct}%`;
        else if (motion.matches) status.textContent = 'Paused · reduced motion';
        else if (time >= DURATION) status.textContent = 'Finished · replay or scrub';
        else if (time > 0) status.textContent = `Inspecting · ${pct}%`;
        else status.textContent = 'Paused · drag to inspect';
      }
    };
    const stopFrame = () => { cancelAnimationFrame(frame); frame = 0; last = 0; };
    const tick = now => {
      frame = 0;
      if (disposed || !running || !visible || document.hidden || !figure.isConnected) { last = 0; return; }
      if (last) time = Math.min(DURATION, time + now - last);
      last = now; paint();
      if (time >= DURATION) { running = false; announce(); last = 0; }
      else frame = requestAnimationFrame(tick);
    };
    const schedule = () => { stopFrame(); if (running && visible && !document.hidden) frame = requestAnimationFrame(tick); };
    const togglePlay = () => { if (time >= DURATION) time = 0; running = !running; paint(); announce(); schedule(); };
    play?.addEventListener('click', togglePlay);
    range?.addEventListener('input', () => {
      running = false; time = Math.max(0, Math.min(100, Number(range.value))) / 100 * DURATION;
      paint(); announce(); schedule();
    });
    figure.tabIndex = figure.tabIndex >= 0 ? figure.tabIndex : 0;
    figure.addEventListener('keydown', (e) => {
      // Native range keys and focusable caption/code content own their events.
      // Static figures have no playback shortcuts; arrow keys can scroll normally.
      if (!play || (e.target !== figure && e.target !== play)) return;
      if (e.code === 'Space' || e.key === ' ') { e.preventDefault(); togglePlay(); }
      else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault(); running = false;
        time = Math.max(0, Math.min(DURATION, time + (e.key === 'ArrowRight' ? 0.05 : -0.05) * DURATION));
        paint(); announce(); schedule();
      } else if (e.key === 'Home') { e.preventDefault(); running = false; time = 0; paint(); announce(); schedule(); }
      else if (e.key === 'End') { e.preventDefault(); running = false; time = DURATION; paint(); announce(); schedule(); }
      else if (e.key === 'Escape' && dialog) { e.preventDefault(); dialog.close(); }
    });
    const observer = new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting && entries[0].intersectionRatio >= .15; schedule();
    }, { threshold: .15 });
    observer.observe(figure);
    document.addEventListener('visibilitychange', () => schedule());
    motion.addEventListener('change', () => { if (motion.matches) running = false; announce(); schedule(); });
    const close = () => {
      if (!dialog) return;
      placeholder?.replaceWith(figure); dialog.remove(); dialog = null; placeholder = null;
      expand.hidden = false; if (!disposed) { expand.focus(); observer.observe(figure); }
    };
    expand?.addEventListener('click', () => {
      if (dialog) return;
      placeholder = document.createComment('Illustration focus view');
      figure.before(placeholder);
      dialog = document.createElement('dialog');
      dialog.className = 'diagram-dialog'; dialog.setAttribute('aria-label', 'Enlarged illustration');
      const closeButton = document.createElement('button');
      closeButton.className = 'btn diagram-close'; closeButton.textContent = 'Close illustration';
      closeButton.addEventListener('click', () => dialog.close());
      dialog.append(closeButton, figure); document.body.append(dialog);
      expand.hidden = true; dialog.addEventListener('close', close, { once: true });
      dialog.showModal(); closeButton.focus();
    });
    const dispose = () => {
      disposed = true; stopFrame(); observer.disconnect(); close();
      animations.forEach(a => a.cancel()); players.delete(dispose);
    };
    players.add(dispose); paint(); announce();
  });
}

function updateEngine(art, progress) {
  art.querySelectorAll('.lw-engine-piston').forEach((piston, i) => {
    const x = Number(piston.getAttribute('x')) + 42, cy = 288, radius = 14, rodLength = 74;
    const angle = (i % 2 ? 1 : 0) * Math.PI + progress * Math.PI;
    const pinX = x + radius * Math.sin(angle), pinY = cy - radius * Math.cos(angle);
    const pistonY = pinY - Math.sqrt(Math.max(0, rodLength ** 2 - (pinX - x) ** 2));
    const top = pistonY - 18;
    piston.setAttribute('y', top.toFixed(1));
    const gas = art.querySelectorAll('.lw-engine-gas')[i];
    if (gas) { gas.setAttribute('height', Math.max(2, top - 163).toFixed(1)); gas.setAttribute('opacity', i === 2 ? String(0.55 + 0.45 * Math.max(0, Math.sin(angle))) : '1'); }
    art.querySelector(`.lw-engine-rod-${i}`)?.setAttribute('d', `M${x.toFixed(1)} ${pistonY.toFixed(1)} L${pinX.toFixed(1)} ${pinY.toFixed(1)}`);
    art.querySelector(`.lw-engine-crank-${i}`)?.setAttribute('d', `M${x} ${cy} L${pinX.toFixed(1)} ${pinY.toFixed(1)}`);
  });
}
function updateLever(art, progress) {
  const bar = art.querySelector('.lw-lever-bar'); if (!bar) return;
  const angle = Math.sin(progress * Math.PI * 2) * 0.16, pivotX = 510, pivotY = 235;
  const effortX = pivotX - 366 * Math.cos(angle), effortY = pivotY - 366 * Math.sin(angle);
  const loadX = pivotX + 122 * Math.cos(angle), loadY = pivotY + 122 * Math.sin(angle);
  bar.setAttribute('d', `M${effortX.toFixed(1)} ${effortY.toFixed(1)} L${loadX.toFixed(1)} ${loadY.toFixed(1)}`);
  art.querySelector('.lw-lever-effort')?.setAttribute('transform', `translate(0, ${(effortY - 225).toFixed(1)})`);
  art.querySelector('.lw-lever-load')?.setAttribute('transform', `translate(0, ${(loadY - 235).toFixed(1)})`);
}
function updatePulley(art, progress) {
  const w = art.querySelector('.lw-pulley-wheel'); if (!w) return;
  const lift = (1 - Math.cos(progress * Math.PI * 2)) / 2 * 48, py = 234 - lift;
  w.setAttribute('cy', py.toFixed(1)); w.style.transformOrigin = 'center'; w.style.transformBox = 'fill-box'; w.style.transform = `rotate(${(progress * 720).toFixed(1)}deg)`;
  art.querySelector('.lw-pulley-rope')?.setAttribute('d', `M540 122 V${py.toFixed(1)} A34 34 0 0 0 608 ${py.toFixed(1)} V${(132 - lift * 2).toFixed(1)}`);
  art.querySelector('.lw-pulley-load')?.setAttribute('transform', `translate(0, ${(-lift).toFixed(1)})`);
  art.querySelector('.lw-pulley-pull')?.setAttribute('transform', `translate(0, ${(-lift * 2).toFixed(1)})`);
}
function updateEquilibrium(art, progress) {
  const fwd = art.querySelector('.lw-eq-dot-fwd'), rev = art.querySelector('.lw-eq-dot-rev');
  if (!fwd && !rev) return;
  const cycle = (progress * 2) % 1, opacity = Math.max(0.25, Math.min(1, Math.min(cycle, 1 - cycle) * 8));
  if (fwd) { fwd.setAttribute('cx', (290 + cycle * 220).toFixed(1)); fwd.setAttribute('opacity', opacity.toFixed(2)); }
  if (rev) { rev.setAttribute('cx', (510 - cycle * 220).toFixed(1)); rev.setAttribute('opacity', opacity.toFixed(2)); }
}
function bezier(t, a, b, c, d) { const u = 1 - t; return u*u*u*a + 3*u*u*t*b + 3*u*t*t*c + t*t*t*d; }
function updateEnzymes(art, progress) {
  const place = (el, x0, x1, x2, x3, y0, y1, y2, y3) => {
    if (!el) return;
    el.setAttribute('cx', bezier(progress, x0, x1, x2, x3).toFixed(1));
    el.setAttribute('cy', bezier(progress, y0, y1, y2, y3).toFixed(1));
    el.setAttribute('r', (5 + 2.5 * Math.max(0, 1 - Math.abs(progress - 0.45) / 0.45)).toFixed(2));
  };
  place(art.querySelector('.lw-enzyme-particle-cat'), 100, 225, 500, 725, 260, 185, 285, 285);
  place(art.querySelector('.lw-enzyme-particle-uncat'), 100, 205, 505, 725, 260, 92, 285, 285);
}
function updateOrbit(art, progress) {
  const group = art.querySelector('.lw-orbit'); if (!group) return;
  const cx = 275, cy = 205, r = 118, angle = -Math.PI / 2 + progress * Math.PI * 2;
  const sx = cx + r * Math.cos(angle), sy = cy + r * Math.sin(angle);
  const sat = group.querySelector('circle');
  if (sat) { sat.setAttribute('cx', sx.toFixed(1)); sat.setAttribute('cy', sy.toFixed(1)); }
  const tx = -Math.sin(angle), ty = Math.cos(angle);
  const vx1 = sx + tx * 12, vy1 = sy + ty * 12, vx2 = sx + tx * 58, vy2 = sy + ty * 58;
  const gx1 = sx - Math.cos(angle) * 14, gy1 = sy - Math.sin(angle) * 14, gx2 = sx - Math.cos(angle) * 50, gy2 = sy - Math.sin(angle) * 50;
  const paths = group.querySelectorAll('path');
  if (paths[0]) paths[0].setAttribute('d', `M${vx1.toFixed(1)} ${vy1.toFixed(1)} L${vx2.toFixed(1)} ${vy2.toFixed(1)}`);
  if (paths[1]) { const a = Math.atan2(vy2 - vy1, vx2 - vx1); const p = ang => `${(vx2 - 9 * Math.cos(ang)).toFixed(1)} ${(vy2 - 9 * Math.sin(ang)).toFixed(1)}`; paths[1].setAttribute('d', `M${p(a - 0.48)} L${vx2.toFixed(1)} ${vy2.toFixed(1)} L${p(a + 0.48)}`); }
  if (paths[2]) paths[2].setAttribute('d', `M${gx1.toFixed(1)} ${gy1.toFixed(1)} L${gx2.toFixed(1)} ${gy2.toFixed(1)}`);
  if (paths[3]) { const a = Math.atan2(gy2 - gy1, gx2 - gx1); const p = ang => `${(gx2 - 9 * Math.cos(ang)).toFixed(1)} ${(gy2 - 9 * Math.sin(ang)).toFixed(1)}`; paths[3].setAttribute('d', `M${p(a - 0.48)} L${gx2.toFixed(1)} ${gy2.toFixed(1)} L${p(a + 0.48)}`); }
  group.style.transform = 'none';
}
function updateSound(art, progress) {
  art.querySelectorAll('.lw-air').forEach((g) => {
    const circle = g.querySelector('circle'); if (!circle) return;
    if (g.dataset.eqX == null) { g.dataset.eqX = circle.getAttribute('cx') || '0'; g.dataset.eqY = circle.getAttribute('cy') || '0'; }
    const eqX = Number(g.dataset.eqX), eqY = Number(g.dataset.eqY);
    const phase = (eqX - 170) / 175 * Math.PI * 2 + progress * Math.PI * 2;
    circle.setAttribute('cx', (eqX + Math.sin(phase) * 13).toFixed(1)); circle.setAttribute('cy', eqY.toFixed(1));
    if (circle.getAttribute('fill') === '#ffd479' || circle.getAttribute('stroke') === '#ffd479') circle.setAttribute('r', (4 + 1.2 * Math.abs(Math.sin(phase))).toFixed(2));
    g.style.transform = 'none';
  });
}
function updateString(art, progress) {
  const amp = Math.sin(progress * Math.PI * 2) * 42;
  art.querySelectorAll('.lw-string').forEach(g => {
    const path = g.querySelector('path'); if (!path) return;
    if (g.dataset.eqD == null) g.dataset.eqD = path.getAttribute('d') || '';
    g.style.transform = 'none';
    if (g.classList.contains('lw-string-1')) path.setAttribute('d', `M123 161 Q404 ${(161 - amp).toFixed(1)} 685 161`);
    else if (g.classList.contains('lw-string-2')) path.setAttribute('d', `M123 257 Q263 ${(257 - amp).toFixed(1)} 404 257 Q544 ${(257 + amp).toFixed(1)} 685 257`);
    else path.setAttribute('d', g.dataset.eqD);
  });
}
function updateGears(art, progress) {
  art.querySelectorAll('.lw-rotate').forEach(el => { el.style.transformOrigin = 'center'; el.style.transformBox = 'fill-box'; el.style.transform = `rotate(${(progress * 360).toFixed(2)}deg)`; });
  art.querySelectorAll('.lw-rotate-reverse-slow').forEach(el => { el.style.transformOrigin = 'center'; el.style.transformBox = 'fill-box'; el.style.transform = `rotate(${(-progress * 180).toFixed(2)}deg)`; });
}
function updateFall(art, progress) { const g = art.querySelector('.lw-fall'); if (g) g.style.transform = `translateY(${((progress % 1) ** 2 * 50).toFixed(1)}px)`; }
function updateWaveRings(art, progress) {
  const paintRing = (ring, speed, late) => {
    const t = (progress * speed + (late ? 0.5 : 0)) % 1;
    ring.style.transformOrigin = 'center'; ring.style.transformBox = 'fill-box';
    ring.style.transform = `scale(${(0.2 + t * 1.15).toFixed(3)})`; ring.style.opacity = Math.max(0.06, 0.9 - t * 0.85).toFixed(3);
  };
  art.querySelectorAll('.lw-wave-p').forEach(r => paintRing(r, 1.7, false));
  art.querySelectorAll('.lw-wave-p-late').forEach(r => paintRing(r, 1.7, true));
  art.querySelectorAll('.lw-wave-s').forEach(r => paintRing(r, 1.0, false));
  art.querySelectorAll('.lw-wave-s-late').forEach(r => paintRing(r, 1.0, true));
  art.querySelectorAll('.lw-wave-ring').forEach(r => paintRing(r, 1.2, false));
  art.querySelectorAll('.lw-wave-ring-late').forEach(r => paintRing(r, 1.2, true));
}
function updateCone(art, progress) {
  art.querySelectorAll('.lw-cone').forEach(el => { el.style.transformOrigin = 'left center'; el.style.transformBox = 'fill-box'; el.style.transform = `scaleX(${(0.88 + 0.12 * Math.sin(progress * Math.PI * 4)).toFixed(3)})`; });
  art.querySelectorAll('.lw-exhaust').forEach(el => { el.style.transformOrigin = 'right center'; el.style.transformBox = 'fill-box'; el.style.transform = `scaleX(${(0.75 + 0.25 * Math.sin(progress * Math.PI * 6)).toFixed(3)})`; });
}
function updateFlow(art, progress) { art.querySelectorAll('.lw-flow').forEach(el => { el.style.strokeDasharray = '8 12'; el.style.strokeDashoffset = (-progress * 20).toFixed(2); }); }
function updateRamp(art, progress) {
  const t = 0.5 - 0.5 * Math.cos(progress * Math.PI * 2);
  const place = (sel, x0, y0, x1, y1) => { const el = art.querySelector(sel); if (el) el.setAttribute('transform', `translate(${(x0 + (x1 - x0) * t).toFixed(1)} ${(y0 + (y1 - y0) * t).toFixed(1)})`); };
  place('.lw-ramp-block-steep', 70, 250, 250, 145); place('.lw-ramp-block-gentle', 400, 265, 680, 145);
  art.querySelector('.lw-ramp-force-steep')?.setAttribute('opacity', (0.45 + 0.55 * t).toFixed(2));
  art.querySelector('.lw-ramp-force-gentle')?.setAttribute('opacity', (0.45 + 0.55 * t).toFixed(2));
}
function updateWedge(art, progress) {
  const t = 0.5 - 0.5 * Math.cos(progress * Math.PI * 2);
  art.querySelector('.lw-wedge')?.setAttribute('transform', `translate(0 ${(t * 36).toFixed(1)})`);
  art.querySelector('.lw-wedge-left')?.setAttribute('transform', `translate(${(-t * 28).toFixed(1)} 0)`);
  art.querySelector('.lw-wedge-right')?.setAttribute('transform', `translate(${(t * 28).toFixed(1)} 0)`);
  art.querySelectorAll('.lw-wedge-force').forEach(el => el.setAttribute('opacity', (0.3 + 0.7 * t).toFixed(2)));
}
function updateScrew(art, progress) {
  const body = art.querySelector('.lw-screw-body'); if (!body) return;
  body.style.transformOrigin = '300px 200px'; body.style.transformBox = 'view-box';
  body.style.transform = `translate(0 ${((progress % 1) * 22).toFixed(1)}px) rotate(${(progress * 360).toFixed(1)}deg)`;
  art.querySelector('.lw-screw-pitch')?.setAttribute('opacity', (0.4 + 0.6 * Math.abs(Math.sin(progress * Math.PI))).toFixed(2));
}
function updateBasePairs(art, progress) {
  const pairs = [...art.querySelectorAll('.lw-base-pair')]; if (!pairs.length) return;
  const active = Math.min(pairs.length - 1, Math.floor(progress * pairs.length));
  pairs.forEach((g, i) => { g.setAttribute('opacity', i === active ? (0.85 + 0.15 * Math.sin(progress * Math.PI * 8)).toFixed(2) : i < active ? '0.55' : '0.2'); });
}
function updateDogma(art, progress) {
  const particle = art.querySelector('.lw-dogma-particle'); if (!particle) return;
  const pts = [[170, 203], [280, 203], [389, 203], [457, 203], [570, 203], [661, 186], [720, 190]];
  const t = progress * (pts.length - 1), i = Math.min(pts.length - 2, Math.floor(t)), f = t - i;
  particle.setAttribute('cx', (pts[i][0] + (pts[i + 1][0] - pts[i][0]) * f).toFixed(1));
  particle.setAttribute('cy', (pts[i][1] + (pts[i + 1][1] - pts[i][1]) * f).toFixed(1));
  art.querySelectorAll('.lw-aa').forEach((el, idx) => el.setAttribute('opacity', progress > 0.55 + idx * 0.12 ? '1' : '0.15'));
}
function updatePunnett(art, progress) {
  const cells = [...art.querySelectorAll('.lw-punnett-cell')]; if (!cells.length) return;
  const step = Math.min(cells.length - 1, Math.floor(progress * cells.length));
  cells.forEach((cell, i) => { cell.setAttribute('opacity', i === step ? '1' : '0.35'); cell.setAttribute('stroke-width', i === step ? '4' : '2'); });
  art.querySelectorAll('.lw-gamete').forEach((g, i) => g.setAttribute('opacity', (0.4 + 0.6 * Math.abs(Math.sin((progress + i * 0.25) * Math.PI * 2))).toFixed(2)));
}
function updateCrossover(art, progress) {
  const t = 0.5 - 0.5 * Math.cos(progress * Math.PI * 2);
  art.querySelector('.lw-xo-before')?.setAttribute('opacity', (1 - t).toFixed(2));
  art.querySelector('.lw-xo-after')?.setAttribute('opacity', t.toFixed(2));
  art.querySelector('.lw-shuffle-a')?.setAttribute('transform', `translate(${(t * 107).toFixed(1)} 0)`);
  art.querySelector('.lw-shuffle-b')?.setAttribute('transform', `translate(${(-t * 107).toFixed(1)} 0)`);
  const mut = art.querySelector('.lw-mut-base');
  if (mut) { const flipped = progress > 0.55; mut.textContent = flipped ? 'G' : 'A'; mut.setAttribute('fill', flipped ? '#ffd479' : '#7cc7ff'); }
}
function updateSeqEdit(art, progress) {
  const cursor = art.querySelector('.lw-seq-cursor');
  if (cursor) { cursor.setAttribute('transform', `translate(${(100 + progress * 200).toFixed(1)} 0)`); cursor.setAttribute('opacity', progress < 0.95 ? '1' : '0.3'); }
  art.querySelector('.lw-edit-target')?.setAttribute('opacity', (0.5 + 0.5 * Math.abs(Math.sin(progress * Math.PI * 4))).toFixed(2));
  const before = art.querySelector('.lw-edit-before'), after = art.querySelector('.lw-edit-after');
  if (before && after) { const done = progress > 0.6; before.setAttribute('opacity', done ? '0.25' : '1'); after.setAttribute('opacity', done ? '1' : '0.2'); }
}
function updateSteps(art, progress) {
  const steps = [...art.querySelectorAll('.lw-step')]; if (!steps.length) return;
  const active = Math.min(steps.length - 1, Math.floor(progress * steps.length));
  steps.forEach((el, i) => {
    el.setAttribute('opacity', i === active ? '1' : i < active ? '0.65' : '0.28');
    if (el.getAttribute('stroke')) el.setAttribute('stroke-width', i === active ? '3.5' : '2');
  });
}
function updateGrowRings(art, progress) {
  art.querySelectorAll('.lw-grow-ring').forEach((ring, i) => {
    const t = (progress + i * 0.22) % 1;
    ring.style.transformOrigin = 'center'; ring.style.transformBox = 'fill-box';
    ring.style.transform = `scale(${(0.25 + t * 1.1).toFixed(3)})`;
    ring.style.opacity = Math.max(0.08, 0.85 - t * 0.75).toFixed(3);
  });
}
function updateBars(art, progress) {
  art.querySelectorAll('.lw-bar').forEach((bar, i) => {
    const fund = progress * Math.PI * 2;
    const amp = 0.35 + 0.65 * Math.abs(Math.sin(fund * (i + 1)));
    const h = Number(bar.dataset.h || bar.getAttribute('height') || 40);
    if (bar.dataset.h == null) bar.dataset.h = String(h);
    const baseY = Number(bar.dataset.y || bar.getAttribute('y') || 0);
    if (bar.dataset.y == null) bar.dataset.y = String(baseY);
    const nh = Math.max(6, h * amp);
    bar.setAttribute('height', nh.toFixed(1));
    bar.setAttribute('y', (baseY + h - nh).toFixed(1));
  });
}

