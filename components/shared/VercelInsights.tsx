'use client';

import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { useEffect, useState } from 'react';
import { isOwnerDevice } from '@/lib/owner-device';

/**
 * Vercel Web Analytics + Speed Insights, left out on the owner's own browsers (`lib/owner-device.ts`).
 * Nothing loads until that check is done, so the owner's visits are never sent.
 */
export function VercelInsights() {
  const [track, setTrack] = useState(false);

  useEffect(() => {
    let active = true;
    const check = () => {
      isOwnerDevice()
        .catch(() => false)
        .then((owner) => {
          if (active) setTrack(!owner);
        });
    };
    check();
    // The secret link can also be pasted into a tab that already has the site open.
    window.addEventListener('hashchange', check);
    return () => {
      active = false;
      window.removeEventListener('hashchange', check);
    };
  }, []);

  if (!track) return null;
  return (
    <>
      <Analytics />
      <SpeedInsights />
    </>
  );
}
