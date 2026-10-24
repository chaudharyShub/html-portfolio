'use client';

import { useEffect } from 'react';
import { AppIcon } from '@/components/icons';
import { useOsActions, useOsState } from '@/components/os/OsProvider';

const TOAST_DURATION_MS = 4500;

/** Notification banner (top-right on desktop, top on phones). Show one with `actions.showToast(title, message)`. */
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
        <div className="toast-inner" key={toast.id}>
          <AppIcon name="portfolio" size={36} />
          <div className="toast-text">
            <div className="toast-head">
              <span className="toast-title">{toast.title}</span>
              <span className="toast-time" aria-hidden="true">
                now
              </span>
            </div>
            <div className="toast-message">{toast.message}</div>
          </div>
        </div>
      )}
    </div>
  );
}
