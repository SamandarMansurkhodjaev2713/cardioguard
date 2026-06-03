/**
 * Selects and composes the active {@link StateRepository}.
 *
 * Offline-only (default): local AsyncStorage.
 * Remote configured (`EXPO_PUBLIC_API_URL`): offline-first composition — local
 * storage stays the offline source of truth, the REST backend is synced
 * best-effort and used to hydrate across devices. The app keeps working if the
 * network is down (R-04 graceful degradation).
 */

import { config } from '../config';
import { createApiRepository } from './apiRepository';
import { localRepository } from './localRepository';
import type { StateRepository } from './repository';

export function createOfflineFirstRepository(
  local: StateRepository,
  remote: StateRepository,
): StateRepository {
  return {
    async load() {
      const remoteState = await remote.load();
      if (remoteState) {
        await local.save(remoteState); // warm the local cache for offline use
        return remoteState;
      }
      return local.load(); // offline / first-run fallback
    },
    async save(state) {
      await local.save(state); // local is the offline source of truth…
      await remote.save(state); // …remote sync is best-effort (never throws)
    },
    async clear() {
      await local.clear();
      await remote.clear();
    },
  };
}

/** Builds the repository for the current configuration. */
export function createRepository(): StateRepository {
  if (!config.useRemote || config.apiBaseUrl === null) {
    return localRepository;
  }
  const remote = createApiRepository({
    baseUrl: config.apiBaseUrl,
    timeoutMs: config.apiTimeoutMs,
    retries: config.apiRetries,
  });
  return createOfflineFirstRepository(localRepository, remote);
}
