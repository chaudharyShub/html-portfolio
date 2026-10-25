'use client';

import {
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
  type Ref,
} from 'react';
import { flushSync } from 'react-dom';
import type { WindowHandle, WindowStatus } from '@/components/os/OsProvider';
import { WindowGlyph } from '@/components/icons';
import { pressableProps } from '@/lib/a11y';
import {
  animateFrame,
  animateFromDock,
  animatePopIn,
  animatePopOut,
  animateToDock,
  APPLE_EASE,
  isPhoneLayout,
  prefersReducedMotion,
  prepareGenie,
  resetAnimationStyles,
} from '@/lib/motion';

type WindowMode = 'normal' | 'maximized' | 'snapped-left' | 'snapped-right';
type ResizeDir = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

const RESIZE_DIRS: ResizeDir[] = ['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'];
/** Keep in sync with --menubar-h / --dock-reserve in styles/base.css. */
const MENUBAR_HEIGHT = 28;
const DOCK_RESERVE = 84;
const SNAP_ZONE = 8;
/** The pointer must move this far (px) before a press on the title bar counts as a drag. */
const DRAG_THRESHOLD = 4;

/**
 * Clears animation leftovers. A window that has been positioned (centered/dragged) keeps
 * `transform: none`, otherwise the CSS centering transform would shift it sideways.
 */
function resetWindowStyles(el: HTMLElement) {
  resetAnimationStyles(el);
  if (el.style.left) el.style.transform = 'none';
}

/** Disables text selection on the page while a window is being dragged. */
function setPageTextSelection(enabled: boolean) {
  document.body.style.userSelect = enabled ? '' : 'none';
}

interface WindowProps {
  ref?: Ref<WindowHandle>;
  id: string;
  variant: 'window' | 'subwindow';
  title: string;
  /** The dock icon this window minimizes into / restores from. */
  getDockIcon: () => HTMLElement | null;
  initiallyOpen: boolean;
  /** Drag to the screen edges to snap left/right, or to the top to maximize. */
  enableSnap?: boolean;
  recenterOnDoubleClick?: boolean;
  minWidth: number;
  minHeight: number;
  /** The red close button. */
  onCloseRequest: () => void;
  onStatusChange: (status: WindowStatus) => void;
  /** Called shortly after the window becomes visible (open/restore). */
  onShown?: () => void;
  role?: 'dialog';
  children: ReactNode;
}

const BackChevron = () => (
  <svg viewBox="0 0 12 20" aria-hidden="true" focusable="false">
    <path d="M10 2 2 10l8 8" />
  </svg>
);

/**
 * A draggable, resizable, minimizable, zoomable macOS-style window; on phones it is a
 * full-screen iOS app with a "Home" button in its title bar. Discrete state (visible, maximized/snapped,
 * dragging) is React state; live drag/resize geometry and animations are written to the
 * element directly so they stay smooth and can measure layout.
 */
