/**
 * Pure clinical calculators (no I/O, no time, no randomness — fully testable).
 *
 * BMI / blood-pressure / adherence are ported from the Kotlin original with two
 * documented clinical corrections (BMI gap-closing; BP takes the worse axis).
 * The CVD-risk functions implement the published, validated models:
 *   • SCORE2 — ESC 2021 Cox model, region-calibrated (very-high by default).
 *   • Framingham — 2008 General CVD (D'Agostino) Cox model.
 *
 * ⚠️ Prototype: when labs are missing, population-typical cholesterol is assumed
 * and surfaced to the user; SCORE2 is clamped to its validated 40–69 age range.
 */

import {
  ADHERENCE,
  BMI,
  BP_DIASTOLIC,
  BP_ELEVATED,
  BP_SYSTOLIC,
  CHOL_MMOL_TO_MGDL,
  DEFAULT_RISK_REGION,
  FRAMINGHAM,
  FRAMINGHAM_CATEGORY,
  LAB_DEFAULTS,
  ROUND_ONE_DECIMAL,
  SCORE2,
  SCORE2_CATEGORY,
} from './constants';
import type {
  AdherenceBand,
  BloodPressureCategory,
  BmiCategory,
  MedicationLog,
  RiskCategory,
  RiskModel,
  UserProfile,
} from './types';

/** Rounds to one decimal place (half-up), matching the Kotlin prototype. */
export function roundOneDecimal(value: number): number {
  return Math.round(value * ROUND_ONE_DECIMAL) / ROUND_ONE_DECIMAL;
}

// ── BMI ──────────────────────────────────────────────────────────────────────

/** Body Mass Index = weight(kg) / height(m)². Returns 0 for invalid height. */
export function calculateBmi(weightKg: number, heightCm: number): number {
  if (heightCm <= 0) return 0;
  const heightM = heightCm / 100;
  return roundOneDecimal(weightKg / (heightM * heightM));
}

/** WHO BMI category. Boundaries are half-open to avoid classification gaps. */
export function classifyBmi(bmi: number): BmiCategory {
  if (bmi < BMI.UNDERWEIGHT_MAX) return 'underweight';
  if (bmi < BMI.NORMAL_MAX) return 'normal';
  if (bmi < BMI.OVERWEIGHT_MAX) return 'overweight';
  return 'obese';
}

// ── Blood pressure ───────────────────────────────────────────────────────────

const BP_CATEGORIES: readonly BloodPressureCategory[] = [
  'optimal',
  'normal',
  'highNormal',
  'hypertension1',
  'hypertension2',
  'hypertension3',
];

function systolicCategoryIndex(systolic: number): number {
  if (systolic >= BP_SYSTOLIC.HTN_3) return 5;
  if (systolic >= BP_SYSTOLIC.HTN_2) return 4;
  if (systolic >= BP_SYSTOLIC.HTN_1) return 3;
  if (systolic >= BP_SYSTOLIC.HIGH_NORMAL) return 2;
  if (systolic >= BP_SYSTOLIC.NORMAL) return 1;
  return 0;
}

function diastolicCategoryIndex(diastolic: number): number {
  if (diastolic >= BP_DIASTOLIC.HTN_3) return 5;
  if (diastolic >= BP_DIASTOLIC.HTN_2) return 4;
  if (diastolic >= BP_DIASTOLIC.HTN_1) return 3;
  if (diastolic >= BP_DIASTOLIC.HIGH_NORMAL) return 2;
  if (diastolic >= BP_DIASTOLIC.NORMAL) return 1;
  return 0;
}

/**
 * ESC/ESH/RCC blood-pressure category. When the systolic and diastolic axes
 * disagree, the higher (worse) category wins — a person at 125/95 is grade-1
 * hypertension, not "normal".
 */
export function classifyBloodPressure(
  systolic: number,
  diastolic: number,
): BloodPressureCategory {
  const index = Math.max(
    systolicCategoryIndex(systolic),
    diastolicCategoryIndex(diastolic),
  );
  return BP_CATEGORIES[index];
}

/** True when either axis is at/above the elevated (≥140/90) threshold. */
export function isElevatedBloodPressure(
  systolic: number,
  diastolic: number,
): boolean {
  return systolic >= BP_ELEVATED.SYSTOLIC || diastolic >= BP_ELEVATED.DIASTOLIC;
}

// ── Medication adherence ─────────────────────────────────────────────────────

/** Adherence % = taken doses / scheduled doses. Empty log ⇒ 100 %. */
export function calculateAdherencePercent(
  logs: readonly MedicationLog[],
): number {
  if (logs.length === 0) return ADHERENCE.EMPTY_DEFAULT_PERCENT;
  const taken = logs.filter((log) => log.status === 'taken').length;
  return roundOneDecimal((taken / logs.length) * 100);
}

/** UI band for an adherence percentage (see ADHERENCE display thresholds). */
export function adherenceBand(percent: number): AdherenceBand {
  if (percent >= ADHERENCE.DISPLAY_GOOD_MIN_PERCENT) return 'good';
  if (percent >= ADHERENCE.DISPLAY_MODERATE_MIN_PERCENT) return 'moderate';
  return 'low';
}

// ── CVD risk: SCORE2 prototype ───────────────────────────────────────────────

