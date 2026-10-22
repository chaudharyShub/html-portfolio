'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { recordVisit } from '@/lib/preferences';

const BOOT_LINES = [
  'Shubham BIOS v3.0 - Copyright (C) Shubham Chaudhary',
  'Initializing Memory... OK',
  'Detecting Skills... React.js, Next.js, Node.js - OK',
  'Mounting File System C:\\Users\\Shubham\\...',
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

/** BIOS-style boot sequence. Any key or click skips it. */
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
      <pre id="boot-text">{lines.map((line) => `${line}\n`).join('')}</pre>
      <div className="boot-progress-wrap">
        <div className="boot-progress-bar">
          <div id="boot-progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <span id="boot-progress-pct">{Math.floor(progress)}%</span>
      </div>
      <p className="boot-skip-hint">Press any key or click to skip...</p>
    </div>
  );
}
