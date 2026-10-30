import { deriveSeed } from '../sim/rng'
import { CONCEPTS } from './concepts'
import { generate } from './generators'
import { isDue, isUnlocked, targetDifficulty, type Learning } from './mastery'
import type { ConceptId, Problem } from './types'

export type SessionMode = { kind: 'review' } | { kind: 'weakest' } | { kind: 'drill'; concept: ConceptId }

export const SESSION_LENGTH = 8

/** The concepts for a session, in order. */
export function planSession(mode: SessionMode, learning: Learning, now: number, length = SESSION_LENGTH): ConceptId[] {
  if (mode.kind === 'drill') return Array(length).fill(mode.concept)
  const open = CONCEPTS.filter((c) => isUnlocked(c.id, learning)).map((c) => c.id)
  const due = open.filter((id) => isDue(learning[id], now)).sort((a, b) => learning[a]!.dueAt - learning[b]!.dueAt)
  const rating = (id: ConceptId) => learning[id]?.rating ?? -1 // never tried counts as weakest
  const weakest = [...open].sort((a, b) => rating(a) - rating(b))
  const picks = mode.kind === 'review' ? [...due, ...weakest.filter((id) => !due.includes(id))] : weakest
  // Use the top few, cycling, and interleave so the same concept never comes twice in a row.
  const pool = picks.slice(0, Math.max(2, Math.min(picks.length, 4)))
  const out: ConceptId[] = []
  for (let i = 0; out.length < length && pool.length; i++) {
    const next = pool[i % pool.length]
    if (out[out.length - 1] === next && pool.length > 1) continue
    out.push(next)
  }
  return out
}

/** Turn a plan into concrete problems at each concept's target difficulty. */
export function buildProblems(plan: ConceptId[], learning: Learning, seed: number): Problem[] {
  return plan.map((id, i) => generate(id, deriveSeed(seed, `${id}-${learning[id]?.attempts ?? 0}-${i}`), targetDifficulty(learning[id])))
}
