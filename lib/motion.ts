/**
 * Imperative window/dialog animations. They write transient styles straight to the element
 * (or use the Web Animations API) because they must measure live layout; React state only
 * decides *when* they run. Every caller skips them under prefers-reduced-motion.
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

/** A CSS cubic-bezier() as a function, for animations driven from JS. */
export function cubicBezier(x1: number, y1: number, x2: number, y2: number): (x: number) => number {
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;
  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;
  const sampleX = (t: number) => ((ax * t + bx) * t + cx) * t;
  const sampleY = (t: number) => ((ay * t + by) * t + cy) * t;
  return (x) => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    // Bisection always converges; 20 steps is far below a pixel.
    let lo = 0;
    let hi = 1;
    let t = x;
    for (let i = 0; i < 20; i++) {
      t = (lo + hi) / 2;
      if (sampleX(t) < x) lo = t;
      else hi = t;
    }
    return sampleY(t);
  };
}

const appleEase = cubicBezier(0.32, 0.72, 0, 1);
const easeInOut = cubicBezier(0.42, 0, 0.58, 1);

function clamp01(v: number): number {
  return Math.min(1, Math.max(0, v));
}

/**
 * Calls `frame(t)` every animation frame with t going 0 -> 1 over `durationMs`, then `done`.
 * Returns a cancel function (which skips `done`).
 */
function tween(durationMs: number, frame: (t: number) => void, done: () => void): () => void {
  const start = performance.now();
  let id = 0;
  const step = () => {
    const t = clamp01((performance.now() - start) / durationMs);
    frame(t);
    if (t < 1) id = requestAnimationFrame(step);
    else done();
  };
  frame(0);
  id = requestAnimationFrame(step);
  return () => cancelAnimationFrame(id);
}

/**
 * Marks the page as mid-animation: the live wallpaper pauses (so blurred glass above it need
 * not be redrawn every frame). Returns the function that clears the mark.
 */
function markAnimating(): () => void {
  document.documentElement.classList.add('os-animating');
  let done = false;
  return () => {
    if (done) return;
    done = true;
    document.documentElement.classList.remove('os-animating');
  };
}

export function cancelAnimations(el: HTMLElement): void {
  el.getAnimations().forEach((a) => a.cancel());
}

/* ===== Minimize on macOS: the genie effect ===== */

type Point = readonly [number, number];

/**
 * A CSS matrix3d() that maps a width x height box (transform-origin 0 0) onto any convex
 * quad p0..p3 (top-left, top-right, bottom-right, bottom-left): a projective "square to quad"
 * mapping. Pure transform, so the GPU can move it without repainting.
 */
function quadTransform(width: number, height: number, p0: Point, p1: Point, p2: Point, p3: Point): string {
  const [x0, y0] = p0;
  const [x1, y1] = p1;
  const [x2, y2] = p2;
  const [x3, y3] = p3;
  const dx1 = x1 - x2;
  const dx2 = x3 - x2;
  const dx3 = x0 - x1 + x2 - x3;
  const dy1 = y1 - y2;
  const dy2 = y3 - y2;
  const dy3 = y0 - y1 + y2 - y3;
  const den = dx1 * dy2 - dx2 * dy1;
  let g = 0;
  let h = 0;
  if (Math.abs(den) > 1e-9 && (Math.abs(dx3) > 1e-9 || Math.abs(dy3) > 1e-9)) {
    g = (dx3 * dy2 - dx2 * dy3) / den;
    h = (dx1 * dy3 - dx3 * dy1) / den;
  }
  const a = x1 - x0 + g * x1;
  const b = x3 - x0 + h * x3;
  const d = y1 - y0 + g * y1;
  const e = y3 - y0 + h * y3;
  // Unit square -> the box's pixels, written column by column.
  const m = [a / width, d / width, 0, g / width, b / height, e / height, 0, h / height, 0, 0, 1, 0, x0, y0, 0, 1];
  return `matrix3d(${m.join(',')})`;
}

const GENIE_MS = 560;

