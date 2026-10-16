// A single, scoped clock controls all motion in a figure. Offscreen figures
// freeze, reduced-motion users start paused, and view changes dispose players.
const players = new Set();
const DURATION = 8000;
export function disposeDiagrams() {
  for (const dispose of [...players]) dispose();
}

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
    animations.forEach(animation => animation.pause());
    let time = 0, running = false, visible = false, frame = 0, last = 0;
    let dialog = null, placeholder = null, disposed = false;
    const paint = () => {
      animations.forEach(animation => { animation.currentTime = time; });
      const p = time / DURATION;
      updateEngine(art, p);
      updateLever(art, p);
      updatePulley(art, p);
      updateEquilibrium(art, p);
      updateEnzymes(art, p);
      updateOrbit(art, p);
      updateSound(art, p);
      updateString(art, p);
      updateGears(art, p);
      updateFall(art, p);
      updateWaveRings(art, p);
      updateCone(art, p);
      updateFlow(art, p);
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
    const schedule = () => {
      stopFrame();
      if (running && visible && !document.hidden) frame = requestAnimationFrame(tick);
    };
    play?.addEventListener('click', () => {
      if (time >= DURATION) time = 0;
      running = !running; paint(); announce(); schedule();
    });
    range?.addEventListener('input', () => {
      running = false; time = Math.max(0, Math.min(100, Number(range.value))) / 100 * DURATION;
      paint(); announce(); schedule();
    });
    const observer = new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting && entries[0].intersectionRatio >= .15;
      schedule();
    }, { threshold: .15 });
    observer.observe(figure);
    const visibility = () => schedule();
    document.addEventListener('visibilitychange', visibility);
    const preference = () => { if (motion.matches) running = false; announce(); schedule(); };
    motion.addEventListener('change', preference);
    const close = () => {
      if (!dialog) return;
      placeholder?.replaceWith(figure);
      dialog.remove(); dialog = null; placeholder = null;
      expand.hidden = false;
      if (!disposed) { expand.focus(); observer.observe(figure); }
    };
    expand?.addEventListener('click', () => {
      if (dialog) return;
      placeholder = document.createComment('Illustration focus view');
      figure.before(placeholder);
      dialog = document.createElement('dialog');
      dialog.className = 'diagram-dialog';
      dialog.setAttribute('aria-label', 'Enlarged illustration');
      const closeButton = document.createElement('button');
      closeButton.className = 'btn diagram-close'; closeButton.textContent = 'Close illustration';
      closeButton.addEventListener('click', () => dialog.close());
      dialog.append(closeButton, figure); document.body.append(dialog);
      expand.hidden = true;
      dialog.addEventListener('close', close, { once: true });
      dialog.showModal(); closeButton.focus();
    });
    const dispose = () => {
      disposed = true; stopFrame(); observer.disconnect();
      document.removeEventListener('visibilitychange', visibility);
      motion.removeEventListener('change', preference);
      close(); animations.forEach(animation => animation.cancel());
      players.delete(dispose);
    };
    players.add(dispose);
    paint(); announce();
  });
}

function updateEngine(art, progress) {
  art.querySelectorAll('.lw-engine-piston').forEach((piston, i) => {
    const x = Number(piston.getAttribute('x')) + 42;
    const cy = 288, radius = 14, rodLength = 74;
    const angle = (i % 2 ? 1 : 0) * Math.PI + progress * Math.PI;
    const pinX = x + radius * Math.sin(angle);
    const pinY = cy - radius * Math.cos(angle);
    const dx = pinX - x;
    const under = rodLength ** 2 - dx * dx;
    const pistonY = pinY - Math.sqrt(Math.max(0, under));
    const top = pistonY - 18;
    piston.setAttribute('y', top.toFixed(1));
    const gas = art.querySelectorAll('.lw-engine-gas')[i];
    if (gas) {
      const h = Math.max(2, top - 163);
      gas.setAttribute('height', h.toFixed(1));
      if (i === 2) gas.setAttribute('opacity', String(0.55 + 0.45 * Math.max(0, Math.sin(angle))));
      else gas.setAttribute('opacity', '1');
    }
    const rod = art.querySelector(`.lw-engine-rod-${i}`);
    rod?.setAttribute('d', `M${x.toFixed(1)} ${pistonY.toFixed(1)} L${pinX.toFixed(1)} ${pinY.toFixed(1)}`);
    const crank = art.querySelector(`.lw-engine-crank-${i}`);
    crank?.setAttribute('d', `M${x} ${cy} L${pinX.toFixed(1)} ${pinY.toFixed(1)}`);
  });
}

