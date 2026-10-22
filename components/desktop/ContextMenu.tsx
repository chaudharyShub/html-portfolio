'use client';

import { ArrangeIcon, DisplayIcon, NewDocumentIcon, PropertiesIcon, RefreshIcon } from '@/components/icons';
import { useOsActions, useOsState } from '@/components/os/OsProvider';
import { pressableProps } from '@/lib/a11y';

const MENU_WIDTH = 200;
const MENU_HEIGHT = 190;

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
      <div {...item} onClick={() => window.location.reload()}>
        <RefreshIcon /> Refresh
      </div>
      <div {...item} onClick={actions.arrangeIcons}>
        <ArrangeIcon /> Arrange Icons
      </div>
      <div className="context-sep" role="separator" />
      <div {...item} onClick={() => actions.openDialog('display')}>
        <DisplayIcon /> Display Properties
      </div>
      <div {...item} onClick={actions.showSystemProperties}>
        <PropertiesIcon /> Properties
      </div>
      <div {...item} onClick={actions.denyNewTextDocument}>
        <NewDocumentIcon /> New Text Document
      </div>
    </div>
  );
}
