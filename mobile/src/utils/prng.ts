/**
 * Tiny deterministic PRNG (mulberry32) + sampling helpers. Used to synthesise a
 * reproducible research cohort: same seed → identical data on every launch and
 * in tests, so group analytics are stable and verifiable. Never use this for
 * anything security-sensitive — it is a fast, seedable, non-cryptographic RNG.
 */

export type Rng = () => number;

/** Seeded RNG returning a float in [0, 1). Deterministic for a given seed. */
export function mulberry32(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Inclusive integer in [min, max]. */
export function randInt(rng: Rng, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

/** Float in [min, max). */
export function randFloat(rng: Rng, min: number, max: number): number {
  return min + rng() * (max - min);
}

/** Uniformly pick one element (caller guarantees a non-empty array). */
export function pick<T>(rng: Rng, items: readonly T[]): T {
  return items[Math.floor(rng() * items.length)];
}

/** True with the given probability (0–1). */
export function chance(rng: Rng, probability: number): boolean {
  return rng() < probability;
}
