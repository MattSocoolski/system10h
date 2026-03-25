// lib/mmkv.ts — MMKV offline cache for TanStack Query persistence
// With Expo Go fallback (MMKV requires native modules / dev client)

import type { Persister } from '@tanstack/react-query-persist-client';

let persister: Persister | null = null;

try {
  const { MMKV } = require('react-native-mmkv');
  const storage = new MMKV({ id: 'query-cache' });
  const { createSyncStoragePersister } = require('@tanstack/query-sync-storage-persister');
  persister = createSyncStoragePersister({
    storage: {
      setItem: (key: string, value: string) => storage.set(key, value),
      getItem: (key: string) => storage.getString(key) ?? null,
      removeItem: (key: string) => storage.delete(key),
    },
    throttleTime: 1000,
  });
} catch {
  // Expo Go fallback — no persistence (MMKV requires dev client)
  persister = null;
}

export { persister };
