/**
 * Imperative window animations. These write transient transform/opacity styles straight to the
 * element (as the original site did) because they run per-frame via CSS transitions and must
 * measure live layout; React state only decides *when* they run.
 */

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function transformBetween(from: DOMRect, to: DOMRect): string {
  const sx = Math.max(0.03, to.width / from.width);
  const sy = Math.max(0.03, to.height / from.height);
  const tx = to.left + to.width / 2 - (from.left + from.width / 2);
  const ty = to.top + to.height / 2 - (from.top + from.height / 2);
  return `translate(${tx}px,${ty}px) scale(${sx},${sy})`;
}

/** Shrinks the window into the taskbar button over 200ms, then calls onDone (which should hide it). */
export function animateToTaskbar(win: HTMLElement, button: HTMLElement, onDone: () => void): number {
  const transform = transformBetween(win.getBoundingClientRect(), button.getBoundingClientRect());
  win.style.transition = 'transform 0.2s ease-in, opacity 0.18s ease-in';
  win.style.transform = transform;
  win.style.opacity = '0';
  win.style.pointerEvents = 'none';
  return window.setTimeout(() => {
    win.style.transition = '';
    onDone();
  }, 215);
}

/**
 * Grows the window from the taskbar button to its laid-out position.
 * The window must already be displayed with `transform: none`.
 */
export function animateFromTaskbar(win: HTMLElement, button: HTMLElement, onDone: () => void): number {
  const transform = transformBetween(win.getBoundingClientRect(), button.getBoundingClientRect());
  win.style.transition = 'none';
  win.style.transform = transform;
  win.style.opacity = '0';
  void win.offsetWidth; // force reflow so the transition starts from the button position
  win.style.transition = 'transform 0.2s ease-out, opacity 0.16s ease-out';
  win.style.transform = 'none';
  win.style.opacity = '';
  return window.setTimeout(() => {
    win.style.transition = '';
    win.style.pointerEvents = '';
    onDone();
  }, 215);
}

/** Scale + fade in from `fromScale`. Returns the cleanup timer id. */
export function animatePopIn(el: HTMLElement, fromScale: number, durationMs: number, settleMs: number): number {
  el.style.transition = 'none';
  el.style.transform = `scale(${fromScale})`;
  el.style.opacity = '0';
  void el.offsetWidth;
  el.style.transition = `transform ${durationMs / 1000}s ease-out, opacity ${durationMs / 1000}s ease-out`;
  el.style.transform = '';
  el.style.opacity = '';
  return window.setTimeout(() => {
    el.style.transition = '';
  }, settleMs);
}

export function resetAnimationStyles(el: HTMLElement): void {
  el.style.transition = '';
  el.style.transform = '';
  el.style.opacity = '';
  el.style.pointerEvents = '';
}
