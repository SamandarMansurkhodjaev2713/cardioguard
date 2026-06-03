/**
 * REST implementation of {@link StateRepository}.
 *
 * Contract (whole-state document, matching the repository seam):
 *   GET    {baseUrl}/state  → 200 PersistedState | 404 (no state yet)
 *   PUT    {baseUrl}/state  ← PersistedState        → 2xx
 *   DELETE {baseUrl}/state                          → 2xx
 *
 * Resilience: per-request timeout (R-02), bounded retry with exponential backoff
 * for transient network / 5xx failures (R-01), and response schema validation
 * (T-03). Dependencies (fetch, delay) are injectable for deterministic tests.
 */

import { logger } from '../utils/logger';
import {
  isValidPersistedState,
  type PersistedState,
  type StateRepository,
} from './repository';

export interface ApiRepositoryOptions {
  readonly baseUrl: string;
  readonly timeoutMs?: number;
  readonly retries?: number;
  readonly fetchImpl?: typeof fetch;
  readonly delay?: (ms: number) => Promise<void>;
}

const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_RETRIES = 2;

const realDelay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function isTransient(status: number): boolean {
  return status >= 500 && status <= 599;
}

export function createApiRepository(options: ApiRepositoryOptions): StateRepository {
  const baseUrl = options.baseUrl.replace(/\/$/, '');
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const retries = options.retries ?? DEFAULT_RETRIES;
  const doFetch = options.fetchImpl ?? fetch;
  const delay = options.delay ?? realDelay;
  const endpoint = `${baseUrl}/state`;

  /** One request with a hard timeout and bounded transient-failure retry. */
  async function request(init: RequestInit): Promise<Response> {
    let lastError: unknown;
    for (let attempt = 0; attempt <= retries; attempt += 1) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const response = await doFetch(endpoint, {
          ...init,
          signal: controller.signal,
          headers: { 'Content-Type': 'application/json', ...init.headers },
        });
        if (isTransient(response.status) && attempt < retries) {
          await delay(2 ** attempt * 300);
          continue;
        }
        return response;
      } catch (error) {
        lastError = error;
        if (attempt < retries) {
          await delay(2 ** attempt * 300);
          continue;
        }
      } finally {
        clearTimeout(timer);
      }
    }
    throw lastError ?? new Error('Request failed');
  }

  return {
    async load(): Promise<PersistedState | null> {
      try {
        const response = await request({ method: 'GET' });
        if (response.status === 404) return null;
        if (!response.ok) {
          logger.warn('Remote load returned non-OK status', { status: response.status });
          return null;
        }
        const data: unknown = await response.json();
        if (!isValidPersistedState(data)) {
          logger.warn('Remote state failed validation; ignoring');
          return null;
        }
        return data;
      } catch (error) {
        logger.error('Remote load failed', { error: String(error) });
        return null;
      }
    },

    async save(state: PersistedState): Promise<void> {
      try {
        const response = await request({ method: 'PUT', body: JSON.stringify(state) });
        if (!response.ok) {
          logger.warn('Remote save returned non-OK status', { status: response.status });
        }
      } catch (error) {
        logger.error('Remote save failed', { error: String(error) });
      }
    },

    async clear(): Promise<void> {
      try {
        await request({ method: 'DELETE' });
      } catch (error) {
        logger.error('Remote clear failed', { error: String(error) });
      }
    },
  };
}
