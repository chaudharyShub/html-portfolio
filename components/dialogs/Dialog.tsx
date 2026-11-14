'use client';

import {
  useEffect,
  useEffectEvent,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from 'react';
import { WindowGlyph } from '@/components/icons';
import { useOsApi, type DialogId } from '@/components/os/OsProvider';
import { pressableProps } from '@/lib/a11y';
import { DOCK_RESERVE, MENUBAR_HEIGHT } from '@/lib/layout';
import { createStore } from '@/lib/store';
import {
  animateFromDock,
  animatePopIn,
  animatePopOut,
  animateSheetIn,
  animateSheetOut,
  animateToDock,
  APPLE_EASE,
  enableSheetDrag,
  isPhoneLayout,
  prefersReducedMotion,
  prepareGenie,
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
  /**
   * Panels only: makes the yellow button work (desktop only). The panel pours into the Dock
   * button `dockIconId` (genie) and stays open, out of sight; `openDialog(id)` brings it back.
   */
  minimizable?: { id: DialogId; dockIconId: string };
  /** The pointer is on the window buttons (true) or left them: e.g. to hold live content still. */
  onButtonsHover?: (over: boolean) => void;
  children: ReactNode;
}

/**
 * On computers panels don't block the desktop (like a Mac's app windows), so several can be open:
 * the one opened or used last is drawn in front (`dialog-overlay--front`).
 */
const frontPanel = createStore({ id: '' });

const CLOSE_MS = 180;
const ZOOM_MS = 420;

/** A minimizable panel: on screen, pouring into the Dock, in the Dock, or coming back. */
type Phase = 'shown' | 'leaving' | 'away' | 'returning';

/**
 * Modal dialog. Stays mounted while closed (so app state like the game survives). Alerts spring
 * in, panels pop in on desktop and slide up as sheets on phones; all of it is skipped under
 * reduced motion. Focus moves in on open and returns on close; Escape closes.
 */
export function Dialog({
  open,
  title,
  onClose,
  kind = 'panel',
  icon,
  boxClassName,
  zoomed = false,
  onToggleZoom,
  minimizable,
  onButtonsHover,
  children,
}: DialogProps) {
  const { actions, connect } = useOsApi();
  const titleId = useId();
  const boxRef = useRef<HTMLDivElement>(null);
  const zoomFrom = useRef<DOMRect | null>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const prepareTimer = useRef(0);
  const [closing, setClosing] = useState(false);
  const [prevOpen, setPrevOpen] = useState(open);
  const [phase, setPhase] = useState<Phase>('shown');
  const phaseRef = useRef<Phase>('shown');
  const cancelGenie = useRef<(() => void) | undefined>(undefined);
  const minimizeRef = useRef<(() => void) | undefined>(undefined);
  const openRef = useRef(open);
  useEffect(() => {
    openRef.current = open;
  }, [open]);
  const front = frontPanel.use().id === titleId;
  const toFront = () => {
    if (kind === 'panel' && frontPanel.get().id !== titleId) frontPanel.set({ id: titleId });
  };

  // Adjust state while rendering when `open` flips (keeps the box visible for the close animation).
  if (prevOpen !== open) {
    setPrevOpen(open);
    // Closed while in the Dock: it just goes (nothing on screen to animate).
    setClosing(!open && !prefersReducedMotion() && phase === 'shown');
    if (!open && phase !== 'shown') setPhase('shown');
  }

  useLayoutEffect(() => {
    const box = boxRef.current;
    if (!box) return;
    const sheet = kind === 'panel' && isPhoneLayout();
    if (open) {
      if (kind === 'panel') frontPanel.set({ id: titleId });
      if (document.activeElement instanceof HTMLElement && !box.contains(document.activeElement)) {
        returnFocus.current = document.activeElement;
      }
      box.focus({ preventScroll: true });
      if (prefersReducedMotion()) return;
      if (sheet) {
        const timer = animateSheetIn(box);
        return () => window.clearTimeout(timer);
      }
      if (kind === 'alert' && isPhoneLayout()) animatePopIn(box, 1.12, 260, APPLE_EASE);
      else animatePopIn(box, 0.9, 340);
      return;
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
  }, [open, closing, kind, titleId]);

  // On phones a sheet can also be pulled down to close, like iOS.
  const dismiss = useEffectEvent(() => onClose());
  useEffect(() => {
    const box = boxRef.current;
    if (!box || !open || kind !== 'panel' || !isPhoneLayout()) return;
    return enableSheetDrag(box, dismiss);
  }, [open, kind]);

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

  /*
   * Minimize: the panel pours into its Dock icon right from the click; the rest of the desktop
   * hears about it when it lands (re-rendering it on the click held up the first frame, as with
   * the windows). In the Dock it is only invisible (--away), so it stays laid out and its way
   * back can be prepared while the pointer rests on the Dock icon. Restore plays it backwards.
   */
  const panelId = minimizable?.id;
  const dockIconId = minimizable?.dockIconId;
  useEffect(() => {
    if (!panelId || !dockIconId) return;
    const go = (next: Phase) => {
      phaseRef.current = next;
      setPhase(next);
    };
    const icon = () => document.getElementById(dockIconId);
    const minimize = () => {
      const box = boxRef.current;
      if (!box || phaseRef.current !== 'shown') return;
      if (box.contains(document.activeElement)) returnFocus.current?.focus({ preventScroll: true });
      const land = () => {
        cancelGenie.current = undefined;
        go('away');
        actions.reportPanelMinimized(panelId, true);
      };
      go('leaving');
      const target = icon();
      if (!target || prefersReducedMotion()) land();
      else cancelGenie.current = animateToDock(box, target, land);
    };
    const restore = () => {
      const box = boxRef.current;
      if (!box || (phaseRef.current !== 'away' && phaseRef.current !== 'leaving')) return;
      cancelGenie.current?.();
      const back = () => {
        cancelGenie.current = undefined;
        box.style.opacity = '';
        go('shown');
        box.focus({ preventScroll: true });
        actions.reportPanelMinimized(panelId, false);
      };
      const target = icon();
      if (!target || prefersReducedMotion()) {
        back();
        return;
      }
      cancelGenie.current = animateFromDock(box, target, back);
      go('returning');
    };
    minimizeRef.current = minimize;
    connect.panel(panelId, {
      isMinimized: () => phaseRef.current === 'leaving' || phaseRef.current === 'away',
      isOnScreen: () => openRef.current && (phaseRef.current === 'shown' || phaseRef.current === 'returning'),
      minimize,
      restore,
      prepareRestore: () => {
        if (openRef.current && boxRef.current && phaseRef.current !== 'leaving') prepareGenie(boxRef.current);
      },
    });
    return () => {
      minimizeRef.current = undefined;
      connect.panel(panelId, null);
    };
  }, [panelId, dockIconId, actions, connect]);

  // Closed while minimized: forget the trip (the genie left the box transparent).
  useLayoutEffect(() => {
    if (open || !panelId) return;
    cancelGenie.current?.();
    cancelGenie.current = undefined;
    phaseRef.current = 'shown';
    if (boxRef.current) boxRef.current.style.opacity = '';
  }, [open, panelId]);

  // Copies for the genie are made while the pointer rests on the buttons, so the click starts it at once.
  // On the yellow button itself: after a click on the green one the panel has a new size.
  const prepareMinimize = () => {
    window.clearTimeout(prepareTimer.current);
    prepareTimer.current = window.setTimeout(() => {
      if (boxRef.current) prepareGenie(boxRef.current);
    }, 80);
  };
  useEffect(() => () => window.clearTimeout(prepareTimer.current), []);

  const toggleZoom = () => {
    if (!onToggleZoom) return;
    zoomFrom.current = boxRef.current?.getBoundingClientRect() ?? null;
    onToggleZoom();
  };

  /*
   * Desktop panels can be dragged by the title bar, like the windows. The offset is the CSS
   * `translate` property, so it adds to the pop-in/out transforms instead of fighting them. The
   * title bar stays reachable: below the menu bar, above the Dock, partly on screen sideways.
   */
  const dragOffset = useRef({ x: 0, y: 0 });
  const placeBox = (box: HTMLElement, x: number, y: number) => {
    dragOffset.current = { x, y };
    box.style.translate = x || y ? `${x}px ${y}px` : '';
  };
  const startDrag = (e: PointerEvent<HTMLDivElement>) => {
    const box = boxRef.current;
    const bar = e.currentTarget;
    if (!box || zoomed || e.button !== 0 || isPhoneLayout()) return;
    if (e.target instanceof Element && e.target.closest('.tl')) return;
    e.preventDefault(); // no text selection while dragging
    const start = { px: e.clientX, py: e.clientY, ...dragOffset.current };
    const rect = box.getBoundingClientRect();
    const barHeight = bar.offsetHeight;
    // Where the box would be with no offset.
    const baseLeft = rect.left - start.x;
    const baseTop = rect.top - start.y;
    const KEEP = 100; // px of the title bar that stays on screen sideways
    const move = (ev: globalThis.PointerEvent) => {
      const left = Math.min(Math.max(baseLeft + start.x + ev.clientX - start.px, KEEP - rect.width), window.innerWidth - KEEP);
      const top = Math.min(
        Math.max(baseTop + start.y + ev.clientY - start.py, MENUBAR_HEIGHT),
        window.innerHeight - DOCK_RESERVE - barHeight,
      );
      placeBox(box, left - baseLeft, top - baseTop);
    };
    const end = () => {
      bar.removeEventListener('pointermove', move);
      bar.removeEventListener('pointerup', end);
      bar.removeEventListener('pointercancel', end);
    };
    bar.setPointerCapture(e.pointerId);
    bar.addEventListener('pointermove', move);
    bar.addEventListener('pointerup', end);
    bar.addEventListener('pointercancel', end);
  };

  // A panel opens centered again, and going full screen (or back) forgets the offset.
  useLayoutEffect(() => {
    const box = boxRef.current;
    if (!open || !box) return;
    dragOffset.current = { x: 0, y: 0 };
    box.style.translate = '';
  }, [open, zoomed]);

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
      className={[
        'dialog-overlay',
        `dialog-overlay--${kind}`,
        zoomed && 'dialog-overlay--zoomed',
        front && 'dialog-overlay--front',
        closing && 'closing',
        (phase === 'leaving' || phase === 'away') && 'dialog-overlay--minimized',
        phase === 'away' && 'dialog-overlay--away',
      ]
        .filter(Boolean)
        .join(' ')}
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
        // Alerts block everything; panels leave the desktop usable on computers (bottom sheets on
        // phones still dim it, but closing them is one tap on the dimmed area).
        aria-modal={kind === 'alert' ? true : undefined}
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={onKeyDown}
        onPointerDownCapture={toFront}
        onFocusCapture={toFront}
      >
        {kind === 'alert' ? (
          <>
            {icon && <div className="dialog-icon">{icon}</div>}
            <h2 className="alert-title" id={titleId}>
              {title}
            </h2>
          </>
        ) : (
          <div className="dialog-title-bar" onPointerDown={startDrag} onDoubleClick={(e) => e.target === e.currentTarget && toggleZoom()}>
            <span className="tl tl-close dialog-close" {...pressableProps} onClick={onClose} aria-label="Close" title="Close">
              <WindowGlyph name="close" />
              <span className="sheet-done" aria-hidden="true">
                Done
              </span>
            </span>
            <span
              className="dialog-lights-off"
              onPointerEnter={() => onButtonsHover?.(true)}
              onPointerLeave={() => {
                window.clearTimeout(prepareTimer.current);
                onButtonsHover?.(false);
              }}
            >
              {minimizable ? (
                <span
                  className="tl tl-min dialog-min"
                  {...pressableProps}
                  onPointerEnter={prepareMinimize}
                  onClick={() => minimizeRef.current?.()}
                  aria-label="Minimize"
                  title="Minimize"
                >
                  <WindowGlyph name="minimize" />
                </span>
              ) : (
                <span className="tl tl-min tl-disabled" aria-hidden="true" />
              )}
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
