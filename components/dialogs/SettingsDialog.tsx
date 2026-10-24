'use client';

import { useOsActions, useOsState } from '@/components/os/OsProvider';
import { pressableProps } from '@/lib/a11y';
import {
  largerTextPreference,
  reduceTransparencyPreference,
  themePreference,
  wallpaperPreference,
} from '@/lib/preferences';
import { THEME_IDS, THEMES } from '@/lib/themes';
import { WALLPAPERS, wallpaperStyle } from '@/lib/wallpapers';
import { Dialog } from './Dialog';

/** System Settings: appearance (Light/Dark/Auto), wallpaper, and display & text options. */
export function SettingsDialog() {
  const { dialogs } = useOsState();
  const { closeDialog } = useOsActions();
  const theme = themePreference.use();
  const wallpaper = wallpaperPreference.use();
  const reduceTransparency = reduceTransparencyPreference.use();
  const largerText = largerTextPreference.use();
  const close = () => closeDialog('settings');

  const pickRandomWallpaper = () => {
    const random = WALLPAPERS[Math.floor(Math.random() * WALLPAPERS.length)];
    if (random) wallpaperPreference.set(random.id);
  };

  return (
    <Dialog open={dialogs.settings} title="System Settings" onClose={close} boxClassName="wide">
      <div className="dialog-body settings-body">
        <h3 className="settings-heading">Appearance</h3>
        <div className="settings-group theme-swatches" role="radiogroup" aria-label="Appearance">
          {THEME_IDS.map((id) => (
            <div
              key={id}
              className="theme-swatch-wrap"
              {...pressableProps}
              onClick={() => themePreference.set(id)}
              role="radio"
              aria-checked={id === theme}
              aria-label={THEMES[id].label}
            >
              <div className={`theme-swatch-preview theme-swatch-preview--${id}${id === theme ? ' selected' : ''}`}>
                <span className="swatch-bar" />
                <span className="swatch-window" />
              </div>
              <div className="theme-swatch-label">{THEMES[id].label}</div>
            </div>
          ))}
        </div>

        <h3 className="settings-heading">Wallpaper</h3>
        <div className="settings-group wallpaper-grid" role="radiogroup" aria-label="Wallpaper">
          {WALLPAPERS.map((w) => (
            <div key={w.id} className="wallpaper-cell">
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

        <h3 className="settings-heading">Display &amp; Text Size</h3>
        <div className="settings-group settings-list">
          <label className="settings-row">
            <span className="settings-row-text">
              <span>Reduce Transparency</span>
              <span className="settings-row-hint">Solid backgrounds instead of frosted glass.</span>
            </span>
            <input
              type="checkbox"
              role="switch"
              className="switch"
              checked={reduceTransparency}
              onChange={(e) => reduceTransparencyPreference.set(e.target.checked)}
            />
          </label>
          <label className="settings-row">
            <span className="settings-row-text">
              <span>Larger Text</span>
              <span className="settings-row-hint">Makes the portfolio easier to read.</span>
            </span>
            <input
              type="checkbox"
              role="switch"
              className="switch"
              checked={largerText}
              onChange={(e) => largerTextPreference.set(e.target.checked)}
            />
          </label>
        </div>

        <div className="dialog-buttons">
          <button type="button" onClick={pickRandomWallpaper}>
            Random Wallpaper
          </button>
          <button type="button" className="btn-primary" onClick={close}>
            Done
          </button>
        </div>
      </div>
    </Dialog>
  );
}
