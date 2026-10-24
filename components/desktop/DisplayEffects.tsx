'use client';

import { useEffect } from 'react';
import { largerTextPreference, reduceTransparencyPreference, themePreference, wallpaperPreference } from '@/lib/preferences';
import { applyDisplayFlag, applyThemeToDocument } from '@/lib/themes';
import { findWallpaper, wallpaperStyle } from '@/lib/wallpapers';

/**
 * Applies the saved System Settings: theme colors, desktop wallpaper (on <body>), and the
 * Reduce Transparency / Larger Text switches (attributes on <html>, styled in styles/effects.css).
 */
export function DisplayEffects() {
  const theme = themePreference.use();
  const wallpaper = wallpaperPreference.use();
  const reduceTransparency = reduceTransparencyPreference.use();
  const largerText = largerTextPreference.use();

  useEffect(() => {
    applyThemeToDocument(theme);
  }, [theme]);

  useEffect(() => {
    Object.assign(document.body.style, wallpaperStyle(findWallpaper(wallpaper)));
  }, [wallpaper]);

  useEffect(() => {
    applyDisplayFlag('data-reduce-transparency', reduceTransparency);
  }, [reduceTransparency]);

  useEffect(() => {
    applyDisplayFlag('data-larger-text', largerText);
  }, [largerText]);

  return null;
}
