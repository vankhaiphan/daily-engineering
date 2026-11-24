/**
 * Minimal localStorage-backed external store for `useSyncExternalStore`.
 * - Server snapshot is a constant default, so hydration always matches.
 * - Reads are cached; the snapshot reference only changes on writes.
 * - Survives storage being unavailable (private mode, quota) by staying in memory.
 * - Syncs across tabs via the `storage` event.
 */
export interface PersistentStore<T> {
  get: () => T;
  getServer: () => T;
  set: (updater: (current: T) => T) => void;
  subscribe: (listener: () => void) => () => void;
}

export function createPersistentStore<T>(key: string, fallback: T, parse: (raw: string | null) => T): PersistentStore<T> {
  let cache: T | undefined;
  const listeners = new Set<() => void>();

  const read = (): T => {
    try {
      return parse(window.localStorage.getItem(key));
    } catch {
      return fallback;
    }
  };

  const emit = () => listeners.forEach((l) => l());

  const onStorage = (event: StorageEvent) => {
    if (event.key !== key) return;
    cache = parse(event.newValue);
    emit();
  };

  return {
    get: () => {
      if (typeof window === "undefined") return fallback;
      if (cache === undefined) cache = read();
      return cache;
    },
    getServer: () => fallback,
    set: (updater) => {
      const current = cache ?? (typeof window === "undefined" ? fallback : read());
      const next = updater(current);
      if (next === current) return;
      cache = next;
      try {
        window.localStorage.setItem(key, JSON.stringify(next));
      } catch {
        /* storage unavailable: keep in-memory state for this session */
      }
      emit();
    },
    subscribe: (listener) => {
      listeners.add(listener);
      if (listeners.size === 1) window.addEventListener("storage", onStorage);
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0) window.removeEventListener("storage", onStorage);
      };
    },
  };
}
