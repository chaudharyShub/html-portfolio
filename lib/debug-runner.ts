/**
 * Debug Runner: a small jump-over-the-bugs game drawn on a canvas.
 *
 * Everything moves per second, not per frame, so a 120Hz screen plays at the same speed as a
 * 60Hz one (the first version moved per frame and ran twice as fast on fast screens).
 * Holding the jump goes higher than a tap. Obstacles: a bug (jump), a memory leak (a wide
 * puddle: hold for a long jump), a merge conflict (two bugs: two quick hops) and a floating 404
 * (stay on the ground, or clear it with a full jump). Coffee gives a few seconds of "hotfix
 * mode" (nothing can hit you). Every 100 points a version ships and the game speeds up a step.
 * Plain canvas, no libraries; only runs while started.
 */

const PLAYER_X = 24;
const PLAYER_W = 22;
const PLAYER_H = 28;
/** Space under the ground line. */
const FLOOR = 8;

const JUMP_V = 430; // px/s
const GRAVITY = 2160; // px/s²
/** Gravity while the jump is held, for up to MAX_HOLD seconds: holding goes higher. */
const HOLD_GRAVITY = 0.4;
const MAX_HOLD = 0.25;
/** Letting go early cuts the climb. */
const RELEASE_CUT = 0.6;
/** A press this soon before landing still jumps on landing. */
const JUMP_BUFFER = 0.12;

const BASE_SPEED = 180; // px/s
const SPEED_STEP = 30; // per version shipped (100 points)
const MAX_SPEED = 480;
const POINTS_PER_SECOND = 10;
const HOTFIX_SECONDS = 4;

type Kind = 'bug' | 'leak' | 'notfound';

interface Obstacle {
  kind: Kind;
  x: number;
  /** Height of its bottom above the ground. */
  y: number;
  w: number;
  h: number;
  /** Small caption drawn above it ("memory leak", "merge conflict"). */
  label?: string;
}

interface Coffee {
  x: number;
  y: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  max: number;
  color: string;
}

interface Building {
  x: number;
  w: number;
  h: number;
}

interface Colors {
  accent: string;
  text: string;
  text2: string;
  red: string;
  orange: string;
  /** The site's mono font stack, for the canvas text. */
  mono: string;
}

export interface RunnerEvents {
  /** The shown score changed. */
  onScore: (score: number) => void;
  /** The run ended (hit something) with this score. */
  onGameOver: (score: number) => void;
}

export interface Runner {
  /** Starts a new run. */
  start: () => void;
  /** Stops the run (the dialog closed). */
  stop: () => void;
  /** Jump button down / up (Space, mouse, finger). */
  press: () => void;
  release: () => void;
  isRunning: () => boolean;
  /** Draws the current frame once (e.g. after opening or a theme change). */
  render: () => void;
  destroy: () => void;
}

/** One of these shows on every game over (never the same twice in a row). */
export const GAME_OVER_LINES = [
  'Works on my machine.',
  'Deployed to prod on a Friday.',
  'It was a feature, actually.',
  'Have you tried turning it off and on again?',
  'Should have written the tests first.',
  'Rolled back. Nobody saw anything.',
  'That bug was in the backlog for months.',
  'Merged without review.',
];

const rand = (min: number, max: number) => min + Math.random() * (max - min);

/** "v1.1" for the first 100 points, ... "v1.9", then "v2.0". */
export function versionName(shipped: number) {
  return `v${1 + Math.floor(shipped / 10)}.${shipped % 10}`;
}

