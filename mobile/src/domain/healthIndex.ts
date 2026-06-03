/**
 * Composite Health Index (TZ Module 11) — a single transparent 0–100 score
 * summarising overall cardiometabolic + lifestyle status. Pure: each component
 * maps one metric to a 0–100 sub-score (100 = ideal) via explainable rules, and
 * the overall is their weighted mean over the components that have data. The
 * sub-scores are returned too, so the UI can show exactly what drives the index.
 */

import { BMI, HEALTH_INDEX } from './constants';
import type { HealthMeasurement, RiskCategory } from './types';

export type HealthIndexComponentKey =
  | 'bloodPressure'
  | 'cvdRisk'
  | 'bmi'
  | 'adherence'
  | 'activity'
  | 'sleep'
  | 'wellbeing';

export interface HealthIndexComponent {
  readonly key: HealthIndexComponentKey;
  /** 0–100 (100 = ideal). */
  readonly score: number;
  /** Renormalised weight actually applied to the overall. */
  readonly weight: number;
}

export type HealthIndexBand = 'good' | 'moderate' | 'low';

export interface HealthIndex {
  readonly overall: number;
  readonly band: HealthIndexBand;
  readonly components: readonly HealthIndexComponent[];
}

export interface HealthIndexInput {
  readonly latest: HealthMeasurement;
  readonly adherencePercent: number;
  readonly riskCategory: RiskCategory;
  /** Latest wellbeing score 0–100 (Module 5); omitted when no check-in exists. */
  readonly wellbeing?: number;
}

const clamp100 = (n: number): number => Math.max(0, Math.min(100, n));

function bloodPressureScore(systolic: number, diastolic: number): number {
  const { OPTIMAL_SYSTOLIC, OPTIMAL_DIASTOLIC, SYS_PENALTY_PER_MMHG, DIA_PENALTY_PER_MMHG } = HEALTH_INDEX.BP;
  const penalty =
    Math.max(0, systolic - OPTIMAL_SYSTOLIC) * SYS_PENALTY_PER_MMHG +
    Math.max(0, diastolic - OPTIMAL_DIASTOLIC) * DIA_PENALTY_PER_MMHG;
  return clamp100(100 - penalty);
}

function bmiScore(bmi: number): number {
  const deviation =
    bmi < BMI.UNDERWEIGHT_MAX ? BMI.UNDERWEIGHT_MAX - bmi
    : bmi > BMI.NORMAL_MAX ? bmi - BMI.NORMAL_MAX
    : 0;
  return clamp100(100 - deviation * HEALTH_INDEX.BMI_PENALTY_PER_UNIT);
}

function activityScore(minutesPerDay: number): number {
  return clamp100((minutesPerDay / HEALTH_INDEX.ACTIVITY_TARGET_MIN) * 100);
}

function sleepScore(hours: number): number {
  const { IDEAL_MIN_H, IDEAL_MAX_H, PENALTY_PER_HOUR } = HEALTH_INDEX.SLEEP;
  const deviation = hours < IDEAL_MIN_H ? IDEAL_MIN_H - hours : hours > IDEAL_MAX_H ? hours - IDEAL_MAX_H : 0;
  return clamp100(100 - deviation * PENALTY_PER_HOUR);
}

export function healthIndexBand(overall: number): HealthIndexBand {
  if (overall >= HEALTH_INDEX.GOOD_MIN) return 'good';
  if (overall >= HEALTH_INDEX.MODERATE_MIN) return 'moderate';
  return 'low';
}

/** Compute the composite index + its component breakdown. */
export function computeHealthIndex(input: HealthIndexInput): HealthIndex {
  const { latest, adherencePercent, riskCategory, wellbeing } = input;
  const w = HEALTH_INDEX.WEIGHTS;

  const raw: Array<{ key: HealthIndexComponentKey; score: number; weight: number }> = [
    { key: 'bloodPressure', score: bloodPressureScore(latest.systolicBp, latest.diastolicBp), weight: w.bloodPressure },
    { key: 'cvdRisk', score: HEALTH_INDEX.RISK_SCORE[riskCategory], weight: w.cvdRisk },
    { key: 'bmi', score: bmiScore(latest.bmi), weight: w.bmi },
    { key: 'adherence', score: clamp100(adherencePercent), weight: w.adherence },
    { key: 'activity', score: activityScore(latest.physicalActivityMinutes), weight: w.activity },
    { key: 'sleep', score: sleepScore(latest.sleepHours), weight: w.sleep },
  ];
  if (wellbeing != null) raw.push({ key: 'wellbeing', score: clamp100(wellbeing), weight: w.wellbeing });

  // Renormalise so weights sum to 1 across the present components.
  const totalWeight = raw.reduce((s, c) => s + c.weight, 0);
  const components: HealthIndexComponent[] = raw.map((c) => ({
    key: c.key,
    score: Math.round(c.score),
    weight: c.weight / totalWeight,
  }));
  const overall = Math.round(components.reduce((s, c) => s + c.score * c.weight, 0));

  return { overall, band: healthIndexBand(overall), components };
}
