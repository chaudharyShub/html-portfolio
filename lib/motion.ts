/**
 * Imperative window/dialog animations. They write transient transform/opacity straight to the
 * element (or use the Web Animations API) because they must measure live layout; React state
 * only decides *when* they run. Every caller skips them under prefers-reduced-motion.
 */

/** Apple's "ease out" used for sheets and window opens: fast start, long soft landing. */
export const APPLE_EASE = 'cubic-bezier(0.32, 0.72, 0, 1)';
/** A gentle spring with a small overshoot, for alerts, menus and the dock. */
export const SPRING_EASE = 'cubic-bezier(0.34, 1.4, 0.64, 1)';

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Phones (portrait or landscape) get the iOS layout. Keep in sync with styles/ios.css. */
export const PHONE_QUERY = '(max-width: 700px), (max-height: 500px) and (pointer: coarse)';

export function isPhoneLayout(): boolean {
  return typeof window !== 'undefined' && window.matchMedia(PHONE_QUERY).matches;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** translate/scale that maps `from` onto `to`, partway by `t` (0..1) per axis. */
function between(from: DOMRect, to: DOMRect, tx = 1, ty = 1, tsx = 1, tsy = 1): string {
  const sx = lerp(1, Math.max(0.03, to.width / from.width), tsx);
  const sy = lerp(1, Math.max(0.03, to.height / from.height), tsy);
  const dx = to.left + to.width / 2 - (from.left + from.width / 2);
  const dy = to.top + to.height / 2 - (from.top + from.height / 2);
  return `translate(${dx * tx}px,${dy * ty}px) scale(${sx},${sy})`;
}

/**
 * Genie-like keyframes from the window to the dock icon: it first narrows and starts to drop,
 * then is pulled into the icon.
 */
function genieFrames(win: HTMLElement, target: HTMLElement): Keyframe[] {
  const from = win.getBoundingClientRect();
  const to = target.getBoundingClientRect();
  return [
    { transform: 'none', opacity: 1 },
    { transform: between(from, to, 0.12, 0.35, 0.45, 0.12), opacity: 1, offset: 0.4 },
    { transform: between(from, to, 0.6, 0.8, 0.85, 0.7), opacity: 0.85, offset: 0.75 },
    { transform: between(from, to), opacity: 0 },
  ];
}

export function cancelAnimations(el: HTMLElement): void {
  el.getAnimations().forEach((a) => a.cancel());
}

const DOCK_MS = 440;

/** Squeezes the window into its dock icon, then calls onDone (which should hide it). */
export function animateToDock(win: HTMLElement, target: HTMLElement, onDone: () => void): number {
  cancelAnimations(win);
  const frames = genieFrames(win, target);
  win.style.pointerEvents = 'none';
  win.style.transformOrigin = 'center';
  win.animate(frames, { duration: DOCK_MS, easing: 'cubic-bezier(0.55, 0, 0.75, 0.1)', fill: 'forwards' });
  return window.setTimeout(() => {
    // Hold the end state inline so nothing flashes between cancel and the caller hiding it.
    win.style.opacity = '0';
    cancelAnimations(win);
    onDone();
  }, DOCK_MS);
}

/** Grows the window back out of its dock icon. The window must already be displayed. */
export function animateFromDock(win: HTMLElement, target: HTMLElement, onDone: () => void): number {
  cancelAnimations(win);
  const frames = genieFrames(win, target).reverse().map((f, i, all) => ({
    ...f,
    offset: f.offset === undefined ? undefined : 1 - (f.offset as number),
    ...(i === all.length - 1 ? { opacity: 1 } : {}),
  }));
  win.style.opacity = '';
  win.animate(frames, { duration: DOCK_MS, easing: APPLE_EASE });
  return window.setTimeout(() => {
    win.style.pointerEvents = '';
    onDone();
  }, DOCK_MS);
}

/**
 * Scale + fade in from `fromScale` with a spring, ending on the element's own transform
 * (the animation never touches its inline styles). Returns a timer that fires when it settles.
 */
export function animatePopIn(
  el: HTMLElement,
  fromScale: number,
  durationMs: number,
  settleMs: number,
  easing: string = SPRING_EASE,
): number {
  cancelAnimations(el);
  const base = getComputedStyle(el).transform;
  const from = `${base === 'none' ? '' : base} scale(${fromScale})`.trim();
  el.animate([{ transform: from }, {}], { duration: durationMs, easing });
  el.animate([{ opacity: 0 }, {}], { duration: Math.round(durationMs * 0.6), easing: 'ease-out' });
  return window.setTimeout(() => {}, settleMs);
}

/** Fade + shrink out over `durationMs`. */
export function animatePopOut(el: HTMLElement, toScale: number, durationMs: number): void {
  el.style.transition = `transform ${durationMs}ms ease-in, opacity ${durationMs}ms ease-in`;
  el.style.transform = `scale(${toScale})`;
  el.style.opacity = '0';
}

/** iOS sheet: slides up from the bottom edge. */
export function animateSheetIn(el: HTMLElement): number {
  el.style.transition = 'none';
  el.style.transform = 'translateY(105%)';
  void el.offsetWidth;
  el.style.transition = `transform 460ms ${APPLE_EASE}`;
  el.style.transform = '';
  return window.setTimeout(() => {
    el.style.transition = '';
  }, 480);
}

export function animateSheetOut(el: HTMLElement, durationMs: number): void {
  el.style.transition = `transform ${durationMs}ms cubic-bezier(0.4, 0, 1, 1)`;
  el.style.transform = 'translateY(105%)';
}

export function resetAnimationStyles(el: HTMLElement): void {
  cancelAnimations(el);
  el.style.transition = '';
  el.style.transform = '';
  el.style.opacity = '';
  el.style.pointerEvents = '';
}
