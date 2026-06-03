/**
 * Early-warning engine — pure function evaluating a patient snapshot into the
 * set of currently-applicable alert drafts. Ported from the Kotlin
 * `MainViewModel.evaluateAlertTriggers`. Time is injected via `now` so the rules
 * are deterministic and testable; identity (id/date/read flag) and de-duplication
 * against existing alerts are the store's responsibility.
 */

import {
  calculateAdherencePercent,
  classifyBmi,
  isElevatedBloodPressure,
  roundOneDecimal,
} from './calculators';
import { ADHERENCE, ALERT_RULES, MS_PER_DAY } from './constants';
import type {
  AlertSeverity,
  AlertType,
  BmiCategory,
  HealthMeasurement,
  MedicationLog,
  MoodState,
  RiskCategory,
} from './types';

export interface AlertDraft {
  readonly type: AlertType;
  readonly severity: AlertSeverity;
  readonly params: Readonly<Record<string, string | number>>;
}

export interface AlertContext {
  /** Measurements newest-first (index 0 = latest). */
  readonly measurements: readonly HealthMeasurement[];
  readonly medicationLogs: readonly MedicationLog[];
  readonly riskPercent: number;
  readonly riskCategory: RiskCategory;
  /** Latest psycho-emotional state, when a wellbeing check-in exists (Module 5). */
  readonly latestMoodState?: MoodState;
}

function daysBetween(laterMs: number, earlierIso: string): number {
  return (laterMs - new Date(earlierIso).getTime()) / MS_PER_DAY;
}

export function evaluateAlerts(ctx: AlertContext, now: Date): AlertDraft[] {
  const { measurements, medicationLogs, riskPercent, riskCategory } = ctx;
  const latest = measurements[0];
  if (!latest) return [];

  const nowMs = now.getTime();
  const drafts: AlertDraft[] = [];

  // 1 — Acute high blood pressure
  if (isElevatedBloodPressure(latest.systolicBp, latest.diastolicBp)) {
    drafts.push({
      type: 'bloodPressure',
      severity: 'warn',
      params: { systolic: latest.systolicBp, diastolic: latest.diastolicBp },
    });
  }

  // 2 — Repeated high blood pressure within the trailing window
  const elevatedRecent = measurements.filter(
    (m) =>
      daysBetween(nowMs, m.date) <= ALERT_RULES.REPEATED_BP_WINDOW_DAYS &&
      isElevatedBloodPressure(m.systolicBp, m.diastolicBp),
  ).length;
  if (elevatedRecent >= ALERT_RULES.REPEATED_BP_MIN_COUNT) {
    drafts.push({
      type: 'repeatedBloodPressure',
      severity: 'high',
      params: { count: elevatedRecent },
    });
  }

  // 3 — Rapid weight gain vs. the previous reading
  const previous = measurements[1];
  if (previous) {
    const delta = roundOneDecimal(latest.weightKg - previous.weightKg);
    if (delta >= ALERT_RULES.RAPID_WEIGHT_GAIN_KG) {
      drafts.push({ type: 'rapidWeight', severity: 'warn', params: { delta } });
    }
  }

  // 4 — BMI category worsening vs. the earliest reading
  const earliest = measurements[measurements.length - 1];
  if (earliest && earliest !== latest) {
    const current: BmiCategory = classifyBmi(latest.bmi);
    const baseline: BmiCategory = classifyBmi(earliest.bmi);
    if (current !== baseline && latest.bmi > earliest.bmi) {
      drafts.push({
        type: 'bmiWorsening',
        severity: 'info',
        params: { current, previous: baseline },
      });
    }
  }

  // 5 — Critically low adherence
  const adherence = calculateAdherencePercent(medicationLogs);
  if (adherence < ADHERENCE.LOW_MAX_PERCENT) {
    drafts.push({ type: 'lowAdherence', severity: 'high', params: { percent: adherence } });
  }

  // 6 — Repeated missed / skipped doses
  const missed = medicationLogs.filter(
    (log) => log.status === 'missed' || log.status === 'skipped',
  ).length;
  if (missed >= ALERT_RULES.MISSED_DOSES_MIN_COUNT) {
    drafts.push({ type: 'medicationAdherence', severity: 'warn', params: { count: missed } });
  }

  // 7 — High integral CVD risk
  if ((ALERT_RULES.HIGH_RISK_CATEGORIES as readonly string[]).includes(riskCategory)) {
    drafts.push({ type: 'highCvdRisk', severity: 'high', params: { percent: riskPercent } });
  }

  // 8 — Self-monitoring lapsed
  if (daysBetween(nowMs, latest.date) > ALERT_RULES.NO_MEASUREMENT_MAX_DAYS) {
    drafts.push({ type: 'noMeasurements', severity: 'warn', params: {} });
  }

  // 9 — Psycho-emotional distress flagged by the latest weekly check-in.
  //     Burnout is the most serious (high); anxiety/stress are warnings.
  if (ctx.latestMoodState && ctx.latestMoodState !== 'normal') {
    drafts.push({
      type: 'psychDistress',
      severity: ctx.latestMoodState === 'burnout' ? 'high' : 'warn',
      params: { state: ctx.latestMoodState },
    });
  }

  return drafts;
}
