/**
 * AsyncStorage-backed {@link StateRepository}. Offline-first, single JSON blob
 * under a versioned key. All failures are caught and logged (never silently
 * swallowed) and degrade to "no persisted state", letting the store re-seed.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { logger } from '../utils/logger';
import {
  isValidPersistedState,
  type PersistedState,
  type StateRepository,
} from './repository';

const STORAGE_KEY = 'cardioguard:state:v1';

export const localRepository: StateRepository = {
  async load(): Promise<PersistedState | null> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw === null) return null;
      const parsed: unknown = JSON.parse(raw);
      if (!isValidPersistedState(parsed)) {
        logger.warn('Persisted state failed validation; ignoring');
        return null;
      }
      return parsed;
    } catch (error) {
      logger.error('Failed to load persisted state', { error: String(error) });
      return null;
    }
  },

  async save(state: PersistedState): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      logger.error('Failed to persist state', { error: String(error) });
    }
  },

  async clear(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      logger.error('Failed to clear persisted state', { error: String(error) });
    }
  },
};
