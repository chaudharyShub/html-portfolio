/**
 * Debug Runner: a small jump-over-the-bugs game drawn on a canvas.
 *
 * Everything moves per second, not per frame, so a 120Hz screen plays at the same speed as a
 * 60Hz one (the first version moved per frame and ran twice as fast on fast screens).
 * Holding the jump goes higher than a tap. Obstacles: a bug (jump), a memory leak (a wide
 * puddle: hold for a long jump), a merge conflict (two bugs: two quick hops) and a floating 404
 * (stay on the ground, or clear it with a full jump). Coffee gives a few seconds of "hotfix
 * mode" (nothing can hit you). Every 100 points a version ships and the game speeds up a step,
 * with no top speed: the steps get smaller after v2.0 and v3.0, but it never stops getting harder
 * (it used to stop at 1000 points, so a good run just went on forever at the same pace).
 * The sky follows the theme: a sun and drifting clouds by day (Light), a crescent moon and
 * twinkling stars by night (Dark, or Auto on a dark system).
 * Plain canvas, no libraries; only runs while started.
 */

import { COFFEE_PATHS } from '@/components/icons/coffee-paths';

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

/**
 * Speed after `shipped` versions (100 points each): +30 px/s per version up to v2.0 (1000
 * points), +20 up to v3.0, then +10 for good. No cap. Everything that has to stay clearable is
 * sized in seconds of travel (the leak's width, the merge conflict's gap), so any speed is fair;
 * it just leaves less time to react.
 */
function speedFor(shipped: number) {
  const early = Math.min(shipped, 10);
  const middle = Math.min(Math.max(shipped - 10, 0), 10);
  const late = Math.max(shipped - 20, 0);
  return BASE_SPEED + 30 * early + 20 * middle + 10 * late;
}

/** Shortest time between obstacles: 0.75s until 1000 points, then down to 0.55s at 3000. */
function minSpawnGap(score: number) {
  return Math.max(0.55, 0.75 - Math.max(0, score - 1000) / 10000);
}
/** Points come only from time survived; the server checks submitted scores against this. */
export const POINTS_PER_SECOND = 10;
const HOTFIX_SECONDS = 4;

/** Size the coffee cup (components/icons/coffee-paths.ts) is drawn at, in px. */
const COFFEE_SIZE = 20;

type CoffeeShapes = Record<keyof typeof COFFEE_PATHS, Path2D>;
let coffeeShapes: CoffeeShapes | null = null;

/** The cup's paths as Path2D, made once (only in the browser: the server never draws). */
function getCoffeeShapes(): CoffeeShapes {
  coffeeShapes ??= Object.fromEntries(
    Object.entries(COFFEE_PATHS).map(([key, d]) => [key, new Path2D(d)]),
  ) as CoffeeShapes;
  return coffeeShapes;
}

type Kind = 'bug' | 'leak' | 'notfound';

interface Obstacle {
  kind: Kind;
  x: number;
  /** Height of its bottom above the ground. */
  y: number;
  w: number;
  h: number;
  /** Small caption drawn above it ("memory leak"). */
  label?: string;
  /** Merge conflict: set on the first bug, the distance to its partner (drawn as one bracket). */
  pairGap?: number;
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

interface Cloud {
  x: number;
  y: number;
  /** Size: 1 is a cloud about 44px wide. */
  s: number;
}

interface Star {
  x: number;
  y: number;
  r: number;
  /** Where in its twinkle it starts, so they don't all pulse together. */
  phase: number;
}

interface Colors {
  accent: string;
  text: string;
  text2: string;
  red: string;
  orange: string;
  /** The site's mono font stack, for the canvas text. */
  mono: string;
  /** Dark theme: moon and stars instead of sun and clouds (`--game-sky` on #game-stage). */
  night: boolean;
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
  /** Holds the run still (the guide is open) and goes on from there. */
  pause: () => void;
  resume: () => void;
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
    night: false,
  };
  let colorsReadAt = 0;