function updateLever(art, progress) {
  const bar = art.querySelector('.lw-lever-bar');
  if (!bar) return;
  const angle = Math.sin(progress * Math.PI * 2) * 0.16;
  const pivotX = 510, pivotY = 235;
  const effortX = pivotX - 366 * Math.cos(angle);
  const effortY = pivotY - 366 * Math.sin(angle);
  const loadX = pivotX + 122 * Math.cos(angle);
  const loadY = pivotY + 122 * Math.sin(angle);
  bar.setAttribute('d', `M${effortX.toFixed(1)} ${effortY.toFixed(1)} L${loadX.toFixed(1)} ${loadY.toFixed(1)}`);
  const effortGroup = art.querySelector('.lw-lever-effort');
  if (effortGroup) effortGroup.setAttribute('transform', `translate(0, ${(effortY - 225).toFixed(1)})`);
  const loadGroup = art.querySelector('.lw-lever-load');
  if (loadGroup) loadGroup.setAttribute('transform', `translate(0, ${(loadY - 235).toFixed(1)})`);
}

function updatePulley(art, progress) {
  const pulleyWheel = art.querySelector('.lw-pulley-wheel');
  if (!pulleyWheel) return;
  const lift = (1 - Math.cos(progress * Math.PI * 2)) / 2 * 48;
  const py = 234 - lift;
  pulleyWheel.setAttribute('cy', py.toFixed(1));
  const spin = progress * 360 * 2;
  pulleyWheel.style.transformOrigin = 'center';
  pulleyWheel.style.transformBox = 'fill-box';
  pulleyWheel.style.transform = `rotate(${spin.toFixed(1)}deg)`;
  const rope = art.querySelector('.lw-pulley-rope');
  if (rope) {
    const freeY = (132 - lift * 2).toFixed(1);
    rope.setAttribute('d', `M540 122 V${py.toFixed(1)} A34 34 0 0 0 608 ${py.toFixed(1)} V${freeY}`);
  }
  const load = art.querySelector('.lw-pulley-load');
  if (load) load.setAttribute('transform', `translate(0, ${(-lift).toFixed(1)})`);
  const pull = art.querySelector('.lw-pulley-pull');
  if (pull) pull.setAttribute('transform', `translate(0, ${(-lift * 2).toFixed(1)})`);
}

function updateEquilibrium(art, progress) {
  const fwd = art.querySelector('.lw-eq-dot-fwd');
  const rev = art.querySelector('.lw-eq-dot-rev');
  if (!fwd && !rev) return;
  const cycle = (progress * 2) % 1;
  if (fwd) fwd.setAttribute('cx', (290 + cycle * 220).toFixed(1));
  if (rev) rev.setAttribute('cx', (510 - cycle * 220).toFixed(1));
}

function bezier(t, p0, p1, p2, p3) {
  const u = 1 - t;
  return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3;
}

function updateEnzymes(art, progress) {
  const cat = art.querySelector('.lw-enzyme-particle-cat');
  if (cat) {
    const x = bezier(progress, 100, 225, 500, 725);
    const y = bezier(progress, 260, 185, 285, 285);
    cat.setAttribute('cx', x.toFixed(1));
    cat.setAttribute('cy', y.toFixed(1));
  }
  const uncat = art.querySelector('.lw-enzyme-particle-uncat');
  if (uncat) {
    const x = bezier(progress, 100, 205, 505, 725);
    const y = bezier(progress, 260, 92, 285, 285);
    uncat.setAttribute('cx', x.toFixed(1));
    uncat.setAttribute('cy', y.toFixed(1));
  }
}

