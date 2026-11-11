/**
 * The coffee cup, our own drawing on a 32x32 grid: the "coffee" emoji (Emoji.tsx) and the
 * Debug Runner's power-up, which draws these paths on its canvas. Plain data, no React, so the
 * game can import it.
 */
export const COFFEE_PATHS = {
  steam1: 'M11.6 10q-1.6-2 0-3.6t0-3.6',
  steam2: 'M16.6 10q-1.6-2 0-3.6t0-3.6',
  handle: 'M22.4 15.4h1.4a3.3 3.3 0 0 1 0 6.6h-1.8',
  mug: 'M6.6 12.6h16v8.6a6 6 0 0 1-6 6h-4a6 6 0 0 1-6-6Z',
  code: 'M12.2 17.6l-1.8 1.8 1.8 1.8M17 17.6l1.8 1.8-1.8 1.8',
} as const;
