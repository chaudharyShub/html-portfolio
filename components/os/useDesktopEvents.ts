'use client';

import { useEffect } from 'react';
import { contextMenuPosition } from '@/components/desktop/ContextMenu';
import { useOsActions } from './OsProvider';

function wantsBrowserMenu(target: EventTarget | null): boolean {
  if (target instanceof Element && target.closest('a[href], input, textarea, select, [contenteditable="true"]')) return true;
  // Right-clicking on the selected text itself (not just anywhere while something is selected).
  const selection = window.getSelection();
  return Boolean(
    target instanceof Node && selection && !selection.isCollapsed && selection.toString().trim() && selection.containsNode(target, true),
  );
}

/**
 * Document-wide listeners: custom right-click menu (not on links, fields or selected text), click-away and Escape to close menus, and
 * `data-inactive` on <html> while the browser window isn't focused (window buttons turn gray).
 */
export function useDesktopEvents() {
  const { openContextMenu, closeMenus } = useOsActions();

  useEffect(() => {
    const onContextMenu = (e: MouseEvent) => {
      // Links, text fields and selected text keep the browser's own menu (open in new tab,
      // copy, paste); the desktop menu is for everywhere else.
      if (wantsBrowserMenu(e.target)) {
        closeMenus();
        return;
      }
      e.preventDefault();
      const { x, y } = contextMenuPosition(e.clientX, e.clientY);
      openContextMenu(x, y);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeMenus();
    };
    const onFocusChange = () => document.documentElement.toggleAttribute('data-inactive', !document.hasFocus());
    // Click-away lives on `window`: React's own listeners sit on `document` (the App Router root),
    // so handlers like the logo menu button can still stop a click from reaching this one.
    document.addEventListener('contextmenu', onContextMenu);
    window.addEventListener('click', closeMenus);
    document.addEventListener('keydown', onKeyDown);
    window.addEventListener('focus', onFocusChange);
    window.addEventListener('blur', onFocusChange);
    return () => {
      document.removeEventListener('contextmenu', onContextMenu);
      window.removeEventListener('click', closeMenus);
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('focus', onFocusChange);
      window.removeEventListener('blur', onFocusChange);
    };
  }, [openContextMenu, closeMenus]);
}
