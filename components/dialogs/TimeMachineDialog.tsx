'use client';

import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { useOsActions, useOsState } from '@/components/os/OsProvider';
import { VISIBLE_EXPERIENCE } from '@/data/experience';
import { prefersReducedMotion } from '@/lib/motion';
import { startStarfield, type Starfield } from '@/lib/starfield';
import { Dialog } from './Dialog';

/** Career milestones, oldest first (the experience data is newest first). */
const MILESTONES = [...VISIBLE_EXPERIENCE].reverse().map((e) => ({
  ...e,
  year: Number(e.period.match(/\d{4}/)?.[0] ?? 0),
  start: e.period.split(' - ')[0],
}));
const LAST = MILESTONES.length - 1;
/** How long one trip takes; scrolling is ignored until it's over. */
const TRAVEL_MS = 700;

/**
 * Snapshots further back in time recede into the tunnel (3D perspective); newer ones than the
 * current fly past the camera and fade out.
 */
function snapshotStyle(stepsBack: number): CSSProperties {
  if (stepsBack < 0) return { transform: 'translate3d(0, 60px, 320px)', opacity: 0 };
  return {
    transform: `translate3d(0, ${-stepsBack * 14}px, ${-stepsBack * 150}px)`,
    opacity: stepsBack > 3 ? 0 : 1 - stepsBack * 0.22,
    zIndex: MILESTONES.length - stepsBack,
  };
}

/** Rolls the big year counter through every year between two milestones. */
function rollYear(el: HTMLElement, from: number, to: number) {
  if (from === to || prefersReducedMotion()) {
    el.textContent = String(to);
    return () => {};
  }
  const start = performance.now();
  let frame = 0;
  const step = (now: number) => {
    const t = Math.min(1, (now - start) / TRAVEL_MS);
    const eased = 1 - Math.pow(1 - t, 3);
    el.textContent = String(Math.round(from + (to - from) * eased));
    if (t < 1) frame = requestAnimationFrame(step);
  };
  frame = requestAnimationFrame(step);
  return () => cancelAnimationFrame(frame);
}

