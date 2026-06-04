/**
 * Runtime validation schemas (Zod) for the persistence / external boundary.
 *
 * Persisted JSON and API responses are untrusted input (T-03): they are parsed
 * here before the store ever sees them, so corrupt storage or a misbehaving
 * backend degrades to a clean re-seed instead of crashing deep in the UI.
 *
 * Literal sets are mirrored from the domain/theme types with `satisfies` so a
 * future change to those unions fails compilation here too — without pulling the
 * React/i18n module graph into the data layer (`import type` only).
 */

import { z } from 'zod';

import type {
  ActivityLevel,
  AlertSeverity,
  AlertType,
  RiskCategory,
  RiskModel,
  RiskRegion,
  Sex,
  SleepQuality,
  SmokingStatus,
  StressLevel,
  SymptomType,
  Ternary,
  UserRole,
  WorkSchedule,
  RiskGroup,
  MedicationIntakeStatus,
} from '../domain/types';
import type { AppLanguage } from '../i18n';
import type { DensityPreset, RadiusPreset } from '../theme/tokens';
import type { AppearancePreference } from '../theme/ThemeProvider';

// ── Enum literal sets (compile-checked against the source unions) ─────────────
const SEX = ['male', 'female'] as const satisfies readonly Sex[];
const SMOKING = ['never', 'former', 'current'] as const satisfies readonly SmokingStatus[];
const TERNARY = ['yes', 'no', 'unknown'] as const satisfies readonly Ternary[];
const WORK_SCHEDULE = ['regular', 'shift', 'night'] as const satisfies readonly WorkSchedule[];
const RISK_GROUP = ['civilian', 'lawEnforcement', 'military', 'other'] as const satisfies readonly RiskGroup[];
const ACTIVITY = ['low', 'medium', 'high'] as const satisfies readonly ActivityLevel[];
const SLEEP_QUALITY = ['good', 'disturbed', 'insufficient'] as const satisfies readonly SleepQuality[];
const STRESS = ['low', 'medium', 'high'] as const satisfies readonly StressLevel[];
const INTAKE_STATUS = ['taken', 'missed', 'skipped'] as const satisfies readonly MedicationIntakeStatus[];
const ALERT_SEVERITY = ['info', 'warn', 'high'] as const satisfies readonly AlertSeverity[];
const ALERT_TYPE = [
  'bloodPressure', 'repeatedBloodPressure', 'rapidWeight', 'bmiWorsening',
  'lowAdherence', 'medicationAdherence', 'highCvdRisk', 'noMeasurements', 'psychDistress',
] as const satisfies readonly AlertType[];
const SYMPTOM_TYPE = [
  'chestPain', 'shortnessOfBreath', 'palpitations', 'dizziness',
  'headache', 'swelling', 'fatigue', 'other',
] as const satisfies readonly SymptomType[];
const RISK_MODEL = ['score2', 'framingham'] as const satisfies readonly RiskModel[];
const RISK_REGION = ['low', 'moderate', 'high', 'veryHigh'] as const satisfies readonly RiskRegion[];
const RISK_CATEGORY = ['low', 'moderate', 'high', 'veryHigh'] as const satisfies readonly RiskCategory[];
const USER_ROLE = ['patient', 'doctor'] as const satisfies readonly UserRole[];
const LANGUAGE = ['ru', 'uz'] as const satisfies readonly AppLanguage[];
const DENSITY = ['compact', 'comfortable'] as const satisfies readonly DensityPreset[];
const RADIUS = ['strict', 'soft'] as const satisfies readonly RadiusPreset[];
const APPEARANCE = ['light', 'dark', 'system'] as const satisfies readonly AppearancePreference[];

const isoString = z.string().min(1);
const paramsSchema = z.record(z.union([z.string(), z.number()]));

// ── Entity schemas ────────────────────────────────────────────────────────────
export const userProfileSchema = z.object({
  id: z.string().min(1),
  anonymizedId: z.string().min(1),
  fullName: z.string(),
  age: z.number(),
  sex: z.enum(SEX),
  heightCm: z.number(),
  weightKg: z.number(),
  waistCircumferenceCm: z.number(),
  smokingStatus: z.enum(SMOKING),
  diabetesStatus: z.enum(TERNARY),
  hypertensionStatus: z.enum(TERNARY),
  onHypertensiveMedication: z.boolean(),
  familyHistoryCvd: z.enum(TERNARY),
  workScheduleType: z.enum(WORK_SCHEDULE),
  professionalRiskGroup: z.enum(RISK_GROUP),
  physicalActivityLevel: z.enum(ACTIVITY),
  sleepQuality: z.enum(SLEEP_QUALITY),
  stressLevel: z.enum(STRESS),
  totalCholMmol: z.number().optional(),
  hdlCholMmol: z.number().optional(),
  riskRegion: z.enum(RISK_REGION).optional(),
  targetSystolicBp: z.number().optional(),
  targetWeightKg: z.number().optional(),
  dyslipidemiaStatus: z.enum(TERNARY).optional(),
  chronicConditions: z.array(z.string()).optional(),
  allergies: z.array(z.string()).optional(),
  medicationNotes: z.string().optional(),
  unit: z.string().optional(),
  serviceYears: z.number().optional(),
  doctorId: z.string().nullable().optional(),
  createdAt: isoString,
  updatedAt: isoString,
});

