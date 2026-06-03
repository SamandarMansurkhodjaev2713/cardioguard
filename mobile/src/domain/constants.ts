/**
 * Centralized clinical thresholds and scoring tables.
 *
 * Every number the calculators and engines branch on lives here as a named
 * constant — no magic values in logic. CVD-risk models implement the published,
 * validated SCORE2 (ESC 2021) and Framingham (2008) equations; other thresholds
 * follow WHO / ESC guidelines.
 *
 * ⚠️ Still a prototype: when labs (cholesterol) are missing, population-typical
 * defaults are assumed and surfaced to the user; verify clinically before use.
 */

// ── BMI (WHO categories) ─────────────────────────────────────────────────────
export const BMI = {
  UNDERWEIGHT_MAX: 18.5,
  NORMAL_MAX: 25.0,
  OVERWEIGHT_MAX: 30.0,
  /** Abdominal-obesity waist thresholds (cm) for metabolic-syndrome flags. */
  WAIST_RISK_MALE_CM: 94.0,
  WAIST_RISK_FEMALE_CM: 80.0,
} as const;

// ── Blood pressure (ESC/ESH/RCC) — lower bound of each category by axis ───────
// Category index grows with severity; the final category is the *higher* of the
// systolic- and diastolic-derived categories (clinical correction vs. the Kotlin
// original, which returned the lower category when the two axes disagreed).
export const BP_SYSTOLIC = {
  NORMAL: 120,
  HIGH_NORMAL: 130,
  HTN_1: 140,
  HTN_2: 160,
  HTN_3: 180,
} as const;

export const BP_DIASTOLIC = {
  NORMAL: 80,
  HIGH_NORMAL: 85,
  HTN_1: 90,
  HTN_2: 100,
  HTN_3: 110,
} as const;

/** A reading at/above either of these is "elevated" for triggers & factors. */
export const BP_ELEVATED = { SYSTOLIC: 140, DIASTOLIC: 90 } as const;

// ── Medication adherence ─────────────────────────────────────────────────────
export const ADHERENCE = {
  /** Empty log → assume perfect adherence (nothing missed yet). */
  EMPTY_DEFAULT_PERCENT: 100,
  // Engine trigger thresholds (ported from Kotlin): a recommendation fires below
  // GOOD, a high-severity alert fires below LOW.
  GOOD_MIN_PERCENT: 80,
  LOW_MAX_PERCENT: 70,
  // Display banding (UI label) — distinct from triggers, aligned with the design
  // (86% is shown as "Средняя"/moderate, so the "good" band starts at 90).
  DISPLAY_GOOD_MIN_PERCENT: 90,
  DISPLAY_MODERATE_MIN_PERCENT: 70,
} as const;

// ── SCORE2 (ESC 2021) — validated Cox model, region-calibrated ────────────────
// Coefficients verified against the published model (RiskScorescvd CRAN package,
// implementing Hageman et al., Eur Heart J 2021;42:2439). Transforms:
//   cage=(age-60)/5, csbp=(sbp-120)/20, ctchol=tchol-6 (mmol/L), chdl=(hdl-1.3)/0.5
// LP = Σ coef·term; uncalibrated = 1 − S0^exp(LP);
// calibrated = 1 − exp(−exp(scale1 + scale2·ln(−ln(1 − uncalibrated)))).
export const SCORE2 = {
  VALID_AGE_MIN: 40,
  VALID_AGE_MAX: 69,
  men: {
    age: 0.3742, smoking: 0.6012, sbp: 0.2777, diabetes: 0.6457, tchol: 0.1458, hdl: -0.2698,
    ageSmoking: -0.0755, ageSbp: -0.0255, ageDiabetes: -0.0983, ageTchol: -0.0281, ageHdl: 0.0426,
    baseline: 0.9605,
  },
  women: {
    age: 0.4648, smoking: 0.7744, sbp: 0.3131, diabetes: 0.8096, tchol: 0.1002, hdl: -0.2606,
    ageSmoking: -0.1088, ageSbp: -0.0277, ageDiabetes: -0.1272, ageTchol: -0.0226, ageHdl: 0.0613,
    baseline: 0.9776,
  },
  region: {
    low: { men: { s1: -0.5699, s2: 0.7476 }, women: { s1: -0.7380, s2: 0.7019 } },
    moderate: { men: { s1: -0.1565, s2: 0.8009 }, women: { s1: -0.3143, s2: 0.7701 } },
    high: { men: { s1: 0.3207, s2: 0.9360 }, women: { s1: 0.5710, s2: 0.9369 } },
    veryHigh: { men: { s1: 0.5836, s2: 0.8294 }, women: { s1: 0.9412, s2: 0.8329 } },
  },
} as const;

// ── Framingham 2008 General CVD (D'Agostino) — validated Cox model ────────────
// ln-transformed inputs; cholesterol in mg/dL. risk = 1 − S0^exp(LP − meanLP).
export const FRAMINGHAM = {
  men: {
    lnAge: 3.06117, lnTotalChol: 1.1237, lnHdl: -0.93263,
    lnSbpTreated: 1.99881, lnSbpUntreated: 1.93303, smoking: 0.65451, diabetes: 0.57367,
    baseline: 0.88936, meanLp: 23.9802,
  },
  women: {
    lnAge: 2.32888, lnTotalChol: 1.20904, lnHdl: -0.70833,
    lnSbpTreated: 2.82263, lnSbpUntreated: 2.76157, smoking: 0.52873, diabetes: 0.69154,
    baseline: 0.95012, meanLp: 26.1931,
  },
} as const;

/** mmol/L → mg/dL for cholesterol (Framingham uses mg/dL). */
export const CHOL_MMOL_TO_MGDL = 38.67;