/**
 * Fired on a window right before the genie copies it. A restoring window was hidden until a
 * moment ago, so anything it sizes with JS (the sidebar's selection highlight) re-measures here.
 */
export const BEFORE_GENIE_COPY = 'beforegeniecopy';

/** The first layer of a computed box-shadow ("rgba(...) 0px 24px 70px 0px, ..."), if any. */
function parseShadow(value: string): { color: string; y: number; blur: number } | null {
  const m = /^(rgba?\([^)]*\)|#[0-9a-f]+)\s+(-?[\d.]+)px\s+(-?[\d.]+)px\s+([\d.]+)px/i.exec(value);
  if (!m) return null;
  const blur = parseFloat(m[4]!);
  return blur > 0 ? { color: m[1]!, y: parseFloat(m[3]!), blur } : null;
}

/** A block inside an on-screen section that a strip may swap for an empty box (see `trimToSlice`). */
interface TrimBlock {
  top: number;
  bottom: number;
  height: number;
  marginTop: string;
  marginBottom: string;
}

const TRIM_ATTR = 'data-genie-block';

/**
 * True when an empty box with the same height and margins takes exactly the same space as `el`:
 * it is a plain block whose children's margins can't leak out of it (text only, or a box that
 * contains them: table, grid, flex, flow-root). The legend is skipped (fieldsets draw it specially).
 */
function isTrimmable(el: Element): boolean {
  if (el.tagName === 'LEGEND') return false;
  const display = getComputedStyle(el).display;
  if (['table', 'grid', 'flex', 'flow-root'].includes(display)) return true;
  return display === 'block' && el.childElementCount === 0;
}

/** An empty box that takes the same space as a trimmed block. */
function spacerFor(block: TrimBlock): HTMLElement {
  const spacer = document.createElement('div');
  spacer.style.height = `${block.height}px`;
  spacer.style.marginTop = block.marginTop;
  spacer.style.marginBottom = block.marginBottom;
  return spacer;
}

/**
 * A copy of the window for the genie strips, as cheap to lay out as possible: no ids, no
 * resize handles, hidden tab sections dropped and sections scrolled out of view replaced by
 * empty boxes of the same size (the copies only ever show what is on screen).
 * The blocks of the on-screen sections are tagged and returned, so each strip can also drop
 * the ones outside its own slice.
 */
function lightCopy(win: HTMLElement): { copy: HTMLElement; blocks: TrimBlock[] } {
  const copy = win.cloneNode(true) as HTMLElement;
  const blocks: TrimBlock[] = [];
  const view = (win.querySelector('.content') ?? win).getBoundingClientRect();
  const slots = win.querySelectorAll<HTMLElement>('.section-slot');
  const copySlots = copy.querySelectorAll<HTMLElement>('.section-slot');
  slots.forEach((slot, i) => {
    const copySlot = copySlots[i];
    if (!copySlot) return;
    if (slot.hidden) {
      copySlot.remove();
      return;
    }
    [...slot.children].forEach((child, k) => {
      const r = child.getBoundingClientRect();
      if (r.bottom >= view.top && r.top <= view.bottom) {
        const copySection = copySlot.children[k];
        [...child.children].forEach((block, j) => {
          if (!isTrimmable(block)) return;
          const b = block.getBoundingClientRect();
          const style = getComputedStyle(block);
          copySection?.children[j]?.setAttribute(TRIM_ATTR, String(blocks.length));
          blocks.push({
            top: b.top,
            bottom: b.bottom,
            height: b.height,
            marginTop: style.marginTop,
            marginBottom: style.marginBottom,
          });
        });
        return;
      }
      const spacer = document.createElement('div');
      spacer.style.height = `${r.height}px`;
      spacer.style.marginBottom = getComputedStyle(child).marginBottom;
      copySlot.children[k]?.replaceWith(spacer);
    });
  });
  copy.querySelectorAll('.resize-handle').forEach((n) => n.remove());
  // The Terminal's invisible input is styled by its id, which copies lose (it would show as a box).
  copy.querySelector('#terminal-input')?.remove();
  copy.removeAttribute('id');
  copy.querySelectorAll('[id]').forEach((n) => n.removeAttribute('id'));
  copy.classList.add('genie-copy');
  return { copy, blocks };
}

