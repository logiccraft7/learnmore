/** Small, fast, seedable PRNG (mulberry32). Same seed → same sequence on every device. */
export type Rng = {
  next(): number
  range(min: number, max: number): number
  int(min: number, maxInclusive: number): number
  pick<T>(items: readonly T[]): T
  chance(p: number): boolean
}

export function createRng(seed: number): Rng {
  let a = seed >>> 0
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  return {
    next,
    range: (min, max) => min + (max - min) * next(),
    int: (min, maxInclusive) => min + Math.floor(next() * (maxInclusive - min + 1)),
    pick: (items) => items[Math.floor(next() * items.length)],
    chance: (p) => next() < p,
  }
}

/** Derive a stable child seed from a parent seed and a label. */
export function deriveSeed(seed: number, label: string): number {
  let h = seed ^ 0x9e3779b9
  for (let i = 0; i < label.length; i++) h = Math.imul(h ^ label.charCodeAt(i), 0x85ebca6b)
  return (h ^ (h >>> 13)) >>> 0
}
