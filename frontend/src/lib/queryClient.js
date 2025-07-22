import { QueryClient } from '@tanstack/react-query';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { CACHE_CONFIG, STORAGE_KEYS, PERSISTENCE_CONFIG } from '@/constants/cache';

/**
 * React Query Client Setup
 *
 * - Configures the global QueryClient for React Query.
 * - Applies centralized cache and retry settings from constants.
 * - Enables localStorage persistence for offline/refresh support.
 * - Used at the root of the app to provide caching and state management.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: CACHE_CONFIG.USER_PROJECTS.staleTime, // Default stale time
      cacheTime: CACHE_CONFIG.USER_PROJECTS.cacheTime, // Default cache time
      retry: CACHE_CONFIG.USER_PROJECTS.retry, // Default retry count
    },
  },
});

// Add localStorage persistence
const persister = createSyncStoragePersister({
  storage: window.localStorage,
  key: STORAGE_KEYS.ROADMAP_CACHE,
});

persistQueryClient({
  queryClient,
  persister,
  maxAge: PERSISTENCE_CONFIG.maxAge,
});
