/**
 * Expands a synthetic cohort member into a *full* {@link PatientRecord} — a real
 * profile plus a believable 7-day history (measurements, medications, intake
 * diary, mood) and computed early-warning alerts. Deterministic (seeded PRNG +
 * injected `now`), so the doctor's roster is identical across launches. This is
 * what turns the old "42 summary rows" cohort into real patients a clinician can
 * open and act on.
 */

import { evaluateAlerts } from '../domain/alertEngine';
import { calculateBmi } from '../domain/calculators';
import type { CohortMember } from '../domain/cohort';
import type {
  Alert,
  CarePlan,
  HealthMeasurement,
  Medication,
  MedicationLog,
  MoodEntry,
  PatientRecord,
  RiskCategory,
  UserProfile,
} from '../domain/types';
import { chance, mulberry32, pick, randFloat, randInt, type Rng } from '../utils/prng';

const NAMES_MALE = [
  'Алишер Рахимов', 'Бахтиёр Каримов', 'Шавкат Юсупов', 'Тимур Назаров',
  'Рустам Холматов', 'Дилшод Эргашев', 'Фаррух Тошматов', 'Улугбек Содиков',
];
const NAMES_FEMALE = [
  'Нигора Саидова', 'Дилноза Абдуллаева', 'Малика Юлдашева', 'Зухра Камилова',
  'Феруза Хакимова', 'Сабина Усмонова', 'Гулнора Маматова', 'Лола Исроилова',
];

const RISK_PERCENT: Record<RiskCategory, number> = { low: 2, moderate: 7, high: 14, veryHigh: 24 };

function isoDaysAgo(now: Date, days: number, hour = 8, minute = 10): string {
  const d = new Date(now);
  d.setDate(d.getDate() - days);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
}

function buildProfile(member: CohortMember, rng: Rng, doctorId: string, now: Date): UserProfile {
  const names = member.sex === 'male' ? NAMES_MALE : NAMES_FEMALE;
  const idx = parseInt(member.id.replace(/\D/g, ''), 10) || 0;
  const conditions: string[] = [];
  if (member.hasHypertension) conditions.push('Артериальная гипертензия');
  if (member.hasDiabetes) conditions.push('Сахарный диабет 2 типа');
  return {
    id: `user_${member.id}`,
    anonymizedId: member.id,
    fullName: names[idx % names.length],
    age: member.age,
    sex: member.sex,
    heightCm: member.heightCm,
    weightKg: member.weightKg,
    waistCircumferenceCm: Math.round(member.sex === 'male' ? 88 + (member.bmi - 25) * 2.2 : 78 + (member.bmi - 25) * 2.0),
    smokingStatus: pick(rng, ['never', 'former', 'current']),
    diabetesStatus: member.hasDiabetes ? 'yes' : 'no',
    hypertensionStatus: member.hasHypertension ? 'yes' : 'no',
    onHypertensiveMedication: member.hasHypertension,
    familyHistoryCvd: pick(rng, ['yes', 'no', 'unknown']),
    workScheduleType: pick(rng, ['regular', 'shift', 'night']),
    professionalRiskGroup: pick(rng, ['civilian', 'lawEnforcement', 'military', 'other']),
    physicalActivityLevel: pick(rng, ['low', 'medium', 'high']),
    sleepQuality: pick(rng, ['good', 'disturbed', 'insufficient']),
    stressLevel: member.stressLevel,
    dyslipidemiaStatus: chance(rng, 0.4) ? 'yes' : 'no',
    chronicConditions: conditions,
    allergies: [],
    doctorId,
    createdAt: isoDaysAgo(now, 60),
    updatedAt: isoDaysAgo(now, 0),
  };
}

function buildMeasurements(member: CohortMember, rng: Rng, now: Date): HealthMeasurement[] {
  const out: HealthMeasurement[] = [];
  for (let i = 0; i < 7; i += 1) {
    const weightKg = Math.round((member.weightKg + i * 0.15 + randFloat(rng, -0.3, 0.3)) * 10) / 10;
    const glucose = member.hasDiabetes
      ? Math.round(randFloat(rng, 6.8, 8.6) * 10) / 10
      : member.bmi >= 27 && chance(rng, 0.5)
        ? Math.round(randFloat(rng, 5.7, 6.4) * 10) / 10
        : undefined;
    out.push({
      id: `m_${member.id}_${i}`,
      userId: `user_${member.id}`,
      date: isoDaysAgo(now, i),
      systolicBp: member.systolicBp + randInt(rng, -5, 5),
      diastolicBp: member.diastolicBp + randInt(rng, -4, 4),
      heartRate: randInt(rng, 62, 86),
      weightKg,
      bmi: calculateBmi(weightKg, member.heightCm),
      waistCircumferenceCm: Math.round(member.sex === 'male' ? 88 + (member.bmi - 25) * 2.2 : 78 + (member.bmi - 25) * 2.0),
      sleepHours: Math.round(randFloat(rng, 5.4, 7.6) * 10) / 10,
      stressLevel: member.stressLevel,
      physicalActivityMinutes: randInt(rng, 10, 45),
      glucoseMmol: glucose,
      notes: '',
    });
  }
  return out;
}

