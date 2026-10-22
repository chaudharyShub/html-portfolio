'use client';

import { useEffect } from 'react';
import { useOsActions, useOsState } from '@/components/os/OsProvider';

const TOAST_DURATION_MS = 4500;

/** Bottom-right notification. Show one with `actions.showToast(title, message)`. */
export function Toast() {
  const { toast } = useOsState();
  const { hideToast } = useOsActions();

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => hideToast(toast.id), TOAST_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [toast, hideToast]);

  // The live region stays mounted so screen readers announce new messages.
  return (
    <div id="toast" className={`toast${toast ? ' show' : ''}`} role="status" aria-live="polite">
      {toast && (
        <>
          <div className="toast-title">{toast.title}</div>
          <div>{toast.message}</div>
        </>
      )}
    </div>
  );
}
