/** كاش عميل لواجهة لوحة التحكم — يقلّل انتظار التنقّل بين الصفحات */

type CacheEntry = { data: unknown; at: number };

const store = new Map<string, CacheEntry>();
const inflight = new Map<string, Promise<unknown>>();

const TTL_MS = 180_000;

export function peekAdminCache<T>(path: string): T | null {
  const entry = store.get(path);
  if (!entry) return null;
  if (Date.now() - entry.at > TTL_MS) {
    store.delete(path);
    return null;
  }
  return entry.data as T;
}

export function setAdminCache(path: string, data: unknown) {
  store.set(path, { data, at: Date.now() });
}

export function deleteAdminCache(path: string) {
  store.delete(path);
  inflight.delete(path);
}

export function invalidateAdminCache(match = "/api/admin") {
  for (const key of [...store.keys()]) {
    if (key.includes(match)) store.delete(key);
  }
  for (const key of [...inflight.keys()]) {
    if (key.includes(match)) inflight.delete(key);
  }
}

export function getInflight<T>(path: string): Promise<T> | null {
  return (inflight.get(path) as Promise<T> | undefined) ?? null;
}

export function setInflight<T>(path: string, promise: Promise<T>) {
  inflight.set(path, promise);
  promise.finally(() => {
    if (inflight.get(path) === promise) inflight.delete(path);
  });
}