  // Run state.
  let running = false;
  /** A run held by pause(): `running` is false meanwhile, resume() goes on. */
  let paused = false;
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
  const clouds: Cloud[] = [];
  const stars: Star[] = [];
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
      night: v('--game-sky', 'day') === 'night',
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

  /** Clouds and stars across twice the stage width (they scroll slower than the skyline). */
  const buildSky = () => {
    const span = Math.max(width, 300) * 2;
    clouds.length = 0;
    for (let x = rand(20, 80); x < span; x += rand(150, 230)) {
      clouds.push({ x, y: rand(22, 58), s: rand(0.75, 1.15) });
    }
    stars.length = 0;
    const count = Math.round(span / 18);
    for (let i = 0; i < count; i++) {
      stars.push({ x: rand(0, span), y: rand(8, 92), r: rand(0.5, 1.3), phase: rand(0, Math.PI * 2) });
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
    buildSky();
    if (!running) draw();
  };
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);

  // A theme change swaps day and night at once, even between runs (a run picks it up anyway
  // within a second, see draw()). Settings can be open beside the game.
  const onThemeChange = () => {
    readColors();
    colorsReadAt = performance.now();
    if (!running) draw();
  };
  const themeObserver = new MutationObserver(onThemeChange);
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');
  darkQuery.addEventListener('change', onThemeChange);

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
    // Past 1000 and 2000 points a plain bug is one pick rarer, so the harder ones come more often.
    const bugs = score >= 2000 ? 1 : score >= 1000 ? 2 : 3;
    const pool: Array<Kind | 'conflict'> = Array.from({ length: bugs }, () => 'bug' as const);
    if (score >= 40) pool.push('leak', 'leak');
    if (score >= 100) pool.push('conflict', 'conflict');
    if (score >= 160) pool.push('notfound', 'notfound');
    const pick = pool[Math.floor(Math.random() * pool.length)] ?? 'bug';
    let extra = 0;
    if (pick === 'bug') {
      obstacles.push({ kind: 'bug', x, y: 0, w: 18, h: 18 });
    } else if (pick === 'leak') {
      // 0.46s of track: a tap's hop (~0.4s in the air) lands in it, a held jump (~0.64s)
      // clears it, at any speed. (It used to stop growing at 166px, so past ~400px/s a tap
      // cleared it; 0.5s left a held jump only ~120ms to start in, too hard - now ~160ms.)
      const w = Math.max(56, speed * 0.46);
      obstacles.push({ kind: 'leak', x, y: 0, w, h: 7, label: 'memory leak' });
      extra = 0.25;
    } else if (pick === 'conflict') {
      // 0.6s apart: too far for one jump (even held, at any speed), close enough for two quick
      // hops. That is a lot of pixels at speed, so a bracket joins the two (see drawObstacle):
      // without it the pair read as one labeled bug and then an unrelated one.
      const gap = speed * 0.6;
      obstacles.push({ kind: 'bug', x, y: 0, w: 18, h: 18, pairGap: gap });
      obstacles.push({ kind: 'bug', x: x + gap, y: 0, w: 18, h: 18 });
      extra = 0.45;
    } else {
      // Floats just above the runner's head: stay down, or clear it with a full jump.
      obstacles.push({ kind: 'notfound', x, y: 40, w: 32, h: 18 });
    }
    spawnIn = Math.max(minSpawnGap(score), 1.5 - score / 300) + rand(0, 0.35) + extra;
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
      speed = speedFor(shipped);
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
    // A merge conflict's first bug stays until its partner has gone too (it draws the bracket).
    obstacles = obstacles.filter((o) => o.x + o.w + (o.pairGap ?? 0) > -40);
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

  /** Where the sun or moon sits: top right, clear of the banner (center) and hotfix label (left). */
  const skyBodyAt = () => ({ x: width - 44, y: 34 });