/** Time Machine: the career as snapshots flying through a starfield, from the first job to today. */
export function TimeMachineDialog() {
  const { dialogs } = useOsState();
  const open = dialogs.timeMachine;
  const actions = useOsActions();
  const [current, setCurrent] = useState(LAST);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stackRef = useRef<HTMLDivElement>(null);
  const yearRef = useRef<HTMLSpanElement>(null);
  const starfield = useRef<Starfield | null>(null);
  const shownYear = useRef(MILESTONES[LAST]?.year ?? 0);
  const lastTrip = useRef(0);
  const close = () => actions.closeDialog('timeMachine');

  const travel = (to: number) => {
    const next = Math.max(0, Math.min(LAST, to));
    if (next === current) return false;
    lastTrip.current = performance.now();
    starfield.current?.warp(next < current ? 1 : -1, Math.abs(next - current));
    setCurrent(next);
    return true;
  };

  // The stars only move while the app is open.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!open || !canvas) return;
    const field = startStarfield(canvas, prefersReducedMotion());
    starfield.current = field;
    return () => {
      field.stop();
      starfield.current = null;
    };
  }, [open]);

  // The year counter rolls to the selected milestone.
  useLayoutEffect(() => {
    const el = yearRef.current;
    if (!el) return;
    const to = MILESTONES[current]?.year ?? 0;
    const cancel = rollYear(el, shownYear.current, to);
    shownYear.current = to;
    return cancel;
  }, [current]);

  // Scroll (wheel / trackpad) travels through time like the real Time Machine: up goes back.
  // Swiping sideways does the same on touch screens.
  useEffect(() => {
    const stack = stackRef.current;
    if (!stack) return;
    let wheel = 0;
    let touchX: number | null = null;
    const busy = () => performance.now() - lastTrip.current < TRAVEL_MS;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (busy()) return;
      wheel += e.deltaY;
      if (Math.abs(wheel) < 40) return;
      setCurrent((cur) => {
        const next = Math.max(0, Math.min(LAST, cur + (wheel > 0 ? 1 : -1)));
        if (next !== cur) {
          lastTrip.current = performance.now();
          starfield.current?.warp(next < cur ? 1 : -1, 1);
        }
        return next;
      });
      wheel = 0;
    };
    const onTouchStart = (e: TouchEvent) => {
      touchX = e.touches[0]?.clientX ?? null;
    };
    const onTouchEnd = (e: TouchEvent) => {
      const endX = e.changedTouches[0]?.clientX;
      if (touchX === null || endX === undefined) return;
      const dx = endX - touchX;
      touchX = null;
      if (Math.abs(dx) < 50 || busy()) return;
      setCurrent((cur) => {
        // Swipe left = forward in time, like flipping to the next card.
        const next = Math.max(0, Math.min(LAST, cur + (dx < 0 ? 1 : -1)));
        if (next !== cur) {
          lastTrip.current = performance.now();
          starfield.current?.warp(next < cur ? 1 : -1, 1);
        }
        return next;
      });
    };
    stack.addEventListener('wheel', onWheel, { passive: false });
    stack.addEventListener('touchstart', onTouchStart, { passive: true });
    stack.addEventListener('touchend', onTouchEnd);
    return () => {
      stack.removeEventListener('wheel', onWheel);
      stack.removeEventListener('touchstart', onTouchStart);
      stack.removeEventListener('touchend', onTouchEnd);
    };
  }, []);

  const onKeyDown = (e: KeyboardEvent) => {
    const step = { ArrowLeft: -1, ArrowUp: -1, ArrowRight: 1, ArrowDown: 1 }[e.key];
    if (step === undefined) return;
    e.preventDefault();
    const next = Math.max(0, Math.min(LAST, current + step));
    travel(next);
    // Keep keyboard focus on the selected year (roving tabs).
    if (e.target instanceof HTMLElement && e.target.classList.contains('tm-tick')) {
      requestAnimationFrame(() => document.getElementById(`tm-tick-${next}`)?.focus());
    }
  };

  const milestone = MILESTONES[current];

  return (
    <Dialog open={open} title="Time Machine" onClose={close} boxClassName="wide time-machine-box">
      <div className="dialog-body time-machine" onKeyDown={onKeyDown}>
        <canvas ref={canvasRef} className="tm-space" aria-hidden="true" />

        <div className="tm-head">
          <span ref={yearRef} className="tm-year-display" aria-hidden="true" />
          <span className="tm-now" aria-live="polite">
            {milestone?.start} · {milestone?.company}
          </span>
        </div>

        <div ref={stackRef} className="tm-stack">
          {MILESTONES.map((m, i) => {
            const stepsBack = current - i;
            return (
              <article
                key={m.company}
                id={`tm-snapshot-${i}`}
                className={`tm-snapshot tm-era-${i % 4}`}
                style={snapshotStyle(stepsBack)}
                role="tabpanel"
                aria-labelledby={`tm-tick-${i}`}
                aria-hidden={stepsBack !== 0}
                inert={stepsBack !== 0}
              >
                <div className="tm-menubar" aria-hidden="true">
                  <span>{m.company}</span>
                  <span>{m.start}</span>
                </div>
                <div className="tm-window">
                  <div className="tm-window-bar" aria-hidden="true">
                    <i />
                    <i />
                    <i />
                  </div>
                  <div className="tm-window-body">
                    <h3 className="tm-title">{m.title}</h3>
                    <p className="tm-meta">
                      {m.company} · {m.period} · {m.duration}
                    </p>
                    <p className="tm-summary">{m.summary}</p>
                    <ul className="tm-tags" aria-label="Skills">
                      {m.tags.map((t) => (
                        <li key={t}>{t}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        <div className="tm-controls">
          <button type="button" className="tm-arrow" onClick={() => travel(current - 1)} disabled={current === 0} aria-label="Back in time">
            ‹
          </button>
          <div className="tm-rail" role="tablist" aria-label="Career timeline">
            {MILESTONES.map((m, i) => (
              <button
                key={m.company}
                type="button"
                id={`tm-tick-${i}`}
                className={`tm-tick${i === current ? ' active' : ''}${i < current ? ' past' : ''}`}
                role="tab"
                aria-selected={i === current}
                aria-controls={`tm-snapshot-${i}`}
                tabIndex={i === current ? 0 : -1}
                onClick={() => travel(i)}
              >
                <span className="tm-dot" aria-hidden="true" />
                <span className="tm-year">{m.year}</span>
              </button>
            ))}
          </div>
          <button type="button" className="tm-arrow" onClick={() => travel(current + 1)} disabled={current === LAST} aria-label="Forward in time">
            ›
          </button>
        </div>
        <p className="tm-hint">Scroll, swipe or pick a year to travel through Shubham&apos;s career.</p>
      </div>
    </Dialog>
  );
}
