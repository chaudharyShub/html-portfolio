'use client';

import { useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { WindowGlyph } from '@/components/icons';
import { pressableProps } from '@/lib/a11y';
import {
  animatePopIn,
  animatePopOut,
  animateSheetIn,
  animateSheetOut,
  APPLE_EASE,
  isPhoneLayout,
  prefersReducedMotion,
  resetAnimationStyles,
} from '@/lib/motion';

interface DialogProps {
  open: boolean;
  title: string;
  onClose: () => void;
  /**
   * 'alert': icon + bold title + message + buttons (macOS/iOS alert).
   * 'panel': a small window with a title bar; a bottom sheet on phones.
   */
  kind?: 'alert' | 'panel';
  /** Alert icon, shown above the title. */
  icon?: ReactNode;
  /** Extra classes for the box, e.g. "wide" or "wizard-box". */
  boxClassName?: string;
  /** Panels only: makes the green button work, filling the screen (desktop only). */
  zoomed?: boolean;
  onToggleZoom?: () => void;
  children: ReactNode;
}

const CLOSE_MS = 180;
const ZOOM_MS = 420;

/**
 * Modal dialog. Stays mounted while closed (so app state like the game survives). Alerts spring
 * in, panels pop in on desktop and slide up as sheets on phones; all of it is skipped under
 * reduced motion. Focus moves in on open and returns on close; Escape closes.
 */
export function Dialog({ open, title, onClose, kind = 'panel', icon, boxClassName, zoomed = false, onToggleZoom, children }: DialogProps) {
  const titleId = useId();
  const boxRef = useRef<HTMLDivElement>(null);
  const zoomFrom = useRef<DOMRect | null>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const [closing, setClosing] = useState(false);
  const [prevOpen, setPrevOpen] = useState(open);

  // Adjust state while rendering when `open` flips (keeps the box visible for the close animation).
  if (prevOpen !== open) {
    setPrevOpen(open);
    setClosing(!open && !prefersReducedMotion());
  }

  useLayoutEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const sheet = kind === 'panel' && isPhoneLayout();
    if (open) {
      if (document.activeElement instanceof HTMLElement && !box.contains(document.activeElement)) {
        returnFocus.current = document.activeElement;
      }
      box.focus({ preventScroll: true });
      if (prefersReducedMotion()) return;
      let timer: number;
      if (sheet) timer = animateSheetIn(box);
      else if (kind === 'alert' && isPhoneLayout()) timer = animatePopIn(box, 1.12, 260, 280, APPLE_EASE);
      else timer = animatePopIn(box, 0.9, 340, 360);
      return () => window.clearTimeout(timer);
    }
    if (box.contains(document.activeElement)) returnFocus.current?.focus({ preventScroll: true });
    if (!closing) return;
    if (sheet) animateSheetOut(box, CLOSE_MS);
    else animatePopOut(box, 0.95, CLOSE_MS);
    const timer = window.setTimeout(() => {
      resetAnimationStyles(box);
      setClosing(false);
    }, CLOSE_MS + 10);
    return () => window.clearTimeout(timer);
  }, [open, closing, kind]);

  // The box glides between its window size and the full screen.
  useLayoutEffect(() => {
    const box = boxRef.current;
    const from = zoomFrom.current;
    zoomFrom.current = null;
    if (!box || !from || prefersReducedMotion()) return;
    const to = box.getBoundingClientRect();
    const radius = zoomed ? ['12px', '0px'] : ['0px', '12px'];
    const anim = box.animate(
      [
        { width: `${from.width}px`, height: `${from.height}px`, borderRadius: radius[0] },
        { width: `${to.width}px`, height: `${to.height}px`, borderRadius: radius[1] },
      ],
      { duration: ZOOM_MS, easing: APPLE_EASE },
    );
    return () => anim.cancel();
  }, [zoomed]);

  const toggleZoom = () => {
    if (!onToggleZoom) return;
    zoomFrom.current = boxRef.current?.getBoundingClientRect() ?? null;
    onToggleZoom();
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      // Like macOS, Escape leaves full screen first.
      if (zoomed && onToggleZoom) toggleZoom();
      else onClose();
    }
  };

  return (
    <div
      className={`dialog-overlay dialog-overlay--${kind}${zoomed ? ' dialog-overlay--zoomed' : ''}${closing ? ' closing' : ''}`}
      style={{ display: open || closing ? 'flex' : 'none' }}
      onClick={(e) => {
        // Tapping the dimmed area closes a sheet, like iOS.
        if (e.target === e.currentTarget && kind === 'panel' && isPhoneLayout()) onClose();
      }}
    >
      <div
        ref={boxRef}
        className={['dialog-box', `dialog-box--${kind}`, boxClassName, zoomed && 'zoomed'].filter(Boolean).join(' ')}
        role={kind === 'alert' ? 'alertdialog' : 'dialog'}
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={onKeyDown}
      >
        {kind === 'alert' ? (
          <>
            {icon && <div className="dialog-icon">{icon}</div>}
            <h2 className="alert-title" id={titleId}>
              {title}
            </h2>
          </>
        ) : (
          <div className="dialog-title-bar" onDoubleClick={(e) => e.target === e.currentTarget && toggleZoom()}>
            <span className="tl tl-close dialog-close" {...pressableProps} onClick={onClose} aria-label="Close" title="Close">
              <WindowGlyph name="close" />
              <span className="sheet-done" aria-hidden="true">
                Done
              </span>
            </span>
            <span className="dialog-lights-off">
              <span className="tl tl-min tl-disabled" aria-hidden="true" />
              {onToggleZoom ? (
                <span
                  className="tl tl-zoom dialog-zoom"
                  {...pressableProps}
                  onClick={toggleZoom}
                  aria-label={zoomed ? 'Exit Full Screen' : 'Enter Full Screen'}
                  title={zoomed ? 'Exit Full Screen' : 'Enter Full Screen'}
                >
                  <WindowGlyph name="zoom" />
                </span>
              ) : (
                <span className="tl tl-zoom tl-disabled" aria-hidden="true" />
              )}
            </span>
            <span className="dialog-title" id={titleId}>
              {title}
            </span>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
