import { useSyncExternalStore } from 'react';
import { likeIdPreference } from './preferences';

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

/** 'busy': a like or unlike is still on its way, so the click is ignored. */
export type LikeResult = 'saved' | 'limit' | 'failed' | 'busy';

let pending = false;

const changeCount = (by: number) => {
  if (state.count !== null) setState({ count: Math.max(0, state.count + by) });
};

/** Marks the like as on its way until the server hands out the real id. */
const PENDING_ID = '00000000-0000-0000-0000-000000000000';

/**
 * Adds this visitor's like: shown at once, then settled on the server's total. If it isn't
 * counted (network error, or this network's daily limit) it is undone.
 */
export async function sendLike(): Promise<LikeResult> {
  if (pending) return 'busy';
  pending = true;
  likeIdPreference.set(PENDING_ID);
  changeCount(1);
  try {
    const res = await fetch('/api/likes', { method: 'POST' });
    if (!res.ok) throw new Error(String(res.status));
    const data = (await res.json()) as { count: number; id: string | null };
    likeIdPreference.set(data.id);
    setState({ count: data.count });
    return data.id ? 'saved' : 'limit';
  } catch {
    likeIdPreference.set(null);
    changeCount(-1);
    return 'failed';
  } finally {
    pending = false;
  }
}

/** Takes this visitor's like back: shown at once; restored if the server can't be reached. */
export async function removeLike(): Promise<LikeResult> {
  if (pending) return 'busy';
  const id = likeIdPreference.get();
  if (!id) return 'saved';
  pending = true;
  likeIdPreference.set(null);
  changeCount(-1);
  try {
    const res = await fetch('/api/likes', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    if (!res.ok) throw new Error(String(res.status));
    const data = (await res.json()) as { count: number };
    setState({ count: data.count });
    return 'saved';
  } catch {
    likeIdPreference.set(id);
    changeCount(1);
    return 'failed';
  } finally {
    pending = false;
  }
}
