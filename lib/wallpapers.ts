import type { CSSProperties } from 'react';

export type Wallpaper =
  | { id: string; label: string; kind: 'gradient'; image: string }
  | { id: string; label: string; kind: 'file'; file: string };

/** Gradients are original (soft "aurora" blends); the scenic ones are the site's own SVGs. */
export const WALLPAPERS: Wallpaper[] = [
  {
    id: 'aurora',
    label: 'Aurora',
    kind: 'gradient',
    image:
      'radial-gradient(at 18% 22%, #ff9a8b 0, transparent 55%), radial-gradient(at 82% 18%, #a18cd1 0, transparent 50%), radial-gradient(at 70% 85%, #5b8def 0, transparent 55%), radial-gradient(at 15% 90%, #f6d365 0, transparent 50%), linear-gradient(135deg, #6a5acd, #ff7eb3)',
  },
  {
    id: 'lagoon',
    label: 'Lagoon',
    kind: 'gradient',
    image:
      'radial-gradient(at 20% 20%, #43e97b 0, transparent 55%), radial-gradient(at 85% 30%, #38f9d7 0, transparent 50%), radial-gradient(at 60% 90%, #2b5876 0, transparent 60%), linear-gradient(160deg, #0f9b8e, #1e3c72)',
  },
  {
    id: 'dusk',
    label: 'Dusk',
    kind: 'gradient',
    image:
      'radial-gradient(at 25% 80%, #ff6a88 0, transparent 55%), radial-gradient(at 80% 20%, #4a3fbf 0, transparent 55%), linear-gradient(170deg, #1a1446, #6b2d6f 55%, #f08a5d)',
  },
  {
    id: 'graphite',
    label: 'Graphite',
    kind: 'gradient',
    image: 'radial-gradient(at 30% 20%, #5c6370 0, transparent 60%), linear-gradient(160deg, #2c3038, #121418)',
  },
  { id: 'sunset', label: 'Sunset Hills', kind: 'file', file: '/wallpaper-sunset-hills.svg' },
  { id: 'city', label: 'City Dusk', kind: 'file', file: '/wallpaper-city-dusk.svg' },
  { id: 'countryside', label: 'Countryside', kind: 'file', file: '/wallpaper-countryside.svg' },
  { id: 'beach', label: 'Beach', kind: 'file', file: '/wallpaper-beach.svg' },
  { id: 'space', label: 'Space', kind: 'file', file: '/wallpaper-space.svg' },
];

export const DEFAULT_WALLPAPER_ID = 'aurora';

export function findWallpaper(id: string): Wallpaper {
  return WALLPAPERS.find((w) => w.id === id) ?? WALLPAPERS[0]!;
}

/** Background styles for the desktop (applied to <body>) and for preview swatches. */
export function wallpaperStyle(wallpaper: Wallpaper): CSSProperties {
  return {
    backgroundImage: wallpaper.kind === 'file' ? `url(${wallpaper.file})` : wallpaper.image,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  };
}
