'use client';

import { useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { pressableProps } from '@/lib/a11y';
import { animatePopIn, prefersReducedMotion, resetAnimationStyles } from '@/lib/motion';

interface DialogProps {
  open: boolean;
  title: string;
  onClose: () => void;
  /** Extra classes for the box, e.g. "wide" or "wizard-box". */
  boxClassName?: string;
  children: ReactNode;
}

/**
 * Win95 modal dialog. Stays mounted while closed (so app state like the DOS-style game survives),
 * pops in at 130ms and out at 100ms, and is skipped entirely under reduced motion.
 */
export function Dialog({ open, title, onClose, boxClassName, children }: DialogProps) {
  const titleId = useId();
  const boxRef = useRef<HTMLDivElement>(null);
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
    if (open) {
      if (document.activeElement instanceof HTMLElement && !box.contains(document.activeElement)) {
        returnFocus.current = document.activeElement;
      }
      box.focus({ preventScroll: true });
      if (prefersReducedMotion()) return;
      const timer = animatePopIn(box, 0.92, 130, 145);
      return () => window.clearTimeout(timer);
    }
    if (box.contains(document.activeElement)) returnFocus.current?.focus({ preventScroll: true });
    if (!closing) return;
    box.style.transition = 'transform 0.1s ease-in, opacity 0.1s ease-in';
    box.style.transform = 'scale(0.92)';
    box.style.opacity = '0';
    const timer = window.setTimeout(() => {
      resetAnimationStyles(box);
      setClosing(false);
    }, 110);
    return () => window.clearTimeout(timer);
  }, [open, closing]);

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      onClose();
    }
  };

  return (
    <div className="dialog-overlay" style={{ display: open || closing ? 'flex' : 'none' }}>
      <div
        ref={boxRef}
        className={['dialog-box', boxClassName].filter(Boolean).join(' ')}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={onKeyDown}
      >
        <div className="dialog-title-bar">
          <span id={titleId}>{title}</span>
          <span className="dialog-close" {...pressableProps} onClick={onClose} aria-label="Close" title="Close">
            &times;
          </span>
        </div>
        {children}
      </div>
    </div>
  );
}
