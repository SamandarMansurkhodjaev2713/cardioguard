import { evaluateAlerts, type AlertContext, type AlertDraft } from '../alertEngine';
import { makeMeasurement, makeMedicationLog } from '../../testing/factories';

const NOW = new Date('2026-06-10T12:00:00.000Z');

function daysAgoIso(days: number): string {
  const d = new Date(NOW);
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

const types = (drafts: AlertDraft[]) => drafts.map((d) => d.type);

function ctx(overrides: Partial<AlertContext> = {}): AlertContext {
  return {
    measurements: [makeMeasurement({ id: 'm0', date: daysAgoIso(0), systolicBp: 120, diastolicBp: 78, bmi: 24, weightKg: 80 })],
    medicationLogs: [],
    riskPercent: 2,
    riskCategory: 'low',
    ...overrides,
  };
}

describe('evaluateAlerts', () => {
  it('GIVEN no measurements THEN returns no drafts', () => {
    expect(evaluateAlerts(ctx({ measurements: [] }), NOW)).toEqual([]);
  });

  it('GIVEN a healthy latest reading THEN returns no drafts', () => {
    expect(evaluateAlerts(ctx(), NOW)).toEqual([]);
  });

  it('GIVEN an acute elevated reading THEN raises bloodPressure', () => {
    const drafts = evaluateAlerts(ctx({ measurements: [makeMeasurement({ date: daysAgoIso(0), systolicBp: 152, diastolicBp: 96, bmi: 24 })] }), NOW);
    const bp = drafts.find((d) => d.type === 'bloodPressure');
    expect(bp?.params).toEqual({ systolic: 152, diastolic: 96 });
  });

  it('GIVEN 2+ elevated readings in the window THEN raises repeatedBloodPressure', () => {
    const drafts = evaluateAlerts(
      ctx({
        measurements: [
          makeMeasurement({ id: 'a', date: daysAgoIso(0), systolicBp: 150, diastolicBp: 95, bmi: 24 }),
          makeMeasurement({ id: 'b', date: daysAgoIso(3), systolicBp: 145, diastolicBp: 92, bmi: 24 }),
        ],
      }),
      NOW,
    );
    expect(types(drafts)).toContain('repeatedBloodPressure');
    expect(drafts.find((d) => d.type === 'repeatedBloodPressure')?.params).toEqual({ count: 2 });
  });

  it('GIVEN a >=2kg gain vs previous THEN raises rapidWeight', () => {
    const drafts = evaluateAlerts(
      ctx({
        measurements: [
          makeMeasurement({ id: 'a', date: daysAgoIso(0), weightKg: 84, bmi: 24 }),
          makeMeasurement({ id: 'b', date: daysAgoIso(1), weightKg: 81, bmi: 24 }),
        ],
      }),
      NOW,
    );
    expect(types(drafts)).toContain('rapidWeight');
    expect(drafts.find((d) => d.type === 'rapidWeight')?.params).toEqual({ delta: 3 });
  });

  it('GIVEN a worsened BMI category vs the earliest reading THEN raises bmiWorsening', () => {
    const drafts = evaluateAlerts(
      ctx({
        measurements: [
          makeMeasurement({ id: 'a', date: daysAgoIso(0), bmi: 31, weightKg: 95 }),
          makeMeasurement({ id: 'b', date: daysAgoIso(14), bmi: 24, weightKg: 74 }),
        ],
      }),
      NOW,
    );
    expect(types(drafts)).toContain('bmiWorsening');
  });

  it('GIVEN adherence below the floor THEN raises lowAdherence', () => {
    const logs = [
      makeMedicationLog({ id: 'a', status: 'taken' }),
      makeMedicationLog({ id: 'b', status: 'missed', actualTime: null }),
      makeMedicationLog({ id: 'c', status: 'missed', actualTime: null }),
    ];
    expect(types(evaluateAlerts(ctx({ medicationLogs: logs }), NOW))).toEqual(expect.arrayContaining(['lowAdherence', 'medicationAdherence']));
  });

  it('GIVEN a high risk category THEN raises highCvdRisk with the percent', () => {
    const drafts = evaluateAlerts(ctx({ riskPercent: 12, riskCategory: 'veryHigh' }), NOW);
    expect(drafts.find((d) => d.type === 'highCvdRisk')?.params).toEqual({ percent: 12 });
  });

  it('GIVEN the latest reading older than the window THEN raises noMeasurements (uses injected now)', () => {
    const drafts = evaluateAlerts(ctx({ measurements: [makeMeasurement({ date: daysAgoIso(9), bmi: 24, systolicBp: 120, diastolicBp: 78 })] }), NOW);
    expect(types(drafts)).toContain('noMeasurements');
  });

  it('GIVEN no mood state THEN raises no psychDistress', () => {
    expect(types(evaluateAlerts(ctx(), NOW))).not.toContain('psychDistress');
  });

  it('GIVEN a normal mood state THEN raises no psychDistress', () => {
    expect(types(evaluateAlerts(ctx({ latestMoodState: 'normal' }), NOW))).not.toContain('psychDistress');
  });

  it('GIVEN elevated anxiety THEN raises a warn psychDistress', () => {
    const draft = evaluateAlerts(ctx({ latestMoodState: 'elevatedAnxiety' }), NOW).find((d) => d.type === 'psychDistress');
    expect(draft?.severity).toBe('warn');
    expect(draft?.params).toEqual({ state: 'elevatedAnxiety' });
  });

  it('GIVEN burnout THEN raises a high-severity psychDistress', () => {
    const draft = evaluateAlerts(ctx({ latestMoodState: 'burnout' }), NOW).find((d) => d.type === 'psychDistress');
    expect(draft?.severity).toBe('high');
  });
});
