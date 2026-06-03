import { computeHealthIndex, healthIndexBand, type HealthIndexInput } from '../healthIndex';
import { makeMeasurement } from '../../testing/factories';

function input(over: Partial<HealthIndexInput> = {}): HealthIndexInput {
  return {
    latest: makeMeasurement({ systolicBp: 120, diastolicBp: 80, bmi: 22, physicalActivityMinutes: 30, sleepHours: 8 }),
    adherencePercent: 100,
    riskCategory: 'low',
    ...over,
  };
}

describe('computeHealthIndex', () => {
  it('GIVEN an ideal profile THEN scores 100 / good', () => {
    const idx = computeHealthIndex(input());
    expect(idx.overall).toBe(100);
    expect(idx.band).toBe('good');
  });

  it('GIVEN a poor profile THEN a low band', () => {
    const idx = computeHealthIndex(
      input({
        latest: makeMeasurement({ systolicBp: 170, diastolicBp: 105, bmi: 35, physicalActivityMinutes: 0, sleepHours: 4 }),
        adherencePercent: 40,
        riskCategory: 'veryHigh',
        wellbeing: 30,
      }),
    );
    expect(idx.overall).toBeLessThan(50);
    expect(idx.band).toBe('low');
  });

  it('renormalises weights so they always sum to 1', () => {
    const withWb = computeHealthIndex(input({ wellbeing: 80 }));
    const sum = withWb.components.reduce((s, c) => s + c.weight, 0);
    expect(sum).toBeCloseTo(1, 6);
    expect(withWb.components.some((c) => c.key === 'wellbeing')).toBe(true);
  });

  it('omits the wellbeing component when no check-in exists', () => {
    const noWb = computeHealthIndex(input());
    expect(noWb.components.some((c) => c.key === 'wellbeing')).toBe(false);
    const sum = noWb.components.reduce((s, c) => s + c.weight, 0);
    expect(sum).toBeCloseTo(1, 6);
  });

  it('clamps every sub-score into [0, 100]', () => {
    const idx = computeHealthIndex(
      input({ latest: makeMeasurement({ systolicBp: 240, diastolicBp: 160, bmi: 60, physicalActivityMinutes: 999, sleepHours: 0 }) }),
    );
    for (const c of idx.components) {
      expect(c.score).toBeGreaterThanOrEqual(0);
      expect(c.score).toBeLessThanOrEqual(100);
    }
  });

  it.each([
    [100, 'good'],
    [75, 'good'],
    [60, 'moderate'],
    [50, 'moderate'],
    [25, 'low'],
  ] as const)('healthIndexBand(%p) = %p', (score, band) => {
    expect(healthIndexBand(score)).toBe(band);
  });
});
