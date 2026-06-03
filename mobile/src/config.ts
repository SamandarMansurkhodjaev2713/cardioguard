/**
 * Validated runtime configuration — the single place that reads `process.env`.
 * Expo inlines `EXPO_PUBLIC_*` variables at build time; everything else in the
 * app must import from here (no scattered `process.env` access — see checklist).
 *
 * `apiBaseUrl` null → the app runs fully offline against local storage. When set,
 * the repository layer syncs through the REST backend (offline-first).
 */

function readApiBaseUrl(): string | null {
  const raw = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (!raw) return null;
  try {
    // Validate it is a well-formed URL; strip any trailing slash for consistent joins.
    const url = new URL(raw);
    return url.toString().replace(/\/$/, '');
  } catch {
    return null;
  }
}

function readPositiveInt(value: string | undefined, fallback: number): number {
  const n = Number(value);
  return Number.isInteger(n) && n > 0 ? n : fallback;
}

const apiBaseUrl = readApiBaseUrl();

export const config = {
  /** REST backend base URL, or null for offline-only mode. */
  apiBaseUrl,
  /** Whether to sync through the remote backend. */
  useRemote: apiBaseUrl !== null,
  /** Per-request timeout (ms) for remote calls. */
  apiTimeoutMs: readPositiveInt(process.env.EXPO_PUBLIC_API_TIMEOUT_MS, 10_000),
  /** Retry attempts for transient (network / 5xx) failures. */
  apiRetries: readPositiveInt(process.env.EXPO_PUBLIC_API_RETRIES, 2),
} as const;

export type AppConfig = typeof config;
