/**
 * Application store (Zustand) — the infrastructure layer that owns mutable state
 * and orchestrates the pure domain engines + persistence. All side effects
 * (clock, id generation, storage I/O) live here so the domain stays pure.
 */

import { create } from 'zustand';

import {
  calculateAdherencePercent,
  calculateBmi,
  classifyRiskCategory,
  riskPercentFor,
} from '../domain/calculators';
import { evaluateAlerts } from '../domain/alertEngine';
import { classifyMoodState, latestMoodEntry } from '../domain/mood';
import { generateRecommendations } from '../domain/riskEngine';
import { BMI, LAB_DEFAULTS, SCORE2 } from '../domain/constants';
import type {
  Alert,
  HealthMeasurement,
  Medication,
  MedicationIntakeStatus,
  MedicationLog,
  MoodEntry,
  Recommendation,
  RiskAssumptionKey,
  RiskCategory,
  RiskFactorKey,
  RiskModel,
  RiskRegion,
  Sex,
  SmokingStatus,
  StressLevel,
  Ternary,
  UserProfile,
  UserRole,
} from '../domain/types';
import { DEFAULT_THEME_PREFERENCES, type ThemePreferences } from '../theme/ThemeProvider';
import { FALLBACK_LANGUAGE, type AppLanguage } from '../i18n';
import { STATE_VERSION, type PersistedState, type StateRepository } from '../data/repository';
import { createRepository } from '../data/repositoryFactory';
import { createPatientSeed } from '../data/seed';

// ── Id generation ────────────────────────────────────────────────────────────
let idSeq = 0;
function nextId(prefix: string): string {
  idSeq += 1;
  return `${prefix}_${Date.now().toString(36)}_${idSeq.toString(36)}`;
}

// ── Action inputs ────────────────────────────────────────────────────────────
export interface MeasurementInput {
  readonly systolicBp: number;
  readonly diastolicBp: number;
  readonly heartRate: number;
  readonly weightKg: number;
  readonly waistCircumferenceCm: number;
  readonly sleepHours: number;
  readonly stressLevel: StressLevel;
  readonly physicalActivityMinutes: number;
  readonly glucoseMmol?: number;
  readonly spo2Percent?: number;
  readonly steps?: number;
  readonly notes: string;
}

export interface MedicationInput {
  readonly name: string;
  readonly dosage: string;
  readonly frequencyPerDay: number;
  readonly intakeTimes: readonly string[];
  readonly instructions: string;
}

/** A weekly wellbeing check-in submission (TZ Module 5). Each item is 0–4. */
export interface MoodEntryInput {
  readonly lowMood: number;
  readonly anxiety: number;
  readonly stress: number;
  readonly emotionalInstability: number;
  readonly sleepProblems: number;
  readonly fatigue: number;
  readonly note: string;
}

/** Editable subset of the medical card (TZ Module 1). All fields optional — only
 *  the touched ones are merged. */
export interface MedicalProfileInput {
  readonly age?: number;
  readonly sex?: Sex;
  readonly heightCm?: number;
  readonly unit?: string;
  readonly serviceYears?: number;
  readonly smokingStatus?: SmokingStatus;
  readonly hypertensionStatus?: Ternary;
  readonly diabetesStatus?: Ternary;
  readonly dyslipidemiaStatus?: Ternary;
  readonly familyHistoryCvd?: Ternary;
  readonly chronicConditions?: readonly string[];
  readonly allergies?: readonly string[];
  readonly medicationNotes?: string;
}

// ── Derived risk result ──────────────────────────────────────────────────────
export interface RiskResult {
  readonly percent: number;
  readonly category: RiskCategory;
  readonly factorKeys: readonly RiskFactorKey[];
  /** Assumptions the model had to make (missing labs, age out of range). */
  readonly assumptionKeys: readonly RiskAssumptionKey[];
}

interface AppState {
  readonly hydrated: boolean;
  readonly role: UserRole;
  readonly profile: UserProfile;
  readonly measurements: HealthMeasurement[];
  readonly medications: Medication[];
  readonly medicationLogs: MedicationLog[];
  readonly moodEntries: MoodEntry[];
  readonly alerts: Alert[];
  readonly riskModel: RiskModel;
  readonly language: AppLanguage;
  readonly themePreferences: ThemePreferences;
  readonly remindersEnabled: boolean;