  const drawSun = () => {
    if (!ctx) return;
    const { x, y } = skyBodyAt();
    const glow = ctx.createRadialGradient(x, y, 10, x, y, 38);
    glow.addColorStop(0, 'rgba(255, 190, 40, 0.45)');
    glow.addColorStop(1, 'rgba(255, 200, 60, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, 38, 0, Math.PI * 2);
    ctx.fill();
    const body = ctx.createLinearGradient(x, y - 13, x, y + 13);
    body.addColorStop(0, '#ffd84d');
    body.addColorStop(1, '#ffad1f');
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.arc(x, y, 13, 0, Math.PI * 2);
    ctx.fill();
  };

  const drawMoon = () => {
    if (!ctx) return;
    const { x, y } = skyBodyAt();
    const glow = ctx.createRadialGradient(x, y, 8, x, y, 34);
    glow.addColorStop(0, 'rgba(220, 230, 255, 0.16)');
    glow.addColorStop(1, 'rgba(220, 230, 255, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(x, y, 34, 0, Math.PI * 2);
    ctx.fill();
    // A crescent: the full disc, then a disc cut out of it (the canvas is see-through, the
    // stage's night sky shows through the cut).
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, 12, 0, Math.PI * 2);
    ctx.clip();
    ctx.fillStyle = '#f2eedf';
    ctx.fillRect(x - 12, y - 12, 24, 24);
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(x + 6, y - 4, 10.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };

  /** A wrapping offset for a sky layer that scrolls `factor` times the ground speed. */
  const skyOffset = (factor: number) => (scroll * factor) % (Math.max(width, 300) * 2);

  const drawClouds = () => {
    if (!ctx) return;
    const span = Math.max(width, 300) * 2;
    const offset = skyOffset(0.06);
    /** Three puffs on a flat base. */
    const puffs = (x: number, y: number, k: number) => {
      ctx.beginPath();
      ctx.arc(x + 12 * k, y, 9 * k, Math.PI * 0.5, Math.PI * 1.5);
      ctx.arc(x + 22 * k, y - 7 * k, 11 * k, Math.PI, 0);
      ctx.arc(x + 34 * k, y - 2 * k, 8 * k, Math.PI * 1.25, Math.PI * 0.5);
      ctx.closePath();
      ctx.fill();
    };
    for (const c of clouds) {
      for (const shift of [0, span]) {
        const x = c.x - offset + shift;
        if (x > width + 30 || x + 50 * c.s < -30) continue;
        // A blue-gray underside first, so the white cloud has an edge on the pale sky.
        ctx.fillStyle = 'rgba(70, 110, 160, 0.22)';
        puffs(x, c.y + 2.5, c.s);
        ctx.fillStyle = '#ffffff';
        puffs(x, c.y, c.s);
      }
    }
  };

  const drawStars = (now: number) => {
    if (!ctx) return;
    const span = Math.max(width, 300) * 2;
    const offset = skyOffset(0.03);
    const moon = skyBodyAt();
    ctx.fillStyle = '#ffffff';
    for (const st of stars) {
      for (const shift of [0, span]) {
        const x = st.x - offset + shift;
        if (x < -2 || x > width + 2) continue;
        if (Math.hypot(x - moon.x, st.y - moon.y) < 20) continue; // not in front of the moon
        const twinkle = reducedMotion ? 0.7 : 0.45 + 0.4 * Math.sin(now / 700 + st.phase);
        ctx.globalAlpha = twinkle;
        ctx.beginPath();
        ctx.arc(x, st.y, st.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  };

  const drawSky = (now: number) => {
    if (colors.night) {
      drawMoon();
      drawStars(now);
    } else {
      drawSun();
      drawClouds();
    }
  };

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

  /** The coffee cup centered on (x, y); its steam rises unless motion is reduced. */
  const drawCoffee = (x: number, y: number, now: number) => {
    if (!ctx) return;
    const shapes = getCoffeeShapes();
    ctx.save();
    ctx.translate(x - COFFEE_SIZE / 2, y - COFFEE_SIZE / 2);
    ctx.scale(COFFEE_SIZE / 32, COFFEE_SIZE / 32);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    // Two wisps, half a cycle apart, fading in and out as they rise.
    ctx.strokeStyle = '#b9a58f';
    ctx.lineWidth = 1.6;
    for (const [shape, offset] of [[shapes.steam1, 0], [shapes.steam2, 0.5]] as const) {
      const t = reducedMotion ? 0.5 : (now / 2200 + offset) % 1;
      ctx.save();
      ctx.globalAlpha = reducedMotion ? 0.8 : Math.sin(t * Math.PI);
      ctx.translate(0, 1.5 - t * 4);
      ctx.stroke(shape);
      ctx.restore();
    }
    ctx.strokeStyle = '#7a4a24';
    ctx.lineWidth = 2.2;
    ctx.stroke(shapes.handle);
    const body = ctx.createLinearGradient(0, 12.6, 0, 27.2);
    body.addColorStop(0, '#ffffff');
    body.addColorStop(1, '#e3dbd0');
    ctx.fillStyle = body;
    ctx.fill(shapes.mug);
    ctx.lineWidth = 1.2;
    ctx.stroke(shapes.mug);
    ctx.fillStyle = '#7a4a24';
    ctx.beginPath();
    ctx.ellipse(14.6, 12.8, 7.6, 1.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#0066cc';
    ctx.lineWidth = 1.4;
    ctx.stroke(shapes.code);
    ctx.restore();
  };

  /**
   * The merge conflict's bracket: a red dashed line over both bugs (from the first one's middle
   * to the second's), with the caption centered above it. Just a drawing, nothing to hit.
   */
  const drawConflict = (x: number, gap: number) => {
    if (!ctx) return;
    const left = x + 9;
    const right = x + gap + 9;
    const y = groundY() - 26;
    ctx.save();
    ctx.strokeStyle = colors.red;
    ctx.globalAlpha = 0.7;
    ctx.lineWidth = 1.2;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(left, y + 5);
    ctx.lineTo(left, y);
    ctx.lineTo(right, y);
    ctx.lineTo(right, y + 5);
    ctx.stroke();
    ctx.restore();
    ctx.font = `600 9px ${colors.mono}`;
    ctx.fillStyle = colors.red;
    ctx.textAlign = 'center';
    ctx.fillText('merge conflict', (left + right) / 2, y - 4);
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
    if (o.pairGap) drawConflict(o.x, o.pairGap);
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
    // By day a navy outline and a deeper skin tone: the blue body and peach face blended into
    // the pale-blue sky (user's report). The night sky is dark enough without.
    const outline = colors.night ? null : 'rgba(12, 35, 70, 0.85)';
    ctx.lineWidth = 1.5;
    if (outline) ctx.strokeStyle = outline;
    ctx.fillStyle = colors.accent;
    ctx.beginPath();
    ctx.roundRect(-8, -16, 16, 16, 5);
    ctx.fill();
    if (outline) ctx.stroke();
    ctx.fillStyle = colors.night ? '#ffd2a8' : '#f6b98c';
    ctx.beginPath();
    ctx.arc(0, -21, 6, 0, Math.PI * 2);
    ctx.fill();
    if (outline) ctx.stroke();
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
    drawSky(now);
    drawSkyline(far, 0.15, 0.05);
    drawSkyline(near, 0.35, 0.08);

    // Ground line.
    ctx.fillStyle = colors.text2;
    ctx.globalAlpha = 0.35;
    ctx.fillRect(0, groundY(), width, 1);
    ctx.globalAlpha = 1;

    for (const c of coffees) {
      const bob = reducedMotion ? 0 : Math.sin(now / 220) * 2;
      drawCoffee(c.x, groundY() - c.y + bob, now);
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
      paused = false;
      last = 0;
      frame = requestAnimationFrame(tick);
    },
    stop: () => {
      running = false;
      paused = false;
      cancelAnimationFrame(frame);
      obstacles = [];
      coffees = [];
      particles = [];
      draw();
    },
    pause: () => {
      if (!running) return;
      running = false;
      paused = true;
      holding = false;
      pressed = false;
      cancelAnimationFrame(frame);
    },
    resume: () => {
      if (!paused) return;
      paused = false;
      running = true;
      last = 0;
      frame = requestAnimationFrame(tick);
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
      themeObserver.disconnect();
      darkQuery.removeEventListener('change', onThemeChange);
    },
  };
}
