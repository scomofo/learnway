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
      if (range) range.value = String(Math.round(p * 100));
      figure.dataset.progress = String(Math.round(p * 100));
    };
    const announce = () => {
      if (play) { play.textContent = running ? 'Pause' : (time >= DURATION ? 'Replay' : 'Play'); play.setAttribute('aria-pressed', String(running)); }
      if (status) status.textContent = running ? 'Playing · one demonstration' : motion.matches ? 'Paused · reduced motion' : time >= DURATION ? 'Finished · replay or scrub' : 'Paused · drag to inspect';
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

// Four-panel stroke comparison: piston, rod and crank pin stay connected.
// Each panel covers a half crank turn; the full engine cycle takes two turns.
function updateEngine(art, progress) {
  art.querySelectorAll('.lw-engine-piston').forEach((piston, i) => {
    const x = Number(piston.getAttribute('x')) + 42;
    const cy = 288, radius = 14, rodLength = 74;
    const angle = (i % 2 ? 1 : 0) * Math.PI + progress * Math.PI;
    const pinX = x + radius * Math.sin(angle), pinY = cy - radius * Math.cos(angle);
    const pistonY = pinY - Math.sqrt(rodLength ** 2 - (pinX - x) ** 2);
    piston.setAttribute('y', String(pistonY - 18));
    art.querySelectorAll('.lw-engine-gas')[i]?.setAttribute('height', String(pistonY - 18 - 163));
    const rod = art.querySelector(`.lw-engine-rod-${i}`);
    rod?.setAttribute('d', `M${x} ${pistonY} L${pinX} ${pinY}`);
    const crank = art.querySelector(`.lw-engine-crank-${i}`);
    crank?.setAttribute('d', `M${x} ${cy} L${pinX} ${pinY}`);
  });
}

// Lever animation: pivot at (510, 235), effort arm = 366, load arm = 122 (3:1 ratio).
function updateLever(art, progress) {
  const bar = art.querySelector('.lw-lever-bar');
  if (!bar) return;
  const angle = Math.sin(progress * Math.PI * 2) * 0.12;
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

// Pulley animation: movable pulley moves up/down, showing 2:1 rope pull ratio.
function updatePulley(art, progress) {
  const pulleyWheel = art.querySelector('.lw-pulley-wheel');
  if (!pulleyWheel) return;
  const lift = (1 - Math.cos(progress * Math.PI * 2)) / 2 * 45;
  const py = 234 - lift;
  pulleyWheel.setAttribute('cy', py.toFixed(1));

  const rope = art.querySelector('.lw-pulley-rope');
  if (rope) rope.setAttribute('d', `M540 122 V${py.toFixed(1)} A34 34 0 0 0 608 ${py.toFixed(1)} V${(132 - lift * 2).toFixed(1)}`);

  const load = art.querySelector('.lw-pulley-load');
  if (load) load.setAttribute('transform', `translate(0, ${(-lift).toFixed(1)})`);

  const pull = art.querySelector('.lw-pulley-pull');
  if (pull) pull.setAttribute('transform', `translate(0, ${(-lift * 2).toFixed(1)})`);
}

// Dynamic equilibrium: particles exchange positions across boundary at equal rates.
function updateEquilibrium(art, progress) {
  const fwd = art.querySelector('.lw-eq-dot-fwd');
  const rev = art.querySelector('.lw-eq-dot-rev');
  if (!fwd && !rev) return;
  const cycle = (progress * 2) % 1;
  if (fwd) fwd.setAttribute('cx', (290 + cycle * 220).toFixed(1));
  if (rev) rev.setAttribute('cx', (510 - cycle * 220).toFixed(1));
}

// Cubic Bezier point calculation B(t) for P0, P1, P2, P3.
function bezier(t, p0, p1, p2, p3) {
  const u = 1 - t;
  return u * u * u * p0 + 3 * u * u * t * p1 + 3 * u * t * t * p2 + t * t * t * p3;
}

// Enzyme activation energy: particles trace the catalyzed and uncatalyzed energy paths.
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

// Circular orbit: satellite + tangential velocity + radial gravity stay locked together.
// Progress 0 → 1 is one full revolution. Centre and radius match the authored drawing.
function updateOrbit(art, progress) {
  const group = art.querySelector('.lw-orbit');
  if (!group) return;
  const cx = 275, cy = 205, r = 118;
  // Start at the top (as drawn) and travel counter-clockwise so the path feels natural.
  const angle = -Math.PI / 2 + progress * Math.PI * 2;
  const sx = cx + r * Math.cos(angle);
  const sy = cy + r * Math.sin(angle);

  const sat = group.querySelector('circle');
  if (sat) {
    sat.setAttribute('cx', sx.toFixed(1));
    sat.setAttribute('cy', sy.toFixed(1));
  }

  // Tangential velocity (amber): perpendicular to radius, pointing in travel direction.
  const tx = -Math.sin(angle);
  const ty = Math.cos(angle);
  const velLen = 52;
  const vx1 = sx + tx * 10;
  const vy1 = sy + ty * 10;
  const vx2 = sx + tx * velLen;
  const vy2 = sy + ty * velLen;

  // Radial gravity (green): toward centre.
  const gx1 = sx - Math.cos(angle) * 12;
  const gy1 = sy - Math.sin(angle) * 12;
  const gx2 = sx - Math.cos(angle) * 48;
  const gy2 = sy - Math.sin(angle) * 48;

  const paths = group.querySelectorAll('path');
  // Authored order: velocity shaft, velocity head, gravity shaft, gravity head.
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

  // Disable the CSS rotate so our geometry is not double-transformed.
  group.style.transform = 'none';
}

// Longitudinal sound wave: each air particle oscillates around a fixed equilibrium.
// Phase depends on horizontal position so a travelling compression pattern appears.
function updateSound(art, progress) {
  const particles = art.querySelectorAll('.lw-air');
  if (!particles.length) return;

  // Equilibrium x is the original centre of each particle group.
  // We store it once so scrubbing is deterministic.
  particles.forEach((g, i) => {
    const circle = g.querySelector('circle');
    if (!circle) return;
    if (g.dataset.eqX == null) {
      g.dataset.eqX = circle.getAttribute('cx') || '0';
      g.dataset.eqY = circle.getAttribute('cy') || '0';
    }
    const eqX = Number(g.dataset.eqX);
    const eqY = Number(g.dataset.eqY);
    // Wavelength roughly spans the particle field (~350 px). Two cycles look clear.
    const phase = (eqX - 170) / 175 * Math.PI * 2 + progress * Math.PI * 2;
    const amp = 11;
    const dx = Math.sin(phase) * amp;
    circle.setAttribute('cx', (eqX + dx).toFixed(1));
    circle.setAttribute('cy', eqY.toFixed(1));
    // Kill any residual CSS translate so only the JS displacement remains.
    g.style.transform = 'none';
  });
}

// Standing-wave string modes: nodes stay fixed; antinodes oscillate with amplitude.
// Authored paths: n=1 is a single quadratic; n=2 is a double-hump path.
function updateString(art, progress) {
  const strings = art.querySelectorAll('.lw-string');
  if (!strings.length) return;
  // Amplitude envelope: one full oscillation over the demonstration.
  const amp = Math.sin(progress * Math.PI * 2) * 42;

  strings.forEach(g => {
    const path = g.querySelector('path');
    if (!path) return;
    if (g.dataset.eqD == null) g.dataset.eqD = path.getAttribute('d') || '';
    const d = g.dataset.eqD;
    g.style.transform = 'none';

    // n = 1: M123 161 Q404 109 685 161  → control y moves with amp
    if (g.classList.contains('lw-string-1')) {
      const yMid = 161 - amp;
      path.setAttribute('d', `M123 161 Q404 ${yMid.toFixed(1)} 685 161`);
      return;
    }
    // n = 2: M123 257 Q263 207 404 257 Q544 307 685 257
    // Left antinode goes up when right goes down (opposite phase).
    if (g.classList.contains('lw-string-2')) {
      const yL = 257 - amp;
      const yR = 257 + amp;
      path.setAttribute('d', `M123 257 Q263 ${yL.toFixed(1)} 404 257 Q544 ${yR.toFixed(1)} 685 257`);
      return;
    }
    // Fallback: restore original path
    path.setAttribute('d', d);
  });
}

// Gears and wheel/axle: drive rotation from the shared clock so scrubbing shows ratios.
// .lw-rotate turns one full revolution over the demo; .lw-rotate-reverse-slow turns half
// (and opposite) so a 2:1 gear pair stays meshed while the learner inspects.
function updateGears(art, progress) {
  art.querySelectorAll('.lw-rotate').forEach(el => {
    const deg = progress * 360;
    el.style.transformOrigin = 'center';
    el.style.transformBox = 'fill-box';
    el.style.transform = `rotate(${deg.toFixed(2)}deg)`;
  });
  art.querySelectorAll('.lw-rotate-reverse-slow').forEach(el => {
    const deg = -progress * 180; // half speed, opposite direction → 2:1 mesh
    el.style.transformOrigin = 'center';
    el.style.transformBox = 'fill-box';
    el.style.transform = `rotate(${deg.toFixed(2)}deg)`;
  });
}

// Falling rain droplets under a cloud: drop, then loop.
function updateFall(art, progress) {
  const group = art.querySelector('.lw-fall');
  if (!group) return;
  // Drop 50 px over the cycle, ease in a little.
  const t = progress % 1;
  const dy = t * t * 50;
  group.style.transform = `translateY(${dy.toFixed(1)}px)`;
}
