'use client';

import type { ReactNode } from 'react';
import { useOsActions, useOsState } from '@/components/os/OsProvider';
import { Dialog } from './Dialog';

/**
 * The Writing app: the latest blog posts, opened from its desktop / Home Screen icon. The list
 * itself (`components/portfolio/Writing.tsx`) is rendered on the server and handed in, so the
 * posts are in the page's HTML for search engines even while the window is closed.
 */
export function WritingDialog({ children }: { children: ReactNode }) {
  const { dialogs } = useOsState();
  const { closeDialog } = useOsActions();
  return (
    <Dialog open={dialogs.writing} title="Writing" onClose={() => closeDialog('writing')} boxClassName="writing-box">
      <div className="dialog-body writing-body">{children}</div>
    </Dialog>
  );
}
