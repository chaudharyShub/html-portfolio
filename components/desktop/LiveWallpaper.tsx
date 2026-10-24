'use client';

import { wallpaperPreference } from '@/lib/preferences';
import { DEFAULT_WALLPAPER_ID, findWallpaper } from '@/lib/wallpapers';

/**
 * Slowly drifting color glows over the default (Aurora) wallpaper, like a live wallpaper.
 * Pure decoration: CSS transform animations only, stopped under prefers-reduced-motion.
 */
export function LiveWallpaper() {
  const wallpaper = wallpaperPreference.use();
  if (findWallpaper(wallpaper).id !== DEFAULT_WALLPAPER_ID) return null;
  return (
    <div className="live-wallpaper" aria-hidden="true">
      <span />
      <span />
      <span />
      <span />
    </div>
  );
}
