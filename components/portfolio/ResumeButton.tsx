'use client';

import type { ReactNode } from 'react';
import { useOsActions } from '@/components/os/OsProvider';

/** Opens the resume "Setup Wizard" (the download happens on its final step). */
export function ResumeButton({ children }: { children: ReactNode }) {
  const { openResumeWizard } = useOsActions();
  return (
    <button type="button" className="btn" onClick={openResumeWizard}>
      {children}
    </button>
  );
}
