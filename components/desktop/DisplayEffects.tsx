'use client';

import { useEffect } from 'react';
import { largerTextPreference, themePreference, wallpaperPreference } from '@/lib/preferences';
import { applyDisplayFlag, applyThemeToDocument } from '@/lib/themes';
import { findWallpaper, wallpaperStyle } from '@/lib/wallpapers';

/**
 * Applies the saved System Settings: theme colors, desktop wallpaper (on <body>), and the
 * Larger Text switch (an attribute on <html>, styled in styles/effects.css).
 */
export function DisplayEffects() {
  const theme = themePreference.use();
  const wallpaper = wallpaperPreference.use();
  const largerText = largerTextPreference.use();

  useEffect(() => {
    applyThemeToDocument(theme);
  }, [theme]);

  useEffect(() => {
    Object.assign(document.body.style, wallpaperStyle(findWallpaper(wallpaper)));
  }, [wallpaper]);

  useEffect(() => {
    applyDisplayFlag('data-larger-text', largerText);
  }, [largerText]);

  return null;
}
