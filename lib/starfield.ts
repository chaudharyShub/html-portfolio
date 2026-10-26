/**
 * Time Machine backdrop: stars drifting toward the viewer on a canvas. `warp` speeds them up into
 * streaks for a moment (forward = into the past, backward = toward the present), then they ease
 * back to a slow drift. Plain canvas, no libraries; only runs while started.
 */

interface Star {
  x: number;
  y: number;
  z: number;
}

const COUNT = 220;
const DRIFT = 0.0012;
const MAX_WARP = 0.045;

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
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  resize();

  const project = (s: Star, z: number) => {
    const f = Math.max(width, height) * 0.5;
    return { x: width / 2 + (s.x / z) * f, y: height * 0.42 + (s.y / z) * f };
  };

  const draw = () => {
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
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
