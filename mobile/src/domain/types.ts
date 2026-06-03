/**
 * Domain models for CardioGuard.
 *
 * Design rule: data stores *canonical codes* (e.g. `'current'`), never localized
 * strings. Human-readable labels are resolved at the presentation layer through
 * i18n. This keeps the domain language-agnostic and lets us ship ru + uz without
 * touching business logic. (Ported from the Kotlin `data/Models.kt`, which stored
 * Russian strings directly — that coupling is intentionally removed here.)
 */

// ────────────────────────────────────────────────────────────────────────────
// Canonical enums (string-literal unions → exhaustive `switch` checks)
// ────────────────────────────────────────────────────────────────────────────

export type Sex = 'male' | 'female';

export type SmokingStatus = 'never' | 'former' | 'current';

/** Tri-state clinical flag (diabetes, hypertension, family history). */
export type Ternary = 'yes' | 'no' | 'unknown';

export type WorkSchedule = 'regular' | 'shift' | 'night';

export type RiskGroup = 'civilian' | 'lawEnforcement' | 'military' | 'other';

export type ActivityLevel = 'low' | 'medium' | 'high';

export type SleepQuality = 'good' | 'disturbed' | 'insufficient';

export type StressLevel = 'low' | 'medium' | 'high';

export type MedicationIntakeStatus = 'taken' | 'missed' | 'skipped';

export type AlertSeverity = 'info' | 'warn' | 'high';

export type AlertType =
  | 'bloodPressure'
  | 'repeatedBloodPressure'
  | 'rapidWeight'
  | 'bmiWorsening'
  | 'lowAdherence'
  | 'medicationAdherence'
  | 'highCvdRisk'
  | 'noMeasurements'
  | 'psychDistress';

export type RiskModel = 'score2' | 'framingham';

/** ESC SCORE2 calibration region (country/area CVD-risk level). */
export type RiskRegion = 'low' | 'moderate' | 'high' | 'veryHigh';

/** Assumptions the risk calculator made when inputs were missing/out of range. */
export type RiskAssumptionKey = 'defaultCholesterol' | 'ageBelowRange' | 'ageAboveRange';

export type RiskCategory = 'low' | 'moderate' | 'high' | 'veryHigh';

export type BmiCategory = 'underweight' | 'normal' | 'overweight' | 'obese';

export type BloodPressureCategory =
  | 'optimal'
  | 'normal'
  | 'highNormal'
  | 'hypertension1'
  | 'hypertension2'
  | 'hypertension3';

export type AdherenceBand = 'good' | 'moderate' | 'low';

export type RecommendationPriority = 'high' | 'medium' | 'low';

export type RecommendationCategory =
  | 'bloodPressure'
  | 'nutrition'
  | 'weight'
  | 'physicalActivity'
  | 'sleep'
  | 'stress'
  | 'adherence'
  | 'smoking'
  | 'diabetes'
  | 'shiftWork'
  | 'overallRisk';

export type UserRole = 'patient' | 'doctor';

// ────────────────────────────────────────────────────────────────────────────
// Entities
// ────────────────────────────────────────────────────────────────────────────

/**
 * Clinical and socio-occupational profile of the monitored individual.
 * `anonymizedId` is the only identifier exposed in the researcher cohort view
 * (PII — full name — is never shown there).
 */
export interface UserProfile {
  readonly id: string;
  readonly anonymizedId: string;
  readonly fullName: string;
  readonly age: number;
  readonly sex: Sex;
  readonly heightCm: number;
  readonly weightKg: number;
  readonly waistCircumferenceCm: number;
  readonly smokingStatus: SmokingStatus;
  readonly diabetesStatus: Ternary;
  readonly hypertensionStatus: Ternary;
  readonly onHypertensiveMedication: boolean;
  readonly familyHistoryCvd: Ternary;
  readonly workScheduleType: WorkSchedule;
  readonly professionalRiskGroup: RiskGroup;
  readonly physicalActivityLevel: ActivityLevel;
  readonly sleepQuality: SleepQuality;
  readonly stressLevel: StressLevel;
  /** Lab values for risk scoring; when absent, population defaults are assumed. */
  readonly totalCholMmol?: number;
  readonly hdlCholMmol?: number;
  /** ESC SCORE2 calibration region; defaults to the very-high-risk region. */
  readonly riskRegion?: RiskRegion;
  /** Personal targets for progress tracking (optional; sensible defaults shown). */
  readonly targetSystolicBp?: number;
  readonly targetWeightKg?: number;
  // ── Extended medical card (TZ Module 1) — all optional & additive, so profiles
  //    persisted before these shipped still validate and load. ───────────────
  /** Dyslipidemia (lipid disorder) flag — distinct from measured cholesterol. */
  readonly dyslipidemiaStatus?: Ternary;
  /** Other chronic conditions, as free-form clinical labels. */
  readonly chronicConditions?: readonly string[];
  /** Known allergies (drug/food/other), as free-form labels. */
  readonly allergies?: readonly string[];
  /** Free-text note on current medications (the structured schedule lives in {@link Medication}). */
  readonly medicationNotes?: string;
  /** Unit / subdivision (law-enforcement & collective-analytics context). */
  readonly unit?: string;
  /** Years of service (for personnel; affects no calculation, shown on the card). */
  readonly serviceYears?: number;
  /** ISO-8601 timestamps (serializable; survive AsyncStorage round-trips). */
  readonly createdAt: string;
  readonly updatedAt: string;
}

