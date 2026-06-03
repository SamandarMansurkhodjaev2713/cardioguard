/**
 * Recommendation engine — pure function mapping a patient snapshot to the set of
 * applicable preventive recommendations. Trigger thresholds are ported from the
 * Kotlin `MainViewModel.updateRiskAndRecommendations`. Each recommendation is
 * returned as an id + interpolation params; the localized copy lives in i18n
 * (concise, design-aligned wording), so this layer carries no UI text.
 */

import { classifyBmi } from './calculators';
import { ADHERENCE, BMI, BP_ELEVATED } from './constants';
import type {
  HealthMeasurement,
  Recommendation,
  RiskCategory,
  UserProfile,
} from './types';

export interface RecommendationContext {
  readonly profile: UserProfile;
  readonly latest: HealthMeasurement;
  readonly adherencePercent: number;
  readonly riskPercent: number;
  readonly riskCategory: RiskCategory;
}

/**
 * Returns recommendations ordered by clinical priority. Pure and deterministic:
 * identical context → identical output (no dates, ids or randomness here).
 */
export function generateRecommendations(ctx: RecommendationContext): Recommendation[] {
  const { profile, latest, adherencePercent, riskPercent, riskCategory } = ctx;
  const recs: Recommendation[] = [];

  // 1 — Blood pressure
  if (latest.systolicBp >= BP_ELEVATED.SYSTOLIC || latest.diastolicBp >= BP_ELEVATED.DIASTOLIC) {
    recs.push({
      id: 'bpHigh',
      category: 'bloodPressure',
      priority: 'high',
      params: { systolic: latest.systolicBp, diastolic: latest.diastolicBp },
    });
  }

  // 2 — Weight / BMI
  if (latest.bmi >= BMI.OVERWEIGHT_MAX) {
    recs.push({
      id: 'weightObese',
      category: 'weight',
      priority: 'high',
      params: { bmi: latest.bmi, waist: latest.waistCircumferenceCm },
    });
  } else if (latest.bmi >= BMI.NORMAL_MAX) {
    recs.push({
      id: 'weightOverweight',
      category: 'weight',
      priority: 'medium',
      params: { bmi: latest.bmi },
    });
  }

  // 3 — Smoking
  if (profile.smokingStatus === 'current') {
    recs.push({ id: 'smoking', category: 'smoking', priority: 'high', params: {} });
  }

  // 4 — Shift / night work
  if (profile.workScheduleType === 'shift' || profile.workScheduleType === 'night') {
    recs.push({ id: 'shiftWork', category: 'shiftWork', priority: 'medium', params: {} });
  }

  // 5 — Stress
  if (profile.stressLevel === 'high' || latest.stressLevel === 'high') {
    recs.push({ id: 'stress', category: 'stress', priority: 'medium', params: {} });
  }

  // 6 — Medication adherence
  if (adherencePercent < ADHERENCE.GOOD_MIN_PERCENT) {
    recs.push({
      id: 'adherence',
      category: 'adherence',
      priority: 'high',
      params: { percent: adherencePercent },
    });
  }

  // 7 — Diabetes
  if (profile.diabetesStatus === 'yes') {
    recs.push({ id: 'diabetes', category: 'diabetes', priority: 'high', params: {} });
  }

  // 8 — Physical activity
  if (profile.physicalActivityLevel === 'low' || latest.physicalActivityMinutes < 20) {
    recs.push({ id: 'physicalActivity', category: 'physicalActivity', priority: 'medium', params: {} });
  }

  // 9 — Integral CVD risk (high or very-high category)
  if (riskCategory === 'high' || riskCategory === 'veryHigh') {
    recs.push({
      id: 'highRiskCvd',
      category: 'overallRisk',
      priority: 'high',
      params: { category: riskCategory, percent: riskPercent },
    });
  }

  // 10 — Sleep hygiene
  if (profile.sleepQuality !== 'good' || latest.sleepHours < 6.5) {
    recs.push({
      id: 'sleepHygiene',
      category: 'sleep',
      priority: 'medium',
      params: { hours: latest.sleepHours },
    });
  }

  return recs;
}
