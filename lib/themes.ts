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

/** On/off display settings, each shown as a boolean attribute on <html> that the CSS reacts to. */
export const DISPLAY_FLAGS = [
  { key: STORAGE_KEYS.reduceTransparency, attribute: 'data-reduce-transparency' },
  { key: STORAGE_KEYS.largerText, attribute: 'data-larger-text' },
] as const;

export function applyDisplayFlag(attribute: string, on: boolean): void {
  document.documentElement.toggleAttribute(attribute, on);
}

/**
 * Inline script that runs before first paint so saved appearance settings (theme, Reduce
 * Transparency, Larger Text) don't flash. Built only from the constants above (no user input),
 * so embedding it is safe.
 */
export function buildAppearanceInitScript(): string {
  const flags = DISPLAY_FLAGS.map(
    (f) => `if(localStorage.getItem(${JSON.stringify(f.key)})==='1')d.setAttribute(${JSON.stringify(f.attribute)},'');`,
  ).join('');
  return `(function(){try{var d=document.documentElement;var id=localStorage.getItem(${JSON.stringify(
    STORAGE_KEYS.theme,
  )});if(${JSON.stringify(THEME_IDS)}.indexOf(id)>=0)d.setAttribute('data-theme',id);${flags}}catch(e){}})();`;
}
