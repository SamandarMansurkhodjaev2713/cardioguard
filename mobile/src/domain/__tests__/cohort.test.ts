import { generateCohortMembers, summariseCohort, summariseGroup } from '../cohort';
import { mulberry32, randInt } from '../../utils/prng';

const CONFIG = { groups: ['group1', 'group2', 'group3'] as const, perGroup: 10 };
const gen = (seed: number) => generateCohortMembers(mulberry32(seed), CONFIG);

describe('mulberry32', () => {
  it('GIVEN the same seed THEN reproduces the same sequence', () => {
    const a = mulberry32(123);
    const b = mulberry32(123);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });

  it('GIVEN different seeds THEN diverges', () => {
    expect(mulberry32(1)()).not.toBe(mulberry32(2)());
  });

  it('randInt stays within the inclusive bounds', () => {
    const rng = mulberry32(7);
    for (let i = 0; i < 200; i += 1) {
      const n = randInt(rng, 3, 8);
      expect(n).toBeGreaterThanOrEqual(3);
      expect(n).toBeLessThanOrEqual(8);
    }
  });
});

describe('generateCohortMembers', () => {
  it('is deterministic for a fixed seed', () => {
    expect(gen(42)).toEqual(gen(42));
  });

  it('produces groups × perGroup members across the configured groups', () => {
    const members = gen(42);
    expect(members).toHaveLength(CONFIG.groups.length * CONFIG.perGroup);
    expect(new Set(members.map((m) => m.group))).toEqual(new Set(CONFIG.groups));
  });

  it('derives self-consistent records (bmi from height/weight, valid enums)', () => {
    for (const m of gen(99)) {
      expect(m.bmi).toBeGreaterThan(0);
      expect(['low', 'moderate', 'high', 'veryHigh']).toContain(m.riskCategory);
      expect(m.adherencePercent).toBeGreaterThanOrEqual(0);
      expect(m.adherencePercent).toBeLessThanOrEqual(100);
    }
  });
});

describe('summariseCohort', () => {
  it('risk distribution sums to the member count', () => {
    const members = gen(42);
    const summary = summariseCohort(members);
    expect(summary.count).toBe(members.length);
    expect(summary.riskDistribution.reduce((s, d) => s + d.value, 0)).toBe(members.length);
  });

  it('groups partition the cohort (per-group counts sum to total)', () => {
    const summary = summariseCohort(gen(42));
    expect(summary.groups).toHaveLength(CONFIG.groups.length);
    expect(summary.groups.reduce((s, g) => s + g.count, 0)).toBe(summary.count);
  });

  it('at-risk count equals the high + veryHigh members', () => {
    const members = gen(42);
    const summary = summariseCohort(members);
    const expected = members.filter((m) => m.riskCategory === 'high' || m.riskCategory === 'veryHigh').length;
    expect(summary.atRiskCount).toBe(expected);
  });

  it('summariseGroup computes percentages in [0, 100]', () => {
    const members = gen(42).filter((m) => m.group === 'group1');
    const stats = summariseGroup('group1', members);
    expect(stats.hypertensionPercent).toBeGreaterThanOrEqual(0);
    expect(stats.hypertensionPercent).toBeLessThanOrEqual(100);
    expect(stats.count).toBe(members.length);
  });
});
