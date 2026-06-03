import { generateRecommendations, type RecommendationContext } from '../riskEngine';
import { makeMeasurement, makeProfile } from '../../testing/factories';
import type { Recommendation } from '../types';

function ctx(overrides: Partial<RecommendationContext> = {}): RecommendationContext {
  return {
    profile: makeProfile(),
    latest: makeMeasurement({ bmi: 22, systolicBp: 120, diastolicBp: 78, sleepHours: 7, physicalActivityMinutes: 30 }),
    adherencePercent: 100,
    riskPercent: 2,
    riskCategory: 'low',
    ...overrides,
  };
}

const ids = (recs: Recommendation[]) => recs.map((r) => r.id);

describe('generateRecommendations', () => {
  it('GIVEN a healthy snapshot THEN produces no recommendations', () => {
    expect(generateRecommendations(ctx())).toHaveLength(0);
  });

  it('GIVEN elevated BP THEN includes bpHigh with the reading params', () => {
    const recs = generateRecommendations(ctx({ latest: makeMeasurement({ systolicBp: 150, diastolicBp: 95, bmi: 22 }) }));
    expect(ids(recs)).toContain('bpHigh');
    expect(recs.find((r) => r.id === 'bpHigh')?.params).toEqual({ systolic: 150, diastolic: 95 });
  });

  it('GIVEN obese vs overweight BMI THEN picks exactly one weight rec', () => {
    expect(ids(generateRecommendations(ctx({ latest: makeMeasurement({ bmi: 31 }) })))).toContain('weightObese');
    expect(ids(generateRecommendations(ctx({ latest: makeMeasurement({ bmi: 27 }) })))).toContain('weightOverweight');
    expect(ids(generateRecommendations(ctx({ latest: makeMeasurement({ bmi: 31 }) })))).not.toContain('weightOverweight');
  });

  it('GIVEN a current smoker THEN includes smoking', () => {
    expect(ids(generateRecommendations(ctx({ profile: makeProfile({ smokingStatus: 'current' }) })))).toContain('smoking');
  });

  it('GIVEN shift work THEN includes shiftWork', () => {
    expect(ids(generateRecommendations(ctx({ profile: makeProfile({ workScheduleType: 'night' }) })))).toContain('shiftWork');
  });

  it('GIVEN low adherence THEN includes adherence', () => {
    expect(ids(generateRecommendations(ctx({ adherencePercent: 65 })))).toContain('adherence');
  });

  it('GIVEN diabetes THEN includes diabetes', () => {
    expect(ids(generateRecommendations(ctx({ profile: makeProfile({ diabetesStatus: 'yes' }) })))).toContain('diabetes');
  });

  it('GIVEN low activity THEN includes physicalActivity', () => {
    expect(ids(generateRecommendations(ctx({ profile: makeProfile({ physicalActivityLevel: 'low' }) })))).toContain('physicalActivity');
  });

  it('GIVEN risk at/above the threshold THEN includes highRiskCvd', () => {
    const recs = generateRecommendations(ctx({ riskPercent: 8, riskCategory: 'high' }));
    expect(ids(recs)).toContain('highRiskCvd');
    expect(recs.find((r) => r.id === 'highRiskCvd')?.priority).toBe('high');
  });

  it('GIVEN disturbed sleep THEN includes sleepHygiene', () => {
    expect(ids(generateRecommendations(ctx({ profile: makeProfile({ sleepQuality: 'disturbed' }) })))).toContain('sleepHygiene');
  });

  it('is deterministic (same context → same output)', () => {
    const c = ctx({ latest: makeMeasurement({ systolicBp: 150, diastolicBp: 95, bmi: 31 }) });
    expect(generateRecommendations(c)).toEqual(generateRecommendations(c));
  });
});
