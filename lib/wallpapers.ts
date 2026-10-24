import type { CSSProperties } from 'react';

export interface Wallpaper {
  id: string;
  label: string;
  /** A CSS background-image (original soft "aurora" gradient blends). */
  image: string;
}

/**
 * The desktop wallpapers. A saved id that no longer exists falls back to the default.
 */
export const WALLPAPERS: Wallpaper[] = [
  {
    id: 'aurora',
    label: 'Aurora',
    image:
      'radial-gradient(at 18% 22%, #ff9a8b 0, transparent 55%), radial-gradient(at 82% 18%, #a18cd1 0, transparent 50%), radial-gradient(at 70% 85%, #5b8def 0, transparent 55%), radial-gradient(at 15% 90%, #f6d365 0, transparent 50%), linear-gradient(135deg, #6a5acd, #ff7eb3)',
  },
  {
    id: 'lagoon',
    label: 'Lagoon',
    image:
      'radial-gradient(at 20% 20%, #43e97b 0, transparent 55%), radial-gradient(at 85% 30%, #38f9d7 0, transparent 50%), radial-gradient(at 60% 90%, #2b5876 0, transparent 60%), linear-gradient(160deg, #0f9b8e, #1e3c72)',
  },
  {
    id: 'dusk',
    label: 'Dusk',
    image:
      'radial-gradient(at 25% 80%, #ff6a88 0, transparent 55%), radial-gradient(at 80% 20%, #4a3fbf 0, transparent 55%), linear-gradient(170deg, #1a1446, #6b2d6f 55%, #f08a5d)',
  },
  {
    id: 'graphite',
    label: 'Graphite',
    image: 'radial-gradient(at 30% 20%, #5c6370 0, transparent 60%), linear-gradient(160deg, #2c3038, #121418)',
  },
  {
    id: 'sunrise',
    label: 'Sunrise',
    image:
      'radial-gradient(at 20% 80%, #ffd194 0, transparent 55%), radial-gradient(at 80% 20%, #ff8a9a 0, transparent 50%), radial-gradient(at 70% 80%, #fca5a5 0, transparent 50%), linear-gradient(160deg, #ffb88c, #de6262)',
  },
  {
    id: 'bloom',
    label: 'Bloom',
    image:
      'radial-gradient(at 25% 25%, #fbc2eb 0, transparent 55%), radial-gradient(at 80% 30%, #a6c1ee 0, transparent 50%), radial-gradient(at 60% 85%, #c084fc 0, transparent 55%), linear-gradient(150deg, #f472b6, #7c3aed)',
  },
  {
    id: 'sky',
    label: 'Sky',
    image:
      'radial-gradient(at 20% 20%, #e0f2fe 0, transparent 55%), radial-gradient(at 85% 30%, #7dd3fc 0, transparent 50%), radial-gradient(at 60% 90%, #60a5fa 0, transparent 55%), linear-gradient(170deg, #93c5fd, #2563eb)',
  },
  {
    id: 'ember',
    label: 'Ember',
    image:
      'radial-gradient(at 75% 80%, #f97316 0, transparent 55%), radial-gradient(at 20% 30%, #be123c 0, transparent 55%), linear-gradient(160deg, #3b0a1a, #7c2d12 60%, #ea580c)',
  },
];

export const DEFAULT_WALLPAPER_ID = 'aurora';

export function findWallpaper(id: string): Wallpaper {
  return WALLPAPERS.find((w) => w.id === id) ?? WALLPAPERS[0]!;
}

/** Background styles for the desktop (applied to <body>) and for preview swatches. */
export function wallpaperStyle(wallpaper: Wallpaper): CSSProperties {
  return {
    backgroundImage: wallpaper.image,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  };
}
