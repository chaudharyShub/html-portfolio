'use client';

import { useState, type ReactNode } from 'react';
import { useOsActions, useOsState } from '@/components/os/OsProvider';
import { Dialog } from './Dialog';

/**
 * The Writing app: the latest blog posts, opened from its desktop / Home Screen icon. The list
 * itself (`components/portfolio/Writing.tsx`) is rendered on the server and handed in, so the
 * posts are in the page's HTML for search engines even while the window is closed.
 * On computers it can go full screen and minimize into its Dock icon (shown while it's open).
 */
export function WritingDialog({ children }: { children: ReactNode }) {
  const { dialogs } = useOsState();
  const { closeDialog } = useOsActions();
  const [zoomed, setZoomed] = useState(false);
  return (
    <Dialog
      open={dialogs.writing}
      title="Writing"
      onClose={() => closeDialog('writing')}
      boxClassName="writing-box"
      zoomed={zoomed}
      onToggleZoom={() => setZoomed((z) => !z)}
      minimizable={{ id: 'writing', dockIconId: 'dock-writing' }}
    >
      <div className="dialog-body writing-body">{children}</div>
    </Dialog>
  );
}
