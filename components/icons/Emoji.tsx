/**
 * Our own emoji drawings (Nov 2026, user's request): used instead of the device's emoji so they
 * look the same on every system and match the app tiles. All are original artwork on a 32x32
 * grid. Wink and Sad monitor borrow the winking monitor from the app icon. The small loops
 * (`.emo-*` in styles/desktop.css) are skipped under reduced motion.
 * Each instance gets its own gradient ids: the like button has two copies and one is always
 * hidden, and a gradient defined inside a hidden copy doesn't paint.
 */

import { useId, type ReactNode } from 'react';
import { COFFEE_PATHS } from './coffee-paths';

export type EmojiName =
  | 'wink'
  | 'love'
  | 'grin'
  | 'stars'
  | 'glowheart'
  | 'sparkheart'
  | 'sparkles'
  | 'popper'
  | 'hands'
  | 'star'
  | 'party'
  | 'letdown'
  | 'teary'
  | 'pensive'
  | 'plead'
  | 'monitor'
  | 'broken'
  | 'coffee'
  | 'check';

/** Top and bottom color of each gradient (vertical unless `diagonal`). */
const GRADIENTS = {
  face: ['#ffe27a', '#ffb52e'],
  pink: ['#ff9cc0', '#ff3d7f'],
  magenta: ['#ff8be0', '#d63aa8'],
  purple: ['#c9b2ff', '#8b5cf6'],
  gold: ['#ffe68f', '#ffaa1c'],
  blue: ['#a8dcff', '#3b9cff'],
  red: ['#ff7a7a', '#e0243a'],
  cone: ['#a78bfa', '#5b3fd6', 'diagonal'],
  hand: ['#ffd987', '#f3a83a'],
  mug: ['#ffffff', '#e3dbd0'],
  green: ['#5ee38c', '#1fa855'],
  screen: ['#2f8cff', '#0b4fb8'],
} as const;

type Gradient = keyof typeof GRADIENTS;
type Url = (name: Gradient) => string;

const INK = '#5b3512';
const HEART = 'M16 27C6 20 3 14 6 9.5 8.5 5.8 13.5 6 16 10c2.5-4 7.5-4.2 10-.5 3 4.5 0 10.5-10 17.5Z';
const STAR5 = 'M0-3.6.88-1.21 3.42-1.11 1.43.46 2.12 2.91 0 1.5-2.12 2.91-1.43.46-3.42-1.11-.88-1.21Z';
const SPARK = 'M0-1C.12-.12.12-.12 1 0 .12.12.12.12 0 1-.12.12-.12.12-1 0-.12-.12-.12-.12 0-1Z';
const ink = { fill: 'none', stroke: INK, strokeWidth: 2.2, strokeLinecap: 'round' } as const;

const face = (u: Url) => (
  <>
    <circle cx="16" cy="16" r="14" fill={u('face')} stroke="#e9a21f" strokeWidth=".8" />
    <ellipse cx="16" cy="8.4" rx="8" ry="3.4" fill="#fff" opacity=".35" />
  </>
);

const cheeks = (
  <g fill="#ff7b7b" opacity=".45">
    <circle cx="8.6" cy="18.8" r="2.2" />
    <circle cx="23.4" cy="18.8" r="2.2" />
  </g>
);

/** A small copy of the heart, centered on (x, y). */
const smallHeart = (x: number, y: number, scale: number, fill: string) => (
  <path d={HEART} fill={fill} transform={`translate(${x} ${y}) scale(${scale}) translate(-16 -17)`} />
);

/** A four-point sparkle centered on (x, y); the class (if any) animates it. */
const spark = (x: number, y: number, size: number, fill: string, className?: string) => (
  <g transform={`translate(${x} ${y}) scale(${size})`}>
    <path className={className} d={SPARK} fill={fill} />
  </g>
);

const COFFEE = COFFEE_PATHS;

