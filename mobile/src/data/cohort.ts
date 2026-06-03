/**
 * Demo research cohort instance. Generated once from a fixed seed so the
 * doctor's collective analytics are reproducible across launches. The pure
 * generation/aggregation lives in {@link file://../domain/cohort.ts}; this
 * module just pins the seed and exposes the materialised members + summary.
 */

import {
  generateCohortMembers,
  summariseCohort,
  type CohortMember,
  type CohortSummary,
} from '../domain/cohort';
import { mulberry32 } from '../utils/prng';

/** Fixed seed → deterministic cohort. */
const COHORT_SEED = 0x5eed_c0de;

export const COHORT_GROUPS = ['group1', 'group2', 'group3'] as const;
export type CohortGroupKey = (typeof COHORT_GROUPS)[number];

const MEMBERS_PER_GROUP = 14;

export const DEMO_COHORT: readonly CohortMember[] = generateCohortMembers(mulberry32(COHORT_SEED), {
  groups: COHORT_GROUPS,
  perGroup: MEMBERS_PER_GROUP,
});

export const DEMO_COHORT_SUMMARY: CohortSummary = summariseCohort(DEMO_COHORT);
