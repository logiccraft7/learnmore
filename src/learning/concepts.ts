import type { ConceptId, VoiceId } from './types'

export type Concept = { id: ConceptId; name: string; voice: VoiceId; prereqs: ConceptId[]; blurb: string }

export const CONCEPTS: readonly Concept[] = [
  { id: 'arithmetic', name: 'Street arithmetic', voice: 'logician', prereqs: [], blurb: 'Totals, change and splits, in your head, fast.' },
  { id: 'fractions_percent', name: 'Fractions & percents', voice: 'logician', prereqs: ['arithmetic'], blurb: 'Parts of a whole, discounts, mark-ups, percent change.' },
  { id: 'ratio_proportion', name: 'Ratio & proportion', voice: 'logician', prereqs: ['fractions_percent'], blurb: 'Recipes, dilution, scaling up and down.' },
  { id: 'linear_eq', name: 'Linear equations', voice: 'logician', prereqs: ['ratio_proportion'], blurb: 'Find the unknown: break-even, budgets, two suppliers.' },
  { id: 'probability', name: 'Probability', voice: 'logician', prereqs: ['fractions_percent'], blurb: 'Dice, cards and the chance of getting caught.' },
  { id: 'unit_price', name: 'Unit price', voice: 'economist', prereqs: ['ratio_proportion'], blurb: 'Which deal is actually cheaper per gallon.' },
  { id: 'profit_margin', name: 'Profit, margin & markup', voice: 'economist', prereqs: ['fractions_percent'], blurb: 'What you keep, and how to price for it.' },
  { id: 'opportunity_cost', name: 'Opportunity cost', voice: 'economist', prereqs: [], blurb: 'The real price of a choice is the best thing you gave up.' },
  { id: 'supply_demand', name: 'Supply & demand', voice: 'economist', prereqs: ['linear_eq'], blurb: 'Where the curves cross, and what shocks do to it.' },
  { id: 'marginal_thinking', name: 'Thinking at the margin', voice: 'economist', prereqs: ['profit_margin'], blurb: 'Is one more runner, one more crate, worth it?' },
  { id: 'expected_value', name: 'Expected value', voice: 'economist', prereqs: ['probability'], blurb: 'Bets, bribes and risks, weighed by their odds.' },
  { id: 'anchoring', name: 'Anchoring', voice: 'empath', prereqs: [], blurb: 'The first number spoken bends every number after it.' },
  { id: 'reciprocity', name: 'Reciprocity', voice: 'empath', prereqs: [], blurb: 'People pay back what you give them, even small things.' },
  { id: 'base_rates', name: 'Base rates', voice: 'skeptic', prereqs: ['probability'], blurb: "A 'reliable' clue can still point at the wrong man." },
  { id: 'prisoners_dilemma', name: "Prisoner's dilemma", voice: 'skeptic', prereqs: ['expected_value'], blurb: 'Why partners in crime rat each other out.' },
]

export const concept = (id: ConceptId) => CONCEPTS.find((c) => c.id === id)!

export const VOICES: Record<VoiceId, { name: string; title: string; color: string }> = {
  logician: { name: 'The Logician', title: 'numbers, proportions, odds', color: '#7fb2d9' },
  economist: { name: 'The Economist', title: 'prices, profit, trade-offs', color: '#d9b45a' },
  empath: { name: 'The Empath', title: 'what people want and fear', color: '#d97a8a' },
  skeptic: { name: 'The Skeptic', title: 'evidence, odds, betrayal', color: '#9ad08f' },
}
