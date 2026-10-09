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
      updateEngine(art, time / DURATION);
      if (range) range.value = String(Math.round(time / DURATION * 100));
      figure.dataset.progress = String(Math.round(time / DURATION * 100));
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
