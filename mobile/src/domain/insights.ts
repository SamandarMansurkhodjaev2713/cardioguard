/**
 * Intelligent analytics & prediction (TZ Module 6) — an on-device, fully
 * deterministic engine. No ML service and no network: it reads the user's own
 * history and applies transparent statistics (least-squares regression for the
 * trend, EWMA for the current smoothed level) plus explainable clinical rules to
 * project the likelihood of hypertension, obesity, diabetes and CVD. Pure: every
 * output is reproducible from its inputs, which is what makes it defensible.
 */

import { BMI, BP_DIASTOLIC, BP_SYSTOLIC, ADHERENCE, INSIGHTS, MS_PER_DAY } from './constants';
import type { HealthMeasurement, MoodState, RiskCategory, UserProfile } from './types';

// ── Trends ────────────────────────────────────────────────────────────────────

export type TrendDirection = 'up' | 'down' | 'flat';

/** Metrics the trend engine tracks (keys into FLAT_EPS_PER_WEEK). */
export type InsightMetricKey = keyof typeof INSIGHTS.FLAT_EPS_PER_WEEK;

export interface MetricTrend {
  readonly direction: TrendDirection;
  /** Signed change per week. */
  readonly changePerWeek: number;
  /** EWMA-smoothed current level. */
  readonly current: number;
  /** Extrapolated level at +HORIZON_DAYS. */
  readonly projected: number;
  readonly points: number;
}

export interface TimePoint {
  readonly x: number; // days since the first reading
  readonly y: number;
}

/** Least-squares fit of y = slope·x + intercept. Slope 0 when fewer than 2 points. */
export function linearRegression(points: readonly TimePoint[]): { slope: number; intercept: number } {
  const n = points.length;
  if (n < INSIGHTS.MIN_POINTS) return { slope: 0, intercept: points[0]?.y ?? 0 };
  let sx = 0, sy = 0, sxy = 0, sxx = 0;
  for (const p of points) {
    sx += p.x; sy += p.y; sxy += p.x * p.y; sxx += p.x * p.x;
  }
  const denom = n * sxx - sx * sx;
  if (denom === 0) return { slope: 0, intercept: sy / n };
  const slope = (n * sxy - sx * sy) / denom;
  return { slope, intercept: (sy - slope * sx) / n };
}