export function createRunner(canvas: HTMLCanvasElement, events: RunnerEvents, reducedMotion: boolean): Runner {
  const ctx = canvas.getContext('2d');
  let width = 0;
  let height = 0;
  let colors: Colors = {
    accent: '#0066cc',
    text: '#1d1d1f',
    text2: '#6e6e73',
    red: '#d70015',
    orange: '#ff9500',
    mono: 'ui-monospace, monospace',
  };
  let colorsReadAt = 0;

  // Run state.
  let running = false;
  let frame = 0;
  let last = 0;
  let score = 0;
  let shownScore = 0;
  let shipped = 0;
  let speed = BASE_SPEED;
  let playerY = 0;
  let vy = 0;
  let inAir = false;
  let holding = false;
  let holdTime = 0;
  let pressed = false;
  let buffered = -1; // seconds since a press that came while in the air
  let squash = 0; // landing squash, counts down
  let hotfix = 0; // seconds of hotfix mode left
  let spawnIn = 1.2;
  let coffeeIn = rand(10, 16);
  let banner = 0;
  let bannerText = '';
  let obstacles: Obstacle[] = [];
  let coffees: Coffee[] = [];
  let particles: Particle[] = [];
  let scroll = 0;
  const far: Building[] = [];
  const near: Building[] = [];

  const readColors = () => {
    const css = getComputedStyle(canvas);
    const v = (name: string, fallback: string) => css.getPropertyValue(name).trim() || fallback;
    colors = {
      accent: v('--accent', colors.accent),
      text: v('--text', colors.text),
      text2: v('--text-2', colors.text2),
      red: v('--red-text', colors.red),
      orange: v('--orange', colors.orange),
      mono: v('--mono', colors.mono),
    };
  };

  /** Fills a skyline layer with buildings across twice the stage width. */
  const buildSkyline = (layer: Building[], minH: number, maxH: number) => {
    layer.length = 0;
    let x = 0;
    while (x < Math.max(width, 300) * 2) {
      const w = rand(22, 56);
      layer.push({ x, w, h: rand(minH, maxH) });
      x += w + rand(2, 10);
    }
  };

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
    buildSkyline(far, 24, 70);
    buildSkyline(near, 14, 42);
    if (!running) draw();
  };
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);

  /** Ground-based coordinates (y up from the ground) to canvas y. */
  const groundY = () => height - FLOOR;

  const burst = (x: number, y: number, count: number, color: string, spread = 70) => {
    if (reducedMotion) return;
    for (let i = 0; i < count; i++) {
      const max = rand(0.25, 0.45);
      particles.push({ x, y, vx: rand(-spread, spread), vy: rand(20, 90), life: max, max, color });
    }
  };

  const spawn = () => {
    const x = width + 10;
    // New kinds join as the score grows, so the start stays easy.
    const pool: Array<Kind | 'conflict'> = ['bug', 'bug', 'bug'];
    if (score >= 40) pool.push('leak', 'leak');
    if (score >= 100) pool.push('conflict', 'conflict');
    if (score >= 160) pool.push('notfound', 'notfound');
    const pick = pool[Math.floor(Math.random() * pool.length)] ?? 'bug';
    let extra = 0;
    if (pick === 'bug') {
      obstacles.push({ kind: 'bug', x, y: 0, w: 18, h: 18 });
    } else if (pick === 'leak') {
      // Wide enough that only a held jump clears it, at any speed.
      const w = Math.min(166, Math.max(56, speed * 0.42 - 4));
      obstacles.push({ kind: 'leak', x, y: 0, w, h: 7, label: 'memory leak' });
      extra = 0.25;
    } else if (pick === 'conflict') {
      // Too far apart for one jump, close enough to need two quick hops.
      const gap = speed * 0.62;
      obstacles.push({ kind: 'bug', x, y: 0, w: 18, h: 18, label: 'merge conflict' });
      obstacles.push({ kind: 'bug', x: x + gap, y: 0, w: 18, h: 18 });
      extra = 0.45;
    } else {
      // Floats just above the runner's head: stay down, or clear it with a full jump.
      obstacles.push({ kind: 'notfound', x, y: 40, w: 32, h: 18 });
    }
    spawnIn = Math.max(0.75, 1.5 - score / 300) + rand(0, 0.35) + extra;
  };

  const jump = () => {
    vy = JUMP_V;
    inAir = true;
    holding = pressed;
    holdTime = 0;
    buffered = -1;
  };

  const land = () => {
    playerY = 0;
    vy = 0;
    inAir = false;
    holding = false;
    squash = 0.12;
    burst(PLAYER_X + PLAYER_W / 2, 0, 6, colors.text2);
    if (buffered >= 0 && buffered <= JUMP_BUFFER) jump();
  };

  const hits = (o: { x: number; y: number; w: number; h: number }) => {
    const inset = 3; // a little forgiveness on every side
    return (
      o.x + o.w - inset > PLAYER_X + inset &&
      o.x + inset < PLAYER_X + PLAYER_W - inset &&
      o.y + o.h - inset > playerY + inset &&
      o.y + inset < playerY + PLAYER_H - inset
    );
  };

  const update = (dt: number) => {
    // Jump: low gravity while held (up to MAX_HOLD), full gravity otherwise.
    if (inAir) {
      const light = holding && holdTime < MAX_HOLD && vy > 0;
      if (holding) holdTime += dt;
      vy -= GRAVITY * (light ? HOLD_GRAVITY : 1) * dt;
      playerY += vy * dt;
      if (buffered >= 0) buffered += dt;
      if (playerY <= 0) land();
    }
    if (squash > 0) squash = Math.max(0, squash - dt);

    score += POINTS_PER_SECOND * dt;
    const nowShipped = Math.floor(score / 100);
    if (nowShipped > shipped) {
      shipped = nowShipped;
      speed = Math.min(MAX_SPEED, BASE_SPEED + SPEED_STEP * shipped);
      bannerText = `${versionName(shipped)} shipped`;
      banner = 1.8;
    }
    if (banner > 0) banner = Math.max(0, banner - dt);
    if (Math.floor(score) !== shownScore) {
      shownScore = Math.floor(score);
      events.onScore(shownScore);
    }

    const dx = speed * dt;
    if (!reducedMotion) scroll += dx;
    spawnIn -= dt;
    if (spawnIn <= 0) spawn();
    if (score >= 60) {
      coffeeIn -= dt;
      if (coffeeIn <= 0) {
        coffees.push({ x: width + 10 + speed * 0.5, y: rand(48, 64) });
        coffeeIn = rand(12, 18);
      }
    }
    for (const o of obstacles) o.x -= dx;
    for (const c of coffees) c.x -= dx;
    obstacles = obstacles.filter((o) => o.x + o.w > -40);
    coffees = coffees.filter((c) => c.x > -30);

    for (const p of particles) {
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy -= 260 * dt;
    }
    particles = particles.filter((p) => p.life > 0);

    // Coffee: a few seconds where nothing can hit you.
    for (const c of coffees) {
      if (hits({ x: c.x - 9, y: c.y - 9, w: 18, h: 18 })) {
        hotfix = HOTFIX_SECONDS;
        burst(c.x, c.y, 10, colors.orange, 110);
        c.x = -100;
      }
    }
    if (hotfix > 0) hotfix = Math.max(0, hotfix - dt);
    else if (obstacles.some(hits)) {
      running = false;
      burst(PLAYER_X + PLAYER_W / 2, playerY + PLAYER_H / 2, 12, colors.red, 120);
      draw();
      events.onGameOver(Math.floor(score));
    }
  };

  /* ===== Drawing ===== */

  const drawSkyline = (layer: Building[], factor: number, alpha: number) => {
    if (!ctx) return;
    const span = layer.reduce((end, b) => Math.max(end, b.x + b.w), 0) + 6;
    const offset = (scroll * factor) % span;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = colors.text;
    for (const b of layer) {
      for (const shift of [0, span]) {
        const x = b.x - offset + shift;
        if (x > width || x + b.w < 0) continue;
        ctx.fillRect(x, groundY() - b.h, b.w, b.h);
      }
    }
    ctx.globalAlpha = 1;
  };

  const drawBug = (x: number, y: number) => {
    if (!ctx) return;
    // The same bug as the app icon (24px grid), drawn 20px wide.
    const s = 20 / 24;
    const left = x - 1;
    const top = groundY() - y - 20;
    ctx.save();
    ctx.translate(left, top);
    ctx.scale(s, s);
    ctx.strokeStyle = '#1f7a35';
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    for (const [x1, y1, x2, y2] of [
      [7, 11, 4, 9],
      [17, 11, 20, 9],
      [7, 15, 3.5, 15],
      [17, 15, 20.5, 15],
      [7.5, 18.5, 5, 21],
      [16.5, 18.5, 19, 21],
    ] as const) {
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
    }
    ctx.stroke();
    ctx.fillStyle = '#34c759';
    ctx.beginPath();
    ctx.ellipse(12, 14, 5, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#30a14e';
    ctx.beginPath();
    ctx.arc(12, 7, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  const drawLabel = (text: string, x: number, y: number) => {
    if (!ctx) return;
    ctx.font = `600 9px ${colors.mono}`;
    ctx.fillStyle = colors.text2;
    ctx.textAlign = 'left';
    ctx.fillText(text, x, y);
  };

  const drawObstacle = (o: Obstacle) => {
    if (!ctx) return;
    const top = groundY() - o.y - o.h;
    if (o.kind === 'bug') drawBug(o.x, o.y);
    else if (o.kind === 'leak') {
      ctx.fillStyle = 'rgba(110, 90, 230, 0.75)';
      ctx.beginPath();
      ctx.ellipse(o.x + o.w / 2, groundY() - 2, o.w / 2, o.h / 2 + 1, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(110, 90, 230, 0.55)';
      for (const f of [0.25, 0.6, 0.85]) {
        ctx.beginPath();
        ctx.arc(o.x + o.w * f, groundY() - o.h - 3, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
    } else {
      ctx.fillStyle = colors.red;
      ctx.globalAlpha = 0.14;
      ctx.beginPath();
      ctx.roundRect(o.x, top, o.w, o.h, 5);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = colors.red;
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.fillStyle = colors.red;
      ctx.font = `700 11px ${colors.mono}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('404', o.x + o.w / 2, top + o.h / 2 + 0.5);
      ctx.textBaseline = 'alphabetic';
    }
    if (o.label) drawLabel(o.label, o.x - 2, top - (o.kind === 'leak' ? 9 : 5));
  };

  const drawPlayer = () => {
    if (!ctx) return;
    // Stretch while rising or falling, squash for a moment on landing.
    let sy = 1;
    if (!reducedMotion) {
      if (inAir) sy = 1 + Math.min(0.14, Math.abs(vy) / 3200);
      else if (squash > 0) sy = 1 - 0.22 * (squash / 0.12);
    }
    const sx = 1 / sy;
    const footX = PLAYER_X + PLAYER_W / 2;
    const footY = groundY() - playerY;
    ctx.save();
    ctx.translate(footX, footY);
    ctx.scale(sx, sy);
    if (hotfix > 0) {
      // Hotfix mode: an orange glow (it flickers in the last second).
      const flicker = hotfix < 1 && Math.floor(hotfix * 10) % 2 === 0;
      ctx.shadowColor = colors.orange;
      ctx.shadowBlur = flicker ? 0 : 14;
    }
    ctx.fillStyle = colors.accent;
    ctx.beginPath();
    ctx.roundRect(-8, -16, 16, 16, 5);
    ctx.fill();
    ctx.fillStyle = '#ffd2a8';
    ctx.beginPath();
    ctx.arc(0, -21, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  const draw = () => {
    if (!ctx || width === 0) return;
    const now = performance.now();
    if (now - colorsReadAt > 1000) {
      readColors();
      colorsReadAt = now;
    }
    ctx.clearRect(0, 0, width, height);
    drawSkyline(far, 0.15, 0.05);
    drawSkyline(near, 0.35, 0.08);

    // Ground line.
    ctx.fillStyle = colors.text2;
    ctx.globalAlpha = 0.35;
    ctx.fillRect(0, groundY(), width, 1);
    ctx.globalAlpha = 1;

    for (const c of coffees) {
      const bob = reducedMotion ? 0 : Math.sin(now / 220) * 2;
      ctx.font = '16px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('☕', c.x, groundY() - c.y + bob);
      ctx.textBaseline = 'alphabetic';
    }
    for (const o of obstacles) drawObstacle(o);
    for (const p of particles) {
      ctx.globalAlpha = Math.max(0, p.life / p.max) * 0.7;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, groundY() - p.y, 1.6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    drawPlayer();

    if (banner > 0) {
      ctx.globalAlpha = Math.min(1, banner / 0.4);
      ctx.fillStyle = colors.accent;
      ctx.font = `700 13px ${colors.mono}`;
      ctx.textAlign = 'center';
      ctx.fillText(bannerText, width / 2, 28);
      ctx.globalAlpha = 1;
    }
    if (hotfix > 0) drawLabel(`hotfix mode ${Math.ceil(hotfix)}s`, 10, 18);
  };

  const tick = (t: number) => {
    if (!running) return;
    const dt = last ? Math.min(0.05, (t - last) / 1000) : 0;
    last = t;
    frame = requestAnimationFrame(tick);
    update(dt);
    draw();
    if (!running) cancelAnimationFrame(frame);
  };

  const reset = () => {
    score = 0;
    shownScore = 0;
    shipped = 0;
    speed = BASE_SPEED;
    playerY = 0;
    vy = 0;
    inAir = false;
    holding = false;
    buffered = -1;
    squash = 0;
    hotfix = 0;
    spawnIn = 1.2;
    coffeeIn = rand(10, 16);
    banner = 0;
    obstacles = [];
    coffees = [];
    particles = [];
    events.onScore(0);
  };

  resize();

  return {
    start: () => {
      cancelAnimationFrame(frame);
      reset();
      readColors();
      colorsReadAt = performance.now();
      running = true;
      last = 0;
      frame = requestAnimationFrame(tick);
    },
    stop: () => {
      running = false;
      cancelAnimationFrame(frame);
      obstacles = [];
      coffees = [];
      particles = [];
      draw();
    },
    press: () => {
      pressed = true;
      if (!running) return;
      if (!inAir) jump();
      else buffered = 0;
    },
    release: () => {
      pressed = false;
      if (holding) {
        holding = false;
        if (vy > 0) vy *= RELEASE_CUT;
      }
    },
    isRunning: () => running,
    render: () => {
      readColors();
      colorsReadAt = performance.now();
      draw();
    },
    destroy: () => {
      running = false;
      cancelAnimationFrame(frame);
      observer.disconnect();
    },
  };
}