/**
 * Swaps the tagged blocks that lie outside a strip's slice (screen y from `top` to `bottom`)
 * for empty boxes of the same size, so each strip only lays out what it shows. Positions don't
 * move, so the strips still line up exactly.
 */
function trimToSlice(copy: HTMLElement, blocks: TrimBlock[], top: number, bottom: number): void {
  copy.querySelectorAll(`[${TRIM_ATTR}]`).forEach((el) => {
    const block = blocks[Number(el.getAttribute(TRIM_ATTR))];
    if (block && (block.bottom <= top || block.top >= bottom)) el.replaceWith(spacerFor(block));
  });
}

/** Points along a rounded corner (a quarter circle around cx, cy), as polygon coordinates. */
function arc(cx: number, cy: number, r: number, fromDeg: number, toDeg: number): Point[] {
  const pts: Point[] = [];
  for (let k = 0; k <= 4; k++) {
    const a = ((fromDeg + ((toDeg - fromDeg) * k) / 4) * Math.PI) / 180;
    pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  return pts;
}

/**
 * The genie's shadow is drawn this much smaller and stretched back to full size. It is so soft
 * that nobody can tell, and blurring a quarter-size picture is ~16x less work per frame.
 */
const SHADOW_SCALE = 0.25;

/**
 * The window is copied into thin horizontal strips. Each strip is only as big as its slice
 * (so the browser composites one window's worth of pixels in total) and the copies have no
 * live blur or shadow. Each frame, every strip is warped (a transform only, so nothing is
 * repainted) onto its slice of a funnel that bends toward the dock icon, and the strips slide
 * down through it into the icon.
 * A window that is frosted glass itself (the Terminal) gets its glass from one funnel-shaped
 * backing under the strips, and its copies are drawn without a background: see-through strips
 * show dark lines where they overlap, and light seams if they only touch.
 * The window's drop shadow is one blurred funnel-shaped shape under everything, so the shadow
 * stays on while the window bends (one blur per frame, like the glass).
 * `minimizing` plays it forwards; otherwise it plays backwards (restore). The real window
 * stays hidden (visibility) while the copies play.
 */
function genie(win: HTMLElement, icon: HTMLElement, minimizing: boolean, onDone: () => void): () => void {
  const w = win.getBoundingClientRect();
  const ic = icon.getBoundingClientRect();
  // Strips vanish into the middle of the icon (the dock is drawn above them).
  const limit = ic.top + ic.height / 2;
  const travel = Math.max(1, limit - w.top);
  const count = Math.max(10, Math.min(16, Math.round(w.height / 44)));
  const band = w.height / count;
  const unmark = markAnimating();

  const scrollers = (root: HTMLElement) => [root, ...root.querySelectorAll<HTMLElement>('.content, .terminal-body')];
  const scrollTops = scrollers(win).map((el) => el.scrollTop);

  win.dispatchEvent(new Event(BEFORE_GENIE_COPY));
  const winStyle = getComputedStyle(win);
  const shadow = parseShadow(winStyle.boxShadow);
  const blur = winStyle.backdropFilter || winStyle.getPropertyValue('-webkit-backdrop-filter');
  const glass = blur && blur !== 'none' ? blur : '';
  const radius = parseFloat(winStyle.borderTopLeftRadius) || 0;

  const { copy: template, blocks } = lightCopy(win);
  if (glass) template.style.setProperty('background', 'transparent', 'important');

  const layer = document.createElement('div');
  layer.className = 'genie-layer';
  layer.setAttribute('aria-hidden', 'true');
  layer.inert = true;
  layer.style.zIndex = winStyle.zIndex;

  // The shadow and the glass backing span the whole funnel: the window and the icon it shrinks into.
  const box = { left: Math.min(w.left, ic.left), top: w.top, right: Math.max(w.right, ic.right) };
  const boxHeight = Math.max(w.height, limit - w.top);

  // Shadow: the funnel drawn with a canvas shadow (same blur radius as box-shadow) into a small
  // canvas that CSS stretches over the funnel, with a margin so the blur isn't cut off.
  let shadowCtx: CanvasRenderingContext2D | null = null;
  const margin = shadow ? shadow.blur : 0;
  if (shadow) {
    const canvas = document.createElement('canvas');
    canvas.className = 'genie-shadow';
    const width = box.right - box.left + 2 * margin;
    const height = boxHeight + 2 * margin;
    canvas.width = Math.ceil(width * SHADOW_SCALE);
    canvas.height = Math.ceil(height * SHADOW_SCALE);
    Object.assign(canvas.style, {
      left: `${box.left - margin}px`,
      top: `${box.top - margin + shadow.y}px`,
      width: `${width}px`,
      height: `${height}px`,
    });
    shadowCtx = canvas.getContext('2d');
    if (shadowCtx) {
      // Only the shadow is wanted: the shape is drawn off the canvas and its shadow is moved back.
      shadowCtx.shadowColor = shadow.color;
      shadowCtx.shadowBlur = shadow.blur * SHADOW_SCALE;
      shadowCtx.shadowOffsetX = canvas.width + 100;
      layer.appendChild(canvas);
    }
  }

  let backing: HTMLElement | null = null;
  if (glass) {
    backing = document.createElement('div');
    backing.className = 'genie-glass';
    Object.assign(backing.style, {
      left: `${box.left}px`,
      top: `${box.top}px`,
      width: `${box.right - box.left}px`,
      height: `${boxHeight}px`,
      background: winStyle.backgroundColor,
      backdropFilter: glass,
    });
    backing.style.setProperty('-webkit-backdrop-filter', glass);
    layer.appendChild(backing);
  }

  const strips: HTMLElement[] = [];
  // Pin each copy to its strip's corner (the strip is its containing block), at full size.
  const pin = (copy: HTMLElement, y: number) => {
    const set = (prop: string, value: string) => copy.style.setProperty(prop, value, 'important');
    set('left', '0px');
    set('top', `${-y}px`);
    set('width', `${w.width}px`);
    set('height', `${w.height}px`);
    set('max-height', 'none');
    set('transform', 'none');
  };
  for (let i = 0; i < count; i++) {
    const strip = document.createElement('div');
    strip.className = 'genie-strip';
    strip.style.left = `${w.left}px`;
    strip.style.top = `${w.top + i * band}px`;
    strip.style.width = `${w.width}px`;
    strip.style.height = `${band + 1}px`;
    const copy = (i === count - 1 ? template : template.cloneNode(true)) as HTMLElement;
    trimToSlice(copy, blocks, w.top + i * band, w.top + (i + 1) * band + 1);
    pin(copy, i * band);
    strip.appendChild(copy);
    layer.appendChild(strip);
    strips.push(strip);
  }
  document.body.appendChild(layer);
  for (const strip of strips) {
    scrollers(strip.firstElementChild as HTMLElement).forEach((el, k) => {
      el.scrollTop = scrollTops[k] ?? 0;
    });
  }
  win.style.visibility = 'hidden';

  // Left/right edge of the funnel at screen height y, for a given amount of bend (0..1).
  const edges = (y: number, bend: number): [number, number] => {
    const u = clamp01((y - w.top) / travel);
    const f = bend * u * u * (3 - 2 * u);
    return [w.left + (ic.left - w.left) * f, w.right + (ic.right - w.right) * f];
  };

  /** The outline of the funnel between two heights (screen coordinates), rounded like the window. */
  const funnel = (top: number, bottom: number, bend: number): Point[] => {
    const r = Math.min(radius, (bottom - top) / 2);
    // The bottom corners are only rounded while the window's real bottom is above the dock.
    const rb = bottom < limit ? r : 0;
    const [topL, topR] = edges(top, bend);
    const [botL, botR] = edges(bottom, bend);
    const left: Point[] = [];
    const right: Point[] = [];
    const steps = 24;
    for (let k = 0; k <= steps; k++) {
      const at = top + r + ((bottom - rb - top - r) * k) / steps;
      const [l, rr] = edges(at, bend);
      left.unshift([l, at]);
      right.push([rr, at]);
    }
    return [
      ...arc(topL + r, top + r, r, 180, 270),
      ...arc(topR - r, top + r, r, 270, 360),
      ...right,
      ...arc(botR - rb, bottom - rb, rb, 0, 90),
      ...arc(botL + rb, bottom - rb, rb, 90, 180),
      ...left,
    ];
  };

  /** Shapes the shadow and the glass backing to the part of the funnel still above the dock. */
  const shapeUnderlays = (top: number, bottom: number, bend: number) => {
    const visible = bottom - top >= 0.5;
    const outline = visible ? funnel(top, bottom, bend) : [];
    if (backing) {
      backing.style.visibility = visible ? '' : 'hidden';
      const pts = outline.map(([x, y]) => `${(x - box.left).toFixed(1)}px ${(y - box.top).toFixed(1)}px`);
      if (visible) backing.style.clipPath = `polygon(${pts.join(', ')})`;
    }
    if (shadowCtx) {
      const ctx = shadowCtx;
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      if (!visible) return;
      const ox = box.left - margin;
      const oy = box.top - margin;
      ctx.beginPath();
      outline.forEach(([x, y], k) => {
        const cx = (x - ox) * SHADOW_SCALE - ctx.shadowOffsetX;
        const cy = (y - oy) * SHADOW_SCALE;
        if (k === 0) ctx.moveTo(cx, cy);
        else ctx.lineTo(cx, cy);
      });
      ctx.closePath();
      ctx.fill();
    }
  };

  const frame = (time: number) => {
    const t = minimizing ? time : 1 - time;
    const bend = easeInOut(clamp01(t / 0.5));
    const slide = clamp01((t - 0.28) / 0.72);
    const dy = slide * slide * travel;
    shapeUnderlays(Math.min(limit, w.top + dy), Math.min(limit, w.bottom + dy), bend);
    strips.forEach((strip, i) => {
      const top = w.top + i * band + dy;
      // The strip is band + 1 px tall, so neighbors overlap and no hairline gaps show.
      const bottom = Math.min(limit, top + band + 1);
      if (bottom - top < 0.5) {
        strip.style.visibility = 'hidden';
        return;
      }
      strip.style.visibility = '';
      const [lt, rt] = edges(top, bend);
      const [lb, rb] = edges(bottom, bend);
      // Quad corners relative to the strip's resting position.
      const ox = w.left;
      const oy = w.top + i * band;
      strip.style.transform = quadTransform(
        w.width,
        band + 1,
        [lt - ox, top - oy],
        [rt - ox, top - oy],
        [rb - ox, bottom - oy],
        [lb - ox, bottom - oy],
      );
    });
  };

  const cleanup = () => {
    layer.remove();
    win.style.visibility = '';
    unmark();
  };
  const cancel = tween(minimizing ? GENIE_MS : GENIE_MS - 40, frame, () => {
    // Stay invisible until the caller hides the window for real.
    if (minimizing) win.style.opacity = '0';
    cleanup();
    onDone();
  });
  return () => {
    cancel();
    cleanup();
  };
}

/* ===== Minimize on iOS: back to the Home Screen ===== */

const IOS_HOME_MS = 420;

/** The app shrinks into its icon, its corners rounding to the icon's, and fades as it lands. */
function iosZoomFrames(win: HTMLElement, icon: HTMLElement): Keyframe[] {
  const from = win.getBoundingClientRect();
  const to = icon.getBoundingClientRect();
  const sx = Math.max(0.03, to.width / from.width);
  const sy = Math.max(0.03, to.height / from.height);
  const dx = to.left + to.width / 2 - (from.left + from.width / 2);
  const dy = to.top + to.height / 2 - (from.top + from.height / 2);
  // The icon's corner radius (22.5%), expressed before the scale, per axis.
  const radius = `${(0.225 * to.width) / sx}px / ${(0.225 * to.height) / sy}px`;
  return [
    { transform: 'none', borderRadius: '0px', opacity: 1 },
    { opacity: 1, offset: 0.55 },
    { transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})`, borderRadius: radius, opacity: 0 },
  ];
}

function iosZoom(win: HTMLElement, icon: HTMLElement, closing: boolean, onDone: () => void): () => void {
  cancelAnimations(win);
  const frames = iosZoomFrames(win, icon);
  const played = closing
    ? frames
    : [...frames].reverse().map((f) => ({ ...f, offset: f.offset === undefined ? undefined : 1 - (f.offset as number) }));
  win.style.pointerEvents = 'none';
  win.animate(played, { duration: IOS_HOME_MS, easing: APPLE_EASE, fill: closing ? 'forwards' : 'none' });
  const timer = window.setTimeout(() => {
    if (closing) win.style.opacity = '0';
    cancelAnimations(win);
    win.style.pointerEvents = '';
    onDone();
  }, IOS_HOME_MS);
  return () => {
    window.clearTimeout(timer);
    cancelAnimations(win);
  };
}

/** Minimize: genie into the dock icon (macOS) or zoom into the Home Screen icon (iOS). Returns a cancel function. */
export function animateToDock(win: HTMLElement, target: HTMLElement, onDone: () => void): () => void {
  return isPhoneLayout() ? iosZoom(win, target, true, onDone) : genie(win, target, true, onDone);
}

/** Restore: the reverse of animateToDock. The window must already be displayed. */
export function animateFromDock(win: HTMLElement, target: HTMLElement, onDone: () => void): () => void {
  win.style.opacity = '';
  return isPhoneLayout() ? iosZoom(win, target, false, onDone) : genie(win, target, false, onDone);
}

/* ===== Zoom (maximize / restore) ===== */

const FRAME_PROPS = ['left', 'top', 'width', 'height', 'max-height', 'transform'] as const;

/**
 * Glides the window's real frame from one rectangle to another, so the content reflows like a
 * macOS window resize instead of being stretched. Inline !important values beat the
 * maximized/snapped class rules while it runs; the previous inline values are put back after.
 */
export function animateFrame(
  el: HTMLElement,
  from: DOMRect,
  to: DOMRect,
  onDone: () => void,
  /** Heavy content to lay out once, at its final width, instead of on every frame. */
  freeze?: HTMLElement | null,
): () => void {
  const saved = FRAME_PROPS.map((p) => [p, el.style.getPropertyValue(p), el.style.getPropertyPriority(p)] as const);
  const scroller = freeze?.parentElement;
  if (freeze && scroller) {
    freeze.style.width = `${freeze.getBoundingClientRect().width}px`;
    scroller.style.overflowX = 'hidden';
  }
  const unmark = markAnimating();
  const restore = () => {
    for (const [p, value, priority] of saved) {
      if (value) el.style.setProperty(p, value, priority);
      else el.style.removeProperty(p);
    }
    if (freeze && scroller) {
      freeze.style.width = '';
      scroller.style.overflowX = '';
    }
    unmark();
  };
  el.style.setProperty('transform', 'none', 'important');
  el.style.setProperty('max-height', 'none', 'important');
  const cancel = tween(
    380,
    (t) => {
      const p = appleEase(t);
      const at = (a: number, b: number) => `${(a + (b - a) * p).toFixed(2)}px`;
      el.style.setProperty('left', at(from.left, to.left), 'important');
      el.style.setProperty('top', at(from.top, to.top), 'important');
      el.style.setProperty('width', at(from.width, to.width), 'important');
      el.style.setProperty('height', at(from.height, to.height), 'important');
    },
    () => {
      restore();
      onDone();
    },
  );
  return () => {
    cancel();
    restore();
  };
}

/* ===== Open / close / sheets ===== */

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
  el.style.visibility = '';
}