// ── Risk categorisation (%) ───────────────────────────────────────────────────
// SCORE2 → ESC 2021 age-specific thresholds; Framingham → conventional bands.
export const SCORE2_CATEGORY = {
  UNDER_50: { high: 2.5, veryHigh: 7.5 },
  A50_69: { high: 5, veryHigh: 10 },
  A70_PLUS: { high: 7.5, veryHigh: 15 },
} as const;
export const FRAMINGHAM_CATEGORY = { high: 10, veryHigh: 20 } as const;

/** Default labs when the patient hasn't entered them (population-typical). */
export const LAB_DEFAULTS = { TOTAL_CHOL_MMOL: 5.2, HDL_MMOL: 1.3 } as const;

/** Uzbekistan / Russia are very-high CVD-risk regions per ESC calibration. */
export const DEFAULT_RISK_REGION = 'veryHigh' as const;

// ── Early-warning triggers ───────────────────────────────────────────────────
export const ALERT_RULES = {
  REPEATED_BP_WINDOW_DAYS: 7,
  REPEATED_BP_MIN_COUNT: 2,
  RAPID_WEIGHT_GAIN_KG: 2.0,
  MISSED_DOSES_MIN_COUNT: 2,
  NO_MEASUREMENT_MAX_DAYS: 7,
  /** Suppress a duplicate acute-BP alert raised within this window (ms). */
  BP_DEDUP_WINDOW_MS: 5 * 60 * 1000,
  HIGH_RISK_CATEGORIES: ['high', 'veryHigh'] as const,
} as const;

// ── Psychological & emotional monitoring (TZ Module 5) ───────────────────────
// Each of the six dimensions is a 0–4 severity of a negative (0 = none …
// 4 = severe). Classification thresholds are deliberately conservative — this
// is a wellbeing screen, not a diagnostic instrument.
export const MOOD = {
  ITEM_MIN: 0,
  ITEM_MAX: 4,
  DIMENSIONS: 6,
  /** Item ≥ this is "notable" and drives a state classification. */
  SEVERE: 3,
  /** Item ≥ this is "elevated" (a contributing, not deciding, factor). */
  ELEVATED: 2,
  /** Cadence: a new check-in is due this many days after the last one. */
  SURVEY_INTERVAL_DAYS: 7,
  /** Wellbeing-score band thresholds (higher score = better wellbeing). */
  GOOD_MIN_SCORE: 75,
  MODERATE_MIN_SCORE: 50,
} as const;

// ── Intelligent analytics & prediction (TZ Module 6) ─────────────────────────
// On-device, deterministic trend analysis + risk projection. No ML service —
// least-squares regression over the user's own history, EWMA for the current
// smoothed level, and explainable thresholds (reusing the clinical constants
// above where possible). A trend is "flat" when its projected weekly change is
// below the per-metric epsilon.
export const INSIGHTS = {
  /** Minimum readings before a trend/projection is computed. */
  MIN_POINTS: 2,
  /** Forward projection horizon. */
  HORIZON_DAYS: 28,
  DAYS_PER_WEEK: 7,
  /** EWMA smoothing factor for the "current level" (0–1; higher = more reactive). */
  EWMA_ALPHA: 0.5,
  /** Per-week absolute change below which a metric reads as flat. */
  FLAT_EPS_PER_WEEK: {
    systolicBp: 1.0,
    weightKg: 0.2,
    bmi: 0.1,
    heartRate: 1.0,
    glucoseMmol: 0.05,
    wellbeing: 1.5,
  },
  /** Impaired-fasting-glucose threshold (mmol/L) for the diabetes projection. */
  GLUCOSE_IMPAIRED_FASTING_MMOL: 6.1,
  /** BMI at/above which obesity risk is "watched" (below the obese cutoff). */
  OBESITY_WATCH_BMI: 27.0,
} as const;

// ── Health index (TZ Module 11) ──────────────────────────────────────────────
// A transparent 0–100 composite. Each component maps a metric to a 0–100
// sub-score (100 = ideal); the overall is their weighted mean over the
// components that have data (weights are renormalised when wellbeing is absent).
export const HEALTH_INDEX = {
  WEIGHTS: {
    bloodPressure: 0.22,
    cvdRisk: 0.2,
    bmi: 0.15,
    adherence: 0.15,
    activity: 0.1,
    sleep: 0.1,
    wellbeing: 0.08,
  },
  /** BP sub-score: penalty per mmHg above optimal (no penalty at/below). */
  BP: { OPTIMAL_SYSTOLIC: 120, OPTIMAL_DIASTOLIC: 80, SYS_PENALTY_PER_MMHG: 1.2, DIA_PENALTY_PER_MMHG: 1.5 },
  /** BMI sub-score: penalty per unit outside the WHO normal range. */
  BMI_PENALTY_PER_UNIT: 6,
  /** Activity sub-score: minutes/day that scores 100. */
  ACTIVITY_TARGET_MIN: 30,
  /** Sleep sub-score: ideal nightly range and penalty per hour outside it. */
  SLEEP: { IDEAL_MIN_H: 7, IDEAL_MAX_H: 9, PENALTY_PER_HOUR: 18 },
  /** CVD-risk sub-score by category. */
  RISK_SCORE: { low: 100, moderate: 70, high: 40, veryHigh: 15 },
  GOOD_MIN: 75,
  MODERATE_MIN: 50,
} as const;

// ── Rounding ─────────────────────────────────────────────────────────────────
export const ROUND_ONE_DECIMAL = 10;

// ── Time ─────────────────────────────────────────────────────────────────────
export const MS_PER_DAY = 24 * 60 * 60 * 1000;