function updateOrbit(art, progress) {
  const group = art.querySelector('.lw-orbit');
  if (!group) return;
  const cx = 275, cy = 205, r = 118;
  const angle = -Math.PI / 2 + progress * Math.PI * 2;
  const sx = cx + r * Math.cos(angle);
  const sy = cy + r * Math.sin(angle);
  const sat = group.querySelector('circle');
  if (sat) {
    sat.setAttribute('cx', sx.toFixed(1));
    sat.setAttribute('cy', sy.toFixed(1));
  }
  const tx = -Math.sin(angle);
  const ty = Math.cos(angle);
  const velLen = 58;
  const vx1 = sx + tx * 12;
  const vy1 = sy + ty * 12;
  const vx2 = sx + tx * velLen;
  const vy2 = sy + ty * velLen;
  const gx1 = sx - Math.cos(angle) * 14;
  const gy1 = sy - Math.sin(angle) * 14;
  const gx2 = sx - Math.cos(angle) * 50;
  const gy2 = sy - Math.sin(angle) * 50;
  const paths = group.querySelectorAll('path');
  if (paths[0]) paths[0].setAttribute('d', `M${vx1.toFixed(1)} ${vy1.toFixed(1)} L${vx2.toFixed(1)} ${vy2.toFixed(1)}`);
  if (paths[1]) {
    const a = Math.atan2(vy2 - vy1, vx2 - vx1);
    const size = 9;
    const p = ang => `${(vx2 - size * Math.cos(ang)).toFixed(1)} ${(vy2 - size * Math.sin(ang)).toFixed(1)}`;
    paths[1].setAttribute('d', `M${p(a - 0.48)} L${vx2.toFixed(1)} ${vy2.toFixed(1)} L${p(a + 0.48)}`);
  }
  if (paths[2]) paths[2].setAttribute('d', `M${gx1.toFixed(1)} ${gy1.toFixed(1)} L${gx2.toFixed(1)} ${gy2.toFixed(1)}`);
  if (paths[3]) {
    const a = Math.atan2(gy2 - gy1, gx2 - gx1);
    const size = 9;
    const p = ang => `${(gx2 - size * Math.cos(ang)).toFixed(1)} ${(gy2 - size * Math.sin(ang)).toFixed(1)}`;
    paths[3].setAttribute('d', `M${p(a - 0.48)} L${gx2.toFixed(1)} ${gy2.toFixed(1)} L${p(a + 0.48)}`);
  }
  group.style.transform = 'none';
}

function updateSound(art, progress) {
  const particles = art.querySelectorAll('.lw-air');
  if (!particles.length) return;
  particles.forEach((g) => {
    const circle = g.querySelector('circle');
    if (!circle) return;
    if (g.dataset.eqX == null) {
      g.dataset.eqX = circle.getAttribute('cx') || '0';
      g.dataset.eqY = circle.getAttribute('cy') || '0';
    }
    const eqX = Number(g.dataset.eqX);
    const eqY = Number(g.dataset.eqY);
    const phase = (eqX - 170) / 175 * Math.PI * 2 + progress * Math.PI * 2;
    const amp = 13;
    const dx = Math.sin(phase) * amp;
    circle.setAttribute('cx', (eqX + dx).toFixed(1));
    circle.setAttribute('cy', eqY.toFixed(1));
    if (circle.getAttribute('fill') === '#ffd479' || circle.getAttribute('stroke') === '#ffd479') {
      const pulse = 4 + 1.2 * Math.abs(Math.sin(phase));
      circle.setAttribute('r', pulse.toFixed(2));
    }
    g.style.transform = 'none';
  });
}

