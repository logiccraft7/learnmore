import type { Generator } from '../types'
import { make, r1, rngFor, shuffleChoices, twoNames } from './util'

export const base_rates: Generator = (seed, d) => {
  const rng = rngFor(seed)
  const N = rng.pick([1000, 2000, 500])
  const basePct = rng.pick([1, 2, 4, 5, 10])
  const sens = rng.pick([80, 90, 95])
  const fp = rng.pick([5, 10, 20])
  const guilty = (N * basePct) / 100
  const truePos = (guilty * sens) / 100
  const falsePos = ((N - guilty) * fp) / 100
  const setup = `Out of ${N} dockworkers, ${basePct}% are smuggling. Your informant fingers ${sens}% of smugglers, but also wrongly fingers ${fp}% of honest men.`
  if (d === 1)
    return make('base_rates', seed, d, {
      prompt: `${setup} How many of the ${N} are smugglers?`,
      kind: 'number', unit: 'plain', answer: guilty, tolerance: 0.01,
      hint: { nudge: 'Start with real people, not percentages.', method: 'smugglers = total × base rate.' },
      worked: [`${N} × ${basePct}% = ${guilty}`],
    })
  if (d === 2)
    return make('base_rates', seed, d, {
      prompt: `${setup} How many men in total does the informant finger?`,
      kind: 'number', unit: 'plain', answer: truePos + falsePos, tolerance: 0.51,
      hint: { nudge: 'He fingers some guilty men and some innocent ones.', method: 'flagged = smugglers × hit rate + honest × false-alarm rate.' },
      worked: [`Smugglers: ${guilty} × ${sens}% = ${truePos}`, `Honest: ${N - guilty} × ${fp}% = ${falsePos}`, `Total fingered = ${truePos + falsePos}`],
    })
  const answer = r1((truePos / (truePos + falsePos)) * 100)
  return make('base_rates', seed, d, {
    prompt: `${setup} He fingers a man. What's the chance that man is actually a smuggler? (Percent.)`,
    kind: 'number', unit: 'percent', answer, tolerance: 0.15,
    hint: { nudge: 'Most men are honest, so even rare false alarms pile up.', method: 'P(guilty | fingered) = true hits ÷ everyone fingered.' },
    worked: [`Smugglers fingered: ${guilty} × ${sens}% = ${truePos}`, `Honest men fingered: ${N - guilty} × ${fp}% = ${falsePos}`, `${truePos} ÷ ${truePos + falsePos} = ${answer}%`, answer < 50 ? 'Most men he fingers are innocent. The base rate wins.' : 'Here the clue is strong enough to beat the base rate.'],
  })
}

export const prisoners_dilemma: Generator = (seed, d) => {
  const rng = rngFor(seed)
  const [a, b] = twoNames(rng)
  // Years in prison: both silent S, both confess C, lone confessor F (free-ish), lone silent L (the sucker).
  const S = rng.int(1, 2)
  const C = S + rng.int(2, 4)
  const F = rng.int(0, S - 1)
  const L = C + rng.int(3, 8)
  const matrix = `Both stay silent: ${S} yr each. Both confess: ${C} yr each. If one confesses and the other stays silent, the confessor gets ${F} yr and the silent one gets ${L}.`
  if (d <= 2) {
    const other = d === 1 ? 'stay silent' : 'confess'
    const right = 'Confess'
    const { choices, answer } = shuffleChoices(rng, right, ['Stay silent', 'It makes no difference', 'Ask for a lawyer'])
    return make('prisoners_dilemma', seed, d, {
      prompt: `${a} and ${b} are in separate rooms. ${matrix} Suppose ${b} will ${other}. What gives ${a} the fewest years?`,
      kind: 'choice', choices, answer, tolerance: 0,
      hint: { nudge: `Fix ${b}'s choice, then compare ${a}'s two options.`, method: 'Read the payoffs for each of your moves, holding the other player fixed.' },
      worked: [d === 1 ? `If ${b} stays silent: ${a} silent → ${S} yr, ${a} confesses → ${F} yr.` : `If ${b} confesses: ${a} silent → ${L} yr, ${a} confesses → ${C} yr.`, `So ${a} should confess.`],
    })
  }
  if (d === 3) {
    const { choices, answer } = shuffleChoices(rng, 'Confess, whatever the other does', ['Stay silent, whatever the other does', 'Confess only if the other confesses', 'Stay silent only if the other stays silent'])
    return make('prisoners_dilemma', seed, d, {
      prompt: `${matrix} What is ${a}'s dominant strategy?`,
      kind: 'choice', choices, answer, tolerance: 0,
      hint: { nudge: 'A dominant strategy is best no matter what the other player does.', method: 'Check both cases: the other stays silent, the other confesses.' },
      worked: [`If ${b} is silent: confess (${F}) beats silent (${S}).`, `If ${b} confesses: confess (${C}) beats silent (${L}).`, 'Confessing is better either way, so it is dominant, even though both silent would be better for the pair.'],
    })
  }
  if (d === 4)
    return make('prisoners_dilemma', seed, d, {
      prompt: `${matrix} If both play their dominant strategy, how many years do ${a} and ${b} serve in total?`,
      kind: 'number', unit: 'plain', answer: 2 * C, tolerance: 0.01,
      hint: { nudge: 'Find what each one rationally does, then add.', method: 'Both confess, the equilibrium, so total = 2 × (both-confess years).' },
      worked: ['Each one\'s dominant strategy is to confess.', `Total = ${C} + ${C} = ${2 * C} years`, `Had both stayed silent: ${2 * S}. Individually rational, collectively worse.`],
    })
  // You're the detective designing the deal: how short must the lone confessor's sentence be?
  const S2 = rng.int(1, 3)
  const C2 = S2 + rng.int(2, 4)
  const L2 = C2 + rng.int(2, 6)
  const answer = S2 - 1
  return make('prisoners_dilemma', seed, d, {
    prompt: `You're designing the DA's offer. Both silent: ${S2} yr each (you can't prove more). Both confess: ${C2} yr each. A lone silent man gets ${L2}. What's the LONGEST whole-year sentence you can promise a lone confessor so that confessing beats silence no matter what the partner does?`,
    kind: 'number', unit: 'plain', answer, tolerance: 0.01,
    hint: { nudge: 'Confessing already wins when the partner confesses. Check the other case.', method: `If the partner stays silent, confessing must beat ${S2} yr: offer < ${S2}.` },
    worked: [`Partner confesses: confess ${C2} < silent ${L2}. Already fine.`, `Partner silent: need offer < ${S2} yr.`, `Longest whole number: ${answer} yr`],
  })
}
