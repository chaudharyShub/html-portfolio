'use client';

import { useEffect, useImperativeHandle, useRef, useState, type MouseEvent as ReactMouseEvent, type ReactNode, type Ref } from 'react';
import { flushSync } from 'react-dom';
import type { WindowHandle, WindowStatus } from '@/components/os/OsProvider';
import { pressableProps } from '@/lib/a11y';
import { animateFromTaskbar, animatePopIn, animateToTaskbar, prefersReducedMotion, resetAnimationStyles } from '@/lib/motion';

type WindowMode = 'normal' | 'maximized' | 'snapped-left' | 'snapped-right';
type ResizeDir = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

const RESIZE_DIRS: ResizeDir[] = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];
const TASKBAR_HEIGHT = 32;
const SNAP_ZONE = 8;
/** Disables text selection on the page while a window is being dragged. */
function setPageTextSelection(enabled: boolean) {
  document.body.style.userSelect = enabled ? '' : 'none';
}

/** Below this width windows are fixed in place (drag/resize disabled), as in the original. */
const MIN_INTERACTIVE_WIDTH = 700;

interface WindowProps {
  ref?: Ref<WindowHandle>;
  id: string;
  variant: 'window' | 'subwindow';
  title: string;
  icon: ReactNode;
  /** The taskbar button this window minimizes into / restores from. */
  getTaskbarButton: () => HTMLElement | null;
  initiallyOpen: boolean;
  /** Drag to the screen edges to snap left/right, or to the top to maximize. */
  enableSnap?: boolean;
  recenterOnDoubleClick?: boolean;
  minWidth: number;
  minHeight: number;
  /** The title-bar close (x) button. */
  onCloseRequest: () => void;
  onStatusChange: (status: WindowStatus) => void;
  /** Called shortly after the window becomes visible (open/restore). */
  onShown?: () => void;
  role?: 'dialog';
  children: ReactNode;
}

/**
 * A draggable, resizable, minimizable, maximizable Win95 window.
 * Discrete state (visible, maximized/snapped, dragging) is React state; live geometry during
 * drag/resize and the minimize/restore animations are written to the element directly so they
 * stay smooth and can measure layout.
 */
