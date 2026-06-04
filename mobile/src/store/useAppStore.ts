/**
 * Application store (Zustand) — the infrastructure layer that owns mutable state
 * and orchestrates the pure domain engines + persistence. All side effects
 * (clock, id generation, storage I/O) live here so the domain stays pure.
 *
 * Multi-user model: the app holds a doctor roster + a map of patient records.
 * Exactly one record is "active" at a time (the logged-in patient, or the patient
 * a doctor has opened); its fields are mirrored onto the top-level slices
 * (`profile`, `measurements`, …) so every patient-facing screen keeps reading the
 * same shape it always has. Writes go through `commitActive`, which updates both
 * the record map and the mirror. Shaped for a real backend swap later.
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
  CarePlan,
  ClinicalNote,
  Doctor,
  HealthMeasurement,
  Medication,
  MedicationIntakeStatus,
  MedicationLog,
  Message,
  MoodEntry,
  PatientRecord,
  Recommendation,
  RiskAssumptionKey,
  RiskCategory,
  RiskFactorKey,
  RiskModel,
  RiskRegion,
  Sex,
  SmokingStatus,
  StressLevel,
  SymptomEntry,
  SymptomType,
  Ternary,
  UserProfile,
  UserRole,
} from '../domain/types';
import { DEFAULT_THEME_PREFERENCES, type ThemePreferences } from '../theme/ThemeProvider';
import { FALLBACK_LANGUAGE, type AppLanguage } from '../i18n';
import { STATE_VERSION, type PersistedState, type StateRepository } from '../data/repository';
import { createRepository } from '../data/repositoryFactory';
import { createMultiUserSeed } from '../data/seed';

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

export interface MoodEntryInput {
  readonly lowMood: number;
  readonly anxiety: number;
  readonly stress: number;
  readonly emotionalInstability: number;
  readonly sleepProblems: number;
  readonly fatigue: number;
  readonly note: string;
}

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

/** Symptom self-report (TZ Module: patient self-management). */
export interface SymptomInput {
  readonly type: SymptomType;
  readonly severity: number;
  readonly note: string;
}

/** Doctor-set care plan fields (all optional — only touched ones are merged). */
export interface CarePlanInput {
  readonly targetSystolicBp?: number;
  readonly targetDiastolicBp?: number;
  readonly targetWeightKg?: number;
  readonly alertSystolicBp?: number;
  readonly alertDiastolicBp?: number;
  readonly note?: string;
}

// ── Derived risk result ──────────────────────────────────────────────────────
export interface RiskResult {
  readonly percent: number;
  readonly category: RiskCategory;
  readonly factorKeys: readonly RiskFactorKey[];
  readonly assumptionKeys: readonly RiskAssumptionKey[];
}

/** The patient-data fields mirrored from the active record onto the top level. */
type ActiveMirror = Pick<
  AppState,
  'profile' | 'measurements' | 'medications' | 'medicationLogs' | 'moodEntries'
  | 'alerts' | 'symptoms' | 'carePlan' | 'notes' | 'messages'
>;

interface AppState {
  readonly hydrated: boolean;

  // Multi-user model
  readonly doctors: Doctor[];
  readonly records: Record<string, PatientRecord>;
  readonly activePatientId: string;
  readonly currentDoctorId: string;
  readonly demoPatientId: string;
  readonly demoDoctorId: string;

  // Active-record mirror (every patient-facing screen reads these)
  readonly profile: UserProfile;
  readonly measurements: HealthMeasurement[];
  readonly medications: Medication[];
  readonly medicationLogs: MedicationLog[];
  readonly moodEntries: MoodEntry[];
  readonly alerts: Alert[];
  readonly symptoms: SymptomEntry[];
  readonly carePlan: CarePlan;
  readonly notes: ClinicalNote[];
  readonly messages: Message[];

  // Global / session
  readonly role: UserRole;
  readonly riskModel: RiskModel;
  readonly language: AppLanguage;
  readonly themePreferences: ThemePreferences;
  readonly remindersEnabled: boolean;

