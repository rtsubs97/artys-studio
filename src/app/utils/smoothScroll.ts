export function smoothScrollToHash(hash: string) {
  const target = hash === "#top" ? document.getElementById("top") : document.querySelector<HTMLElement>(hash);
  if (!target) {
    return;
  }

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const startY = window.scrollY;
  const offset = window.innerWidth < 768 ? 84 : 102;
  const targetY = Math.max(0, startY + target.getBoundingClientRect().top - offset);

  if (prefersReducedMotion) {
    window.scrollTo(0, targetY);
    return;
  }

  const duration = 980;
  const start = performance.now();
  const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  const tick = (now: number) => {
    const elapsed = Math.min((now - start) / duration, 1);
    const eased = easeInOutCubic(elapsed);
    const nextY = startY + (targetY - startY) * eased;
    window.scrollTo(0, nextY);

    if (elapsed < 1) {
      window.requestAnimationFrame(tick);
    }
  };

  window.requestAnimationFrame(tick);
}
