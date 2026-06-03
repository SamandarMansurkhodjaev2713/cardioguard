import {
  analyzeSeries,
  buildMetricTrends,
  ewma,
  generateInsights,
  linearRegression,
  projectConditions,
  type ConditionKey,
  type InsightInput,
  type TimePoint,
} from '../insights';
import { INSIGHTS } from '../constants';
import { makeMeasurement, makeProfile } from '../../testing/factories';
import type { HealthMeasurement } from '../types';

const DAY = 24 * 60 * 60 * 1000;
const BASE = new Date('2026-06-01T08:00:00.000Z').getTime();

/** Build newest-first daily measurements from oldest→newest values. */
function series(values: readonly Partial<HealthMeasurement>[]): HealthMeasurement[] {
  return values
    .map((v, i) => makeMeasurement({ id: `m${i}`, date: new Date(BASE + i * DAY).toISOString(), ...v }))
    .reverse();
}

const pts = (ys: readonly number[]): TimePoint[] => ys.map((y, x) => ({ x, y }));

function input(measurements: HealthMeasurement[], over: Partial<InsightInput> = {}): InsightInput {
  return {
    measurements,
    profile: makeProfile(),
    riskCategory: 'low',
    riskPercent: 2,
    adherencePercent: 100,
    ...over,
  };
}

describe('linearRegression', () => {
  it('GIVEN a rising line THEN positive slope', () => {
    expect(linearRegression(pts([1, 2, 3, 4])).slope).toBeCloseTo(1, 5);
  });
  it('GIVEN a falling line THEN negative slope', () => {
    expect(linearRegression(pts([4, 3, 2, 1])).slope).toBeCloseTo(-1, 5);
  });
  it('GIVEN fewer than 2 points THEN slope 0', () => {
    expect(linearRegression(pts([5])).slope).toBe(0);
    expect(linearRegression([]).slope).toBe(0);
  });
});

describe('ewma', () => {
  it('GIVEN empty THEN 0', () => expect(ewma([], 0.5)).toBe(0));
  it('GIVEN constant series THEN the constant', () => expect(ewma([3, 3, 3], 0.5)).toBe(3));
  it('weights recent values more heavily', () => {
    expect(ewma([0, 10], 0.5)).toBeCloseTo(5, 5);
  });
});

describe('analyzeSeries', () => {
  it('GIVEN a clear rise above eps THEN up with projection', () => {
    const t = analyzeSeries(pts([120, 124, 128, 132]), INSIGHTS.FLAT_EPS_PER_WEEK.systolicBp);
    expect(t.direction).toBe('up');
    expect(t.changePerWeek).toBeGreaterThan(0);
    expect(t.projected).toBeGreaterThan(t.current);
  });
  it('GIVEN a flat series THEN flat with zero weekly change', () => {
    const t = analyzeSeries(pts([130, 130, 130]), INSIGHTS.FLAT_EPS_PER_WEEK.systolicBp);
    expect(t.direction).toBe('flat');
    expect(t.changePerWeek).toBe(0);
  });
  it('GIVEN a sub-epsilon drift THEN flat', () => {
    // ~0.1/day weight gain = 0.7/week, above weight eps 0.2 → up; make it tiny.
    const t = analyzeSeries(pts([80.0, 80.01, 80.02]), INSIGHTS.FLAT_EPS_PER_WEEK.weightKg);
    expect(t.direction).toBe('flat');
  });
  it('GIVEN a single point THEN flat, projected = current', () => {
    const t = analyzeSeries(pts([90]), INSIGHTS.FLAT_EPS_PER_WEEK.weightKg);
    expect(t).toMatchObject({ direction: 'flat', projected: t.current, points: 1 });
  });

  it('caps the projection to the observed span (no runaway extrapolation)', () => {
    // 2 points over 1 day rising 10/day: a naive 28-day projection would add 280;
    // capped to the 1-day span it adds ~10, staying near the current level.
    const t = analyzeSeries(pts([120, 130]), INSIGHTS.FLAT_EPS_PER_WEEK.systolicBp);
    expect(t.direction).toBe('up');
    expect(t.projected - t.current).toBeLessThanOrEqual(11);
  });
});

