'use client';

import { useEffect, useRef } from 'react';
import { crtPreference, cursorTrailPreference, themePreference, wallpaperPreference } from '@/lib/preferences';
import { applyThemeToDocument, THEMES } from '@/lib/themes';
import { findWallpaper, wallpaperStyle } from '@/lib/wallpapers';

/**
 * Applies the saved Display Properties: theme colors, desktop wallpaper (on <body>),
 * the CRT scanline overlay and the optional mouse trail.
 */
export function DisplayEffects() {
  const theme = themePreference.use();
  const wallpaper = wallpaperPreference.use();
  const crt = crtPreference.use();
  const trail = cursorTrailPreference.use();

  useEffect(() => {
    applyThemeToDocument(theme);
  }, [theme]);

  useEffect(() => {
    Object.assign(document.body.style, wallpaperStyle(findWallpaper(wallpaper), THEMES[theme].vars['--teal']));
  }, [wallpaper, theme]);

  return (
    <>
      <div id="crt-overlay" aria-hidden="true" style={{ display: crt ? 'block' : 'none' }} />
      <CursorTrail enabled={trail} />
    </>
  );
}

const TRAIL_SIZE = 10;
const TRAIL_INTERVAL_MS = 40;

/** 10 pooled dots recycled on mousemove (~25 fps), faded out by a CSS transition. */
function CursorTrail({ enabled }: { enabled: boolean }) {
  const dots = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (!enabled) return;
    const pool = dots.current;
    let index = 0;
    let last = 0;
    const onMove = (e: MouseEvent) => {
      const now = Date.now();
      if (now - last < TRAIL_INTERVAL_MS) return;
      last = now;
      const dot = pool[index++ % TRAIL_SIZE];
      if (!dot) return;
      dot.style.left = `${e.clientX - 3}px`;
      dot.style.top = `${e.clientY - 3}px`;
      dot.classList.remove('active');
      void dot.offsetWidth; // restart the fade
      dot.classList.add('active');
    };
    document.addEventListener('mousemove', onMove);
    return () => {
      document.removeEventListener('mousemove', onMove);
      pool.forEach((dot) => dot?.classList.remove('active'));
    };
  }, [enabled]);

  return (
    <>
      {Array.from({ length: TRAIL_SIZE }, (_, i) => (
        <div
          key={i}
          className="cursor-trail"
          aria-hidden="true"
          ref={(el) => {
            dots.current[i] = el;
          }}
        />
      ))}
    </>
  );
}
