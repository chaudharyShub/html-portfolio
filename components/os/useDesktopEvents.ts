'use client';

import { useEffect } from 'react';
import { contextMenuPosition } from '@/components/desktop/ContextMenu';
import { useOsActions } from './OsProvider';

/** Document-wide listeners: custom right-click menu, click-away and Escape to close menus. */
export function useDesktopEvents() {
  const { openContextMenu, closeMenus } = useOsActions();

  useEffect(() => {
    const onContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      const { x, y } = contextMenuPosition(e.clientX, e.clientY);
      openContextMenu(x, y);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMenus();
    };
    // Click-away lives on `window`: React's own listeners sit on `document` (the App Router root),
    // so handlers like the Start button can still stop a click from reaching this one.
    document.addEventListener('contextmenu', onContextMenu);
    window.addEventListener('click', closeMenus);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('contextmenu', onContextMenu);
      window.removeEventListener('click', closeMenus);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [openContextMenu, closeMenus]);
}