describe('buildMetricTrends', () => {
  it('omits metrics without enough data and includes glucose only when present', () => {
    const ms = series([
      { systolicBp: 120, weightKg: 80, bmi: 26, heartRate: 70 },
      { systolicBp: 126, weightKg: 81, bmi: 26.3, heartRate: 72, glucoseMmol: 5.4 },
    ]);
    const trends = buildMetricTrends(ms);
    expect(trends.systolicBp).toBeDefined();
    expect(trends.weightKg).toBeDefined();
    expect(trends.glucoseMmol).toBeUndefined(); // only 1 glucose reading
  });

  it('GIVEN no measurements THEN empty map', () => {
    expect(buildMetricTrends([])).toEqual({});
  });
});

describe('projectConditions', () => {
  const found = (out: ReturnType<typeof projectConditions>, c: ConditionKey) =>
    out.find((p) => p.condition === c)!;

  it('GIVEN no measurements THEN no projections', () => {
    expect(projectConditions(input([]))).toEqual([]);
  });

  it('flags hypertension present when the profile is hypertensive', () => {
    const ms = series([{ systolicBp: 120 }, { systolicBp: 122 }]);
    const out = projectConditions(input(ms, { profile: makeProfile({ hypertensionStatus: 'yes' }) }));
    expect(found(out, 'hypertension').likelihood).toBe('present');
  });

  it('flags hypertension high when BP is high-normal AND rising', () => {
    const ms = series([{ systolicBp: 128, diastolicBp: 82 }, { systolicBp: 132, diastolicBp: 84 }, { systolicBp: 136, diastolicBp: 86 }]);
    const out = projectConditions(input(ms, { profile: makeProfile({ hypertensionStatus: 'no' }) }));
    const htn = found(out, 'hypertension');
    expect(htn.likelihood).toBe('high');
    expect(htn.driverKeys).toEqual(expect.arrayContaining(['elevatedBp', 'risingBp']));
  });

  it('flags obesity present at BMI >= 30 and diabetes present when diagnosed', () => {
    const ms = series([{ bmi: 31, weightKg: 96 }, { bmi: 31.2, weightKg: 97 }]);
    const out = projectConditions(input(ms, { profile: makeProfile({ diabetesStatus: 'yes' }) }));
    expect(found(out, 'obesity').likelihood).toBe('present');
    expect(found(out, 'diabetes').likelihood).toBe('present');
  });

  it('maps CVD likelihood from the risk category', () => {
    const ms = series([{ systolicBp: 120 }, { systolicBp: 121 }]);
    expect(found(projectConditions(input(ms, { riskCategory: 'veryHigh' })), 'cvd').likelihood).toBe('present');
    expect(found(projectConditions(input(ms, { riskCategory: 'low' })), 'cvd').likelihood).toBe('low');
  });
});

describe('generateInsights', () => {
  it('GIVEN rising BP that reaches hypertension THEN a risk-level projection insight', () => {
    const ms = series([{ systolicBp: 128 }, { systolicBp: 134 }, { systolicBp: 140 }, { systolicBp: 146 }]);
    const out = generateInsights(input(ms));
    const bp = out.find((i) => i.id === 'bpProjectionHigh');
    expect(bp?.level).toBe('risk');
  });

  it('GIVEN everything stable THEN a single positive insight', () => {
    const ms = series([{ systolicBp: 120, weightKg: 80, bmi: 26 }, { systolicBp: 120, weightKg: 80, bmi: 26 }]);
    const out = generateInsights(input(ms));
    expect(out).toHaveLength(1);
    expect(out[0]).toMatchObject({ id: 'allStable', level: 'positive' });
  });

  it('sorts risk before watch', () => {
    const ms = series([{ systolicBp: 130, weightKg: 80 }, { systolicBp: 138, weightKg: 81 }, { systolicBp: 146, weightKg: 82 }]);
    const out = generateInsights(input(ms, { adherencePercent: 100 }));
    expect(out[0].level).toBe('risk'); // bpProjectionHigh ahead of weightRising (watch)
  });

  it('flags low adherence as a risk insight', () => {
    const ms = series([{ systolicBp: 120 }, { systolicBp: 120 }]);
    const out = generateInsights(input(ms, { adherencePercent: 60 }));
    expect(out.find((i) => i.id === 'adherenceImpact')?.level).toBe('risk');
  });
});
