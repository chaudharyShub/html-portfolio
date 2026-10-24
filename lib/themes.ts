import { STORAGE_KEYS } from './storage';

/**
 * Appearance: Light, Dark, or Auto (follows the device). The colors themselves live in CSS
 * (styles/base.css); a theme only sets `data-theme` on <html>.
 */
export const THEME_IDS = ['light', 'dark', 'auto'] as const;
export type ThemeId = (typeof THEME_IDS)[number];

export const THEMES: Record<ThemeId, { label: string }> = {
  light: { label: 'Light' },
  dark: { label: 'Dark' },
  auto: { label: 'Auto' },
};

/** Light unless the visitor picks Dark or Auto in System Settings. */
export const DEFAULT_THEME: ThemeId = 'light';

export function isThemeId(value: unknown): value is ThemeId {
  return typeof value === 'string' && (THEME_IDS as readonly string[]).includes(value);
}

export function applyThemeToDocument(id: ThemeId): void {
  document.documentElement.setAttribute('data-theme', id);
}

/**
 * Inline script that runs before first paint so a saved Light/Dark choice doesn't flash.
 * Built only from the constants above (no user input), so embedding it is safe.
 */
export function buildThemeInitScript(): string {
  return `(function(){try{var id=localStorage.getItem(${JSON.stringify(STORAGE_KEYS.theme)});if(${JSON.stringify(
    THEME_IDS,
  )}.indexOf(id)>=0)document.documentElement.setAttribute('data-theme',id);}catch(e){}})();`;
}