export function Window({
  ref,
  id,
  variant,
  title,
  icon,
  getTaskbarButton,
  initiallyOpen,
  enableSnap = false,
  recenterOnDoubleClick = false,
  minWidth,
  minHeight,
  onCloseRequest,
  onStatusChange,
  onShown,
  role,
  children,
}: WindowProps) {
  const elRef = useRef<HTMLDivElement>(null);
  const [hidden, setHidden] = useState(!initiallyOpen);
  const [mode, setMode] = useState<WindowMode>('normal');
  const [dragging, setDragging] = useState(false);

  const status = useRef<WindowStatus>(initiallyOpen ? 'open' : 'closed');
  const animating = useRef(false);
  const animTimer = useRef<number | undefined>(undefined);
  const detachPointer = useRef<(() => void) | null>(null);
  const callbacks = useRef({ onStatusChange, onShown });

  useEffect(() => {
    callbacks.current = { onStatusChange, onShown };
  });

  useEffect(() => () => {
    detachPointer.current?.();
    window.clearTimeout(animTimer.current);
  }, []);

  const titleId = `${id}-title`;
  const toggleMaximized = (m: WindowMode): WindowMode => (m === 'maximized' ? 'normal' : 'maximized');

  const handle = useRef<WindowHandle>(null);

  useImperativeHandle(handle, () => {
    const setStatus = (next: WindowStatus) => {
      status.current = next;
      callbacks.current.onStatusChange(next);
    };
    const shownSoon = () => window.setTimeout(() => callbacks.current.onShown?.(), 50);

    const center = () => {
      const el = elRef.current;
      if (!el) return;
      el.style.transform = 'none';
      const rect = el.getBoundingClientRect();
      el.style.left = `${Math.max(10, (window.innerWidth - rect.width) / 2)}px`;
      el.style.top = `${Math.max(10, (window.innerHeight - TASKBAR_HEIGHT - rect.height) / 2)}px`;
    };

    const minimize = () => {
      const el = elRef.current;
      if (!el || animating.current) return;
      animating.current = true;
      setStatus('minimized');
      const button = getTaskbarButton();
      if (prefersReducedMotion() || !button) {
        setHidden(true);
        animating.current = false;
        return;
      }
      window.clearTimeout(animTimer.current);
      animTimer.current = animateToTaskbar(el, button, () => {
        setHidden(true);
        el.style.transform = 'none';
        el.style.opacity = '';
        el.style.pointerEvents = '';
        animating.current = false;
      });
    };

    const restore = () => {
      const el = elRef.current;
      if (!el) return;
      if (status.current !== 'minimized' && !animating.current) return;
      window.clearTimeout(animTimer.current);
      setStatus('open');
      animating.current = true;
      el.style.transition = 'none';
      el.style.transform = 'none';
      el.style.opacity = '';
      el.style.pointerEvents = '';
      flushSync(() => setHidden(false));
      const button = getTaskbarButton();
      if (prefersReducedMotion() || !button) {
        animating.current = false;
        shownSoon();
        return;
      }
      void el.offsetWidth;
      animTimer.current = animateFromTaskbar(el, button, () => {
        animating.current = false;
        shownSoon();
      });
    };

    const open = () => {
      const el = elRef.current;
      if (!el) return;
      if (status.current === 'minimized') {
        restore();
        return;
      }
      const wasClosed = status.current === 'closed';
      setStatus('open');
      if (wasClosed) {
        flushSync(() => setHidden(false));
        if (!prefersReducedMotion()) animatePopIn(el, 0.9, 150, 165);
      }
      shownSoon();
    };

    const close = () => {
      const el = elRef.current;
      if (!el) return;
      window.clearTimeout(animTimer.current);
      const finish = () => {
        setHidden(true);
        resetAnimationStyles(el);
        animating.current = false;
        setStatus('closed');
      };
      if (prefersReducedMotion() || animating.current) {
        finish();
        return;
      }
      animating.current = true;
      el.style.transition = 'transform 0.12s ease-in, opacity 0.12s ease-in';
      el.style.transform = 'scale(0.94)';
      el.style.opacity = '0';
      el.style.pointerEvents = 'none';
      animTimer.current = window.setTimeout(finish, 130);
    };

    return {
      open,
      close,
      minimize,
      restore,
      center,
      toggleFromTaskbar: () => {
        if (animating.current) return;
        if (status.current === 'open') minimize();
        else if (status.current === 'minimized') restore();
        else open();
      },
      playOpenAnimation: () => {
        const el = elRef.current;
        if (!el) return;
        center();
        if (prefersReducedMotion()) return;
        el.style.transition = 'none';
        el.style.transform = 'scale(0.94)';
        el.style.opacity = '0';
        void el.offsetWidth;
        el.style.transition = 'transform 0.17s ease-out, opacity 0.17s ease-out';
        el.style.transform = 'scale(1)';
        el.style.opacity = '';
        window.setTimeout(() => {
          el.style.transition = '';
          el.style.transform = 'none';
        }, 190);
      },
    };
  });

  // Expose the same handle to the parent (declared after, so `handle.current` is already set).
  useImperativeHandle(ref, () => handle.current!, []);

  const toggleMaximize = () => {
    const el = elRef.current;
    if (!el) return;
    if (prefersReducedMotion() || animating.current) {
      setMode(toggleMaximized);
      return;
    }
    animating.current = true;
    el.style.transition = 'opacity 0.07s linear';
    el.style.opacity = '0.75';
    window.setTimeout(() => {
      setMode(toggleMaximized);
      el.style.transition = 'opacity 0.15s ease-out';
      el.style.opacity = '';
      window.setTimeout(() => {
        el.style.transition = '';
        animating.current = false;
      }, 160);
    }, 80);
  };

  const clearSize = (el: HTMLElement) => {
    el.style.width = '';
    el.style.height = '';
    el.style.maxHeight = '';
  };

  /** Tracks document-level mouse movement until mouseup (listeners removed on release/unmount). */
  const trackPointer = (onMove: (e: MouseEvent) => void, onUp: (e: MouseEvent) => void) => {
    const up = (e: MouseEvent) => {
      detach();
      onUp(e);
    };
    const detach = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', up);
      detachPointer.current = null;
    };
    detachPointer.current?.();
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', up);
    detachPointer.current = detach;
  };

  const onTitleMouseDown = (e: ReactMouseEvent<HTMLDivElement>) => {
    const el = elRef.current;
    if (!el || e.button !== 0) return;
    if ((e.target as HTMLElement).closest('.title-bar-buttons')) return;
    if (window.innerWidth < MIN_INTERACTIVE_WIDTH) return;

    if (mode !== 'normal') {
      // Dragging a maximized/snapped window pops it back to normal size under the cursor.
      flushSync(() => setMode('normal'));
      clearSize(el);
      el.style.left = `${e.clientX - 150}px`;
      el.style.top = `${Math.max(0, e.clientY - 14)}px`;
    }
    const rect = el.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;
    el.style.transform = 'none';
    setDragging(true);
    setPageTextSelection(false);

    trackPointer(
      (ev) => {
        const maxLeft = window.innerWidth - 100;
        const maxTop = window.innerHeight - TASKBAR_HEIGHT - 40;
        const left = Math.max(-el.offsetWidth + 120, Math.min(ev.clientX - offsetX, maxLeft));
        const top = Math.max(0, Math.min(ev.clientY - offsetY, maxTop));
        el.style.left = `${left}px`;
        el.style.top = `${top}px`;
      },
      (ev) => {
        setDragging(false);
        setPageTextSelection(true);
        if (!enableSnap) return;
        const snapTo = (side: 'snapped-left' | 'snapped-right') => {
          clearSize(el);
          el.style.left = '';
          el.style.top = '';
          setMode(side);
        };
        if (ev.clientY <= SNAP_ZONE) setMode('maximized');
        else if (ev.clientX <= SNAP_ZONE) snapTo('snapped-left');
        else if (ev.clientX >= window.innerWidth - SNAP_ZONE) snapTo('snapped-right');
      },
    );
  };

  const onTitleDoubleClick = (e: ReactMouseEvent<HTMLDivElement>) => {
    const el = elRef.current;
    if (!el || (e.target as HTMLElement).closest('.title-bar-buttons')) return;
    flushSync(() => setMode('normal'));
    clearSize(el);
    if (recenterOnDoubleClick) handle.current?.center();
  };

  const onResizeMouseDown = (dir: ResizeDir, e: ReactMouseEvent<HTMLDivElement>) => {
    const el = elRef.current;
    if (!el || window.innerWidth < MIN_INTERACTIVE_WIDTH || mode !== 'normal') return;
    e.stopPropagation();
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    const rect = el.getBoundingClientRect();
    el.style.transform = 'none';
    el.style.maxHeight = 'none';

    trackPointer(
      (ev) => {
        const dx = ev.clientX - startX;
        const dy = ev.clientY - startY;
        let width = rect.width;
        let height = rect.height;
        let left = rect.left;
        let top = rect.top;
        if (dir.includes('e')) width = Math.max(minWidth, rect.width + dx);
        if (dir.includes('s')) height = Math.max(minHeight, rect.height + dy);
        if (dir.includes('w')) {
          width = Math.max(minWidth, rect.width - dx);
          left = rect.left + (rect.width - width);
        }
        if (dir.includes('n')) {
          height = Math.max(minHeight, rect.height - dy);
          top = rect.top + (rect.height - height);
        }
        height = Math.min(height, window.innerHeight - TASKBAR_HEIGHT - Math.max(0, top));
        el.style.width = `${width}px`;
        el.style.left = `${left}px`;
        el.style.top = `${Math.max(0, top)}px`;
        el.style.height = `${height}px`;
      },
      () => {},
    );
  };

  const className = [variant, mode !== 'normal' ? mode : ''].filter(Boolean).join(' ');

  return (
    <div
      ref={elRef}
      id={id}
      className={className}
      style={{ display: hidden ? 'none' : 'flex' }}
      role={role}
      aria-labelledby={titleId}
    >
      {RESIZE_DIRS.map((dir) => (
        <div
          key={dir}
          className={`resize-handle resize-${dir}`}
          data-dir={dir}
          aria-hidden="true"
          onMouseDown={(e) => onResizeMouseDown(dir, e)}
        />
      ))}
      <div
        className={`title-bar${dragging ? ' dragging' : ''}`}
        onMouseDown={onTitleMouseDown}
        onDoubleClick={onTitleDoubleClick}
      >
        <div className="title-bar-left">
          {icon}
          <span id={titleId}>{title}</span>
        </div>
        <div className="title-bar-buttons">
          <span {...pressableProps} onClick={() => handle.current?.minimize()} title="Minimize" aria-label="Minimize">
            _
          </span>
          <span
            {...pressableProps}
            onClick={toggleMaximize}
            title="Maximize"
            aria-label={mode === 'maximized' ? 'Restore' : 'Maximize'}
          >
            &#9633;
          </span>
          <span {...pressableProps} onClick={onCloseRequest} title="Close" aria-label="Close">
            &times;
          </span>
        </div>
      </div>
      {children}
    </div>
  );
}