function updateString(art, progress) {
  const strings = art.querySelectorAll('.lw-string');
  if (!strings.length) return;
  const amp = Math.sin(progress * Math.PI * 2) * 42;
  strings.forEach(g => {
    const path = g.querySelector('path');
    if (!path) return;
    if (g.dataset.eqD == null) g.dataset.eqD = path.getAttribute('d') || '';
    const d = g.dataset.eqD;
    g.style.transform = 'none';
    if (g.classList.contains('lw-string-1')) {
      const yMid = 161 - amp;
      path.setAttribute('d', `M123 161 Q404 ${yMid.toFixed(1)} 685 161`);
      return;
    }
    if (g.classList.contains('lw-string-2')) {
      const yL = 257 - amp;
      const yR = 257 + amp;
      path.setAttribute('d', `M123 257 Q263 ${yL.toFixed(1)} 404 257 Q544 ${yR.toFixed(1)} 685 257`);
      return;
    }
    path.setAttribute('d', d);
  });
}

function updateGears(art, progress) {
  art.querySelectorAll('.lw-rotate').forEach(el => {
    const deg = progress * 360;
    el.style.transformOrigin = 'center';
    el.style.transformBox = 'fill-box';
    el.style.transform = `rotate(${deg.toFixed(2)}deg)`;
  });
  art.querySelectorAll('.lw-rotate-reverse-slow').forEach(el => {
    const deg = -progress * 180;
    el.style.transformOrigin = 'center';
    el.style.transformBox = 'fill-box';
    el.style.transform = `rotate(${deg.toFixed(2)}deg)`;
  });
}

function updateFall(art, progress) {
  const group = art.querySelector('.lw-fall');
  if (!group) return;
  const t = progress % 1;
  const dy = t * t * 50;
  group.style.transform = `translateY(${dy.toFixed(1)}px)`;
}

function updateWaveRings(art, progress) {
  const paintRing = (ring, speed, late) => {
    let t = (progress * speed + (late ? 0.5 : 0)) % 1;
    const scale = 0.2 + t * 1.15;
    const opacity = Math.max(0.06, 0.9 - t * 0.85);
    ring.style.transformOrigin = 'center';
    ring.style.transformBox = 'fill-box';
    ring.style.transform = `scale(${scale.toFixed(3)})`;
    ring.style.opacity = opacity.toFixed(3);
  };
  art.querySelectorAll('.lw-wave-p').forEach(r => paintRing(r, 1.7, false));
  art.querySelectorAll('.lw-wave-p-late').forEach(r => paintRing(r, 1.7, true));
  art.querySelectorAll('.lw-wave-s').forEach(r => paintRing(r, 1.0, false));
  art.querySelectorAll('.lw-wave-s-late').forEach(r => paintRing(r, 1.0, true));
  art.querySelectorAll('.lw-wave-ring').forEach(r => paintRing(r, 1.2, false));
  art.querySelectorAll('.lw-wave-ring-late').forEach(r => paintRing(r, 1.2, true));
}

function updateCone(art, progress) {
  art.querySelectorAll('.lw-cone').forEach(el => {
    const scaleX = 0.88 + 0.12 * Math.sin(progress * Math.PI * 4);
    el.style.transformOrigin = 'left center';
    el.style.transformBox = 'fill-box';
    el.style.transform = `scaleX(${scaleX.toFixed(3)})`;
  });
  art.querySelectorAll('.lw-exhaust').forEach(el => {
    const scaleX = 0.75 + 0.25 * Math.sin(progress * Math.PI * 6);
    el.style.transformOrigin = 'right center';
    el.style.transformBox = 'fill-box';
    el.style.transform = `scaleX(${scaleX.toFixed(3)})`;
  });
}

function updateFlow(art, progress) {
  art.querySelectorAll('.lw-flow').forEach(el => {
    const offset = -progress * 20;
    el.style.strokeDasharray = '8 12';
    el.style.strokeDashoffset = offset.toFixed(2);
  });
}
