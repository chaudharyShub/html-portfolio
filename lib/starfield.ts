/**
 * Time Machine backdrop: stars drifting toward the viewer on a canvas. `warp` speeds them up into
 * streaks for a moment (forward = into the past, backward = toward the present), then they ease
 * back to a slow drift. A small ringed planet sits far away; a trip nudges it a little and it
 * floats back. Plain canvas, no libraries; only runs while started.
 */

interface Star {
  x: number;
  y: number;
  z: number;
}

const COUNT = 220;
const DRIFT = 0.0012;
const MAX_WARP = 0.045;

/** Far-away planets, placed as fractions of the canvas (one for now, the ringed one). */
interface Planet {
  x: number;
  y: number;
  /** Radius as a fraction of the canvas's shorter side. */
  r: number;
  /** Lit side and shadow side of the sphere. */
  light: string;
  dark: string;
  ring?: boolean;
  /** How far a warp pushes it (bigger = closer). */
  depth: number;
}

const PLANETS: Planet[] = [
  // Small, cool, with a ring, high up between the year and the place.
  { x: 0.57, y: 0.085, r: 0.036, light: 'rgba(170, 205, 255, 0.85)', dark: 'rgba(28, 38, 92, 0.85)', ring: true, depth: 0.5 },
];

export interface Starfield {
  /** direction: 1 = back in time (fly forward), -1 = toward today. steps: how far the jump is. */
  warp: (direction: 1 | -1, steps: number) => void;
  stop: () => void;
}

export function startStarfield(canvas: HTMLCanvasElement, reducedMotion: boolean): Starfield {
  const ctx = canvas.getContext('2d');
  const stars: Star[] = Array.from({ length: COUNT }, () => newStar(Math.random()));
  let speed = DRIFT;
  let boost = 0; // extra speed from a warp, decays every frame
  let nudge = 0; // planets' push from a warp; springs back to 0
  let nudgeV = 0;
  let frame = 0;
  let width = 0;
  let height = 0;

  function newStar(z: number): Star {
    return { x: Math.random() * 2 - 1, y: Math.random() * 2 - 1, z: Math.max(z, 0.02) };
  }

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  // Resizing clears the canvas; with reduced motion no next frame repaints it, so draw it again.
  const observer = new ResizeObserver(() => {
    resize();
    if (reducedMotion) draw();
  });
  observer.observe(canvas);
  resize();

  const project = (s: Star, z: number) => {
    const f = Math.max(width, height) * 0.5;
    return { x: width / 2 + (s.x / z) * f, y: height * 0.42 + (s.y / z) * f };
  };

  const drawPlanets = () => {
    if (!ctx) return;
    const side = Math.min(width, height);
    for (const pl of PLANETS) {
      // A warp pushes the planets outward from the center (into the past) or inward (back).
      const push = nudge * pl.depth;
      const cx = width / 2 + (pl.x * width - width / 2) * (1 + push * 0.12);
      const cy = height * 0.42 + (pl.y * height - height * 0.42) * (1 + push * 0.12);
      const r = pl.r * side * (1 + push * 0.06);
      // A solid sphere lit from the top right, with a soft glow around it.
      const halo = ctx.createRadialGradient(cx, cy, r * 0.9, cx, cy, r * 1.5);
      halo.addColorStop(0, pl.light.replace(/[\d.]+\)$/, '0.16)'));
      halo.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(cx, cy, r * 1.5, 0, Math.PI * 2);
      ctx.fill();
      const g = ctx.createRadialGradient(cx + r * 0.4, cy - r * 0.4, r * 0.05, cx, cy, r);
      g.addColorStop(0, pl.light);
      g.addColorStop(1, pl.dark);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      if (pl.ring) {
        ctx.strokeStyle = 'rgba(200, 220, 255, 0.5)';
        ctx.lineWidth = Math.max(1.2, r * 0.1);
        ctx.beginPath();
        ctx.ellipse(cx, cy, r * 1.9, r * 0.48, -0.35, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  };

  const draw = () => {
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    drawPlanets();
    const streak = Math.abs(speed) > DRIFT * 3;
    for (const s of stars) {
      const prevZ = s.z;
      s.z -= speed;
      if (s.z <= 0.02) Object.assign(s, newStar(1));
      else if (s.z > 1) Object.assign(s, newStar(0.03));
      const p = project(s, s.z);
      if (p.x < -20 || p.x > width + 20 || p.y < -20 || p.y > height + 20) {
        Object.assign(s, newStar(speed >= 0 ? 1 : 0.05));
        continue;
      }
      const light = Math.min(1, (1 - s.z) * 1.3);
      ctx.strokeStyle = ctx.fillStyle = `rgba(${200 + light * 55}, ${215 + light * 40}, 255, ${0.25 + light * 0.75})`;
      if (streak) {
        const q = project(s, Math.min(1, prevZ + speed * 2.5));
        ctx.lineWidth = 0.6 + light * 1.4;
        ctx.beginPath();
        ctx.moveTo(q.x, q.y);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 0.4 + light * 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  };

  const tick = () => {
    boost *= 0.94;
    if (Math.abs(boost) < 0.0004) boost = 0;
    // Planets: a soft spring back to where they rest.
    nudgeV += -nudge * 0.02 + boost * 0.6;
    nudgeV *= 0.9;
    nudge += nudgeV;
    if (Math.abs(nudge) < 0.0005 && Math.abs(nudgeV) < 0.0005) nudge = nudgeV = 0;
    speed = DRIFT + boost;
    draw();
    frame = requestAnimationFrame(tick);
  };

  if (reducedMotion) draw();
  else frame = requestAnimationFrame(tick);

  return {
    warp: (direction, steps) => {
      if (reducedMotion) return;
      const amount = Math.min(MAX_WARP, 0.02 + steps * 0.012);
      // Toward today the stars stream back out of the tunnel.
      boost = direction === 1 ? amount : -amount - DRIFT;
    },
    stop: () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    },
  };
}
