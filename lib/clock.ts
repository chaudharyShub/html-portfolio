import { useSyncExternalStore } from 'react';

/**
 * One shared 1-second ticker for every live readout (menu bar clock, footer clock, uptime).
 * The server snapshot is null so server HTML and the first client render match; components
 * show their placeholder until the client takes over.
 */
let now: number | null = null;
let timer: number | undefined;
const listeners = new Set<() => void>();

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  if (timer === undefined) {
    timer = window.setInterval(() => {
      now = Date.now();
      listeners.forEach((l) => l());
    }, 1000);
  }
  return () => {
    listeners.delete(listener);
    if (listeners.size === 0 && timer !== undefined) {
      window.clearInterval(timer);
      timer = undefined;
      now = null;
    }
  };
}

function getSnapshot(): number {
  if (now === null) now = Date.now();
  return now;
}

function getServerSnapshot(): number | null {
  return null;
}

/** Current time in ms, updated every second; null during server render and hydration. */
export function useNow(): number | null {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
