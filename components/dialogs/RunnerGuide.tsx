'use client';

import { useEffect, useRef, type KeyboardEvent, type ReactNode } from 'react';
import { Emoji } from '@/components/icons/Emoji';

/*
 * The Debug Runner's field guide: every thing on the track, drawn like the canvas draws it
 * (lib/debug-runner.ts: the bug, the purple puddle, the red 404 box, the coffee cup), with what
 * it does and when it starts showing up. Keep it in step with `spawn()` there. Opened with
 * "How to play": it covers the game (which holds still meanwhile); Escape or "Got it" closes it.
 */

/** The game's bug (the app icon's bug, 24px grid). */
function Bug({ x = 0 }: { x?: number }) {
  return (
    <g transform={`translate(${x} 0)`}>
      <path
        d="M7 11 4 9M17 11l3-2M7 15H3.5M17 15h3.5M7.5 18.5 5 21M16.5 18.5 19 21"
        stroke="#1f7a35"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <ellipse cx="12" cy="14" rx="5" ry="6" fill="#34c759" />
      <circle cx="12" cy="7" r="3" fill="#30a14e" />
    </g>
  );
}

const ICONS: Record<'bug' | 'leak' | 'conflict' | 'notfound', ReactNode> = {
  bug: (
    <svg viewBox="0 0 24 24" width="24" height="24">
      <Bug />
    </svg>
  ),
  leak: (
    <svg viewBox="0 0 36 24" width="36" height="24">
      <ellipse cx="18" cy="19" rx="16" ry="4.5" fill="rgba(110, 90, 230, 0.75)" />
      {[9, 21.6, 30.6].map((cx) => (
        <circle key={cx} cx={cx} cy="10" r="1.8" fill="rgba(110, 90, 230, 0.55)" />
      ))}
    </svg>
  ),
  conflict: (
    <svg viewBox="0 0 40 24" width="36" height="22">
      <Bug x={-2} />
      <Bug x={18} />
    </svg>
  ),
  notfound: (
    <svg viewBox="0 0 34 20" width="34" height="20" className="game-guide-404">
      <rect x="1" y="1" width="32" height="18" rx="5" />
      <text x="17" y="10.5" textAnchor="middle" dominantBaseline="middle">
        404
      </text>
    </svg>
  ),
};

/** In the order they first show up in a run. */
const ITEMS: Array<{ id: string; icon: ReactNode; name: string; tip: string }> = [
  { id: 'bug', icon: ICONS.bug, name: 'Bug', tip: 'Any jump clears it.' },
  { id: 'leak', icon: ICONS.leak, name: 'Memory leak', tip: 'A wide puddle: hold to jump far. From 40 points.' },
  { id: 'coffee', icon: <Emoji name="coffee" size={26} />, name: 'Coffee', tip: 'Hotfix mode: nothing can hit you for 4s. From 60.' },
  { id: 'conflict', icon: ICONS.conflict, name: 'Merge conflict', tip: 'Two bugs in a row: hop twice. From 100.' },
  { id: 'notfound', icon: ICONS.notfound, name: '404', tip: 'Floats overhead: stay down or jump fully over. From 160.' },
];

export function RunnerGuide({ onClose }: { onClose: () => void }) {
  const done = useRef<HTMLButtonElement>(null);
  useEffect(() => done.current?.focus({ preventScroll: true }), []);
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'Escape') return;
    e.stopPropagation(); // closes the guide, not the game
    onClose();
  };
  return (
    <section className="game-guide" aria-labelledby="game-guide-title" onKeyDown={onKeyDown}>
      <div className="game-guide-head">
        <h3 id="game-guide-title" className="game-guide-title">
          What&apos;s on the track
        </h3>
        <button type="button" ref={done} className="btn-primary game-guide-done" onClick={onClose}>
          Got it
        </button>
      </div>
      <ul className="game-guide-list">
        {ITEMS.map((item) => (
          <li key={item.id} className="game-guide-item" data-item={item.id}>
            <span className="game-guide-icon" aria-hidden="true">
              {item.icon}
            </span>
            <span>
              <span className="game-guide-name">{item.name}</span>
              <span className="game-guide-tip">{item.tip}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
