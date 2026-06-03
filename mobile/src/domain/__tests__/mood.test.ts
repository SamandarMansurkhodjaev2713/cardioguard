import {
  classifyMoodState,
  daysUntilNextMoodSurvey,
  isMoodSurveyDue,
  latestMoodEntry,
  moodSeverityTotal,
  wellbeingBand,
  wellbeingScore,
} from '../mood';
import { makeMoodEntry } from '../../testing/factories';

const NOW = new Date('2026-06-15T12:00:00.000Z');
const iso = (daysAgo: number) => new Date(NOW.getTime() - daysAgo * 24 * 60 * 60 * 1000).toISOString();

describe('wellbeingScore', () => {
  it('GIVEN all dimensions zero THEN scores 100', () => {
    const entry = makeMoodEntry({ lowMood: 0, anxiety: 0, stress: 0, emotionalInstability: 0, sleepProblems: 0, fatigue: 0 });
    expect(wellbeingScore(entry)).toBe(100);
    expect(moodSeverityTotal(entry)).toBe(0);
  });

  it('GIVEN all dimensions maxed THEN scores 0', () => {
    const entry = makeMoodEntry({ lowMood: 4, anxiety: 4, stress: 4, emotionalInstability: 4, sleepProblems: 4, fatigue: 4 });
    expect(wellbeingScore(entry)).toBe(0);
  });

  it('GIVEN out-of-range values THEN clamps before scoring', () => {
    const entry = makeMoodEntry({ lowMood: 99, anxiety: -5, stress: 0, emotionalInstability: 0, sleepProblems: 0, fatigue: 0 });
    // lowMood clamps to 4, anxiety to 0 → total 4 of 24 → ~83
    expect(wellbeingScore(entry)).toBe(83);
  });

  it.each([
    [100, 'good'],
    [75, 'good'],
    [60, 'moderate'],
    [50, 'moderate'],
    [30, 'low'],
  ] as const)('GIVEN score %p THEN band %p', (score, band) => {
    expect(wellbeingBand(score)).toBe(band);
  });
});

describe('classifyMoodState', () => {
  it('GIVEN low severities THEN normal', () => {
    expect(classifyMoodState(makeMoodEntry({ stress: 1, anxiety: 1 }))).toBe('normal');
  });

  it('GIVEN severe anxiety only THEN elevatedAnxiety', () => {
    expect(classifyMoodState(makeMoodEntry({ anxiety: 4 }))).toBe('elevatedAnxiety');
  });

  it('GIVEN severe stress THEN chronicStress (takes priority over anxiety)', () => {
    expect(classifyMoodState(makeMoodEntry({ stress: 4, anxiety: 4 }))).toBe('chronicStress');
  });

  it('GIVEN the exhaustion triad THEN burnout (takes top priority)', () => {
    const entry = makeMoodEntry({ fatigue: 4, emotionalInstability: 3, lowMood: 3, stress: 4 });
    expect(classifyMoodState(entry)).toBe('burnout');
  });

  it('GIVEN high fatigue but stable mood THEN not burnout', () => {
    const entry = makeMoodEntry({ fatigue: 4, emotionalInstability: 1, lowMood: 1 });
    expect(classifyMoodState(entry)).toBe('normal');
  });
});

describe('survey cadence', () => {
  it('GIVEN no entries THEN due now', () => {
    expect(isMoodSurveyDue([], NOW)).toBe(true);
    expect(daysUntilNextMoodSurvey([], NOW)).toBe(0);
  });

  it('GIVEN a check-in 3 days ago THEN not due, 4 days remaining', () => {
    const entries = [makeMoodEntry({ date: iso(3) })];
    expect(isMoodSurveyDue(entries, NOW)).toBe(false);
    expect(daysUntilNextMoodSurvey(entries, NOW)).toBe(4);
  });

  it('GIVEN a check-in 7+ days ago THEN due again', () => {
    expect(isMoodSurveyDue([makeMoodEntry({ date: iso(8) })], NOW)).toBe(true);
  });

  it('latestMoodEntry returns the newest regardless of array order', () => {
    const entries = [makeMoodEntry({ id: 'old', date: iso(10) }), makeMoodEntry({ id: 'new', date: iso(1) })];
    expect(latestMoodEntry(entries)?.id).toBe('new');
  });
});