/** A single self-monitoring snapshot (BP, HR, weight, BMI, lifestyle). */
export interface HealthMeasurement {
  readonly id: string;
  readonly userId: string;
  readonly date: string; // ISO-8601
  readonly systolicBp: number;
  readonly diastolicBp: number;
  readonly heartRate: number;
  readonly weightKg: number;
  readonly bmi: number;
  readonly waistCircumferenceCm: number;
  readonly sleepHours: number;
  readonly stressLevel: StressLevel;
  readonly physicalActivityMinutes: number;
  /** Optional extended metrics (recorded when available). */
  readonly glucoseMmol?: number;
  readonly spo2Percent?: number;
  readonly steps?: number;
  readonly notes: string;
}

/** A prescribed cardiometabolic medication schedule. */
export interface Medication {
  readonly id: string;
  readonly userId: string;
  readonly name: string;
  readonly dosage: string;
  readonly frequencyPerDay: number;
  readonly intakeTimes: readonly string[]; // 'HH:mm'
  readonly startDate: string; // ISO-8601
  readonly endDate: string | null;
  readonly instructions: string;
  readonly isActive: boolean;
}

/** A single dose intake record. */
export interface MedicationLog {
  readonly id: string;
  readonly medicationId: string;
  readonly userId: string;
  readonly scheduledTime: string; // 'HH:mm'
  readonly actualTime: string | null; // ISO-8601
  readonly status: MedicationIntakeStatus;
  readonly note: string;
}

/** Computed 10-year CVD risk estimate (prototype models — see calculators). */
export interface RiskAssessment {
  readonly id: string;
  readonly userId: string;
  readonly date: string; // ISO-8601
  readonly model: RiskModel;
  readonly estimatedRiskPercent: number;
  readonly category: RiskCategory;
  /** i18n keys describing the contributing factors (resolved in the UI). */
  readonly factorKeys: readonly RiskFactorKey[];
}

export type RiskFactorKey =
  | 'elevatedBp'
  | 'smoking'
  | 'obesity'
  | 'overweight'
  | 'diabetes'
  | 'familyHistory'
  | 'shiftWork'
  | 'abdominalFat';

/** A personalized, evidence-based preventive recommendation. */
export interface Recommendation {
  readonly id: RecommendationId;
  readonly category: RecommendationCategory;
  readonly priority: RecommendationPriority;
  /** Interpolation values merged into the localized template (e.g. BP numbers). */
  readonly params: Readonly<Record<string, string | number>>;
}

export type RecommendationId =
  | 'bpHigh'
  | 'weightObese'
  | 'weightOverweight'
  | 'smoking'
  | 'shiftWork'
  | 'stress'
  | 'adherence'
  | 'diabetes'
  | 'physicalActivity'
  | 'highRiskCvd'
  | 'sleepHygiene';

/** An early-warning signal raised by the alert engine. */
export interface Alert {
  readonly id: string;
  readonly userId: string;
  readonly date: string; // ISO-8601
  readonly type: AlertType;
  readonly severity: AlertSeverity;
  /** Interpolation values merged into the localized title/message templates. */
  readonly params: Readonly<Record<string, string | number>>;
  readonly isRead: boolean;
}

/** A knowledge-base article (content localized via i18n keys). */
export interface EducationArticle {
  readonly id: string;
  readonly category: string; // i18n key
  readonly readingTimeMinutes: number;
}

// ────────────────────────────────────────────────────────────────────────────
// Psychological & emotional monitoring (TZ Module 5)
// ────────────────────────────────────────────────────────────────────────────

/**
 * The six weekly self-report dimensions. Every item is scored as the *severity
 * of a negative* (0 = none … 4 = severe) so they aggregate consistently into a
 * single wellbeing score — including emotional (in)stability and sleep problems.
 */
export type MoodDimension =
  | 'lowMood'
  | 'anxiety'
  | 'stress'
  | 'emotionalInstability'
  | 'sleepProblems'
  | 'fatigue';

/** Classified psycho-emotional state (TZ Module 5 outcomes). */
export type MoodState = 'normal' | 'elevatedAnxiety' | 'chronicStress' | 'burnout';

/** A single weekly wellbeing check-in. Each dimension is an integer 0–4. */
export interface MoodEntry {
  readonly id: string;
  readonly userId: string;
  readonly date: string; // ISO-8601
  readonly lowMood: number;
  readonly anxiety: number;
  readonly stress: number;
  readonly emotionalInstability: number;
  readonly sleepProblems: number;
  readonly fatigue: number;
  readonly note: string;
}