  readonly hydrate: () => Promise<void>;
  readonly enterAs: (role: UserRole) => void;
  readonly addMeasurement: (input: MeasurementInput) => void;
  readonly addMedication: (input: MedicationInput) => void;
  readonly recordIntake: (medicationId: string, scheduledTime: string) => void;
  readonly addMoodEntry: (input: MoodEntryInput) => void;
  readonly setLogStatus: (logId: string, status: MedicationIntakeStatus) => void;
  readonly markAlertRead: (id: string) => void;
  readonly clearReadAlerts: () => void;
  readonly setRiskModel: (model: RiskModel) => void;
  readonly setRiskInputs: (input: { totalCholMmol?: number; hdlCholMmol?: number; riskRegion?: RiskRegion }) => void;
  readonly setGoals: (goals: { targetSystolicBp?: number; targetWeightKg?: number }) => void;
  readonly updateMedicalProfile: (input: MedicalProfileInput) => void;
  readonly setRemindersEnabled: (enabled: boolean) => void;
  readonly setLanguage: (language: AppLanguage) => void;
  readonly setThemePreferences: (prefs: ThemePreferences) => void;
  readonly applyOnboarding: (profile: UserProfile, baseline: HealthMeasurement) => void;
  readonly resetDemo: () => void;
}

const repository: StateRepository = createRepository();

// ── Pure derivations (exported as selectors) ─────────────────────────────────
function computeFactorKeys(profile: UserProfile, latest: HealthMeasurement | undefined): RiskFactorKey[] {
  const keys: RiskFactorKey[] = [];
  if (latest && (latest.systolicBp >= 140 || latest.diastolicBp >= 90)) keys.push('elevatedBp');
  if (profile.smokingStatus !== 'never') keys.push('smoking');
  if (latest && latest.bmi >= BMI.OVERWEIGHT_MAX) keys.push('obesity');
  else if (latest && latest.bmi >= BMI.NORMAL_MAX) keys.push('overweight');
  if (profile.diabetesStatus === 'yes') keys.push('diabetes');
  if (profile.familyHistoryCvd === 'yes') keys.push('familyHistory');
  if (profile.workScheduleType === 'shift' || profile.workScheduleType === 'night') keys.push('shiftWork');
  const waistLimit = profile.sex === 'male' ? BMI.WAIST_RISK_MALE_CM : BMI.WAIST_RISK_FEMALE_CM;
  if (latest && latest.waistCircumferenceCm > waistLimit) keys.push('abdominalFat');
  return keys;
}

export function deriveRisk(state: Pick<AppState, 'profile' | 'measurements' | 'riskModel'>): RiskResult {
  const { profile } = state;
  const latest = state.measurements[0];

  const labsMissing = profile.totalCholMmol == null || profile.hdlCholMmol == null;
  const inputs = {
    systolicBp: latest?.systolicBp ?? 120,
    totalCholMmol: profile.totalCholMmol ?? LAB_DEFAULTS.TOTAL_CHOL_MMOL,
    hdlCholMmol: profile.hdlCholMmol ?? LAB_DEFAULTS.HDL_MMOL,
  };

  const percent = riskPercentFor(state.riskModel, profile, inputs);
  const category = classifyRiskCategory(percent, state.riskModel, profile.age);

  const assumptionKeys: RiskAssumptionKey[] = [];
  if (labsMissing) assumptionKeys.push('defaultCholesterol');
  if (state.riskModel === 'score2' && profile.age < SCORE2.VALID_AGE_MIN) assumptionKeys.push('ageBelowRange');
  if (state.riskModel === 'score2' && profile.age > SCORE2.VALID_AGE_MAX) assumptionKeys.push('ageAboveRange');

  return { percent, category, factorKeys: computeFactorKeys(profile, latest), assumptionKeys };
}

// ── Alert merge (dedup against existing unread of the same type) ──────────────
function mergeAlerts(
  existing: readonly Alert[],
  state: Pick<AppState, 'profile' | 'measurements' | 'medicationLogs' | 'moodEntries'>,
  risk: RiskResult,
  now: Date,
): Alert[] {
  const latestMood = latestMoodEntry(state.moodEntries);
  const drafts = evaluateAlerts(
    {
      measurements: state.measurements,
      medicationLogs: state.medicationLogs,
      riskPercent: risk.percent,
      riskCategory: risk.category,
      latestMoodState: latestMood ? classifyMoodState(latestMood) : undefined,
    },
    now,
  );
  const result = [...existing];
  for (const draft of drafts) {
    if (result.some((a) => a.type === draft.type && !a.isRead)) continue;
    result.unshift({
      id: nextId(`al_${draft.type}`),
      userId: state.profile.id,
      date: now.toISOString(),
      type: draft.type,
      severity: draft.severity,
      params: draft.params,
      isRead: false,
    });
  }
  return result;
}

