/**
 * Presentation helpers: map clinical category codes to visual status tones, and
 * format dates per the active locale. Pure and UI-agnostic (no React imports).
 */

import type {
  AdherenceBand,
  BloodPressureCategory,
  BmiCategory,
  RiskCategory,
} from '../domain/types';
import type { StatusTone } from '../theme/tokens';

export function bloodPressureTone(category: BloodPressureCategory): StatusTone {
  switch (category) {
    case 'optimal':
    case 'normal':
      return 'ok';
    case 'highNormal':
      return 'warn';
    case 'hypertension1':
    case 'hypertension2':
      return 'high';
    case 'hypertension3':
      return 'vhigh';
  }
}

export function bmiTone(category: BmiCategory): StatusTone {
  switch (category) {
    case 'normal':
      return 'ok';
    case 'underweight':
    case 'overweight':
      return 'warn';
    case 'obese':
      return 'high';
  }
}

export function riskTone(category: RiskCategory): StatusTone {
  switch (category) {
    case 'low':
      return 'ok';
    case 'moderate':
      return 'warn';
    case 'high':
      return 'high';
    case 'veryHigh':
      return 'vhigh';
  }
}

export function adherenceTone(band: AdherenceBand): StatusTone {
  switch (band) {
    case 'good':
      return 'ok';
    case 'moderate':
      return 'warn';
    case 'low':
      return 'high';
  }
}

const LOCALE_TAG: Record<string, string> = { ru: 'ru-RU', uz: 'uz-UZ' };

function localeTag(language: string): string {
  return LOCALE_TAG[language] ?? 'ru-RU';
}

const WEEKDAYS_RU = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

/** Long localized date ("Понедельник, 1 июня"), with a safe manual fallback. */
export function formatLongDate(date: Date, language: string): string {
  try {
    const formatted = new Intl.DateTimeFormat(localeTag(language), {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    }).format(date);
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  } catch {
    return date.toLocaleDateString();
  }
}

/** Short weekday ("Пн"), capitalized, with a manual fallback. */
export function shortWeekday(date: Date, language: string): string {
  try {
    const formatted = new Intl.DateTimeFormat(localeTag(language), { weekday: 'short' }).format(date);
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  } catch {
    return WEEKDAYS_RU[date.getDay()];
  }
}

/** Short date ("2 июн"). */
export function shortDate(date: Date, language: string): string {
  try {
    return new Intl.DateTimeFormat(localeTag(language), { day: 'numeric', month: 'short' }).format(date);
  } catch {
    return `${date.getDate()}`;
  }
}

/** Numeric date ("02.06.2026"), locale-aware, with a manual fallback. */
export function formatDateNumeric(date: Date, language: string): string {
  try {
    return new Intl.DateTimeFormat(localeTag(language), {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  } catch {
    const d = String(date.getDate()).padStart(2, '0');
    const m = String(date.getMonth() + 1).padStart(2, '0');
    return `${d}.${m}.${date.getFullYear()}`;
  }
}

/** Time of day as HH:mm. */
export function timeHm(date: Date): string {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}
