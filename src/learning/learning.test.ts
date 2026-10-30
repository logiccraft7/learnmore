import { describe, expect, it } from 'vitest'
import { CONCEPTS } from './concepts'
import { GENERATORS, generate } from './generators'
import { dueConcepts, fresh, isUnlocked, level, recordResult, REVIEW_HOURS, targetDifficulty, type Learning } from './mastery'
import { formatAnswer, isCorrect, parseNumber } from './parse'
import { planSession } from './session'
import { hintFor, voiceLevel } from './voices'
import type { ConceptId } from './types'

const answerText = (p: ReturnType<typeof generate>) => (p.kind === 'choice' ? 'ABCD'[p.answer] : String(p.answer))

describe('problem generators', () => {
  for (const id of Object.keys(GENERATORS) as ConceptId[]) {
    it(`${id}: 400 seeds × 5 difficulties produce valid, checkable problems`, () => {
      for (let d = 1; d <= 5; d++) {
        for (let seed = 1; seed <= 400; seed++) {
          const p = generate(id, seed * 7919, d)
          const where = `${id} d${d} seed${seed}: ${p.prompt}`
          expect(p.prompt, where).not.toMatch(/NaN|undefined|Infinity/)
          expect(p.worked.length, where).toBeGreaterThan(0)
          for (const line of p.worked) expect(line, where).not.toMatch(/NaN|undefined|Infinity/)
          expect(Number.isFinite(p.answer), where).toBe(true)
          expect(isCorrect(p, answerText(p)), where).toBe(true)
          expect(isCorrect(p, formatAnswer(p).split('.')[0] === formatAnswer(p) ? formatAnswer(p) : answerText(p)), where).toBe(true)
          if (p.kind === 'choice') {
            expect(new Set(p.choices).size, where).toBe(p.choices!.length)
            expect(p.answer, where).toBeGreaterThanOrEqual(0)
            expect(p.answer, where).toBeLessThan(p.choices!.length)
            expect(isCorrect(p, 'ABCD'[(p.answer + 1) % p.choices!.length]), where).toBe(false)
          } else {
            const wrong = p.answer + Math.max(1, Math.abs(p.answer) * 0.5)
            expect(isCorrect(p, String(wrong)), where).toBe(false)
          }
        }
      }
    })
    it(`${id}: same seed, same problem`, () => {
      expect(generate(id, 42, 3)).toEqual(generate(id, 42, 3))
    })
  }
})

describe('answer parsing', () => {
  it('reads the ways people write numbers', () => {
    expect(parseNumber('1.2')?.value).toBe(1.2)
    expect(parseNumber('$1.20')?.value).toBe(1.2)
    expect(parseNumber('120¢')?.value).toBeCloseTo(1.2)
    expect(parseNumber('120c')?.value).toBeCloseTo(1.2)
    expect(parseNumber('20%')).toMatchObject({ value: 20, percent: true })
    expect(parseNumber('3/4')?.value).toBe(0.75)
    expect(parseNumber('1,200')?.value).toBe(1200)
    expect(parseNumber('-5')?.value).toBe(-5)
    expect(parseNumber('.5')?.value).toBe(0.5)
    expect(parseNumber('abc')).toBeNull()
    expect(parseNumber('')).toBeNull()
  })
  it('accepts a percent written as a fraction of one', () => {
    const p = generate('fractions_percent', 3, 2)
    expect(isCorrect(p, String(p.answer / 100))).toBe(true)
    expect(isCorrect(p, `${p.answer}%`)).toBe(true)
  })
})

describe('mastery and spaced repetition', () => {
  const now = 1_000_000
  it('rises on a right answer and falls on a wrong one; a hint halves the gain', () => {
    const up = recordResult(undefined, 1, true, false, now)
    const hinted = recordResult(undefined, 1, true, true, now)
    const down = recordResult(undefined, 1, false, false, now)
    expect(up.rating).toBeGreaterThan(fresh().rating)
    expect(Math.abs(hinted.rating - fresh().rating - (up.rating - fresh().rating) / 2)).toBeLessThanOrEqual(1)
    expect(down.rating).toBeLessThan(fresh().rating)
  })
  it('spaces reviews further apart with each success and resets on a miss', () => {
    let m = recordResult(undefined, 1, true, false, now)
    const gaps = [m.dueAt - now]
    for (let i = 0; i < 4; i++) {
      m = recordResult(m, 1, true, false, now)
      gaps.push(m.dueAt - now)
    }
    for (let i = 1; i < gaps.length; i++) expect(gaps[i]).toBeGreaterThan(gaps[i - 1])
    m = recordResult(m, 1, false, false, now)
    expect(m.dueAt - now).toBe(REVIEW_HOURS[0] * 3_600_000)
  })
  it('targets harder problems as the rating climbs', () => {
    let m = fresh()
    const start = targetDifficulty(m)
    for (let i = 0; i < 30; i++) m = recordResult(m, targetDifficulty(m), true, false, now)
    expect(targetDifficulty(m)).toBeGreaterThan(start)
    expect(level(m)).toBe(5)
  })
  it('unlocks a concept once its prerequisites have a star', () => {
    const learning: Learning = {}
    expect(isUnlocked('fractions_percent', learning)).toBe(false)
    expect(isUnlocked('arithmetic', learning)).toBe(true)
    let m = fresh()
    while (level(m) < 1) m = recordResult(m, 1, true, false, now)
    learning.arithmetic = m
    expect(isUnlocked('fractions_percent', learning)).toBe(true)
  })
})

describe('sessions and voices', () => {
  const now = 5_000_000
  it('puts due reviews first and never repeats a concept back to back', () => {
    const learning: Learning = { arithmetic: { ...fresh(), attempts: 3, dueAt: now - 1000 }, anchoring: { ...fresh(), attempts: 2, dueAt: now + 99999 } }
    expect(dueConcepts(learning, now)).toEqual(['arithmetic'])
    const plan = planSession({ kind: 'review' }, learning, now)
    expect(plan[0]).toBe('arithmetic')
    expect(plan.length).toBe(8)
    for (let i = 1; i < plan.length; i++) expect(plan[i]).not.toBe(plan[i - 1])
    for (const id of plan) expect(isUnlocked(id, learning)).toBe(true)
  })
  it('gives deeper hints as a voice levels up', () => {
    const p = generate('ratio_proportion', 9, 3)
    expect(hintFor(p, {}).lines.length).toBe(1)
    const strong: Learning = {}
    for (const c of CONCEPTS) strong[c.id] = { ...fresh(), rating: 1300 }
    expect(voiceLevel('logician', strong)).toBe(3)
    expect(hintFor(p, strong).lines.length).toBe(3)
  })
})
