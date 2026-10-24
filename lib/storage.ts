/** localStorage keys. Names are unchanged from the original site so saved preferences carry over. */
export const STORAGE_KEYS = {
  theme: 'shubhamOsTheme',
  wallpaper: 'shubhamOsWallpaper',
  reduceTransparency: 'shubhamOsReduceTransparency',
  largerText: 'shubhamOsLargerText',
  visitCount: 'shubhamOsVisitCount',
  visitorNumber: 'shubhamOsVisitorNum',
  debugRunnerBest: 'debugRunnerBest',
  contactSends: 'shubhamOsContactSends',
} as const;

// localStorage can throw (private mode, blocked storage), so every access is guarded.
export function readStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeStorage(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Preferences simply won't persist.
  }
}

export function readStorageInt(key: string): number {
  const parsed = Number.parseInt(readStorage(key) ?? '0', 10);
  return Number.isFinite(parsed) ? parsed : 0;
}
