import { createStoredValue } from './stored-value';
import { readStorageInt, STORAGE_KEYS, writeStorage } from './storage';
import { DEFAULT_THEME, isThemeId, type ThemeId } from './themes';
import { DEFAULT_WALLPAPER_ID, WALLPAPERS } from './wallpapers';

const parseFlag = (raw: string | null) => raw === '1';
const serializeFlag = (on: boolean) => (on ? '1' : '0');

export const themePreference = createStoredValue<ThemeId>(
  STORAGE_KEYS.theme,
  (raw) => (isThemeId(raw) ? raw : DEFAULT_THEME),
  (id) => id,
  DEFAULT_THEME,
);

export const wallpaperPreference = createStoredValue<string>(
  STORAGE_KEYS.wallpaper,
  (raw) => (raw && WALLPAPERS.some((w) => w.id === raw) ? raw : DEFAULT_WALLPAPER_ID),
  (id) => id,
  DEFAULT_WALLPAPER_ID,
);

export const crtPreference = createStoredValue(STORAGE_KEYS.crt, parseFlag, serializeFlag, false);

export const cursorTrailPreference = createStoredValue(STORAGE_KEYS.cursorTrail, parseFlag, serializeFlag, false);

/** Playful, locally seeded "visitor number" (not a real global count). 0 means not yet assigned. */
export const visitorNumber = createStoredValue(
  STORAGE_KEYS.visitorNumber,
  (raw) => {
    const n = Number.parseInt(raw ?? '0', 10);
    return Number.isFinite(n) ? n : 0;
  },
  (n) => String(n),
  0,
);

let visitorNumberBumped = false;
/** Advances the visitor number once per page load (guarded against StrictMode double effects). */
export function bumpVisitorNumber(): void {
  if (visitorNumberBumped) return;
  visitorNumberBumped = true;
  const current = visitorNumber.get();
  visitorNumber.set(current ? current + Math.floor(Math.random() * 7) + 1 : 3100 + Math.floor(Math.random() * 1800));
}

let visitCount: number | null = null;
/** Increments and returns the visit count, once per page load. */
export function recordVisit(): number {
  if (visitCount === null) {
    visitCount = readStorageInt(STORAGE_KEYS.visitCount) + 1;
    writeStorage(STORAGE_KEYS.visitCount, String(visitCount));
  }
  return visitCount;
}