  readonly hydrate: () => Promise<void>;
  readonly enterAs: (role: UserRole) => void;
  readonly openPatient: (patientId: string) => void;
  readonly addMeasurement: (input: MeasurementInput) => void;
  readonly addMedication: (input: MedicationInput) => void;
  readonly updateMedication: (id: string, input: Partial<MedicationInput>) => void;
  readonly deleteMedication: (id: string) => void;
  readonly recordIntake: (medicationId: string, scheduledTime: string) => void;
  readonly addMoodEntry: (input: MoodEntryInput) => void;
  readonly addSymptom: (input: SymptomInput) => void;
  readonly setLogStatus: (logId: string, status: MedicationIntakeStatus) => void;
  readonly markAlertRead: (id: string) => void;
  readonly clearReadAlerts: () => void;
  readonly setRiskModel: (model: RiskModel) => void;
  readonly setRiskInputs: (input: { totalCholMmol?: number; hdlCholMmol?: number; riskRegion?: RiskRegion }) => void;
  readonly setGoals: (goals: { targetSystolicBp?: number; targetWeightKg?: number }) => void;
  readonly setCarePlan: (input: CarePlanInput) => void;
  readonly addNote: (text: string) => void;
  readonly sendMessage: (text: string) => void;
  readonly markMessagesRead: () => void;
  readonly linkToDoctor: (inviteCode: string) => boolean;
  readonly unlinkDoctor: () => void;
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

export function deriveRisk(state: { profile: UserProfile; measurements: readonly HealthMeasurement[]; riskModel: RiskModel }): RiskResult {
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
  data: { profile: UserProfile; measurements: HealthMeasurement[]; medicationLogs: MedicationLog[]; moodEntries: MoodEntry[] },
  risk: RiskResult,
  now: Date,
): Alert[] {
  const latestMood = latestMoodEntry(data.moodEntries);
  const drafts = evaluateAlerts(
    {
      measurements: data.measurements,
      medicationLogs: data.medicationLogs,
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
      userId: data.profile.id,
      date: now.toISOString(),
      type: draft.type,
      severity: draft.severity,
      params: draft.params,
      isRead: false,
    });
  }
  return result;
}

/** Project a record onto the top-level mirror fields. */
function mirror(record: PatientRecord): ActiveMirror {
  return {
    profile: record.profile,
    measurements: record.measurements,
    medications: record.medications,
    medicationLogs: record.medicationLogs,
    moodEntries: record.moodEntries,
    alerts: record.alerts,
    symptoms: record.symptoms,
    carePlan: record.carePlan,
    notes: record.notes,
    messages: record.messages,
  };
}

function toPersisted(state: AppState): PersistedState {
  return {
    version: STATE_VERSION,
    role: state.role,
    doctors: state.doctors,
    records: state.records,
    activePatientId: state.activePatientId,
    currentDoctorId: state.currentDoctorId,
    demoPatientId: state.demoPatientId,
    demoDoctorId: state.demoDoctorId,
    riskModel: state.riskModel,
    language: state.language,
    themePreferences: state.themePreferences,
    remindersEnabled: state.remindersEnabled,
  };
}

const initialSeed = createMultiUserSeed(new Date());
const initialActive = initialSeed.records[initialSeed.demoPatientId];