export interface RiskInputs {
  readonly systolicBp: number;
  readonly totalCholMmol: number;
  readonly hdlCholMmol: number;
}

// ── CVD risk: SCORE2 (ESC 2021) ──────────────────────────────────────────────

/**
 * SCORE2 10-year CVD risk (%) — validated ESC 2021 Cox model, region-calibrated.
 * Age is clamped to the model's validated 40–69 range (SCORE2-OP for ≥70 is not
 * implemented); the patient's risk region defaults to very-high (Uzbekistan /
 * Russia). Diabetes is included per the published implementation.
 */
export function score2RiskPercent(profile: UserProfile, inputs: RiskInputs): number {
  const c = profile.sex === 'male' ? SCORE2.men : SCORE2.women;
  const age = Math.min(Math.max(profile.age, SCORE2.VALID_AGE_MIN), SCORE2.VALID_AGE_MAX);
  const cage = (age - 60) / 5;
  const csbp = (inputs.systolicBp - 120) / 20;
  const ctchol = inputs.totalCholMmol - 6;
  const chdl = (inputs.hdlCholMmol - 1.3) / 0.5;
  const smoking = profile.smokingStatus === 'current' ? 1 : 0;
  const diabetes = profile.diabetesStatus === 'yes' ? 1 : 0;

  const lp =
    c.age * cage +
    c.smoking * smoking +
    c.sbp * csbp +
    c.diabetes * diabetes +
    c.tchol * ctchol +
    c.hdl * chdl +
    c.ageSmoking * cage * smoking +
    c.ageSbp * cage * csbp +
    c.ageDiabetes * cage * diabetes +
    c.ageTchol * cage * ctchol +
    c.ageHdl * cage * chdl;

  const uncalibrated = 1 - Math.pow(c.baseline, Math.exp(lp));
  const region = SCORE2.region[profile.riskRegion ?? DEFAULT_RISK_REGION];
  const scale = profile.sex === 'male' ? region.men : region.women;
  // Clamp away from 0/1 so the double-log stays finite.
  const u = Math.min(Math.max(uncalibrated, 1e-10), 1 - 1e-10);
  const calibrated = 1 - Math.exp(-Math.exp(scale.s1 + scale.s2 * Math.log(-Math.log(1 - u))));
  return roundOneDecimal(Math.min(Math.max(calibrated, 0), 1) * 100);
}

// ── CVD risk: Framingham 2008 General CVD ────────────────────────────────────

/** Framingham 2008 General CVD 10-year risk (%) — validated D'Agostino Cox model. */
export function framinghamRiskPercent(profile: UserProfile, inputs: RiskInputs): number {
  const c = profile.sex === 'male' ? FRAMINGHAM.men : FRAMINGHAM.women;
  const age = Math.max(profile.age, 30); // model defined from age 30
  const totalCholMgdl = Math.max(inputs.totalCholMmol * CHOL_MMOL_TO_MGDL, 1);
  const hdlMgdl = Math.max(inputs.hdlCholMmol * CHOL_MMOL_TO_MGDL, 1);
  const sbp = Math.max(inputs.systolicBp, 1);
  const smoking = profile.smokingStatus === 'current' ? 1 : 0;
  const diabetes = profile.diabetesStatus === 'yes' ? 1 : 0;

  const lp =
    c.lnAge * Math.log(age) +
    c.lnTotalChol * Math.log(totalCholMgdl) +
    c.lnHdl * Math.log(hdlMgdl) +
    (profile.onHypertensiveMedication ? c.lnSbpTreated : c.lnSbpUntreated) * Math.log(sbp) +
    c.smoking * smoking +
    c.diabetes * diabetes;

  const risk = 1 - Math.pow(c.baseline, Math.exp(lp - c.meanLp));
  return roundOneDecimal(Math.min(Math.max(risk, 0), 1) * 100);
}

/** Dispatches to the selected model. */
export function riskPercentFor(
  model: RiskModel,
  profile: UserProfile,
  inputs: RiskInputs = {
    systolicBp: 0,
    totalCholMmol: LAB_DEFAULTS.TOTAL_CHOL_MMOL,
    hdlCholMmol: LAB_DEFAULTS.HDL_MMOL,
  },
): number {
  return model === 'score2'
    ? score2RiskPercent(profile, inputs)
    : framinghamRiskPercent(profile, inputs);
}

/**
 * Risk category. SCORE2 follows ESC 2021 age-specific thresholds; Framingham
 * uses its conventional 10 %/20 % bands. Returns low/high/veryHigh (the
 * 'moderate' value is reserved and not produced by these models).
 */
export function classifyRiskCategory(riskPercent: number, model: RiskModel, age: number): RiskCategory {
  if (model === 'framingham') {
    if (riskPercent < FRAMINGHAM_CATEGORY.high) return 'low';
    if (riskPercent < FRAMINGHAM_CATEGORY.veryHigh) return 'high';
    return 'veryHigh';
  }
  const band = age < 50 ? SCORE2_CATEGORY.UNDER_50 : age < 70 ? SCORE2_CATEGORY.A50_69 : SCORE2_CATEGORY.A70_PLUS;
  if (riskPercent < band.high) return 'low';
  if (riskPercent < band.veryHigh) return 'high';
  return 'veryHigh';
}