export const healthMeasurementSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  date: isoString,
  systolicBp: z.number(),
  diastolicBp: z.number(),
  heartRate: z.number(),
  weightKg: z.number(),
  bmi: z.number(),
  waistCircumferenceCm: z.number(),
  sleepHours: z.number(),
  stressLevel: z.enum(STRESS),
  physicalActivityMinutes: z.number(),
  glucoseMmol: z.number().optional(),
  spo2Percent: z.number().optional(),
  steps: z.number().optional(),
  notes: z.string(),
});

export const medicationSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  name: z.string(),
  dosage: z.string(),
  frequencyPerDay: z.number(),
  intakeTimes: z.array(z.string()),
  startDate: isoString,
  endDate: z.string().nullable(),
  instructions: z.string(),
  isActive: z.boolean(),
});

export const medicationLogSchema = z.object({
  id: z.string().min(1),
  medicationId: z.string().min(1),
  userId: z.string().min(1),
  scheduledTime: z.string(),
  actualTime: z.string().nullable(),
  status: z.enum(INTAKE_STATUS),
  note: z.string(),
});

export const alertSchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  date: isoString,
  type: z.enum(ALERT_TYPE),
  severity: z.enum(ALERT_SEVERITY),
  params: paramsSchema,
  isRead: z.boolean(),
});

export const moodEntrySchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  date: isoString,
  lowMood: z.number(),
  anxiety: z.number(),
  stress: z.number(),
  emotionalInstability: z.number(),
  sleepProblems: z.number(),
  fatigue: z.number(),
  note: z.string(),
});

export const symptomEntrySchema = z.object({
  id: z.string().min(1),
  userId: z.string().min(1),
  date: isoString,
  type: z.enum(SYMPTOM_TYPE),
  severity: z.number(),
  note: z.string(),
});

export const doctorSchema = z.object({
  id: z.string().min(1),
  fullName: z.string(),
  specialty: z.string(),
  inviteCode: z.string().min(1),
  organization: z.string().optional(),
});

export const carePlanSchema = z.object({
  targetSystolicBp: z.number().optional(),
  targetDiastolicBp: z.number().optional(),
  targetWeightKg: z.number().optional(),
  alertSystolicBp: z.number().optional(),
  alertDiastolicBp: z.number().optional(),
  note: z.string().optional(),
  updatedByDoctorId: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const clinicalNoteSchema = z.object({
  id: z.string().min(1),
  doctorId: z.string().min(1),
  date: isoString,
  text: z.string(),
});

export const messageSchema = z.object({
  id: z.string().min(1),
  fromRole: z.enum(USER_ROLE),
  date: isoString,
  text: z.string(),
  isRead: z.boolean(),
});

export const patientRecordSchema = z.object({
  profile: userProfileSchema,
  measurements: z.array(healthMeasurementSchema),
  medications: z.array(medicationSchema),
  medicationLogs: z.array(medicationLogSchema),
  moodEntries: z.array(moodEntrySchema),
  alerts: z.array(alertSchema),
  symptoms: z.array(symptomEntrySchema),
  carePlan: carePlanSchema,
  notes: z.array(clinicalNoteSchema),
  messages: z.array(messageSchema),
});

export const themePreferencesSchema = z.object({
  density: z.enum(DENSITY),
  radius: z.enum(RADIUS),
  appearance: z.enum(APPEARANCE),
});

/**
 * Top-level persisted snapshot (multi-user). `version` is validated structurally
 * here; the exact-version match (migration boundary) stays in the repository.
 */
export const persistedStateSchema = z.object({
  version: z.number(),
  role: z.enum(USER_ROLE),
  doctors: z.array(doctorSchema),
  records: z.record(patientRecordSchema),
  activePatientId: z.string().min(1),
  currentDoctorId: z.string().min(1),
  demoPatientId: z.string().min(1),
  demoDoctorId: z.string().min(1),
  riskModel: z.enum(RISK_MODEL),
  language: z.enum(LANGUAGE),
  themePreferences: themePreferencesSchema,
  remindersEnabled: z.boolean().optional(),
});