function toPersisted(state: AppState): PersistedState {
  return {
    version: STATE_VERSION,
    role: state.role,
    profile: state.profile,
    measurements: state.measurements,
    medications: state.medications,
    medicationLogs: state.medicationLogs,
    alerts: state.alerts,
    riskModel: state.riskModel,
    language: state.language,
    themePreferences: state.themePreferences,
    remindersEnabled: state.remindersEnabled,
    moodEntries: state.moodEntries,
  };
}

export const useAppStore = create<AppState>((set, get) => {
  // Persist the current snapshot. localRepository.save catches its own errors,
  // so this is safe to call without awaiting.
  const persist = () => {
    void repository.save(toPersisted(get()));
  };

  // Recompute alerts from current data and persist.
  const refreshAlerts = () => {
    const state = get();
    const risk = deriveRisk(state);
    set({ alerts: mergeAlerts(state.alerts, state, risk, new Date()) });
    persist();
  };

  return {
    hydrated: false,
    role: 'patient',
    profile: createPatientSeed(new Date()).profile,
    measurements: [],
    medications: [],
    medicationLogs: [],
    moodEntries: [],
    alerts: [],
    riskModel: 'score2',
    language: FALLBACK_LANGUAGE,
    themePreferences: DEFAULT_THEME_PREFERENCES,
    remindersEnabled: false,

    async hydrate() {
      const persisted = await repository.load();
      if (persisted) {
        set({
          hydrated: true,
          role: persisted.role,
          profile: persisted.profile,
          measurements: [...persisted.measurements],
          medications: [...persisted.medications],
          medicationLogs: [...persisted.medicationLogs],
          moodEntries: persisted.moodEntries ? [...persisted.moodEntries] : [],
          alerts: [...persisted.alerts],
          riskModel: persisted.riskModel,
          language: persisted.language,
          themePreferences: persisted.themePreferences,
          remindersEnabled: persisted.remindersEnabled ?? false,
        });
        return;
      }
      // First launch — seed the demo patient and compute initial alerts.
      const now = new Date();
      const seed = createPatientSeed(now);
      set({
        hydrated: true,
        role: 'patient',
        profile: seed.profile,
        measurements: seed.measurements,
        medications: seed.medications,
        medicationLogs: seed.medicationLogs,
        moodEntries: seed.moodEntries,
        alerts: [],
      });
      refreshAlerts();
    },

    enterAs(role) {
      set({ role });
      persist();
    },

    addMeasurement(input) {
      const { profile, measurements } = get();
      const measurement: HealthMeasurement = {
        id: nextId('m'),
        userId: profile.id,
        date: new Date().toISOString(),
        systolicBp: input.systolicBp,
        diastolicBp: input.diastolicBp,
        heartRate: input.heartRate,
        weightKg: input.weightKg,
        bmi: calculateBmi(input.weightKg, profile.heightCm),
        waistCircumferenceCm: input.waistCircumferenceCm,
        sleepHours: input.sleepHours,
        stressLevel: input.stressLevel,
        physicalActivityMinutes: input.physicalActivityMinutes,
        glucoseMmol: input.glucoseMmol,
        spo2Percent: input.spo2Percent,
        steps: input.steps,
        notes: input.notes,
      };
      set({
        measurements: [measurement, ...measurements],
        profile: {
          ...profile,
          weightKg: input.weightKg,
          waistCircumferenceCm: input.waistCircumferenceCm,
          updatedAt: measurement.date,
        },
      });
      refreshAlerts();
    },

    addMedication(input) {
      const { profile, medications } = get();
      const medication: Medication = {
        id: nextId('med'),
        userId: profile.id,
        name: input.name,
        dosage: input.dosage,
        frequencyPerDay: input.frequencyPerDay,
        intakeTimes: [...input.intakeTimes],
        startDate: new Date().toISOString(),
        endDate: null,
        instructions: input.instructions,
        isActive: true,
      };
      set({ medications: [...medications, medication] });
      persist();
    },

    recordIntake(medicationId, scheduledTime) {
      const { profile, medicationLogs } = get();
      const now = new Date();
      const log: MedicationLog = {
        id: nextId('log'),
        medicationId,
        userId: profile.id,
        scheduledTime,
        actualTime: now.toISOString(),
        status: 'taken',
        note: '',
      };
      set({ medicationLogs: [...medicationLogs, log] });
      refreshAlerts();
    },

    addMoodEntry(input) {
      const { profile, moodEntries } = get();
      const entry: MoodEntry = {
        id: nextId('mood'),
        userId: profile.id,
        date: new Date().toISOString(),
        lowMood: input.lowMood,
        anxiety: input.anxiety,
        stress: input.stress,
        emotionalInstability: input.emotionalInstability,
        sleepProblems: input.sleepProblems,
        fatigue: input.fatigue,
        note: input.note,
      };
      // Newest-first, mirroring measurements.
      set({ moodEntries: [entry, ...moodEntries] });
      // A distressed check-in can raise an early-warning signal (rule 9).
      refreshAlerts();
    },

    setLogStatus(logId, status) {
      const { medicationLogs } = get();
      set({
        medicationLogs: medicationLogs.map((log) =>
          log.id === logId
            ? { ...log, status, actualTime: status === 'taken' ? new Date().toISOString() : null }
            : log,
        ),
      });
      refreshAlerts();
    },

    markAlertRead(id) {
      set({ alerts: get().alerts.map((a) => (a.id === id ? { ...a, isRead: true } : a)) });
      persist();
    },

    clearReadAlerts() {
      set({ alerts: get().alerts.filter((a) => !a.isRead) });
      persist();
    },

    setRiskModel(model) {
      set({ riskModel: model });
      persist();
    },

    setRiskInputs(input) {
      set({ profile: { ...get().profile, ...input, updatedAt: new Date().toISOString() } });
      refreshAlerts();
    },

    setGoals(goals) {
      set({ profile: { ...get().profile, ...goals, updatedAt: new Date().toISOString() } });
      persist();
    },

    updateMedicalProfile(input) {
      const merged: UserProfile = { ...get().profile };
      // Merge only keys actually provided — never clobber a required field with
      // `undefined`. Keys are a known subset of UserProfile, so the single cast
      // is sound (T-02: subset is checked at the type level by MedicalProfileInput).
      const writable = merged as unknown as Record<string, unknown>;
      for (const key of Object.keys(input) as (keyof MedicalProfileInput)[]) {
        const value = input[key];
        if (value !== undefined) writable[key] = value;
      }
      set({ profile: { ...merged, updatedAt: new Date().toISOString() } });
      // Clinical flags (diabetes/smoking/hypertension) feed the risk model →
      // recompute alerts so the early-warning state stays consistent.
      refreshAlerts();
    },

    setRemindersEnabled(enabled) {
      set({ remindersEnabled: enabled });
      persist();
    },

    setLanguage(language) {
      set({ language });
      persist();
    },

    setThemePreferences(prefs) {
      set({ themePreferences: prefs });
      persist();
    },

    applyOnboarding(profile, baseline) {
      set({ role: 'patient', profile, measurements: [baseline], moodEntries: [], alerts: [] });
      refreshAlerts();
    },

    resetDemo() {
      const now = new Date();
      const seed = createPatientSeed(now);
      set({
        role: 'patient',
        profile: seed.profile,
        measurements: seed.measurements,
        medications: seed.medications,
        medicationLogs: seed.medicationLogs,
        moodEntries: seed.moodEntries,
        alerts: [],
        riskModel: 'score2',
      });
      refreshAlerts();
    },
  };
});

// ── Selectors ────────────────────────────────────────────────────────────────
export const selectLatestMeasurement = (s: AppState): HealthMeasurement | undefined => s.measurements[0];
export const selectAdherencePercent = (s: AppState): number => calculateAdherencePercent(s.medicationLogs);
export const selectRisk = (s: AppState): RiskResult => deriveRisk(s);
export const selectRecommendations = (s: AppState): Recommendation[] => {
  const latest = s.measurements[0];
  if (!latest) return [];
  const risk = deriveRisk(s);
  return generateRecommendations({
    profile: s.profile,
    latest,
    adherencePercent: calculateAdherencePercent(s.medicationLogs),
    riskPercent: risk.percent,
    riskCategory: risk.category,
  });
};
export const selectUnreadAlertCount = (s: AppState): number => s.alerts.filter((a) => !a.isRead).length;
export const selectMoodEntries = (s: AppState): MoodEntry[] => s.moodEntries;
