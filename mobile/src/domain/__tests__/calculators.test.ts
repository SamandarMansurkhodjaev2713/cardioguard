import {
  adherenceBand,
  calculateAdherencePercent,
  calculateBmi,
  classifyBloodPressure,
  classifyBmi,
  classifyRiskCategory,
  framinghamRiskPercent,
  isElevatedBloodPressure,
  riskPercentFor,
  roundOneDecimal,
  score2RiskPercent,
} from '../calculators';
import { LAB_DEFAULTS } from '../constants';
import { makeMedicationLog, makeProfile } from '../../testing/factories';
import type { RiskInputs } from '../calculators';

const labs: RiskInputs = {
  systolicBp: 130,
  totalCholMmol: LAB_DEFAULTS.TOTAL_CHOL_MMOL,
  hdlCholMmol: LAB_DEFAULTS.HDL_MMOL,
};

describe('roundOneDecimal', () => {
  it('GIVEN a long decimal WHEN rounding THEN keeps one place (half-up)', () => {
    expect(roundOneDecimal(29.449)).toBe(29.4);
    expect(roundOneDecimal(29.45)).toBe(29.5);
    expect(roundOneDecimal(0)).toBe(0);
  });
});

describe('calculateBmi', () => {
  it('GIVEN valid weight/height WHEN computing THEN returns rounded BMI', () => {
    expect(calculateBmi(91.5, 176)).toBe(29.5);
    expect(calculateBmi(80, 175)).toBe(26.1);
  });

  it('GIVEN non-positive height WHEN computing THEN returns 0 (no divide-by-zero)', () => {
    expect(calculateBmi(80, 0)).toBe(0);
    expect(calculateBmi(80, -10)).toBe(0);
  });

  it('GIVEN zero weight WHEN computing THEN returns 0', () => {
    expect(calculateBmi(0, 175)).toBe(0);
  });
});

describe('classifyBmi', () => {
  it.each([
    [17.9, 'underweight'],
    [18.5, 'normal'],
    [24.9, 'normal'],
    [25.0, 'overweight'],
    [29.9, 'overweight'],
    [30.0, 'obese'],
    [42.0, 'obese'],
  ])('GIVEN BMI %p THEN category is %p', (bmi, expected) => {
    expect(classifyBmi(bmi as number)).toBe(expected);
  });
});

describe('classifyBloodPressure', () => {
  it('GIVEN both axes low THEN optimal', () => {
    expect(classifyBloodPressure(118, 78)).toBe('optimal');
  });

  it('GIVEN mixed reading 125/95 THEN takes the worse axis (grade-1 HTN)', () => {
    // Clinical correction: the Kotlin original returned "normal" here.
    expect(classifyBloodPressure(125, 95)).toBe('hypertension1');
  });

  it.each([
    [120, 80, 'normal'],
    [135, 85, 'highNormal'],
    [145, 92, 'hypertension1'],
    [165, 105, 'hypertension2'],
    [185, 115, 'hypertension3'],
  ])('GIVEN %p/%p THEN %p', (sys, dia, expected) => {
    expect(classifyBloodPressure(sys as number, dia as number)).toBe(expected);
  });
});

describe('isElevatedBloodPressure', () => {
  it('GIVEN either axis at threshold THEN elevated', () => {
    expect(isElevatedBloodPressure(140, 80)).toBe(true);
    expect(isElevatedBloodPressure(120, 90)).toBe(true);
    expect(isElevatedBloodPressure(139, 89)).toBe(false);
  });
});

describe('calculateAdherencePercent', () => {
  it('GIVEN empty log THEN defaults to 100%', () => {
    expect(calculateAdherencePercent([])).toBe(100);
  });

  it('GIVEN mixed statuses THEN taken/total rounded', () => {
    const logs = [
      makeMedicationLog({ id: 'a', status: 'taken' }),
      makeMedicationLog({ id: 'b', status: 'taken' }),
      makeMedicationLog({ id: 'c', status: 'missed', actualTime: null }),
      makeMedicationLog({ id: 'd', status: 'skipped', actualTime: null }),
    ];
    expect(calculateAdherencePercent(logs)).toBe(50);
  });

  it('GIVEN all missed THEN 0%', () => {
    const logs = [makeMedicationLog({ status: 'missed', actualTime: null })];
    expect(calculateAdherencePercent(logs)).toBe(0);
  });
});

describe('adherenceBand', () => {
  it('GIVEN 86% THEN moderate (matches the design)', () => {
    expect(adherenceBand(86)).toBe('moderate');
  });
  it('boundaries', () => {
    expect(adherenceBand(90)).toBe('good');
    expect(adherenceBand(70)).toBe('moderate');
    expect(adherenceBand(69.9)).toBe('low');
  });
});