export function Window({
  ref,
  id,
  variant,
  title,
  getDockIcon,
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
  /** Cancels the running minimize/restore/zoom/close animation, if any. */
  const cancelAnim = useRef<(() => void) | undefined>(undefined);
  const detachPointer = useRef<(() => void) | null>(null);
  const callbacks = useRef({ onStatusChange, onShown, getDockIcon });

  useEffect(() => {
    callbacks.current = { onStatusChange, onShown, getDockIcon };
  });

  // When a mouse rests on the window buttons (to minimize) or on the dock icon (to restore),
  // prepare the genie's copies so the animation starts without a pause on click.
  useEffect(() => {
    let timer = 0;
    const onPointerOver = (e: PointerEvent) => {
      const el = elRef.current;
      const target = e.target as Element | null;
      if (!el || !target || e.pointerType !== 'mouse' || animating.current) return;
      const aimsAtMinimize = status.current === 'open' && !!target.closest('.traffic-lights') && el.contains(target);
      const aimsAtRestore = status.current === 'minimized' && !!callbacks.current.getDockIcon()?.contains(target);
      window.clearTimeout(timer);
      if (!aimsAtMinimize && !aimsAtRestore) return;
      // A short rest first, so sweeping the pointer across the dock doesn't prepare anything.
      timer = window.setTimeout(() => {
        if (!animating.current) prepareGenie(el);
      }, 80);
    };
    document.addEventListener('pointerover', onPointerOver);
    return () => {
      document.removeEventListener('pointerover', onPointerOver);
      window.clearTimeout(timer);
    };
  }, []);

  useEffect(() => () => {
    detachPointer.current?.();
    cancelAnim.current?.();
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
    const hideNow = () => flushSync(() => setHidden(true));

    const center = () => {
      const el = elRef.current;
      if (!el || isPhoneLayout()) return;
      el.style.transform = 'none';
      const rect = el.getBoundingClientRect();
      const free = window.innerHeight - MENUBAR_HEIGHT - DOCK_RESERVE;
      el.style.left = `${Math.max(10, (window.innerWidth - rect.width) / 2)}px`;
      el.style.top = `${MENUBAR_HEIGHT + Math.max(8, (free - rect.height) / 2)}px`;
    };

    const minimize = () => {
      const el = elRef.current;
      if (!el || animating.current || status.current !== 'open') return;
      animating.current = true;
      setStatus('minimized');
      const icon = getDockIcon();
      if (prefersReducedMotion() || !icon) {
        hideNow();
        animating.current = false;
        return;
      }
      cancelAnim.current?.();
      cancelAnim.current = animateToDock(el, icon, () => {
        hideNow();
        resetWindowStyles(el);
        animating.current = false;
      });
    };

    const restore = () => {
      const el = elRef.current;
      if (!el) return;
      if (status.current !== 'minimized' && !animating.current) return;
      cancelAnim.current?.();
      setStatus('open');
      animating.current = true;
      resetWindowStyles(el);
      flushSync(() => setHidden(false));
      const icon = getDockIcon();
      if (prefersReducedMotion() || !icon) {
        animating.current = false;
        shownSoon();
        return;
      }
      cancelAnim.current = animateFromDock(el, icon, () => {
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
        if (!prefersReducedMotion()) animatePopIn(el, 0.88, 380, 400, APPLE_EASE);
      }
      shownSoon();
    };

    const close = () => {
      const el = elRef.current;
      if (!el) return;
      cancelAnim.current?.();
      const finish = () => {
        hideNow();
        resetWindowStyles(el);
        animating.current = false;
        setStatus('closed');
      };
      if (prefersReducedMotion() || animating.current) {
        finish();
        return;
      }
      animating.current = true;
      el.style.pointerEvents = 'none';
      animatePopOut(el, 0.9, 180);
      const timer = window.setTimeout(finish, 190);
      cancelAnim.current = () => window.clearTimeout(timer);
    };

    return {
      open,
      close,
      minimize,
      restore,
      center,
      toggleFromDock: () => {
        // Clicking the dock icon mid-minimize reverses it straight away.
        if (animating.current && status.current === 'minimized') {
          restore();
          return;
        }
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
        animatePopIn(el, 0.92, 520, 540, APPLE_EASE);
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
    // Glide the real frame from the old size to the new one, so the content reflows like macOS.
    animating.current = true;
    const before = el.getBoundingClientRect();
    flushSync(() => setMode(toggleMaximized));
    const after = el.getBoundingClientRect();
    const content = el.querySelector<HTMLElement>('[role="tabpanel"]');
    cancelAnim.current = animateFrame(
      el,
      before,
      after,
      () => {
        animating.current = false;
      },
      content,
    );
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
    if ((e.target as HTMLElement).closest('.traffic-lights')) return;
    if (isPhoneLayout()) return;

    const startX = e.clientX;
    const startY = e.clientY;
    let dragStarted = false;
    let offsetX = 0;
    let offsetY = 0;
    // Starts the drag only once the pointer really moves, so a plain click (or the first click
    // of a double-click) never changes the window.
    const beginDrag = (ev: MouseEvent) => {
      dragStarted = true;
      if (mode !== 'normal') {
        // Dragging a maximized/snapped window pops it back to normal size under the cursor.
        flushSync(() => setMode('normal'));
        clearSize(el);
        el.style.left = `${ev.clientX - 150}px`;
        el.style.top = `${Math.max(MENUBAR_HEIGHT, ev.clientY - 14)}px`;
      }
      const rect = el.getBoundingClientRect();
      offsetX = ev.clientX - rect.left;
      offsetY = ev.clientY - rect.top;
      el.style.transform = 'none';
      setDragging(true);
      setPageTextSelection(false);
    };

    trackPointer(
      (ev) => {
        if (!dragStarted) {
          if (Math.hypot(ev.clientX - startX, ev.clientY - startY) < DRAG_THRESHOLD) return;
          beginDrag(ev);
        }
        const maxLeft = window.innerWidth - 100;
        const maxTop = window.innerHeight - DOCK_RESERVE;
        const left = Math.max(-el.offsetWidth + 120, Math.min(ev.clientX - offsetX, maxLeft));
        const top = Math.max(MENUBAR_HEIGHT, Math.min(ev.clientY - offsetY, maxTop));
        el.style.left = `${left}px`;
        el.style.top = `${top}px`;
      },
      (ev) => {
        if (!dragStarted) return;
        setDragging(false);
        setPageTextSelection(true);
        if (!enableSnap) return;
        const snapTo = (side: 'snapped-left' | 'snapped-right') => {
          clearSize(el);
          el.style.left = '';
          el.style.top = '';
          setMode(side);
        };
        if (ev.clientY <= MENUBAR_HEIGHT + SNAP_ZONE) setMode('maximized');
        else if (ev.clientX <= SNAP_ZONE) snapTo('snapped-left');
        else if (ev.clientX >= window.innerWidth - SNAP_ZONE) snapTo('snapped-right');
      },
    );
  };

  // macOS: double-clicking the title bar zooms the window, and double-clicking again restores it.
  const onTitleDoubleClick = (e: ReactMouseEvent<HTMLDivElement>) => {
    const el = elRef.current;
    if (!el || (e.target as HTMLElement).closest('.traffic-lights')) return;
    if (isPhoneLayout()) return;
    if (mode === 'normal' || mode === 'maximized') {
      toggleMaximize();
      return;
    }
    // Snapped to a half: back to its normal size.
    flushSync(() => setMode('normal'));
    clearSize(el);
    if (recenterOnDoubleClick) handle.current?.center();
  };

  const onResizeMouseDown = (dir: ResizeDir, e: ReactMouseEvent<HTMLDivElement>) => {
    const el = elRef.current;
    if (!el || isPhoneLayout() || mode !== 'normal') return;
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
        top = Math.max(MENUBAR_HEIGHT, top);
        height = Math.min(height, window.innerHeight - top - 8);
        el.style.width = `${width}px`;
        el.style.left = `${left}px`;
        el.style.top = `${top}px`;
        el.style.height = `${height}px`;
      },
      () => {},
    );
  };

  // iOS: tapping the top bar scrolls the app back to the top (like tapping the status bar).
  const onTitleClick = (e: ReactMouseEvent<HTMLDivElement>) => {
    const el = elRef.current;
    if (!el || !isPhoneLayout() || (e.target as HTMLElement).closest('.title-home')) return;
    el.scrollTo({ top: 0, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  };

  const className = [variant, mode !== 'normal' ? mode : ''].filter(Boolean).join(' ');

  return (
    <div
      ref={elRef}
      id={id}
      className={className}
      style={hidden ? { display: 'none' } : undefined}
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
        onClick={onTitleClick}
      >
        <div className="traffic-lights">
          <span className="tl tl-close" {...pressableProps} onClick={onCloseRequest} title="Close" aria-label="Close">
            <WindowGlyph name="close" />
          </span>
          <span
            className="tl tl-min"
            {...pressableProps}
            onClick={() => handle.current?.minimize()}
            title="Minimize"
            aria-label="Minimize"
          >
            <WindowGlyph name="minimize" />
          </span>
          <span
            className="tl tl-zoom"
            {...pressableProps}
            onClick={toggleMaximize}
            title="Zoom"
            aria-label={mode === 'maximized' ? 'Restore' : 'Maximize'}
          >
            <WindowGlyph name="zoom" />
          </span>
        </div>
        {/* Phones only: back to the Home Screen (the app zooms into its icon). */}
        <button type="button" className="title-home" onClick={() => handle.current?.minimize()}>
          <BackChevron />
          Home
        </button>
        <span className="title-text" id={titleId}>
          {title}
        </span>
      </div>
      {children}
    </div>
  );
}
