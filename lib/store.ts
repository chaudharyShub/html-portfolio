import { useSyncExternalStore } from 'react';

/** Listeners for `useSyncExternalStore`: React subscribes, `notify` tells it something changed. */
export function createListeners() {
  const listeners = new Set<() => void>();
  return {
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    notify: () => listeners.forEach((l) => l()),
  };
}

export interface Store<T> {
  /** React hook: the current state (`serverState` during SSR and hydration). */
  use: () => T;
  get: () => T;
  /** Merges `next` into the state and re-renders every component using it. */
  set: (next: Partial<T>) => void;
}

/** A small shared state object that any component can read; one copy per page load. */
export function createStore<T extends object>(serverState: T): Store<T> {
  const { subscribe, notify } = createListeners();
  let state = serverState;
  const get = () => state;
  const getServerSnapshot = () => serverState;
  return {
    use: () => useSyncExternalStore(subscribe, get, getServerSnapshot),
    get,
    set: (next) => {
      state = { ...state, ...next };
      notify();
    },
  };
}