function buildMedications(member: CohortMember, now: Date): Medication[] {
  const meds: Medication[] = [];
  const uid = `user_${member.id}`;
  const start = isoDaysAgo(now, 60);
  if (member.hasHypertension) {
    meds.push({ id: `med_${member.id}_lis`, userId: uid, name: 'Лизиноприл', dosage: '10 мг', frequencyPerDay: 1, intakeTimes: ['08:00'], startDate: start, endDate: null, instructions: 'Ингибитор АПФ · контроль АД', isActive: true });
  }
  if (member.riskCategory === 'high' || member.riskCategory === 'veryHigh') {
    meds.push({ id: `med_${member.id}_ator`, userId: uid, name: 'Аторвастатин', dosage: '20 мг', frequencyPerDay: 1, intakeTimes: ['21:00'], startDate: start, endDate: null, instructions: 'Статин · контроль холестерина', isActive: true });
  }
  if (member.hasDiabetes) {
    meds.push({ id: `med_${member.id}_met`, userId: uid, name: 'Метформин', dosage: '500 мг', frequencyPerDay: 2, intakeTimes: ['08:00', '20:00'], startDate: start, endDate: null, instructions: 'Контроль гликемии', isActive: true });
  }
  return meds;
}

function buildLogs(member: CohortMember, medications: readonly Medication[], rng: Rng, now: Date): MedicationLog[] {
  const logs: MedicationLog[] = [];
  const missProbability = Math.max(0, 1 - member.adherencePercent / 100);
  for (let day = 6; day >= 1; day -= 1) {
    for (const med of medications) {
      for (const time of med.intakeTimes) {
        const missed = chance(rng, missProbability);
        const [h, m] = time.split(':').map(Number);
        logs.push({
          id: `log_${member.id}_${med.id}_${day}_${time}`,
          medicationId: med.id,
          userId: `user_${member.id}`,
          scheduledTime: time,
          actualTime: missed ? null : isoDaysAgo(now, day, h, m + 4),
          status: missed ? 'missed' : 'taken',
          note: '',
        });
      }
    }
  }
  return logs;
}

function buildMood(member: CohortMember, rng: Rng, now: Date): MoodEntry[] {
  const stressBase = member.stressLevel === 'high' ? 3 : member.stressLevel === 'medium' ? 2 : 1;
  return [0, 1].map((i) => ({
    id: `mood_${member.id}_${i}`,
    userId: `user_${member.id}`,
    date: isoDaysAgo(now, i * 7 + 5, 12, 0),
    lowMood: randInt(rng, 0, 2),
    anxiety: randInt(rng, 1, stressBase),
    stress: stressBase,
    emotionalInstability: randInt(rng, 0, 2),
    sleepProblems: randInt(rng, 1, 3),
    fatigue: randInt(rng, 1, 3),
    note: '',
  }));
}

/** Build a complete, deterministic patient record from a cohort member. */
export function buildPatientRecord(member: CohortMember, now: Date, doctorId: string): PatientRecord {
  const seed = 0x9e37 ^ (parseInt(member.id.replace(/\D/g, ''), 10) || 1);
  const rng = mulberry32(seed);
  const profile = buildProfile(member, rng, doctorId, now);
  const measurements = buildMeasurements(member, rng, now);
  const medications = buildMedications(member, now);
  const medicationLogs = buildLogs(member, medications, rng, now);
  const moodEntries = buildMood(member, rng, now);

  const drafts = evaluateAlerts(
    {
      measurements,
      medicationLogs,
      riskPercent: RISK_PERCENT[member.riskCategory],
      riskCategory: member.riskCategory,
    },
    now,
  );
  const alerts: Alert[] = drafts.map((d, i) => ({
    id: `al_${member.id}_${i}`,
    userId: profile.id,
    date: isoDaysAgo(now, 0),
    type: d.type,
    severity: d.severity,
    params: d.params,
    isRead: false,
  }));

  const carePlan: CarePlan = {};
  return { profile, measurements, medications, medicationLogs, moodEntries, alerts, symptoms: [], carePlan, notes: [], messages: [] };
}
