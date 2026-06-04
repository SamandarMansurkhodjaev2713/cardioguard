/**
 * Persistence seam. The app talks to {@link StateRepository}, never to a storage
 * engine directly — so the AsyncStorage implementation can be swapped for a REST
 * / Supabase adapter later without touching the store or screens.
 */

import type {
  Doctor,
  PatientRecord,
  RiskModel,
  UserRole,
} from '../domain/types';
import type { AppLanguage } from '../i18n';
import type { ThemePreferences } from '../theme/ThemeProvider';
import { persistedStateSchema } from './schemas';

/** v2: multi-user model (doctor roster + keyed patient records). v1 blobs re-seed. */
export const STATE_VERSION = 2;

/** The serializable snapshot persisted between launches (multi-user). */
export interface PersistedState {
  readonly version: number;
  readonly role: UserRole;
  readonly doctors: readonly Doctor[];
  /** Patient records keyed by patient id. */
  readonly records: Readonly<Record<string, PatientRecord>>;
  /** Patient currently in view (logged-in patient, or doctor's open patient). */
  readonly activePatientId: string;
  /** The logged-in clinician (when role === 'doctor'). */
  readonly currentDoctorId: string;
  /** Stable identities for the demo "login as patient / doctor" shortcuts. */
  readonly demoPatientId: string;
  readonly demoDoctorId: string;
  readonly riskModel: RiskModel;
  readonly language: AppLanguage;
  readonly themePreferences: ThemePreferences;
  readonly remindersEnabled?: boolean;
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
