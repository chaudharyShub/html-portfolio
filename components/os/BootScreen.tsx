'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { PROFILE } from '@/data/profile';
import { recordVisit } from '@/lib/preferences';

const STEPS = ['Loading profile', 'Loading skills', 'Loading projects', 'Loading experience', 'Getting the desktop ready'];

/*
 * Fixed timeline (must stay within 4-6s total): the icon, name and role animate in, the
 * progress bar fills from 0.6s for 3s (the step text follows it), a 300ms pause, then a 500ms
 * zoom-and-fade out = 4.4s.
 */
const PROGRESS_AT_MS = 600;
const PROGRESS_DURATION_MS = 3000;
const HOLD_AFTER_PROGRESS_MS = 300;
const FADE_MS = 500;

type Phase = 'booting' | 'leaving' | 'done';

/** Gentle ease-in-out so the bar starts and lands softly. */
const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);

/** Startup screen: app icon, name and role, a progress bar and the current step. Any key or click skips it. */
export function BootScreen({ onFinish }: { onFinish: () => void }) {
  const [step, setStep] = useState('');
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
    setPhase('leaving');
    timers.current.push(
      window.setTimeout(() => {
        setPhase('done');
        onFinish();
      }, FADE_MS),
    );
  }, [onFinish]);

  useEffect(() => {
    const steps = [...STEPS];
    if (recordVisit() > 1) steps[0] = 'Welcome back';
    setStep(steps[0] ?? '');

    const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms));
    later(() => {
      const start = performance.now();
      const tick = () => {
        if (finished.current) return;
        const t = Math.min(1, (performance.now() - start) / PROGRESS_DURATION_MS);
        setProgress(ease(t) * 100);
        setStep(steps[Math.min(steps.length - 1, Math.floor(t * steps.length))] ?? '');
        if (t < 1) frame.current = requestAnimationFrame(tick);
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
      className={phase === 'leaving' ? 'leaving' : undefined}
      aria-hidden="true"
      onClick={finish}
      style={phase === 'done' ? { display: 'none' } : undefined}
    >
      <div className="boot-glow" />
      <div className="boot-center">
        {/* eslint-disable-next-line @next/next/no-img-element -- tiny static SVG, no optimization needed */}
        <img className="boot-icon" src="/icon.svg" alt="" width={96} height={96} />
        <div className="boot-name">{PROFILE.name}</div>
        <div className="boot-role">{PROFILE.role}</div>
        <div className="boot-progress-bar">
          <div id="boot-progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <p id="boot-text">{step}</p>
      </div>
      <p className="boot-skip-hint">
        <span className="boot-hint-pointer">Press any key or click to skip</span>
        <span className="boot-hint-touch">Tap to skip</span>
      </p>
    </div>
  );
}
