import type { AnswerUnit, Problem } from './types'

/** Read a typed number: "1.2", "$1.20", "120¢", "20%", "3/4", "1,200", "-5". Returns null if unreadable. */
export function parseNumber(input: string): { value: number; percent: boolean; cents: boolean } | null {
  let s = input.trim().toLowerCase().replace(/,/g, '').replace(/\s+/g, '')
  if (!s) return null
  const percent = s.endsWith('%')
  const cents = s.endsWith('¢') || s.endsWith('c') || s.endsWith('cents')
  s = s.replace(/^\$/, '').replace(/(%|¢|cents|c)$/, '').replace(/^\$/, '')
  let value: number
  const frac = s.match(/^(-?\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)$/)
  if (frac) {
    const den = Number(frac[2])
    if (den === 0) return null
    value = Number(frac[1]) / den
  } else {
    if (!/^-?(\d+\.?\d*|\.\d+)$/.test(s)) return null
    value = Number(s)
  }
  if (!Number.isFinite(value)) return null
  return { value: cents ? value / 100 : value, percent, cents }
}

/** Candidate readings of a typed answer for a given unit (e.g. 0.25 and 25 are both "25%"). */
function readings(parsed: NonNullable<ReturnType<typeof parseNumber>>, unit: AnswerUnit | undefined): number[] {
  if (unit === 'percent') return parsed.percent ? [parsed.value] : [parsed.value, parsed.value * 100]
  return [parsed.value]
}

const CHOICE_KEYS = ['a', 'b', 'c', 'd', 'e']

/** Is this typed answer right? Choice problems accept a letter (A–D) or a number (1–4). */
export function isCorrect(p: Problem, input: string): boolean {
  if (p.kind === 'choice') {
    const s = input.trim().toLowerCase()
    const idx = CHOICE_KEYS.indexOf(s) >= 0 ? CHOICE_KEYS.indexOf(s) : Number(s) - 1
    return idx === p.answer
  }
  const parsed = parseNumber(input)
  if (!parsed) return false
  return readings(parsed, p.unit).some((v) => Math.abs(v - p.answer) <= p.tolerance + 1e-9)
}

/** How the right answer is written back to the player. */
export function formatAnswer(p: Problem): string {
  if (p.kind === 'choice') return `${CHOICE_KEYS[p.answer].toUpperCase()}. ${p.choices![p.answer]}`
  if (p.unit === 'money') return `$${p.answer.toFixed(2)}`
  if (p.unit === 'percent') return `${round(p.answer)}%`
  return String(round(p.answer))
}

export const round = (x: number, dp = 2) => Math.round(x * 10 ** dp) / 10 ** dp