export const useAppStore = create<AppState>((set, get) => {
  const persist = () => {
    void repository.save(toPersisted(get()));
  };

  /** Update the active patient's record + the top-level mirror, then persist. */
  const commitActive = (patch: Partial<PatientRecord>) => {
    const { activePatientId, records } = get();
    const current = records[activePatientId];
    if (!current) return;
    const updated: PatientRecord = { ...current, ...patch };
    set({ records: { ...records, [activePatientId]: updated }, ...mirror(updated) });
    persist();
  };

  /** Recompute the active patient's alerts and persist. */
  const refreshAlerts = () => {
    const state = get();
    const record = state.records[state.activePatientId];
    if (!record) {
      persist();
      return;
    }
    const risk = deriveRisk({ profile: record.profile, measurements: record.measurements, riskModel: state.riskModel });
    const alerts = mergeAlerts(record.alerts, record, risk, new Date());
    commitActive({ alerts });
  };

  return {
    hydrated: false,
    doctors: initialSeed.doctors,
    records: initialSeed.records,
    activePatientId: initialSeed.demoPatientId,
    currentDoctorId: initialSeed.demoDoctorId,
    demoPatientId: initialSeed.demoPatientId,
    demoDoctorId: initialSeed.demoDoctorId,
    ...mirror(initialActive),
    role: 'patient',
    riskModel: 'score2',
    language: FALLBACK_LANGUAGE,
    themePreferences: DEFAULT_THEME_PREFERENCES,
    remindersEnabled: false,

    async hydrate() {
      const persisted = await repository.load();
      if (persisted) {
        const active = persisted.records[persisted.activePatientId];
        set({
          hydrated: true,
          role: persisted.role,
          doctors: [...persisted.doctors],
          records: { ...persisted.records },
          activePatientId: persisted.activePatientId,
          currentDoctorId: persisted.currentDoctorId,
          demoPatientId: persisted.demoPatientId,
          demoDoctorId: persisted.demoDoctorId,
          ...(active ? mirror(active) : {}),
          riskModel: persisted.riskModel,
          language: persisted.language,
          themePreferences: persisted.themePreferences,
          remindersEnabled: persisted.remindersEnabled ?? false,
        });
        return;
      }
      // First launch — seed the multi-user demo and compute the patient's alerts.
      const seed = createMultiUserSeed(new Date());
      const active = seed.records[seed.demoPatientId];
      set({
        hydrated: true,
        role: 'patient',
        doctors: seed.doctors,
        records: seed.records,
        activePatientId: seed.demoPatientId,
        currentDoctorId: seed.demoDoctorId,
        demoPatientId: seed.demoPatientId,
        demoDoctorId: seed.demoDoctorId,
        ...mirror(active),
      });
      refreshAlerts();
    },

    enterAs(role) {
      const state = get();
      if (role === 'patient') {
        const id = state.records[state.demoPatientId] ? state.demoPatientId : state.activePatientId;
        const record = state.records[id];
        set({ role: 'patient', activePatientId: id, ...(record ? mirror(record) : {}) });
      } else {
        set({ role: 'doctor', currentDoctorId: state.demoDoctorId });
      }
      persist();
    },

    openPatient(patientId) {
      const record = get().records[patientId];
      if (!record) return;
      set({ activePatientId: patientId, ...mirror(record) });
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
      commitActive({
        measurements: [measurement, ...measurements],
        profile: { ...profile, weightKg: input.weightKg, waistCircumferenceCm: input.waistCircumferenceCm, updatedAt: measurement.date },
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
      commitActive({ medications: [...medications, medication] });
    },

    updateMedication(id, input) {
      const { medications } = get();
      commitActive({
        medications: medications.map((m) =>
          m.id === id
            ? {
                ...m,
                ...(input.name !== undefined ? { name: input.name } : {}),
                ...(input.dosage !== undefined ? { dosage: input.dosage } : {}),
                ...(input.frequencyPerDay !== undefined ? { frequencyPerDay: input.frequencyPerDay } : {}),
                ...(input.intakeTimes !== undefined ? { intakeTimes: [...input.intakeTimes] } : {}),
                ...(input.instructions !== undefined ? { instructions: input.instructions } : {}),
              }
            : m,
        ),
      });
    },

    deleteMedication(id) {
      const { medications, medicationLogs } = get();
      commitActive({
        medications: medications.filter((m) => m.id !== id),
        medicationLogs: medicationLogs.filter((l) => l.medicationId !== id),
      });
    },

    recordIntake(medicationId, scheduledTime) {
      const { profile, medicationLogs } = get();
      const log: MedicationLog = {
        id: nextId('log'),
        medicationId,
        userId: profile.id,
        scheduledTime,
        actualTime: new Date().toISOString(),
        status: 'taken',
        note: '',
      };
      commitActive({ medicationLogs: [...medicationLogs, log] });
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
      commitActive({ moodEntries: [entry, ...moodEntries] });
      refreshAlerts();
    },

    addSymptom(input) {
      const { profile, symptoms } = get();
      const entry: SymptomEntry = {
        id: nextId('sym'),
        userId: profile.id,
        date: new Date().toISOString(),
        type: input.type,
        severity: input.severity,
        note: input.note,
      };
      commitActive({ symptoms: [entry, ...symptoms] });
    },

    setLogStatus(logId, status) {
      const { medicationLogs } = get();
      commitActive({
        medicationLogs: medicationLogs.map((log) =>
          log.id === logId
            ? { ...log, status, actualTime: status === 'taken' ? new Date().toISOString() : null }
            : log,
        ),
      });
      refreshAlerts();
    },

    markAlertRead(id) {
      commitActive({ alerts: get().alerts.map((a) => (a.id === id ? { ...a, isRead: true } : a)) });
    },

    clearReadAlerts() {
      commitActive({ alerts: get().alerts.filter((a) => !a.isRead) });
    },

    setRiskModel(model) {
      set({ riskModel: model });
      persist();
    },

    setRiskInputs(input) {
      commitActive({ profile: { ...get().profile, ...input, updatedAt: new Date().toISOString() } });
      refreshAlerts();
    },

    setGoals(goals) {
      commitActive({ profile: { ...get().profile, ...goals, updatedAt: new Date().toISOString() } });
    },

    setCarePlan(input) {
      const { carePlan, currentDoctorId } = get();
      // The doctor's plan is kept separate from the patient's personal goals
      // (profile.target*) — the patient sees the plan as authoritative guidance,
      // but their own goal is theirs. So we write only carePlan here.
      const next: Record<string, unknown> = { ...carePlan };
      for (const key of Object.keys(input) as (keyof CarePlanInput)[]) {
        if (input[key] !== undefined) next[key] = input[key];
      }
      next.updatedByDoctorId = currentDoctorId;
      next.updatedAt = new Date().toISOString();
      commitActive({ carePlan: next as CarePlan });
    },

    addNote(text) {
      const { notes, currentDoctorId } = get();
      const note: ClinicalNote = { id: nextId('note'), doctorId: currentDoctorId, date: new Date().toISOString(), text };
      commitActive({ notes: [note, ...notes] });
    },

    sendMessage(text) {
      const { messages, role } = get();
      const message: Message = { id: nextId('msg'), fromRole: role, date: new Date().toISOString(), text, isRead: false };
      commitActive({ messages: [...messages, message] });
    },

    markMessagesRead() {
      const { messages, role } = get();
      // Mark messages from the *other* party as read.
      commitActive({ messages: messages.map((m) => (m.fromRole !== role ? { ...m, isRead: true } : m)) });
    },

    linkToDoctor(inviteCode) {
      const { doctors, profile } = get();
      const doctor = doctors.find((d) => d.inviteCode.toUpperCase() === inviteCode.trim().toUpperCase());
      if (!doctor) return false;
      commitActive({ profile: { ...profile, doctorId: doctor.id, updatedAt: new Date().toISOString() } });
      return true;
    },

    unlinkDoctor() {
      commitActive({ profile: { ...get().profile, doctorId: null, updatedAt: new Date().toISOString() } });
    },

    updateMedicalProfile(input) {
      const merged: UserProfile = { ...get().profile };
      const writable = merged as unknown as Record<string, unknown>;
      for (const key of Object.keys(input) as (keyof MedicalProfileInput)[]) {
        const value = input[key];
        if (value !== undefined) writable[key] = value;
      }
      commitActive({ profile: { ...merged, updatedAt: new Date().toISOString() } });
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
      const id = profile.id && profile.id.length > 0 ? profile.id : nextId('user');
      const finalProfile: UserProfile = { ...profile, id };
      const record: PatientRecord = {
        profile: finalProfile,
        measurements: [baseline],
        medications: [],
        medicationLogs: [],
        moodEntries: [],
        alerts: [],
        symptoms: [],
        carePlan: {},
        notes: [],
        messages: [],
      };
      set({
        role: 'patient',
        records: { ...get().records, [id]: record },
        activePatientId: id,
        demoPatientId: id,
        ...mirror(record),
      });
      refreshAlerts();
    },

    resetDemo() {
      const seed = createMultiUserSeed(new Date());
      const active = seed.records[seed.demoPatientId];
      set({
        role: 'patient',
        doctors: seed.doctors,
        records: seed.records,
        activePatientId: seed.demoPatientId,
        currentDoctorId: seed.demoDoctorId,
        demoPatientId: seed.demoPatientId,
        demoDoctorId: seed.demoDoctorId,
        riskModel: 'score2',
        ...mirror(active),
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
export const selectSymptoms = (s: AppState): SymptomEntry[] => s.symptoms;
export const selectCarePlan = (s: AppState): CarePlan => s.carePlan;
export const selectMessages = (s: AppState): Message[] => s.messages;
export const selectUnreadMessageCount = (s: AppState): number =>
  s.messages.filter((m) => !m.isRead && m.fromRole !== s.role).length;

// NB: the doctor's roster (records filtered by currentDoctorId) is intentionally
// NOT exposed as a selector — building a fresh array each call would loop when
// used as a hook (unstable getSnapshot). Screens select `records` +
// `currentDoctorId` and derive the roster via useMemo instead.

/** The patient currently in view (active record). */
export const selectActiveRecord = (s: AppState): PatientRecord | undefined => s.records[s.activePatientId];

/** The clinician the active patient is enrolled under (if any). */
export const selectLinkedDoctor = (s: AppState): Doctor | undefined =>
  s.doctors.find((d) => d.id === s.profile.doctorId);

/** The currently logged-in clinician. */
export const selectCurrentDoctor = (s: AppState): Doctor | undefined =>
  s.doctors.find((d) => d.id === s.currentDoctorId);
