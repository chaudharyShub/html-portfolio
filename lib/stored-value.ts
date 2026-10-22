import { useSyncExternalStore } from 'react';
import { readStorage, writeStorage } from './storage';

export interface StoredValue<T> {
  /** React hook: the current value (the server value during SSR and hydration). */
  use: () => T;
  get: () => T;
  set: (value: T) => void;
}

/**
 * A localStorage-backed value that React components can subscribe to.
 * Falls back to in-memory state when storage is unavailable.
 */
export function createStoredValue<T>(
  key: string,
  parse: (raw: string | null) => T,
  serialize: (value: T) => string,
  serverValue: T,
): StoredValue<T> {
  const listeners = new Set<() => void>();
  let memoryRaw: string | undefined;
  let cachedRaw: string | null | undefined;
  let cachedValue: T = serverValue;

  const get = (): T => {
    const raw = memoryRaw ?? readStorage(key);
    if (raw !== cachedRaw) {
      cachedRaw = raw;
      cachedValue = parse(raw);
    }
    return cachedValue;
  };

  const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => listeners.delete(listener);
  };

  const set = (value: T) => {
    memoryRaw = serialize(value);
    writeStorage(key, memoryRaw);
    listeners.forEach((l) => l());
  };

  const getServerSnapshot = () => serverValue;

  return {
    use: () => useSyncExternalStore(subscribe, get, getServerSnapshot),
    get,
    set,
  };
}