const DRAWINGS: Record<EmojiName, { uses: Gradient[]; draw: (u: Url) => ReactNode }> = {
  wink: {
    uses: ['face'],
    draw: (u) => (
      <>
        {face(u)}
        {cheeks}
        <g {...ink}>
          <path d="M18.6 14.2q2.6-2.8 5.2 0" />
          <path d="M10.5 19q5.5 5.6 11 0" />
        </g>
        <circle className="emo emo-blink" cx="11.6" cy="13.4" r="2" fill={INK} />
      </>
    ),
  },
  love: {
    uses: ['face', 'pink'],
    draw: (u) => (
      <>
        {face(u)}
        {cheeks}
        <g {...ink}>
          <path d="M8.8 14.2q2.6-3 5.2 0" />
          <path d="M18 14.2q2.6-3 5.2 0" />
          <path d="M11 19.6q5 4.6 10 0" />
        </g>
        <g className="emo emo-float1">{smallHeart(26, 6.2, 0.34, u('pink'))}</g>
        <g className="emo emo-float2">{smallHeart(4.6, 9.4, 0.26, u('pink'))}</g>
        <g className="emo emo-float3">{smallHeart(27.4, 23.4, 0.28, u('pink'))}</g>
      </>
    ),
  },
  grin: {
    uses: ['face'],
    draw: (u) => (
      <>
        {face(u)}
        <g {...ink}>
          <path d="M9.4 13.6q2.3-2.8 4.6 0" />
          <path d="M18 13.6q2.3-2.8 4.6 0" />
        </g>
        <path d="M9 17.4h14q0 7.6-7 7.6t-7-7.6Z" fill={INK} />
        <path d="M10.3 18.1h11.4v1.4q-5.7 1-11.4 0Z" fill="#fff" />
        <ellipse cx="16" cy="23" rx="3.2" ry="1.5" fill="#ff6b7d" />
      </>
    ),
  },
  stars: {
    uses: ['face'],
    draw: (u) => (
      <>
        {face(u)}
        <g fill="#ff5a36" stroke="#ff5a36" strokeWidth=".8" strokeLinejoin="round">
          <g transform="translate(11 13.4)">
            <path className="emo emo-spin" d={STAR5} />
          </g>
          <g transform="translate(21 13.4)">
            <path className="emo emo-spin" d={STAR5} />
          </g>
        </g>
        <path d="M10.5 18.6h11q0 6-5.5 6t-5.5-6Z" fill={INK} />
        <path d="M11.5 19.2h9v1.2q-4.5.8-9 0Z" fill="#fff" />
      </>
    ),
  },
  glowheart: {
    uses: ['pink'],
    draw: (u) => (
      <>
        <circle className="emo emo-glow" cx="16" cy="16.5" r="15" fill="#ff4f9a" opacity=".2" />
        <g className="emo emo-beat">
          {smallHeart(16, 16.6, 0.84, u('pink'))}
          <ellipse cx="11.6" cy="11.6" rx="2.6" ry="1.6" fill="#fff" opacity=".5" transform="rotate(-35 11.6 11.6)" />
        </g>
      </>
    ),
  },
  sparkheart: {
    uses: ['magenta'],
    draw: (u) => (
      <>
        {smallHeart(14.6, 18, 0.82, u('magenta'))}
        <ellipse cx="10.4" cy="13" rx="2.4" ry="1.5" fill="#fff" opacity=".5" transform="rotate(-35 10.4 13)" />
        {spark(25.2, 7, 4.6, '#ffd23f', 'emo emo-twinkle1')}
        {spark(5.6, 6.6, 2.6, '#ffd23f', 'emo emo-twinkle2')}
      </>
    ),
  },
  sparkles: {
    uses: ['gold', 'purple'],
    draw: (u) => (
      <>
        {spark(13, 18.5, 10.5, u('gold'), 'emo emo-twinkle1')}
        {spark(24.6, 8, 5.6, u('gold'), 'emo emo-twinkle2')}
        {spark(25, 24.6, 3.6, u('purple'), 'emo emo-twinkle3')}
      </>
    ),
  },
  popper: {
    uses: ['cone'],
    draw: (u) => (
      <>
        <path d="M4.6 27.4 10 11.2 20.8 22Z" fill={u('cone')} stroke="#6c4ee0" strokeWidth="1.4" strokeLinejoin="round" />
        <path d="M7.2 19.6 12.4 24.8M8.6 15.4l7.9 7.9" stroke="#ffd23f" strokeWidth="1.6" strokeLinecap="round" />
        <g className="emo emo-pop">
          <path d="M14 9.4q2.8-4 5.8-1.2t5.8-1.4" fill="none" stroke="#ffb020" strokeWidth="1.7" strokeLinecap="round" />
          <path d="M19.4 16.6q4.2-1 5.2 2.6t4.4 1.8" fill="none" stroke="#34c759" strokeWidth="1.7" strokeLinecap="round" />
          <circle cx="21.6" cy="12.6" r="1.6" fill="#ff5e8a" />
          <circle cx="14.6" cy="4.6" r="1.3" fill="#3bb4ff" />
          <rect x="25.4" y="11" width="3" height="3" rx=".6" fill="#8b5cf6" transform="rotate(20 26.9 12.5)" />
        </g>
      </>
    ),
  },
  hands: {
    uses: ['hand'],
    draw: (u) => {
      const hand = (x: number) => (
        <>
          <path d={`M${x} 25V14.6a4.2 4.2 0 0 1 8.4 0V25Z`} fill={u('hand')} stroke="#d98a1e" strokeWidth="1" />
          <path d={`M${x + 2.8} 10.8v3.2M${x + 5.6} 10.8v3.2`} stroke="#d98a1e" strokeWidth="1" strokeLinecap="round" />
          <rect x={x - 0.6} y="24.4" width="9.6" height="4" rx="1.2" fill="#0066cc" />
        </>
      );
      return (
        <>
          <g stroke="#f5a524" strokeWidth="1.8" strokeLinecap="round">
            <path d="M16 3.2v3" />
            <path d="M10.6 4.6l1.2 2.4" />
            <path d="M21.4 4.6l-1.2 2.4" />
          </g>
          <g className="emo emo-wave-l">
            <g transform="rotate(-14 10 28)">{hand(5.6)}</g>
          </g>
          <g className="emo emo-wave-r">
            <g transform="rotate(14 22 28)">{hand(18)}</g>
          </g>
        </>
      );
    },
  },
  star: {
    uses: ['gold'],
    draw: (u) => (
      <>
        <circle className="emo emo-glow" cx="16" cy="16.6" r="15" fill="#ffd23f" opacity=".2" />
        <path
          d="M16 3.8 19.29 12.27 28.36 12.78 21.33 18.53 23.64 27.32 16 22.4 8.36 27.32 10.67 18.53 3.64 12.78 12.71 12.27Z"
          fill={u('gold')}
          stroke="#f2a20f"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path d="M12.6 13.4q1.6-.4 2.4-2.6" fill="none" stroke="#fff" strokeWidth="1.4" strokeLinecap="round" opacity=".7" />
      </>
    ),
  },
  party: {
    uses: ['face', 'cone'],
    draw: (u) => (
      <>
        <circle cx="17" cy="18" r="12.6" fill={u('face')} stroke="#e9a21f" strokeWidth=".8" />
        <ellipse cx="17" cy="11.2" rx="7" ry="3" fill="#fff" opacity=".35" />
        <path d="M3.6 13 8.6 1.8 14 10Z" fill={u('cone')} stroke="#6c4ee0" strokeWidth="1" strokeLinejoin="round" />
        <path d="M6.2 7.6l4.6 1.6" stroke="#ffd23f" strokeWidth="1.4" strokeLinecap="round" />
        <circle cx="8.6" cy="2.2" r="1.7" fill="#ffd23f" />
        <g fill="#ff7b7b" opacity=".45">
          <circle cx="10.6" cy="20.4" r="2" />
          <circle cx="23.6" cy="20.4" r="2" />
        </g>
        <g {...ink} strokeWidth="2.1">
          <path d="M11.2 16.4q2.2-2.6 4.4 0" />
          <path d="M18.8 16.4q2.2-2.6 4.4 0" />
          <path d="M14 22q2.8 2.4 5.6 0" />
        </g>
        <path d="M19.6 22.6h5.6q3.2 0 3.2-2.6 0-2-2-2" fill="none" stroke="#ff5e8a" strokeWidth="2.2" strokeLinecap="round" />
        <g className="emo emo-pop">
          <circle cx="27" cy="7" r="1.3" fill="#3bb4ff" />
          <circle cx="22.6" cy="3.6" r="1" fill="#ff5e8a" />
          <rect x="28" y="12" width="2.2" height="2.2" rx=".5" fill="#34c759" />
        </g>
      </>
    ),
  },
  letdown: {
    uses: ['face'],
    draw: (u) => (
      <>
        {face(u)}
        <g className="emo emo-droop">
          <g {...ink} strokeWidth="2">
            <path d="M9.4 14.2h4.6" />
            <path d="M18 14.2h4.6" />
            <path d="M11 23.4q5-4.6 10 0" />
          </g>
          <circle cx="11.7" cy="16.6" r="1.6" fill={INK} />
          <circle cx="20.3" cy="16.6" r="1.6" fill={INK} />
        </g>
      </>
    ),
  },
  teary: {
    uses: ['face', 'blue'],
    draw: (u) => (
      <>
        {face(u)}
        <g {...ink} strokeWidth="2">
          <path d="M8.8 11.2l4.4-1.6" />
          <path d="M23.2 11.2l-4.4-1.6" />
          <path d="M11.4 22.8q4.6-3.8 9.2 0" />
        </g>
        <circle cx="11.4" cy="14.4" r="1.8" fill={INK} />
        <circle cx="20.6" cy="14.4" r="1.8" fill={INK} />
        <path className="emo emo-tear" d="M21.2 16.6q-2.4 3.4-2.4 5a2.4 2.4 0 0 0 4.8 0q0-1.6-2.4-5Z" fill={u('blue')} />
      </>
    ),
  },
  pensive: {
    uses: ['face'],
    draw: (u) => (
      <>
        {face(u)}
        <g className="emo emo-droop" {...ink} strokeWidth="2">
          <path d="M8.8 10.8l4.2-1.4" />
          <path d="M23.2 10.8l-4.2-1.4" />
          <path d="M9 14.4q2.5 2.2 5 0" />
          <path d="M18 14.4q2.5 2.2 5 0" />
          <path d="M13 22.6q3-1.8 6 0" />
        </g>
      </>
    ),
  },
  plead: {
    uses: ['face'],
    draw: (u) => (
      <>
        {face(u)}
        <g {...ink} strokeWidth="1.8">
          <path d="M8 9.6l4.2-1.4" />
          <path d="M24 9.6l-4.2-1.4" />
          <path d="M13.2 23.4q2.8-2.2 5.6 0" />
        </g>
        <circle cx="11" cy="14.8" r="3.5" fill={INK} />
        <circle cx="21" cy="14.8" r="3.5" fill={INK} />
        <g className="emo emo-shimmer" fill="#fff">
          <circle cx="12.2" cy="13.4" r="1.3" />
          <circle cx="10" cy="16.2" r=".6" />
          <circle cx="22.2" cy="13.4" r="1.3" />
          <circle cx="20" cy="16.2" r=".6" />
        </g>
      </>
    ),
  },
  monitor: {
    uses: ['screen'],
    draw: (u) => (
      <>
        <rect x="2.6" y="4.6" width="26.8" height="19" rx="3.6" fill="#fff" stroke="#c9d3e0" strokeWidth=".8" />
        <rect x="4.8" y="6.8" width="22.4" height="14.6" rx="2" fill={u('screen')} />
        <rect x="13.6" y="23.4" width="4.8" height="3.4" fill="#fff" stroke="#c9d3e0" strokeWidth=".6" />
        <rect x="9.6" y="26.4" width="12.8" height="2.6" rx="1.3" fill="#fff" stroke="#c9d3e0" strokeWidth=".6" />
        <circle cx="12.4" cy="12.6" r="1.4" fill="#fff" />
        <circle cx="19.6" cy="12.6" r="1.4" fill="#fff" />
        <path d="M12.6 18.4q3.4-2.6 6.8 0" fill="none" stroke="#fff" strokeWidth="1.7" strokeLinecap="round" />
        <path className="emo emo-tear" d="M20.4 14.4q-1.3 1.8-1.3 2.7a1.3 1.3 0 0 0 2.6 0q0-.9-1.3-2.7Z" fill="#8fd0ff" />
      </>
    ),
  },
  broken: {
    uses: ['red'],
    draw: (u) => (
      <>
        <g className="emo emo-split-l">
          <path d="M15.4 10C12.9 6 7.9 5.8 5.4 9.5 2.4 14 5.4 20 15.4 27l-1-5.5 2.5-4-3-3.5Z" fill={u('red')} />
        </g>
        <g className="emo emo-split-r">
          <path d="M16.6 10c2.5-4 7.5-4.2 10-.5 3 4.5 0 10.5-10 17.5l-1-5.5 2.5-4-3-3.5Z" fill={u('red')} />
        </g>
        <ellipse cx="10" cy="11.6" rx="2.2" ry="1.4" fill="#fff" opacity=".45" transform="rotate(-35 10 11.6)" />
      </>
    ),
  },
  coffee: {
    uses: ['mug'],
    draw: (u) => (
      <>
        <g fill="none" stroke="#b9a58f" strokeWidth="1.6" strokeLinecap="round">
          <path className="emo emo-steam1" d={COFFEE.steam1} />
          <path className="emo emo-steam2" d={COFFEE.steam2} />
        </g>
        <path d={COFFEE.handle} fill="none" stroke="#7a4a24" strokeWidth="2.2" />
        <path d={COFFEE.mug} fill={u('mug')} stroke="#7a4a24" strokeWidth="1.2" />
        <ellipse cx="14.6" cy="12.8" rx="7.6" ry="1.6" fill="#7a4a24" />
        <path d={COFFEE.code} fill="none" stroke="#0066cc" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
  },
  check: {
    uses: ['green'],
    draw: (u) => (
      <>
        <circle cx="16" cy="16" r="13.6" fill={u('green')} />
        <ellipse cx="16" cy="8.6" rx="7.6" ry="3.2" fill="#fff" opacity=".28" />
        <path d="M10 16.6l4 4 8-8.6" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
  },
};

/** One of our emoji drawings. Decorative: callers give the meaning in text. */
export function Emoji({ name, size = 20, className }: { name: EmojiName; size?: number; className?: string }) {
  const prefix = `emo${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const { uses, draw } = DRAWINGS[name];
  return (
    <svg
      className={`emoji-art${className ? ` ${className}` : ''}`}
      width={size}
      height={size}
      viewBox="0 0 32 32"
      data-emoji={name}
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        {uses.map((g) => {
          const [top, bottom, diagonal] = GRADIENTS[g] as readonly string[];
          return (
            <linearGradient key={g} id={`${prefix}-${g}`} x1="0" y1="0" x2={diagonal ? 1 : 0} y2="1">
              <stop offset="0" stopColor={top} />
              <stop offset="1" stopColor={bottom} />
            </linearGradient>
          );
        })}
      </defs>
      {draw((g) => `url(#${prefix}-${g})`)}
    </svg>
  );
}
