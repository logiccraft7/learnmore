import { createRng, type Rng } from '../../sim/rng'
import type { ConceptId, Problem } from '../types'

export const r2 = (x: number) => Math.round(x * 100) / 100
export const r1 = (x: number) => Math.round(x * 10) / 10
/** "$1.20" */
export const $ = (x: number) => `$${x.toFixed(2)}`
/** Price in cents when under a dollar, otherwise dollars: "35¢", "$2.40". */
export const price = (x: number) => (x < 1 ? `${Math.round(x * 100)}¢` : $(x))

export const NAMES = ['Sal', 'Vinnie', 'Rosie', 'Mickey', 'Dot', 'Lou', 'Frankie', 'Mae', 'Ike', 'Nell', 'Gus', 'Ruth']

export function rngFor(seed: number) {
  return createRng(seed)
}

/** Shuffle choices deterministically; returns the choices and where the right one landed. */
export function shuffleChoices(rng: Rng, right: string, wrong: string[]): { choices: string[]; answer: number } {
  const all = [right, ...wrong.slice(0, 3)]
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(rng.next() * (i + 1))
    ;[all[i], all[j]] = [all[j], all[i]]
  }
  return { choices: all, answer: all.indexOf(right) }
}

/** Two distinct names. */
export function twoNames(rng: Rng): [string, string] {
  const a = rng.pick(NAMES)
  let b = rng.pick(NAMES)
  while (b === a) b = rng.pick(NAMES)
  return [a, b]
}

type Base = Omit<Problem, 'concept' | 'difficulty' | 'seed'>
export const make = (concept: ConceptId, seed: number, difficulty: number, p: Base): Problem => ({ concept, seed, difficulty, ...p })
