import { STORAGE_KEYS } from './storage';

export const THEME_IDS = ['win95', 'win98', 'terminal'] as const;
export type ThemeId = (typeof THEME_IDS)[number];

export type ThemeVars = Record<
  '--gray' | '--gray-dark' | '--white' | '--black' | '--navy' | '--navy-light' | '--teal',
  string
>;

export const THEMES: Record<ThemeId, { label: string; vars: ThemeVars }> = {
  win95: {
    label: 'Win95 Gray',
    vars: {
      '--gray': '#c0c0c0',
      '--gray-dark': '#808080',
      '--white': '#ffffff',
      '--black': '#000000',
      '--navy': '#000080',
      '--navy-light': '#1084d0',
      '--teal': '#008080',
    },
  },
  win98: {
    label: 'Win98 Blue',
    vars: {
      '--gray': '#b4c4d8',
      '--gray-dark': '#4a6a90',
      '--white': '#e8f0ff',
      '--black': '#000818',
      '--navy': '#003399',
      '--navy-light': '#0060cc',
      '--teal': '#2050a0',
    },
  },
  terminal: {
    label: 'Terminal',
    vars: {
      '--gray': '#0a120a',
      '--gray-dark': '#33ff33',
      '--white': '#1a2b1a',
      '--black': '#33ff33',
      '--navy': '#001800',
      '--navy-light': '#004000',
      '--teal': '#000000',
    },
  },
};

export const DEFAULT_THEME: ThemeId = 'win95';

export function isThemeId(value: unknown): value is ThemeId {
  return typeof value === 'string' && (THEME_IDS as readonly string[]).includes(value);
}

export function applyThemeToDocument(id: ThemeId): void {
  const root = document.documentElement;
  for (const [name, value] of Object.entries(THEMES[id].vars)) root.style.setProperty(name, value);
  root.setAttribute('data-theme', id);
}

/**
 * Inline script that runs before first paint so a saved non-default theme doesn't flash.
 * Built only from the constants above (no user input), so embedding it is safe.
 */
export function buildThemeInitScript(): string {
  const overrides = Object.fromEntries(
    THEME_IDS.filter((id) => id !== DEFAULT_THEME).map((id) => [id, THEMES[id].vars]),
  );
  return `(function(){try{var id=localStorage.getItem(${JSON.stringify(STORAGE_KEYS.theme)});var T=${JSON.stringify(
    overrides,
  )};var t=id&&T[id];if(!t)return;var r=document.documentElement;for(var k in t)r.style.setProperty(k,t[k]);r.setAttribute('data-theme',id);}catch(e){}})();`;
}
