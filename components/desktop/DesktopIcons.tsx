'use client';

import { useEffect, useImperativeHandle, useRef, useState, type KeyboardEvent, type MouseEvent, type ReactNode } from 'react';
import { BugIcon, DosDesktopIcon, MyComputerIcon, RecycleBinIcon } from '@/components/icons';
import { useOsApi, type OsActions } from '@/components/os/OsProvider';

interface DesktopIconDef {
  id: string;
  label: string;
  icon: ReactNode;
  open: (actions: OsActions) => void;
}

const DESKTOP_ICONS: DesktopIconDef[] = [
  { id: 'icon-recyclebin', label: 'Recycle Bin', icon: <RecycleBinIcon />, open: (a) => a.openDialog('recycleBin') },
  { id: 'icon-mycomputer', label: 'My Computer', icon: <MyComputerIcon />, open: (a) => a.showSystemProperties() },
  { id: 'icon-game', label: 'Debug Runner', icon: <BugIcon />, open: (a) => a.openGame() },
  { id: 'icon-dos', label: 'MS-DOS Prompt', icon: <DosDesktopIcon />, open: (a) => a.openDos() },
];

const TASKBAR_HEIGHT = 32;

interface Position {
  left: number;
  top: number;
}

/** Column layout down the left edge; slightly wider spacing on small screens. */
function columnLayout(viewportWidth: number): Position[] {
  const gap = viewportWidth > 700 ? 90 : 95;
  return DESKTOP_ICONS.map((_, i) => ({ left: 20, top: 20 + i * gap }));
}

/** Draggable desktop shortcuts; double-click (or Enter) opens them. */
export function DesktopIcons() {
  const { actions, connect } = useOsApi();
  // Server and first client render use the desktop layout; the real viewport layout is applied after boot.
  const [positions, setPositions] = useState<Position[]>(() => columnLayout(1024));
  const detach = useRef<(() => void) | null>(null);

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
      const top = Math.max(0, Math.min(ev.clientY - offsetY, window.innerHeight - TASKBAR_HEIGHT - iconEl.offsetHeight));
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
    <div className="desktop-layer" aria-label="Desktop" role="group">
      {DESKTOP_ICONS.map((def, i) => (
        <div
          key={def.id}
          id={def.id}
          className="desktop-icon"
          style={positions[i]}
          role="button"
          tabIndex={0}
          aria-label={`${def.label} (double-click or press Enter to open)`}
          onMouseDown={(e) => startDrag(i, e)}
          onDoubleClick={() => def.open(actions)}
          onKeyDown={(e) => onKeyDown(def, e)}
        >
          {def.icon}
          {def.label}
        </div>
      ))}
    </div>
  );
}
