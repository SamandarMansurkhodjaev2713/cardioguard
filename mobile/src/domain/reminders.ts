/**
 * Pure helpers for medication reminders. Turns the medication schedule into a
 * deduplicated, time-sorted set of reminder slots — one per distinct intake
 * time, listing every medication due then. No platform / side effects here so
 * the grouping logic can be unit-tested; the actual OS scheduling lives in
 * {@link file://../services/notifications.ts}.
 */

import type { Medication } from './types';

export interface MedicationRef {
  readonly name: string;
  readonly dosage: string;
}

/** A single daily reminder: all medications due at one wall-clock time. */
export interface ReminderSlot {
  /** Original "HH:MM" label. */
  readonly time: string;
  readonly hour: number;
  readonly minute: number;
  readonly medications: readonly MedicationRef[];
}

const TIME_PATTERN = /^([01]?\d|2[0-3]):([0-5]\d)$/;

/** Parse an "HH:MM" 24-hour string. Returns null for anything malformed. */
export function parseTimeOfDay(value: string): { readonly hour: number; readonly minute: number } | null {
  const match = TIME_PATTERN.exec(value.trim());
  if (!match) return null;
  return { hour: Number(match[1]), minute: Number(match[2]) };
}

/**
 * Group active medications' intake times into reminder slots. Times that fail
 * to parse are skipped (never silently scheduled at a wrong time). Slots are
 * sorted chronologically; medications within a slot keep schedule order.
 */
export function buildReminderSlots(medications: readonly Medication[]): ReminderSlot[] {
  const byTime = new Map<string, { hour: number; minute: number; medications: MedicationRef[] }>();

  for (const med of medications) {
    if (!med.isActive) continue;
    for (const time of med.intakeTimes) {
      const parsed = parseTimeOfDay(time);
      if (!parsed) continue;
      const existing = byTime.get(time);
      const ref: MedicationRef = { name: med.name, dosage: med.dosage };
      if (existing) existing.medications.push(ref);
      else byTime.set(time, { hour: parsed.hour, minute: parsed.minute, medications: [ref] });
    }
  }

  return [...byTime.entries()]
    .map(([time, slot]) => ({ time, hour: slot.hour, minute: slot.minute, medications: slot.medications }))
    .sort((a, b) => a.hour - b.hour || a.minute - b.minute);
}