describe('score2RiskPercent (ESC 2021, validated)', () => {
  it('GIVEN a high-risk older male smoker (very-high region) THEN substantial risk', () => {
    const profile = makeProfile({ age: 65, sex: 'male', smokingStatus: 'current', riskRegion: 'veryHigh' });
    const risk = score2RiskPercent(profile, { systolicBp: 160, totalCholMmol: 6.5, hdlCholMmol: 1.0 });
    expect(risk).toBeGreaterThan(20);
    expect(risk).toBeLessThanOrEqual(100);
  });

  it('GIVEN a low-risk younger non-smoker (low region) THEN low risk', () => {
    const profile = makeProfile({ age: 40, sex: 'female', smokingStatus: 'never', riskRegion: 'low' });
    const risk = score2RiskPercent(profile, { systolicBp: 110, totalCholMmol: 4.5, hdlCholMmol: 1.8 });
    expect(risk).toBeLessThan(5);
  });

  it('is monotonic: smoking, higher BP, higher cholesterol, worse region each raise risk', () => {
    const base = makeProfile({ age: 55, sex: 'male', smokingStatus: 'never', riskRegion: 'high' });
    const input = { systolicBp: 130, totalCholMmol: 5.5, hdlCholMmol: 1.3 };
    const baseRisk = score2RiskPercent(base, input);
    expect(score2RiskPercent({ ...base, smokingStatus: 'current' }, input)).toBeGreaterThan(baseRisk);
    expect(score2RiskPercent(base, { ...input, systolicBp: 160 })).toBeGreaterThan(baseRisk);
    expect(score2RiskPercent(base, { ...input, totalCholMmol: 7 })).toBeGreaterThan(baseRisk);
    expect(score2RiskPercent({ ...base, riskRegion: 'veryHigh' }, input)).toBeGreaterThan(baseRisk);
  });

  it('clamps age outside 40–69 to the validated range (finite, no NaN)', () => {
    expect(Number.isFinite(score2RiskPercent(makeProfile({ age: 25, sex: 'male' }), labs))).toBe(true);
    expect(Number.isFinite(score2RiskPercent(makeProfile({ age: 85, sex: 'male' }), labs))).toBe(true);
  });
});

describe('framinghamRiskPercent (2008 General CVD, validated)', () => {
  it('GIVEN a low-risk profile THEN low risk', () => {
    const profile = makeProfile({ age: 40, sex: 'female', smokingStatus: 'never' });
    expect(framinghamRiskPercent(profile, { systolicBp: 110, totalCholMmol: 4.5, hdlCholMmol: 1.8 })).toBeLessThan(10);
  });

  it('GIVEN a high-risk profile THEN high risk', () => {
    const profile = makeProfile({ age: 65, sex: 'male', smokingStatus: 'current', diabetesStatus: 'yes', onHypertensiveMedication: true });
    expect(framinghamRiskPercent(profile, { systolicBp: 165, totalCholMmol: 7.0, hdlCholMmol: 0.9 })).toBeGreaterThan(20);
  });

  it('treated SBP yields higher risk than untreated at the same reading', () => {
    const input = { systolicBp: 150, totalCholMmol: 6, hdlCholMmol: 1.2 };
    const treated = framinghamRiskPercent(makeProfile({ age: 55, sex: 'male', onHypertensiveMedication: true }), input);
    const untreated = framinghamRiskPercent(makeProfile({ age: 55, sex: 'male', onHypertensiveMedication: false }), input);
    expect(treated).toBeGreaterThan(untreated);
  });
});

describe('riskPercentFor', () => {
  it('dispatches to the selected model', () => {
    const profile = makeProfile({ age: 55, smokingStatus: 'current' });
    expect(riskPercentFor('score2', profile, labs)).toBe(score2RiskPercent(profile, labs));
    expect(riskPercentFor('framingham', profile, labs)).toBe(framinghamRiskPercent(profile, labs));
  });
});

describe('classifyRiskCategory', () => {
  it('SCORE2 uses ESC age-specific thresholds', () => {
    expect(classifyRiskCategory(2.0, 'score2', 45)).toBe('low');
    expect(classifyRiskCategory(5.0, 'score2', 45)).toBe('high');
    expect(classifyRiskCategory(8.0, 'score2', 45)).toBe('veryHigh');
    expect(classifyRiskCategory(4.0, 'score2', 60)).toBe('low');
    expect(classifyRiskCategory(7.0, 'score2', 60)).toBe('high');
    expect(classifyRiskCategory(12.0, 'score2', 60)).toBe('veryHigh');
  });

  it('Framingham uses 10/20% bands', () => {
    expect(classifyRiskCategory(8, 'framingham', 55)).toBe('low');
    expect(classifyRiskCategory(15, 'framingham', 55)).toBe('high');
    expect(classifyRiskCategory(25, 'framingham', 55)).toBe('veryHigh');
  });
});
