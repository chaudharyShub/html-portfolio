'use client';

import { useCallback, useEffect, useRef, type PointerEvent as ReactPointerEvent } from 'react';
import { AppIcon } from '@/components/icons';
import { useOsActions, useOsState } from '@/components/os/OsProvider';
import { APPLE_EASE, isPhoneLayout, prefersReducedMotion } from '@/lib/motion';

const TOAST_DURATION_MS = 4500;
const LEAVE_MS = 320;
/** Phones: an upward drag past this distance (px), or a quick flick, dismisses the banner. */
const DISMISS_DISTANCE = 36;
const DISMISS_VELOCITY = 0.5; // px per ms

interface Drag {
  pointerId: number;
  startY: number;
  lastY: number;
  lastTime: number;
  velocity: number;
  offset: number;
}

/**
 * Notification banner (top-right on desktop, top on phones). Show one with
 * `actions.showToast(title, message, emoji?)`; an emoji replaces the app tile as its icon.
 * It leaves the way it came in (slides right on computers, up on phones); on phones it can also be pushed up to dismiss it, like an iPhone banner.
 */
export function Toast() {
  const { toast } = useOsState();
  const { hideToast } = useOsActions();
  const innerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<Drag | null>(null);
  const leavingRef = useRef(false);

  /** Animates the banner out from wherever it is, then removes it. */
  const leave = useCallback(
    (id: number) => {
      const el = innerRef.current;
      if (!el || leavingRef.current) return;
      leavingRef.current = true;
      if (prefersReducedMotion()) {
        hideToast(id);
        return;
      }
      const from = getComputedStyle(el).transform;
      el.getAnimations().forEach((a) => a.cancel());
      const to = isPhoneLayout() ? 'translateY(-140%)' : 'translateX(110%)';
      const animation = el.animate(
        [
          { transform: from === 'none' ? 'none' : from, opacity: 1 },
          { transform: to, opacity: 0 },
        ],
        { duration: LEAVE_MS, easing: APPLE_EASE, fill: 'forwards' },
      );
      animation.finished.then(() => hideToast(id)).catch(() => {});
    },
    [hideToast],
  );

  useEffect(() => {
    if (!toast) return;
    leavingRef.current = false;
    let timer: number;
    const tick = () => {
      // Don't pull the banner away while a finger is holding it.
      if (dragRef.current) timer = window.setTimeout(tick, 600);
      else leave(toast.id);
    };
    timer = window.setTimeout(tick, TOAST_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [toast, leave]);

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!isPhoneLayout() || leavingRef.current) return;
    // Settle the entrance animation so the drag starts from the banner's resting place.
    e.currentTarget.getAnimations().forEach((a) => a.finish());
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current = { pointerId: e.pointerId, startY: e.clientY, lastY: e.clientY, lastTime: e.timeStamp, velocity: 0, offset: 0 };
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    const dt = Math.max(1, e.timeStamp - drag.lastTime);
    drag.velocity = (drag.lastY - e.clientY) / dt;
    drag.lastY = e.clientY;
    drag.lastTime = e.timeStamp;
    const dy = e.clientY - drag.startY;
    // Free upward, a little resistance downward.
    drag.offset = dy < 0 ? dy : dy * 0.25;
    e.currentTarget.style.transform = `translateY(${drag.offset}px)`;
  };

  const onPointerEnd = (e: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== e.pointerId) return;
    dragRef.current = null;
    const el = e.currentTarget;
    const dismiss = drag.offset < -DISMISS_DISTANCE || (drag.offset < 0 && drag.velocity > DISMISS_VELOCITY);
    if (dismiss && toast) {
      leave(toast.id);
      el.style.transform = '';
      return;
    }
    // Not far enough: spring back.
    const from = el.style.transform;
    el.style.transform = '';
    if (from && !prefersReducedMotion()) {
      el.animate([{ transform: from }, { transform: 'none' }], { duration: 300, easing: APPLE_EASE });
    }
  };

  // The live region stays mounted so screen readers announce new messages.
  return (
    <div id="toast" className={`toast${toast ? ' show' : ''}`} role="status" aria-live="polite">
      {toast && (
        <div
          className="toast-inner"
          key={toast.id}
          ref={innerRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerEnd}
          onPointerCancel={onPointerEnd}
        >
          {toast.emoji ? (
            <span className="toast-emoji" aria-hidden="true">
              {toast.emoji}
            </span>
          ) : (
            <AppIcon name="portfolio" size={36} />
          )}
          <div className="toast-text">
            <div className="toast-head">
              <span className="toast-title">{toast.title}</span>
              <span className="toast-time" aria-hidden="true">
                now
              </span>
            </div>
            <div className="toast-message">{toast.message}</div>
          </div>
        </div>
      )}
    </div>
  );
}
