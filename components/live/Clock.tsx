'use client';

import { useNow } from '@/lib/clock';

/** Live local time (HH:MM:SS); shows the original "00:00:00" placeholder until hydrated. */
export function Clock() {
  const now = useNow();
  return <>{now === null ? '00:00:00' : new Date(now).toLocaleTimeString()}</>;
}
