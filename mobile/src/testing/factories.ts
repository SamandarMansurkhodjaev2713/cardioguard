/**
 * Test data factories. Tests build entities through these (never hardcoded
 * literals scattered across specs) so a model change touches exactly one place.
 */

import type {
  Alert,
  HealthMeasurement,
  Medication,
  MedicationLog,
  MoodEntry,
  UserProfile,
} from '../domain/types';

const EPOCH = '2026-06-01T08:00:00.000Z';

export function makeProfile(overrides: Partial<UserProfile> = {}): UserProfile {
  return {
    id: 'user_test',
    anonymizedId: 'CG-0000-T',
    fullName: 'Test Patient',
    age: 50,
    sex: 'male',
    heightCm: 175,
    weightKg: 80,
    waistCircumferenceCm: 92,
    smokingStatus: 'never',
    diabetesStatus: 'no',
    hypertensionStatus: 'no',
    onHypertensiveMedication: false,
    familyHistoryCvd: 'no',
    workScheduleType: 'regular',
    professionalRiskGroup: 'civilian',
    physicalActivityLevel: 'medium',
    sleepQuality: 'good',
    stressLevel: 'low',
    createdAt: EPOCH,
    updatedAt: EPOCH,
    ...overrides,
  };
}

export function makeMeasurement(
  overrides: Partial<HealthMeasurement> = {},
): HealthMeasurement {
  return {
    id: 'm_test',
    userId: 'user_test',
    date: EPOCH,
    systolicBp: 120,
    diastolicBp: 80,
    heartRate: 70,
    weightKg: 80,
    bmi: 26.1,
    waistCircumferenceCm: 92,
    sleepHours: 7,
    stressLevel: 'low',
    physicalActivityMinutes: 30,
    notes: '',
    ...overrides,
  };
}

export function makeMedication(
  overrides: Partial<Medication> = {},
): Medication {
  return {
    id: 'med_test',
    userId: 'user_test',
    name: 'Периндоприл',
    dosage: '10 мг',
    frequencyPerDay: 1,
    intakeTimes: ['08:00'],
    startDate: EPOCH,
    endDate: null,
    instructions: '',
    isActive: true,
    ...overrides,
  };
}

export function makeMedicationLog(
  overrides: Partial<MedicationLog> = {},
): MedicationLog {
  return {
    id: 'log_test',
    medicationId: 'med_test',
    userId: 'user_test',
    scheduledTime: '08:00',
    actualTime: EPOCH,
    status: 'taken',
    note: '',
    ...overrides,
  };
}

export function makeAlert(overrides: Partial<Alert> = {}): Alert {
  return {
    id: 'alert_test',
    userId: 'user_test',
    date: EPOCH,
    type: 'bloodPressure',
    severity: 'warn',
    params: {},
    isRead: false,
    ...overrides,
  };
}

export function makeMoodEntry(overrides: Partial<MoodEntry> = {}): MoodEntry {
  return {
    id: 'mood_test',
    userId: 'user_test',
    date: EPOCH,
    lowMood: 1,
    anxiety: 1,
    stress: 1,
    emotionalInstability: 1,
    sleepProblems: 1,
    fatigue: 1,
    note: '',
    ...overrides,
  };
}
