'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { recordVisit } from '@/lib/preferences';

const BOOT_LINES = [
  'Shubham OS v3.0 - Copyright (C) Shubham Chaudhary',
  'Initializing Memory... OK',
  'Detecting Skills... React.js, Next.js, Node.js - OK',
  'Mounting /Users/shubham...',
  'Loading Projects... OK',
  'Loading Experience Logs... OK',
  'Launching Shubham OS...',
];

/*
 * Fixed timeline (must stay within 4-6s total): one line every 300ms, "Verifying disk integrity"
 * at 2.3s, a 1.8s progress bar from 2.7s, a 300ms pause, then a 500ms fade = 5.3s.
 */
const LINE_INTERVAL_MS = 300;
const VERIFY_AT_MS = BOOT_LINES.length * LINE_INTERVAL_MS + 200;
const PROGRESS_AT_MS = VERIFY_AT_MS + 400;
const PROGRESS_DURATION_MS = 1800;
const HOLD_AFTER_PROGRESS_MS = 300;
const FADE_MS = 500;

type Phase = 'booting' | 'fading' | 'done';

/** Startup screen: logo, progress bar and the current boot step. Any key or click skips it. */
export function BootScreen({ onFinish }: { onFinish: () => void }) {
  const [lines, setLines] = useState<string[]>([]);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<Phase>('booting');
  const finished = useRef(false);
  const timers = useRef<number[]>([]);
  const frame = useRef(0);

  const finish = useCallback(function finishBoot() {
    if (finished.current) return;
    finished.current = true;
    document.removeEventListener('keydown', finishBoot);
    cancelAnimationFrame(frame.current);
    setPhase('fading');
    timers.current.push(
      window.setTimeout(() => {
        setPhase('done');
        onFinish();
      }, FADE_MS),
    );
  }, [onFinish]);

  useEffect(() => {
    const visits = recordVisit();
    const script = [...BOOT_LINES];
    if (visits > 1) script[1] = `Welcome back. Session #${visits}.`;

    const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms));
    script.forEach((line, i) => later(() => setLines((prev) => [...prev, line]), i * LINE_INTERVAL_MS));
    later(() => setLines((prev) => [...prev, 'Verifying disk integrity...']), VERIFY_AT_MS);
    later(() => {
      const start = performance.now();
      const tick = (now: number) => {
        if (finished.current) return;
        const p = Math.min(100, ((now - start) / PROGRESS_DURATION_MS) * 100);
        setProgress(p);
        if (p < 100) frame.current = requestAnimationFrame(tick);
        else later(finish, HOLD_AFTER_PROGRESS_MS);
      };
      frame.current = requestAnimationFrame(tick);
    }, PROGRESS_AT_MS);

    document.addEventListener('keydown', finish);
    const pending = timers.current;
    return () => {
      document.removeEventListener('keydown', finish);
      pending.forEach((t) => window.clearTimeout(t));
      pending.length = 0;
      cancelAnimationFrame(frame.current);
    };
  }, [finish]);

  return (
    <div
      id="boot-screen"
      aria-hidden="true"
      onClick={finish}
      style={{ opacity: phase === 'booting' ? undefined : 0, display: phase === 'done' ? 'none' : undefined }}
    >
      <svg className="boot-logo" viewBox="0 0 20 20" width="88" height="88" focusable="false">
        <rect x="2" y="2.5" width="16" height="11.5" rx="2.5" fill="currentColor" />
        <rect x="7" y="15" width="6" height="1.6" rx=".6" fill="currentColor" />
        <rect x="5" y="16.8" width="10" height="1.4" rx=".7" fill="currentColor" />
        <circle cx="7.3" cy="7" r="1.2" fill="#000" />
        <path d="M11.4 7.1h2.4M7 10.1c1.6 1.4 4.4 1.4 6 0" stroke="#000" strokeWidth="1.2" strokeLinecap="round" fill="none" />
      </svg>
      <div className="boot-progress-bar">
        <div id="boot-progress-fill" style={{ width: `${progress}%` }} />
      </div>
      {/* The current boot step, shown one at a time. */}
      <p id="boot-text">{lines[lines.length - 1] ?? ''}</p>
      <p className="boot-skip-hint">Press any key or click to skip</p>
    </div>
  );
}
