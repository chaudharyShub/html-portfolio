'use client';

import { useEffect } from 'react';
import { bumpVisitorNumber, visitorNumber } from '@/lib/preferences';

/** Retro LCD "visitor number". Locally seeded per browser - not a real global count. */
export function VisitorCounter() {
  const value = visitorNumber.use();

  useEffect(() => {
    bumpVisitorNumber();
  }, []);

  return (
    <span className="visitor-counter" title="Locally seeded - playful, not a real global count">
      No. {String(value).padStart(6, '0')}
    </span>
  );
}
