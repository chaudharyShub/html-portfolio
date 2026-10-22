'use client';

import { useOsActions, useOsState } from '@/components/os/OsProvider';
import { pressableProps } from '@/lib/a11y';
import { crtPreference, cursorTrailPreference, themePreference, wallpaperPreference } from '@/lib/preferences';
import { THEME_IDS, THEMES } from '@/lib/themes';
import { WALLPAPERS, wallpaperStyle } from '@/lib/wallpapers';
import { Dialog } from './Dialog';

export function DisplayPropertiesDialog() {
  const { dialogs } = useOsState();
  const { closeDialog } = useOsActions();
  const theme = themePreference.use();
  const wallpaper = wallpaperPreference.use();
  const crt = crtPreference.use();
  const trail = cursorTrailPreference.use();
  const close = () => closeDialog('display');

  const pickRandomWallpaper = () => {
    const random = WALLPAPERS[Math.floor(Math.random() * WALLPAPERS.length)];
    if (random) wallpaperPreference.set(random.id);
  };

  return (
    <Dialog open={dialogs.display} title="Display Properties" onClose={close} boxClassName="wide">
      <div className="dialog-body display-body">
        <p className="display-heading">
          <b>Theme:</b>
        </p>
        <div className="theme-swatches" role="radiogroup" aria-label="Theme">
          {THEME_IDS.map((id) => {
            const { label, vars } = THEMES[id];
            return (
              <div
                key={id}
                className="theme-swatch-wrap"
                {...pressableProps}
                onClick={() => themePreference.set(id)}
                role="radio"
                aria-checked={id === theme}
                aria-label={label}
              >
                <div className={`theme-swatch-preview${id === theme ? ' selected' : ''}`}>
                  <div className="theme-swatch-bar" style={{ background: vars['--navy'] }} />
                  <div className="theme-swatch-body" style={{ background: vars['--gray'] }} />
                </div>
                <div className="theme-swatch-label">{label}</div>
              </div>
            );
          })}
        </div>
        <p className="display-heading spaced">
          <b>Background:</b>
        </p>
        <div className="wallpaper-grid" role="radiogroup" aria-label="Background">
          {WALLPAPERS.map((w) => (
            <div key={w.id}>
              <div
                className={`wallpaper-swatch${w.id === wallpaper ? ' selected' : ''}`}
                style={wallpaperStyle(w)}
                {...pressableProps}
                onClick={() => wallpaperPreference.set(w.id)}
                role="radio"
                aria-checked={w.id === wallpaper}
                aria-label={w.label}
              />
              <div className="wallpaper-label">{w.label}</div>
            </div>
          ))}
        </div>
        <div className="display-toggles">
          <label className="display-toggle">
            <input type="checkbox" checked={crt} onChange={(e) => crtPreference.set(e.target.checked)} /> CRT Scanlines
          </label>
          <label className="display-toggle">
            <input type="checkbox" checked={trail} onChange={(e) => cursorTrailPreference.set(e.target.checked)} /> Mouse
            Trails
          </label>
        </div>
        <div className="dialog-buttons spaced">
          <button type="button" onClick={pickRandomWallpaper}>
            &#127922; Random
          </button>
          <button type="button" onClick={close}>
            Close
          </button>
        </div>
      </div>
    </Dialog>
  );
}