/** Exponentially-weighted moving average (chronological order). */
export function ewma(values: readonly number[], alpha: number): number {
  if (values.length === 0) return 0;
  let acc = values[0];
  for (let i = 1; i < values.length; i += 1) acc = alpha * values[i] + (1 - alpha) * acc;
  return acc;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

/** Analyze a chronological time series into a {@link MetricTrend}. */
export function analyzeSeries(points: readonly TimePoint[], epsPerWeek: number): MetricTrend {
  const ys = points.map((p) => p.y);
  const current = round1(ewma(ys, INSIGHTS.EWMA_ALPHA));
  if (points.length < INSIGHTS.MIN_POINTS) {
    return { direction: 'flat', changePerWeek: 0, current, projected: current, points: points.length };
  }
  const { slope } = linearRegression(points);
  const changePerWeek = round1(slope * INSIGHTS.DAYS_PER_WEEK);
  // Don't extrapolate further forward than the history we've actually observed
  // (capped at the horizon). This keeps projections honest on short, noisy data
  // instead of fanning a few days into an alarming month-ahead figure.
  const observedSpanDays = points[points.length - 1].x - points[0].x;
  const horizonDays = Math.min(INSIGHTS.HORIZON_DAYS, Math.max(observedSpanDays, 0));
  const projected = round1(current + slope * horizonDays);
  const direction: TrendDirection =
    Math.abs(changePerWeek) < epsPerWeek ? 'flat' : changePerWeek > 0 ? 'up' : 'down';
  return { direction, changePerWeek, current, projected, points: points.length };
}

/** Build time points (x = days since earliest) for a metric, dropping gaps. */
function pointsFor(
  chronological: readonly HealthMeasurement[],
  pick: (m: HealthMeasurement) => number | null | undefined,
): TimePoint[] {
  if (chronological.length === 0) return [];
  const t0 = new Date(chronological[0].date).getTime();
  const out: TimePoint[] = [];
  for (const m of chronological) {
    const y = pick(m);
    if (y == null) continue;
    out.push({ x: (new Date(m.date).getTime() - t0) / MS_PER_DAY, y });
  }
  return out;
}

const PICKERS: Record<InsightMetricKey, (m: HealthMeasurement) => number | null | undefined> = {
  systolicBp: (m) => m.systolicBp,
  weightKg: (m) => m.weightKg,
  bmi: (m) => m.bmi,
  heartRate: (m) => m.heartRate,
  glucoseMmol: (m) => m.glucoseMmol,
  wellbeing: () => null, // wellbeing comes from mood entries, not measurements
};

/**
 * Trends for every measurement-backed metric that has enough data. `measurements`
 * are newest-first (store order); a metric is omitted when it lacks MIN_POINTS.
 */
export function buildMetricTrends(
  measurements: readonly HealthMeasurement[],
): Partial<Record<InsightMetricKey, MetricTrend>> {
  const chronological = [...measurements].reverse();
  const result: Partial<Record<InsightMetricKey, MetricTrend>> = {};
  for (const key of Object.keys(PICKERS) as InsightMetricKey[]) {
    if (key === 'wellbeing') continue;
    const points = pointsFor(chronological, PICKERS[key]);
    if (points.length < INSIGHTS.MIN_POINTS) continue;
    result[key] = analyzeSeries(points, INSIGHTS.FLAT_EPS_PER_WEEK[key]);
  }
  return result;
}

// ── Condition projections ──────────────────────────────────────────────────────

export type ConditionKey = 'hypertension' | 'obesity' | 'diabetes' | 'cvd';
export type ProjectionLikelihood = 'present' | 'high' | 'moderate' | 'low';

export interface ConditionProjection {
  readonly condition: ConditionKey;
  readonly likelihood: ProjectionLikelihood;
  /** i18n keys naming the contributing drivers (resolved in the UI). */
  readonly driverKeys: readonly string[];
}

export interface InsightInput {
  /** Newest-first, as held by the store. */
  readonly measurements: readonly HealthMeasurement[];
  readonly profile: UserProfile;
  readonly riskCategory: RiskCategory;
  readonly riskPercent: number;
  readonly adherencePercent: number;
  readonly latestMoodState?: MoodState;
}

function waistLimit(profile: UserProfile): number {
  return profile.sex === 'male' ? BMI.WAIST_RISK_MALE_CM : BMI.WAIST_RISK_FEMALE_CM;
}

function projectHypertension(
  latest: HealthMeasurement,
  profile: UserProfile,
  bpUp: boolean,
): ConditionProjection {
  const drivers: string[] = [];
  const elevated = latest.systolicBp >= BP_SYSTOLIC.HIGH_NORMAL;
  if (elevated) drivers.push('elevatedBp');
  if (bpUp) drivers.push('risingBp');
  if (profile.familyHistoryCvd === 'yes') drivers.push('familyHistory');

  let likelihood: ProjectionLikelihood;
  if (profile.hypertensionStatus === 'yes' || latest.systolicBp >= BP_SYSTOLIC.HTN_1 || latest.diastolicBp >= BP_DIASTOLIC.HTN_1) {
    likelihood = 'present';
  } else if (elevated && bpUp) likelihood = 'high';
  else if (elevated || bpUp) likelihood = 'moderate';
  else likelihood = 'low';
  return { condition: 'hypertension', likelihood, driverKeys: drivers };
}

function projectObesity(latest: HealthMeasurement, profile: UserProfile, weightUp: boolean): ConditionProjection {
  const drivers: string[] = [];
  if (latest.bmi >= BMI.NORMAL_MAX) drivers.push('overweight');
  if (weightUp) drivers.push('risingWeight');
  if (latest.waistCircumferenceCm > waistLimit(profile)) drivers.push('abdominalFat');

  let likelihood: ProjectionLikelihood;
  if (latest.bmi >= BMI.OVERWEIGHT_MAX) likelihood = 'present';
  else if (latest.bmi >= INSIGHTS.OBESITY_WATCH_BMI && weightUp) likelihood = 'high';
  else if (latest.bmi >= BMI.NORMAL_MAX || weightUp) likelihood = 'moderate';
  else likelihood = 'low';
  return { condition: 'obesity', likelihood, driverKeys: drivers };
}

function projectDiabetes(latest: HealthMeasurement, profile: UserProfile, glucoseUp: boolean): ConditionProjection {
  const drivers: string[] = [];
  const impaired = latest.glucoseMmol != null && latest.glucoseMmol >= INSIGHTS.GLUCOSE_IMPAIRED_FASTING_MMOL;
  const obese = latest.bmi >= BMI.OVERWEIGHT_MAX;
  const abdominal = latest.waistCircumferenceCm > waistLimit(profile);
  if (impaired) drivers.push('impairedGlucose');
  if (obese) drivers.push('obesity');
  if (abdominal) drivers.push('abdominalFat');
  if (glucoseUp) drivers.push('risingGlucose');

  let likelihood: ProjectionLikelihood;
  if (profile.diabetesStatus === 'yes') likelihood = 'present';
  else if (impaired || (obese && abdominal)) likelihood = 'high';
  else if (latest.bmi >= INSIGHTS.OBESITY_WATCH_BMI || abdominal || glucoseUp) likelihood = 'moderate';
  else likelihood = 'low';
  return { condition: 'diabetes', likelihood, driverKeys: drivers };
}

const CVD_LIKELIHOOD: Record<RiskCategory, ProjectionLikelihood> = {
  veryHigh: 'present',
  high: 'high',
  moderate: 'moderate',
  low: 'low',
};

function projectCvd(input: InsightInput, bpUp: boolean): ConditionProjection {
  const drivers: string[] = ['integralRisk'];
  if (bpUp) drivers.push('risingBp');
  if (input.adherencePercent < ADHERENCE.GOOD_MIN_PERCENT) drivers.push('lowAdherence');
  return { condition: 'cvd', likelihood: CVD_LIKELIHOOD[input.riskCategory], driverKeys: drivers };
}

/** Project the four target conditions. Empty when there is no measurement yet. */
export function projectConditions(input: InsightInput): ConditionProjection[] {
  const latest = input.measurements[0];
  if (!latest) return [];
  const trends = buildMetricTrends(input.measurements);
  const bpUp = trends.systolicBp?.direction === 'up';
  const weightUp = trends.weightKg?.direction === 'up' || trends.bmi?.direction === 'up';
  const glucoseUp = trends.glucoseMmol?.direction === 'up';
  return [
    projectHypertension(latest, input.profile, bpUp),
    projectObesity(latest, input.profile, weightUp),
    projectDiabetes(latest, input.profile, glucoseUp),
    projectCvd(input, bpUp),
  ];
}

// ── Headline insights ───────────────────────────────────────────────────────

export type InsightLevel = 'risk' | 'watch' | 'positive';

export interface Insight {
  readonly id: string;
  readonly level: InsightLevel;
  readonly params: Readonly<Record<string, string | number>>;
}

const LEVEL_RANK: Record<InsightLevel, number> = { risk: 0, watch: 1, positive: 2 };

/**
 * Synthesize the forward-looking headline insights (distinct from the current
 * advice the recommendation engine gives). Sorted risk → watch → positive; a
 * single positive note is returned when nothing needs attention.
 */
export function generateInsights(input: InsightInput): Insight[] {
  const latest = input.measurements[0];
  if (!latest) return [];
  const trends = buildMetricTrends(input.measurements);
  const insights: Insight[] = [];

  const bp = trends.systolicBp;
  if (bp?.direction === 'up') {
    const reachesHtn = bp.projected >= BP_SYSTOLIC.HTN_1;
    insights.push({
      id: reachesHtn ? 'bpProjectionHigh' : 'bpRising',
      level: reachesHtn ? 'risk' : 'watch',
      params: { perWeek: Math.abs(bp.changePerWeek), projected: Math.round(bp.projected) },
    });
  }

  const weight = trends.weightKg;
  if (weight?.direction === 'up') {
    insights.push({ id: 'weightRising', level: 'watch', params: { perWeek: Math.abs(weight.changePerWeek) } });
  }

  if (trends.glucoseMmol?.direction === 'up') {
    insights.push({ id: 'glucoseRising', level: 'watch', params: { perWeek: Math.abs(trends.glucoseMmol.changePerWeek) } });
  }

  if (input.latestMoodState && input.latestMoodState !== 'normal') {
    insights.push({
      id: 'wellbeingDistress',
      level: input.latestMoodState === 'burnout' ? 'risk' : 'watch',
      params: { state: input.latestMoodState },
    });
  }

  if (input.adherencePercent < ADHERENCE.GOOD_MIN_PERCENT) {
    insights.push({
      id: 'adherenceImpact',
      level: input.adherencePercent < ADHERENCE.LOW_MAX_PERCENT ? 'risk' : 'watch',
      params: { percent: input.adherencePercent },
    });
  }

  if (insights.length === 0) {
    insights.push({ id: 'allStable', level: 'positive', params: {} });
  }

  return insights.sort((a, b) => LEVEL_RANK[a.level] - LEVEL_RANK[b.level]);
}
