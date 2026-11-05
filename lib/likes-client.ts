import { useSyncExternalStore } from 'react';
import { likedPreference } from './preferences';

/**
 * The shared like count in the browser. Every like button reads this one store, so the count is
 * fetched once per page load and all buttons (status bar on computers, title bar on phones) agree.
 */
export interface LikesState {
  /** null until loaded. */
  count: number | null;
  /** false when /api/likes isn't available: the buttons hide. */
  available: boolean;
}

const SERVER_STATE: LikesState = { count: null, available: true };
let state: LikesState = SERVER_STATE;
let loadStarted = false;
const listeners = new Set<() => void>();

function setState(next: Partial<LikesState>) {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useLikes(): LikesState {
  return useSyncExternalStore(subscribe, () => state, () => SERVER_STATE);
}

/** Loads the count once (later calls do nothing). */
export function loadLikes(): void {
  if (loadStarted) return;
  loadStarted = true;
  fetch('/api/likes', { cache: 'no-store' })
    .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
    .then((data: { count: number }) => setState({ count: data.count }))
    .catch(() => setState({ available: false }));
}

/**
 * Adds this visitor's like: shown at once, then settled on the server's total. A failure is undone.
 * Returns whether it was saved.
 */
export async function sendLike(): Promise<boolean> {
  likedPreference.set(true);
  if (state.count !== null) setState({ count: state.count + 1 });
  try {
    const res = await fetch('/api/likes', { method: 'POST' });
    if (!res.ok) throw new Error(String(res.status));
    const data = (await res.json()) as { count: number };
    setState({ count: data.count });
    return true;
  } catch {
    likedPreference.set(false);
    if (state.count !== null) setState({ count: Math.max(0, state.count - 1) });
    return false;
  }
}
