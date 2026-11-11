'use client';

import { useEffect, useImperativeHandle, useRef, useState, type KeyboardEvent, type MouseEvent, type ReactNode } from 'react';
import { AppIcon } from '@/components/icons';
import { useOsApi, type OsActions } from '@/components/os/OsProvider';
import { /* MadeByPill, */ MadeByWidget } from './MadeBy';
import { StickyNote } from './StickyNote';
import { MENUBAR_HEIGHT } from '@/lib/layout';

interface DesktopIconDef {
  id: string;
  label: string;
  icon: ReactNode;
  open: (actions: OsActions) => void;
  /**
   * Home Screen only. On computers these apps are in the Dock (or, for Links, in the Contact
   * section), so the desktop doesn't repeat them; the phone Dock only holds four apps.
   */
  phoneOnly?: boolean;
}

const DESKTOP_ICONS: DesktopIconDef[] = [
  { id: 'icon-mycomputer', label: 'Shubham HD', icon: <AppIcon name="drive" size={56} />, open: (a) => a.openDialog('about') },
  { id: 'icon-game', label: 'Debug Runner', icon: <AppIcon name="game" size={56} />, open: (a) => a.openGame() },
  { id: 'icon-timemachine', label: 'Time Machine', icon: <AppIcon name="timemachine" size={56} />, open: (a) => a.openDialog('timeMachine') },
  { id: 'icon-activity', label: 'Activity Monitor', icon: <AppIcon name="activity" size={56} />, open: (a) => a.openDialog('activity'), phoneOnly: true },
  // The blog posts, as their own app (not a tab in the portfolio window, not in the Dock).
  { id: 'icon-writing', label: 'Writing', icon: <AppIcon name="writing" size={56} />, open: (a) => a.openDialog('writing') },
  { id: 'icon-trash', label: 'Trash', icon: <AppIcon name="trash" size={56} />, open: (a) => a.openDialog('trash'), phoneOnly: true },
  // Placed before Trash by CSS.
  { id: 'icon-links', label: 'Links', icon: <AppIcon name="links" size={56} />, open: (a) => a.openDialog('links'), phoneOnly: true },
];

const ICON_STEP = 104;
/** The icons computers show, top to bottom. */
const COLUMN_ICONS = DESKTOP_ICONS.filter((def) => !def.phoneOnly);

interface Position {
  left: number;
  top: number;
}

/**
 * A column down the right edge, like the macOS desktop. (Phones ignore this: they use a grid.)
 * Positions are inside the desktop layer, which starts below the menu bar. `order` lists the
 * computer icons from top to bottom (Clean Up shuffles it); phone-only icons are hidden here.
 */
function columnLayout(viewportWidth: number, order: readonly DesktopIconDef[] = COLUMN_ICONS): Position[] {
  return DESKTOP_ICONS.map((def) => ({
    left: viewportWidth - 112,
    top: MENUBAR_HEIGHT + 16 + Math.max(0, order.indexOf(def)) * ICON_STEP,
  }));
}

function shuffled<T>(items: readonly T[]): T[] {
  return [...items].sort(() => Math.random() - 0.5);
}

const HOME_PAGES = 2;

/**
 * Draggable desktop icons; double-click, tap or Enter opens them. On phones this is the Home
 * Screen: two pages you swipe between (CSS scroll snap), with page dots above the Dock. Page 1
 * holds the icons, the sticky note and the Shubham Works pill; page 2 the Shubham Works widget.
 * On computers the page wrappers are `display: contents` and page 2 is hidden.
 */
export function DesktopIcons() {
  const { actions, connect } = useOsApi();
  // Server and first client render use the desktop layout; the real viewport layout is applied after boot.
  const [positions, setPositions] = useState<Position[]>(() => columnLayout(1024));
  const detach = useRef<(() => void) | null>(null);
  const lastPointerType = useRef('mouse');
  const layerRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(0);

  const onLayerScroll = () => {
    const layer = layerRef.current;
    if (layer && layer.clientWidth) setPage(Math.round(layer.scrollLeft / layer.clientWidth));
  };

  const goToPage = (index: number) => {
    const layer = layerRef.current;
    if (!layer) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    layer.scrollTo({ left: index * layer.clientWidth, behavior: reduce ? 'auto' : 'smooth' });
  };

  useImperativeHandle(connect.desktopIcons, () => ({
    resetLayout: () => setPositions(columnLayout(window.innerWidth)),
    arrange: () => setPositions(columnLayout(window.innerWidth, shuffled(COLUMN_ICONS))),
  }));

  useEffect(() => () => detach.current?.(), []);

  const startDrag = (index: number, e: MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    const iconEl = e.currentTarget;
    // Positions are inside the desktop layer (which starts below the menu bar), so the grab
    // offset is measured in the same coordinates; viewport coordinates made the icon jump.
    const layer = iconEl.offsetParent as HTMLElement | null;
    const offsetX = e.clientX - iconEl.offsetLeft;
    const offsetY = e.clientY - iconEl.offsetTop;

    const onMove = (ev: globalThis.MouseEvent) => {
      const maxLeft = (layer?.clientWidth ?? window.innerWidth) - iconEl.offsetWidth;
      const maxTop = (layer?.clientHeight ?? window.innerHeight) - iconEl.offsetHeight;
      const left = Math.max(0, Math.min(ev.clientX - offsetX, maxLeft));
      const top = Math.max(0, Math.min(ev.clientY - offsetY, maxTop));
      setPositions((prev) => prev.map((p, i) => (i === index ? { left, top } : p)));
    };
    const stop = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', stop);
      detach.current = null;
    };
    detach.current?.();
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', stop);
    detach.current = stop;
  };

  const onKeyDown = (def: DesktopIconDef, e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      def.open(actions);
    }
  };

  return (
    <>
      <div className="desktop-layer" aria-label="Desktop" role="group" ref={layerRef} onScroll={onLayerScroll}>
        <div className="home-page">
          <StickyNote />
          {DESKTOP_ICONS.map((def, i) => (
            <div
              key={def.id}
              id={def.id}
              className={def.phoneOnly ? 'desktop-icon desktop-icon--phone-only' : 'desktop-icon'}
              style={positions[i]}
              role="button"
              tabIndex={0}
              onPointerDown={(e) => {
                lastPointerType.current = e.pointerType;
              }}
              onMouseDown={(e) => startDrag(i, e)}
              // Mouse: double-click opens (as before). Double-tap isn't reliable on phones (iOS),
              // so a single tap opens on touch screens.
              onClick={() => {
                if (lastPointerType.current !== 'mouse') def.open(actions);
              }}
              onDoubleClick={() => {
                if (lastPointerType.current === 'mouse') def.open(actions);
              }}
              onKeyDown={(e) => onKeyDown(def, e)}
            >
              {def.icon}
              <span className="desktop-icon-label">{def.label}</span>
            </div>
          ))}
          {/* Hidden for now to see the Home Screen without it (user's request). */}
          {/* <MadeByPill /> */}
        </div>
        <div className="home-page home-page-widgets">
          <MadeByWidget />
        </div>
      </div>
      <div className="home-dots">
        {Array.from({ length: HOME_PAGES }, (_, i) => (
          <button
            key={i}
            type="button"
            className="home-dot"
            aria-label={`Home Screen page ${i + 1} of ${HOME_PAGES}`}
            aria-current={page === i ? 'true' : undefined}
            onClick={() => goToPage(i)}
          />
        ))}
      </div>
    </>
  );
}
