import type { CSSProperties } from 'react';

export type Wallpaper =
  | { id: string; label: string; kind: 'color'; color: string }
  | { id: string; label: string; kind: 'pattern'; image: string }
  | { id: string; label: string; kind: 'file'; file: string };

export const WALLPAPERS: Wallpaper[] = [
  { id: 'teal', label: 'Teal', kind: 'color', color: '#008080' },
  { id: 'navy', label: 'Navy', kind: 'color', color: '#000080' },
  { id: 'maroon', label: 'Maroon', kind: 'color', color: '#800000' },
  {
    id: 'stripes',
    label: 'Stripes',
    kind: 'pattern',
    image: 'repeating-linear-gradient(45deg, #008080, #008080 10px, #006666 10px, #006666 20px)',
  },
  { id: 'sunset', label: 'Sunset Hills', kind: 'file', file: '/wallpaper-sunset-hills.svg' },
  { id: 'city', label: 'City Dusk', kind: 'file', file: '/wallpaper-city-dusk.svg' },
  { id: 'countryside', label: 'Countryside', kind: 'file', file: '/wallpaper-countryside.svg' },
  { id: 'beach', label: 'Beach', kind: 'file', file: '/wallpaper-beach.svg' },
  { id: 'space', label: 'Space', kind: 'file', file: '/wallpaper-space.svg' },
];

/** The default wallpaper follows the active theme's desktop color instead of a fixed teal. */
export const DEFAULT_WALLPAPER_ID = 'teal';

export function findWallpaper(id: string): Wallpaper {
  return WALLPAPERS.find((w) => w.id === id) ?? WALLPAPERS[0]!;
}

/** Background styles for the desktop (applied to <body>) and for preview swatches. */
export function wallpaperStyle(wallpaper: Wallpaper, themeDesktopColor?: string): CSSProperties {
  switch (wallpaper.kind) {
    case 'file':
      return {
        backgroundImage: `url(${wallpaper.file})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundColor: '',
      };
    case 'pattern':
      return { backgroundImage: wallpaper.image, backgroundSize: 'auto', backgroundPosition: '', backgroundColor: '' };
    case 'color':
      return {
        backgroundImage: 'none',
        backgroundSize: '',
        backgroundPosition: '',
        backgroundColor:
          wallpaper.id === DEFAULT_WALLPAPER_ID && themeDesktopColor ? themeDesktopColor : wallpaper.color,
      };
  }
}
