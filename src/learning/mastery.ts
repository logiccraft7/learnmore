import { CONCEPTS } from './concepts'
import type { ConceptId } from './types'

export type Mastery = {
  rating: number
  attempts: number
  correct: number
  streak: number
  /** Index into REVIEW_HOURS; -1 before the first correct answer. */
  stage: number
  /** Real-world time (ms) when this concept is next due for review. */
  dueAt: number
  history: number[]
}
export type Learning = Partial<Record<ConceptId, Mastery>>

export const START_RATING = 1000
const K = 64
/** Spaced-repetition ladder: 10 min, 1 h, 8 h, 1 day, 3 days, 1 week, 3 weeks. */
export const REVIEW_HOURS = [1 / 6, 1, 8, 24, 72, 168, 504]
const LEVELS = [1080, 1160, 1250, 1350, 1450]
const TARGET_SUCCESS = 0.75

export const fresh = (): Mastery => ({ rating: START_RATING, attempts: 0, correct: 0, streak: 0, stage: -1, dueAt: 0, history: [START_RATING] })

/** How hard a problem of this difficulty is, on the same scale as the player's rating. */
export const itemRating = (difficulty: number) => 700 + 150 * difficulty
export const expectedSuccess = (rating: number, difficulty: number) => 1 / (1 + 10 ** ((itemRating(difficulty) - rating) / 400))

/** 0–5 stars. */
export const level = (m: Mastery | undefined) => (m ? LEVELS.filter((t) => m.rating >= t).length : 0)

/** The difficulty (1–5) the player should get right about 75% of the time. */
export function targetDifficulty(m: Mastery | undefined): number {
  const r = m?.rating ?? START_RATING
  let best = 1
  for (let d = 1; d <= 5; d++) if (Math.abs(expectedSuccess(r, d) - TARGET_SUCCESS) < Math.abs(expectedSuccess(r, best) - TARGET_SUCCESS)) best = d
  return best
}

/**
 * Update a concept after an answer. A hint halves the reward. Misses cost a bit less than a pure Elo
 * update would, so one slip doesn't wipe out a run of good answers.
 */
export function recordResult(m: Mastery | undefined, difficulty: number, correct: boolean, hinted: boolean, now: number): Mastery {
  const prev = m ?? fresh()
  const expected = expectedSuccess(prev.rating, difficulty)
  const k = correct ? (hinted ? K / 2 : K) : K * 0.6
  const rating = Math.round(prev.rating + k * ((correct ? 1 : 0) - expected))
  const stage = correct ? Math.min(prev.stage + 1, REVIEW_HOURS.length - 1) : 0
  return {
    rating,
    attempts: prev.attempts + 1,
    correct: prev.correct + (correct ? 1 : 0),
    streak: correct ? prev.streak + 1 : 0,
    stage,
    dueAt: now + REVIEW_HOURS[Math.max(0, stage)] * 3_600_000,
    history: [...prev.history, rating].slice(-20),
  }
}

export const isDue = (m: Mastery | undefined, now: number) => !!m && m.attempts > 0 && m.dueAt <= now

/** A concept opens once every prerequisite has at least one star. */
export function isUnlocked(id: ConceptId, learning: Learning): boolean {
  const c = CONCEPTS.find((x) => x.id === id)!
  return c.prereqs.every((p) => level(learning[p]) >= 1)
}

export const dueConcepts = (learning: Learning, now: number) =>
  CONCEPTS.filter((c) => isUnlocked(c.id, learning) && isDue(learning[c.id], now)).map((c) => c.id)
