/**
 * Psychological & emotional monitoring (TZ Module 5) — pure scoring + state
 * classification + weekly cadence. No side effects: `now` is injected and the
 * survey is a plain value object, so every rule is deterministic and testable.
 *
 * Each dimension is the severity of a negative (0 = none … 4 = severe), so a
 * higher aggregate means *worse* wellbeing; `wellbeingScore` inverts that into a
 * 0–100 "better is higher" score. This is a screening aid, not a diagnosis.
 */

import { MOOD, MS_PER_DAY } from './constants';
import type { MoodDimension, MoodEntry, MoodState } from './types';

/** Survey order (also the order shown in the UI). */
export const MOOD_DIMENSIONS: readonly MoodDimension[] = [
  'lowMood',
  'anxiety',
  'stress',
  'emotionalInstability',
  'sleepProblems',
  'fatigue',
];

export type WellbeingBand = 'good' | 'moderate' | 'low';

function clampItem(value: number): number {
  if (!Number.isFinite(value)) return MOOD.ITEM_MIN;
  return Math.max(MOOD.ITEM_MIN, Math.min(MOOD.ITEM_MAX, Math.round(value)));
}

/** Sum of the six dimension severities (0 … DIMENSIONS×ITEM_MAX). */
export function moodSeverityTotal(entry: MoodEntry): number {
  return MOOD_DIMENSIONS.reduce((sum, dim) => sum + clampItem(entry[dim]), 0);
}

/** Wellbeing score 0–100 (higher = better), inverted from total severity. */
export function wellbeingScore(entry: MoodEntry): number {
  const max = MOOD.DIMENSIONS * MOOD.ITEM_MAX;
  return Math.round(100 * (1 - moodSeverityTotal(entry) / max));
}

export function wellbeingBand(score: number): WellbeingBand {
  if (score >= MOOD.GOOD_MIN_SCORE) return 'good';
  if (score >= MOOD.MODERATE_MIN_SCORE) return 'moderate';
  return 'low';
}

/**
 * Classify the entry into one of the four TZ states. Priority is clinical
 * salience: burnout (exhaustion pattern) → chronic stress → elevated anxiety →
 * normal. "Burnout" requires the exhaustion triad (fatigue + emotional
 * instability, with at least elevated low mood) so a single stressful week
 * doesn't over-label.
 */
export function classifyMoodState(entry: MoodEntry): MoodState {
  const fatigue = clampItem(entry.fatigue);
  const instability = clampItem(entry.emotionalInstability);
  const lowMood = clampItem(entry.lowMood);
  const stress = clampItem(entry.stress);
  const anxiety = clampItem(entry.anxiety);

  const exhaustionTriad = fatigue >= MOOD.SEVERE && instability >= MOOD.SEVERE && lowMood >= MOOD.ELEVATED;
  if (exhaustionTriad) return 'burnout';
  if (stress >= MOOD.SEVERE) return 'chronicStress';
  if (anxiety >= MOOD.SEVERE) return 'elevatedAnxiety';
  return 'normal';
}

/** Latest entry by date (entries are not assumed pre-sorted). */
export function latestMoodEntry(entries: readonly MoodEntry[]): MoodEntry | undefined {
  if (entries.length === 0) return undefined;
  return entries.reduce((latest, e) =>
    new Date(e.date).getTime() > new Date(latest.date).getTime() ? e : latest,
  );
}

function daysSince(iso: string, now: Date): number {
  return (now.getTime() - new Date(iso).getTime()) / MS_PER_DAY;
}

/** Whole days remaining until the next check-in is due (0 once due). */
export function daysUntilNextMoodSurvey(entries: readonly MoodEntry[], now: Date): number {
  const latest = latestMoodEntry(entries);
  if (!latest) return 0;
  const remaining = MOOD.SURVEY_INTERVAL_DAYS - daysSince(latest.date, now);
  return remaining <= 0 ? 0 : Math.ceil(remaining);
}

/** A check-in is due when none was taken within the cadence window. */
export function isMoodSurveyDue(entries: readonly MoodEntry[], now: Date): boolean {
  return daysUntilNextMoodSurvey(entries, now) === 0;
}
