'use client';

import { useEffect, useImperativeHandle, useRef, useState, type KeyboardEvent, type MouseEvent, type ReactNode } from 'react';
import { AppIcon } from '@/components/icons';
import { useOsApi, type OsActions } from '@/components/os/OsProvider';
import { /* MadeByPill, */ MadeByWidget } from './MadeBy';
import { StickyNote } from './StickyNote';

interface DesktopIconDef {
  id: string;
  label: string;
  icon: ReactNode;
  open: (actions: OsActions) => void;
}

const DESKTOP_ICONS: DesktopIconDef[] = [
  { id: 'icon-mycomputer', label: 'Shubham HD', icon: <AppIcon name="drive" size={56} />, open: (a) => a.openDialog('about') },
  { id: 'icon-game', label: 'Debug Runner', icon: <AppIcon name="game" size={56} />, open: (a) => a.openGame() },
  { id: 'icon-timemachine', label: 'Time Machine', icon: <AppIcon name="timemachine" size={56} />, open: (a) => a.openDialog('timeMachine') },
  { id: 'icon-activity', label: 'Activity Monitor', icon: <AppIcon name="activity" size={56} />, open: (a) => a.openDialog('activity') },
  // The blog posts, as their own app (not a tab in the portfolio window, not in the Dock).
  { id: 'icon-writing', label: 'Writing', icon: <AppIcon name="writing" size={56} />, open: (a) => a.openDialog('writing') },
  { id: 'icon-terminal', label: 'Terminal', icon: <AppIcon name="terminal" size={56} />, open: (a) => a.openTerminal() },
  { id: 'icon-trash', label: 'Trash', icon: <AppIcon name="trash" size={56} />, open: (a) => a.openDialog('trash') },
  // Phones only (the Contact section shows the links on computers); placed before Trash by CSS.
  { id: 'icon-links', label: 'Links', icon: <AppIcon name="links" size={56} />, open: (a) => a.openDialog('links') },
];

/** Keep in sync with --menubar-h in styles/base.css. */
const MENUBAR_HEIGHT = 28;
const ICON_HEIGHT = 96;
/** Spacing between icons: the roomy default, and the tightest before labels would touch. */
const MAX_STEP = 104;
const MIN_STEP = 80;
/** On computers the Links icon is hidden (its links are in Contact), so it takes no slot. */
const COLUMN_ICONS = DESKTOP_ICONS.filter((def) => def.id !== 'icon-links');

interface Position {
  left: number;
  top: number;
}

/**
 * A column down the right edge, like the macOS desktop. On shorter screens the icons move closer
 * together, and the column may run down beside the Dock (it is centered, so the right edge is
 * free). Only on very short screens does a second column start to its left. (Phones ignore all
 * this: they use a grid.) Positions are inside the desktop layer, which starts below the menu bar.
 */
function columnLayout(viewportWidth: number, viewportHeight: number): Position[] {
  const top = MENUBAR_HEIGHT + 16;
  const maxTop = viewportHeight - MENUBAR_HEIGHT - ICON_HEIGHT - 8;
  const step = Math.max(MIN_STEP, Math.min(MAX_STEP, (maxTop - top) / (COLUMN_ICONS.length - 1)));
  const perColumn = Math.max(1, Math.floor((maxTop - top) / step) + 1);
  return DESKTOP_ICONS.map((def) => {
    // Links (hidden here) gets the slot after the others, so Clean Up never stacks two icons.
    const slot = def.id === 'icon-links' ? COLUMN_ICONS.length : COLUMN_ICONS.indexOf(def);
    return {
      left: viewportWidth - 112 - Math.floor(slot / perColumn) * 104,
      top: Math.round(top + (slot % perColumn) * step),
    };
  });
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
  const [positions, setPositions] = useState<Position[]>(() => columnLayout(1024, 900));
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
    resetLayout: () => setPositions(columnLayout(window.innerWidth, window.innerHeight)),
    arrange: () => setPositions(columnLayout(window.innerWidth, window.innerHeight).sort(() => Math.random() - 0.5)),
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
      // Down to the screen's bottom edge (the layer stops above the Dock, but icons may sit beside it).
      const maxTop = window.innerHeight - (layer?.getBoundingClientRect().top ?? 0) - iconEl.offsetHeight;
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
              className="desktop-icon"
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
