'use client';

import { useOsActions, useOsState } from '@/components/os/OsProvider';
import { pressableProps } from '@/lib/a11y';

const MENU_WIDTH = 250;
const MENU_HEIGHT = 170;

/** Clamps the right-click position so the menu stays on screen. */
export function contextMenuPosition(clientX: number, clientY: number) {
  return {
    x: Math.min(clientX, window.innerWidth - MENU_WIDTH),
    y: Math.min(clientY, window.innerHeight - MENU_HEIGHT),
  };
}

/** Custom desktop right-click menu. Opening/closing is wired up in useDesktopEvents. */
export function ContextMenu() {
  const { contextMenu } = useOsState();
  const actions = useOsActions();
  const item = { className: 'context-item', ...pressableProps, role: 'menuitem' } as const;

  return (
    <div
      id="context-menu"
      className="context-menu"
      role="menu"
      aria-label="Desktop menu"
      style={contextMenu ? { display: 'block', left: contextMenu.x, top: contextMenu.y } : undefined}
    >
      <div {...item} onClick={actions.denyNewTextDocument}>
        New Folder
      </div>
      <div className="context-sep" role="separator" />
      <div {...item} onClick={() => actions.openDialog('about')}>
        Get Info
      </div>
      <div {...item} onClick={() => actions.openDialog('settings')}>
        System Settings…
      </div>
      <div className="context-sep" role="separator" />
      <div {...item} onClick={actions.arrangeIcons}>
        Clean Up
      </div>
      <div {...item} onClick={() => window.location.reload()}>
        Reload
      </div>
    </div>
  );
}
