'use client';

import { useEffect, useImperativeHandle, useRef, useState, type KeyboardEvent, type MouseEvent, type ReactNode } from 'react';
import { AppIcon } from '@/components/icons';
import { useOsApi, type OsActions } from '@/components/os/OsProvider';
import { MadeByPill, MadeByWidget } from './MadeBy';
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
  { id: 'icon-terminal', label: 'Terminal', icon: <AppIcon name="terminal" size={56} />, open: (a) => a.openTerminal() },
  { id: 'icon-trash', label: 'Trash', icon: <AppIcon name="trash" size={56} />, open: (a) => a.openDialog('trash') },
];

/** Keep in sync with --menubar-h / --dock-reserve in styles/base.css. */
const MENUBAR_HEIGHT = 28;
const DOCK_RESERVE = 84;

interface Position {
  left: number;
  top: number;
}

/** A column down the right edge, like the macOS desktop. (Phones ignore this: they use a grid.) */
function columnLayout(viewportWidth: number): Position[] {
  return DESKTOP_ICONS.map((_, i) => ({ left: viewportWidth - 112, top: MENUBAR_HEIGHT + 16 + i * 104 }));
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
    arrange: () => setPositions(columnLayout(window.innerWidth).sort(() => Math.random() - 0.5)),
  }));

  useEffect(() => () => detach.current?.(), []);

  const startDrag = (index: number, e: MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    const iconEl = e.currentTarget;
    const rect = iconEl.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const offsetY = e.clientY - rect.top;

    const onMove = (ev: globalThis.MouseEvent) => {
      const left = Math.max(0, Math.min(ev.clientX - offsetX, window.innerWidth - iconEl.offsetWidth));
      const top = Math.max(MENUBAR_HEIGHT, Math.min(ev.clientY - offsetY, window.innerHeight - DOCK_RESERVE - iconEl.offsetHeight));
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
          <MadeByPill />
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
