'use client';

import { useNow } from '@/lib/clock';

/** Computed in the browser so a statically built page never shows a stale year. */
export function CurrentYear() {
  const now = useNow();
  return <>{now === null ? '' : new Date(now).getFullYear()}</>;
}
