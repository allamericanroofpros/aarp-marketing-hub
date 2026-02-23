interface CacheEntry {
  key: string;
  filtersHash: string;
  computedAt: number;
  data: any;
  ttl: number;
}

const store = new Map<string, CacheEntry>();
const DEFAULT_TTL = 60_000;

function hash(obj: any): string {
  return JSON.stringify(obj ?? '');
}

export const cache = {
  get<T = any>(key: string, filters?: any): T | null {
    const fk = `${key}:${hash(filters)}`;
    const e = store.get(fk);
    if (!e || Date.now() - e.computedAt > e.ttl) {
      if (e) store.delete(fk);
      return null;
    }
    return e.data;
  },

  set(key: string, data: any, filters?: any, ttl = DEFAULT_TTL) {
    const fk = `${key}:${hash(filters)}`;
    store.set(fk, { key, filtersHash: hash(filters), computedAt: Date.now(), data, ttl });
  },

  invalidate(prefix?: string) {
    if (!prefix) { store.clear(); return; }
    for (const k of store.keys()) {
      if (k.startsWith(prefix)) store.delete(k);
    }
  },

  invalidateAll() { store.clear(); },

  getStatus() {
    const entries = Array.from(store.values());
    return {
      entries: entries.length,
      lastRefresh: entries.length > 0
        ? new Date(Math.max(...entries.map(e => e.computedAt))).toISOString()
        : null,
      keys: [...new Set(entries.map(e => e.key))],
    };
  },
};
