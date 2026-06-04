/**
 * Demo seed data. Mirrors the design's reference patient ("Алишер", P-0142) and
 * cohort figures (`cg-data.jsx`). Dates are generated relative to `now` so the
 * latest reading is always "today" and the early-warning windows stay meaningful.
 * Replaced wholesale once a real backend exists (see repository abstraction).
 */

import { evaluateAlerts } from '../domain/alertEngine';
import { calculateBmi, classifyRiskCategory, riskPercentFor } from '../domain/calculators';
import { generateCohortMembers } from '../domain/cohort';
import { LAB_DEFAULTS } from '../domain/constants';
import { classifyMoodState, latestMoodEntry } from '../domain/mood';
import type {
  Alert,
  Doctor,
  HealthMeasurement,
  Medication,
  MedicationLog,
  MoodEntry,
  PatientRecord,
  UserProfile,
} from '../domain/types';
import { mulberry32 } from '../utils/prng';
import { buildPatientRecord } from './patientGenerator';

const HEIGHT_CM = 178;

function isoDaysAgo(now: Date, days: number, hour = 8, minute = 0): string {
  const d = new Date(now);
  d.setDate(d.getDate() - days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

export interface PatientSeed {
  readonly profile: UserProfile;
  readonly measurements: HealthMeasurement[];
  readonly medications: Medication[];
  readonly medicationLogs: MedicationLog[];
  readonly moodEntries: MoodEntry[];
}

// Weekly wellbeing check-ins (newest-first), a gently improving trend. All stay
// below the classification thresholds (state = "normal") so the demo populates
// the history & trend without synthesising an early-warning signal.
const WEEKLY_MOOD: ReadonlyArray<{
  lowMood: number; anxiety: number; stress: number; emotionalInstability: number; sleepProblems: number; fatigue: number;
}> = [
  { lowMood: 1, anxiety: 2, stress: 2, emotionalInstability: 1, sleepProblems: 1, fatigue: 1 }, // latest
  { lowMood: 1, anxiety: 2, stress: 2, emotionalInstability: 1, sleepProblems: 2, fatigue: 2 },
  { lowMood: 2, anxiety: 2, stress: 2, emotionalInstability: 2, sleepProblems: 2, fatigue: 2 },
  { lowMood: 2, anxiety: 2, stress: 2, emotionalInstability: 2, sleepProblems: 3, fatigue: 3 },
];

/**
 * Daily self-monitoring track (newest-first), aligned with the design's chart.
 * Fasting glucose sits in the impaired/pre-diabetic band (5.9–6.3 mmol/L), which
 * is what justifies the Metformin prescription for a patient whose diabetes is
 * not yet diagnosed (pre-diabetes / insulin resistance).
 */
const DAILY: ReadonlyArray<{ sys: number; dia: number; hr: number; kg: number; glu: number }> = [
  { sys: 138, dia: 86, hr: 76, kg: 93.0, glu: 6.1 },
  { sys: 141, dia: 88, hr: 75, kg: 92.8, glu: 6.2 },
  { sys: 136, dia: 84, hr: 80, kg: 92.8, glu: 6.0 },
  { sys: 131, dia: 83, hr: 72, kg: 92.6, glu: 6.3 },
  { sys: 134, dia: 85, hr: 78, kg: 92.3, glu: 6.1 },
  { sys: 133, dia: 83, hr: 74, kg: 92.0, glu: 5.9 },
  { sys: 134, dia: 84, hr: 76, kg: 91.8, glu: 6.0 },
];

export function createPatientSeed(now: Date): PatientSeed {
  const profile: UserProfile = {
    id: 'user_01',
    anonymizedId: 'P-0142',
    fullName: 'Алишер Рахимов',
    age: 54,
    sex: 'male',
    heightCm: HEIGHT_CM,
    weightKg: 93.0,
    waistCircumferenceCm: 104,
    smokingStatus: 'former',
    diabetesStatus: 'no',
    hypertensionStatus: 'yes',
    onHypertensiveMedication: true,
    familyHistoryCvd: 'no',
    workScheduleType: 'shift',
    professionalRiskGroup: 'lawEnforcement',
    physicalActivityLevel: 'low',
    sleepQuality: 'disturbed',
    stressLevel: 'high',
    dyslipidemiaStatus: 'yes',
    chronicConditions: ['Артериальная гипертензия', 'Дислипидемия', 'Предиабет'],
    allergies: ['Пенициллин'],
    medicationNotes: 'Лизиноприл, Бисопролол, Аторвастатин, Метформин',
    unit: 'Подразделение №2',
    serviceYears: 22,
    createdAt: isoDaysAgo(now, 30),
    updatedAt: isoDaysAgo(now, 0),
  };

  const measurements: HealthMeasurement[] = DAILY.map((d, i) => ({
    id: `m_${i}`,
    userId: profile.id,
    date: isoDaysAgo(now, i, i === 0 ? 8 : 8, 10),
    systolicBp: d.sys,
    diastolicBp: d.dia,
    heartRate: d.hr,
    weightKg: d.kg,
    bmi: calculateBmi(d.kg, HEIGHT_CM),
    glucoseMmol: d.glu,
    waistCircumferenceCm: 104,
    sleepHours: i % 2 === 0 ? 6.2 : 5.6,
    stressLevel: i % 3 === 0 ? 'high' : 'medium',
    physicalActivityMinutes: 15 + (i % 3) * 10,
    notes: '',
  }));

  const medications: Medication[] = [
    {
      id: 'med_lis', userId: profile.id, name: 'Лизиноприл', dosage: '10 мг',
      frequencyPerDay: 1, intakeTimes: ['08:00'], startDate: isoDaysAgo(now, 30),
      endDate: null, instructions: 'Ингибитор АПФ · контроль АД', isActive: true,
    },
    {
      id: 'med_bis', userId: profile.id, name: 'Бисопролол', dosage: '5 мг',
      frequencyPerDay: 1, intakeTimes: ['21:00'], startDate: isoDaysAgo(now, 30),
      endDate: null, instructions: 'Бета-блокатор · ЧСС и АД', isActive: true,
    },
    {
      id: 'med_ator', userId: profile.id, name: 'Аторвастатин', dosage: '20 мг',
      frequencyPerDay: 1, intakeTimes: ['08:00'], startDate: isoDaysAgo(now, 30),
      endDate: null, instructions: 'Статин · контроль холестерина', isActive: true,
    },
    {
      id: 'med_met', userId: profile.id, name: 'Метформин', dosage: '500 мг',
      frequencyPerDay: 2, intakeTimes: ['08:00', '14:00'], startDate: isoDaysAgo(now, 30),
      endDate: null, instructions: 'Контроль гликемии · предиабет', isActive: true,
    },
  ];

  // 7-day intake diary: mostly adherent with a couple of misses (≈86%, "moderate").
  const medicationLogs: MedicationLog[] = [];
  const schedule: ReadonlyArray<{ medId: string; time: string }> = [
    { medId: 'med_lis', time: '08:00' },
    { medId: 'med_ator', time: '08:00' },
    { medId: 'med_met', time: '14:00' },
    { medId: 'med_bis', time: '21:00' },
  ];
  for (let day = 6; day >= 1; day--) {
    for (const slot of schedule) {
      // Three deliberate misses across the week → adherence lands in the
      // "moderate" band (≈87%), matching the design's demo figure.
      const missed =
        (day === 3 && slot.medId === 'med_met') ||
        (day === 5 && slot.medId === 'med_bis') ||
        (day === 4 && slot.medId === 'med_lis');
      const [h, m] = slot.time.split(':').map(Number);
      medicationLogs.push({
        id: `log_${slot.medId}_${day}`,
        medicationId: slot.medId,
        userId: profile.id,
        scheduledTime: slot.time,
        actualTime: missed ? null : isoDaysAgo(now, day, h, m + 5),
        status: missed ? 'missed' : 'taken',
        note: '',
      });
    }
  }

  const moodEntries: MoodEntry[] = WEEKLY_MOOD.map((m, i) => ({
    id: `mood_${i}`,
    userId: profile.id,
    // Most recent check-in is 8 days back (noon) → a new one is due now, and is
    // always newer than the seed regardless of the wall-clock time of day.
    date: isoDaysAgo(now, i * 7 + 8, 12, 0),
    lowMood: m.lowMood,
    anxiety: m.anxiety,
    stress: m.stress,
    emotionalInstability: m.emotionalInstability,
    sleepProblems: m.sleepProblems,
    fatigue: m.fatigue,
    note: '',
  }));

  return { profile, measurements, medications, medicationLogs, moodEntries };
}

// ── Multi-user demo (1 doctor + a roster of real patient records) ─────────────

/** Compute early-warning alerts for a patient's data (reuses the pure engines). */
function recordAlerts(
  profile: UserProfile,
  measurements: HealthMeasurement[],
  medicationLogs: MedicationLog[],
  moodEntries: MoodEntry[],
  now: Date,
): Alert[] {
  const latest = measurements[0];
  const inputs = {
    systolicBp: latest?.systolicBp ?? 120,
    totalCholMmol: profile.totalCholMmol ?? LAB_DEFAULTS.TOTAL_CHOL_MMOL,
    hdlCholMmol: profile.hdlCholMmol ?? LAB_DEFAULTS.HDL_MMOL,
  };
  const percent = riskPercentFor('score2', profile, inputs);
  const category = classifyRiskCategory(percent, 'score2', profile.age);
  const latestMood = latestMoodEntry(moodEntries);
  const drafts = evaluateAlerts(
    {
      measurements,
      medicationLogs,
      riskPercent: percent,
      riskCategory: category,
      latestMoodState: latestMood ? classifyMoodState(latestMood) : undefined,
    },
    now,
  );
  return drafts.map((d, i) => ({
    id: `al_${profile.anonymizedId}_${i}`,
    userId: profile.id,
    date: now.toISOString(),
    type: d.type,
    severity: d.severity,
    params: d.params,
    isRead: false,
  }));
}

export interface MultiUserSeed {
  readonly doctors: Doctor[];
  readonly records: Record<string, PatientRecord>;
  readonly demoDoctorId: string;
  readonly demoPatientId: string;
}

/**
 * The demo data the app boots with: one clinician and a roster of patients with
 * full histories — the patient "Алишер" (rich, hand-tuned) plus five generated
 * patients, all enrolled under the doctor. Deterministic given `now`.
 */
export function createMultiUserSeed(now: Date): MultiUserSeed {
  const doctor: Doctor = {
    id: 'doc_01',
    fullName: 'Д-р Сардор Алиев',
    specialty: 'Кардиолог',
    inviteCode: 'CARD-4827',
    organization: 'Кардиологический центр',
  };

  // Rich demo patient (Алишер), enrolled under the doctor.
  const base = createPatientSeed(now);
  const profile: UserProfile = { ...base.profile, doctorId: doctor.id };
  const alisher: PatientRecord = {
    profile,
    measurements: base.measurements,
    medications: base.medications,
    medicationLogs: base.medicationLogs,
    moodEntries: base.moodEntries,
    alerts: recordAlerts(profile, base.measurements, base.medicationLogs, base.moodEntries, now),
    symptoms: [],
    carePlan: { targetSystolicBp: 130, targetWeightKg: 88 },
    notes: [],
    messages: [],
  };

  const records: Record<string, PatientRecord> = { [alisher.profile.id]: alisher };

  // Five more real patients from the deterministic cohort, all under the doctor.
  const members = generateCohortMembers(mulberry32(0x5eed_face), { groups: ['roster'], perGroup: 5 });
  for (const member of members) {
    const record = buildPatientRecord(member, now, doctor.id);
    records[record.profile.id] = record;
  }

  return { doctors: [doctor], records, demoDoctorId: doctor.id, demoPatientId: alisher.profile.id };
}
