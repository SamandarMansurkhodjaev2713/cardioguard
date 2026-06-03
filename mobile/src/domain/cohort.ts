/**
 * Synthetic research cohort (TZ Modules 10–11) — generation + group/overall
 * aggregation. The cohort is produced deterministically from a seeded PRNG (no
 * `Math.random`), so the doctor's collective analytics are real computations
 * over real (synthetic) member records rather than hand-typed totals, yet stay
 * identical across launches and unit tests.
 */

import { BMI, BP_SYSTOLIC } from './constants';
import type { RiskCategory, Sex, StressLevel } from './types';
import { chance, pick, randFloat, randInt, type Rng } from '../utils/prng';

export interface CohortMember {
  readonly id: string;
  readonly group: string;
  readonly age: number;
  readonly sex: Sex;
  readonly systolicBp: number;
  readonly diastolicBp: number;
  readonly heightCm: number;
  readonly weightKg: number;
  readonly bmi: number;
  readonly adherencePercent: number;
  readonly riskCategory: RiskCategory;
  readonly stressLevel: StressLevel;
  readonly hasHypertension: boolean;
  readonly hasDiabetes: boolean;
  readonly activeAlerts: number;
  readonly lastSeenDaysAgo: number;
}

export interface CohortConfig {
  readonly groups: readonly string[];
  readonly perGroup: number;
}

const RISK_ORDER: readonly RiskCategory[] = ['low', 'moderate', 'high', 'veryHigh'];
const STRESS_LEVELS: readonly StressLevel[] = ['low', 'medium', 'high'];

const round1 = (n: number) => Math.round(n * 10) / 10;
const mean = (xs: readonly number[]) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 0);
const percent = (count: number, total: number) => (total ? Math.round((count / total) * 100) : 0);

/** Plausible risk bucket from a member's own features (keeps aggregates coherent). */
function deriveCohortRisk(m: {
  age: number; systolicBp: number; bmi: number; hasDiabetes: boolean; hasHypertension: boolean;
}): RiskCategory {
  let points = 0;
  if (m.age >= 60) points += 2;
  else if (m.age >= 50) points += 1;
  if (m.systolicBp >= BP_SYSTOLIC.HTN_2) points += 3;
  else if (m.systolicBp >= BP_SYSTOLIC.HTN_1) points += 2;
  else if (m.systolicBp >= BP_SYSTOLIC.HIGH_NORMAL) points += 1;
  if (m.bmi >= BMI.OVERWEIGHT_MAX) points += 2;
  else if (m.bmi >= 27) points += 1;
  if (m.hasDiabetes) points += 2;
  if (m.hasHypertension) points += 1;
  if (points >= 6) return 'veryHigh';
  if (points >= 4) return 'high';
  if (points >= 2) return 'moderate';
  return 'low';
}

/** Generate a deterministic cohort. `rng` carries the seed (caller owns it). */
export function generateCohortMembers(rng: Rng, config: CohortConfig): CohortMember[] {
  const members: CohortMember[] = [];
  let idCounter = 100;
  for (const group of config.groups) {
    for (let i = 0; i < config.perGroup; i += 1) {
      idCounter += randInt(rng, 1, 4);
      const sex = pick<Sex>(rng, ['male', 'female']);
      const age = randInt(rng, 30, 67);
      const systolicBp = randInt(rng, 110, 168);
      const diastolicBp = randInt(rng, 68, 104);
      const heightCm = sex === 'male' ? randInt(rng, 168, 186) : randInt(rng, 156, 172);
      const bmi = round1(randFloat(rng, 21, 34));
      const weightKg = Math.round(bmi * (heightCm / 100) ** 2);
      const adherencePercent = randInt(rng, 55, 100);
      const hasHypertension = systolicBp >= BP_SYSTOLIC.HTN_1 || chance(rng, 0.22);
      const hasDiabetes = chance(rng, 0.14);
      const stressLevel = pick(rng, STRESS_LEVELS);
      const riskCategory = deriveCohortRisk({ age, systolicBp, bmi, hasDiabetes, hasHypertension });
      const activeAlerts =
        (riskCategory === 'high' || riskCategory === 'veryHigh' ? 1 : 0) +
        (adherencePercent < 70 ? 1 : 0) +
        (systolicBp >= BP_SYSTOLIC.HTN_2 ? 1 : 0);
      members.push({
        id: `P-0${idCounter}`,
        group,
        age,
        sex,
        systolicBp,
        diastolicBp,
        heightCm,
        weightKg,
        bmi,
        adherencePercent,
        riskCategory,
        stressLevel,
        hasHypertension,
        hasDiabetes,
        activeAlerts,
        lastSeenDaysAgo: randInt(rng, 0, 6),
      });
    }
  }
  return members;
}

export interface GroupStats {
  readonly group: string;
  readonly count: number;
  readonly avgAge: number;
  readonly avgBmi: number;
  readonly avgWeightKg: number;
  readonly avgSystolic: number;
  readonly avgDiastolic: number;
  readonly avgAdherence: number;
  readonly hypertensionPercent: number;
  readonly diabetesPercent: number;
  readonly highStressPercent: number;
  readonly atRiskCount: number;
}

export interface RiskDistributionEntry {
  readonly category: RiskCategory;
  readonly value: number;
}

export interface CohortSummary {
  readonly count: number;
  readonly avgSystolic: number;
  readonly avgDiastolic: number;
  readonly avgBmi: number;
  readonly avgAdherence: number;
  readonly atRiskCount: number;
  readonly activeAlerts: number;
  readonly riskDistribution: readonly RiskDistributionEntry[];
  readonly groups: readonly GroupStats[];
}

const atRisk = (m: CohortMember) => m.riskCategory === 'high' || m.riskCategory === 'veryHigh';

export function summariseGroup(group: string, members: readonly CohortMember[]): GroupStats {
  return {
    group,
    count: members.length,
    avgAge: Math.round(mean(members.map((m) => m.age))),
    avgBmi: round1(mean(members.map((m) => m.bmi))),
    avgWeightKg: Math.round(mean(members.map((m) => m.weightKg))),
    avgSystolic: Math.round(mean(members.map((m) => m.systolicBp))),
    avgDiastolic: Math.round(mean(members.map((m) => m.diastolicBp))),
    avgAdherence: Math.round(mean(members.map((m) => m.adherencePercent))),
    hypertensionPercent: percent(members.filter((m) => m.hasHypertension).length, members.length),
    diabetesPercent: percent(members.filter((m) => m.hasDiabetes).length, members.length),
    highStressPercent: percent(members.filter((m) => m.stressLevel === 'high').length, members.length),
    atRiskCount: members.filter(atRisk).length,
  };
}

export function summariseCohort(members: readonly CohortMember[]): CohortSummary {
  const groupKeys = [...new Set(members.map((m) => m.group))];
  return {
    count: members.length,
    avgSystolic: Math.round(mean(members.map((m) => m.systolicBp))),
    avgDiastolic: Math.round(mean(members.map((m) => m.diastolicBp))),
    avgBmi: round1(mean(members.map((m) => m.bmi))),
    avgAdherence: Math.round(mean(members.map((m) => m.adherencePercent))),
    atRiskCount: members.filter(atRisk).length,
    activeAlerts: members.reduce((s, m) => s + m.activeAlerts, 0),
    riskDistribution: RISK_ORDER.map((category) => ({
      category,
      value: members.filter((m) => m.riskCategory === category).length,
    })),
    groups: groupKeys.map((g) => summariseGroup(g, members.filter((m) => m.group === g))),
  };
}
