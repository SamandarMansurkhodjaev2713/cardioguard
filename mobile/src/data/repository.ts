/**
 * Persistence seam. The app talks to {@link StateRepository}, never to a storage
 * engine directly — so the AsyncStorage implementation can be swapped for a REST
 * / Supabase adapter later without touching the store or screens.
 */

import type {
  Alert,
  HealthMeasurement,
  Medication,
  MedicationLog,
  MoodEntry,
  RiskModel,
  UserProfile,
  UserRole,
} from '../domain/types';
import type { AppLanguage } from '../i18n';
import type { ThemePreferences } from '../theme/ThemeProvider';
import { persistedStateSchema } from './schemas';

export const STATE_VERSION = 1;

/** The serializable snapshot persisted between launches. */
export interface PersistedState {
  readonly version: number;
  readonly role: UserRole;
  readonly profile: UserProfile;
  readonly measurements: readonly HealthMeasurement[];
  readonly medications: readonly Medication[];
  readonly medicationLogs: readonly MedicationLog[];
  readonly alerts: readonly Alert[];
  readonly riskModel: RiskModel;
  readonly language: AppLanguage;
  readonly themePreferences: ThemePreferences;
  /** Optional (added after v1 shipped); absent in older blobs → defaults to off. */
  readonly remindersEnabled?: boolean;
  /** Weekly wellbeing check-ins (Module 5); absent in older blobs → empty. */
  readonly moodEntries?: readonly MoodEntry[];
}

export interface StateRepository {
  load(): Promise<PersistedState | null>;
  save(state: PersistedState): Promise<void>;
  clear(): Promise<void>;
}

/**
 * Runtime guard for untrusted persisted JSON / API responses (T-03). Full
 * schema validation via Zod ({@link persistedStateSchema}); on top, the version
 * must match exactly — a different generation is rejected so the app re-seeds
 * cleanly instead of mixing shapes. Callers return the original object, not the
 * parsed copy, so no fields are silently stripped.
 */
export function isValidPersistedState(value: unknown): value is PersistedState {
  const parsed = persistedStateSchema.safeParse(value);
  return parsed.success && parsed.data.version === STATE_VERSION;
}
