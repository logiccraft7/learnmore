import type { ConceptId, Generator, Problem } from '../types'
import { arithmetic, fractions_percent, linear_eq, probability, ratio_proportion } from './logician'
import { expected_value, marginal_thinking, opportunity_cost, profit_margin, supply_demand, unit_price } from './economist'
import { anchoring, reciprocity } from './psychology'
import { base_rates, prisoners_dilemma } from './skeptic'

export const GENERATORS: Record<ConceptId, Generator> = {
  arithmetic, fractions_percent, ratio_proportion, linear_eq, probability,
  unit_price, profit_margin, opportunity_cost, supply_demand, marginal_thinking, expected_value,
  anchoring, reciprocity, base_rates, prisoners_dilemma,
}

export const generate = (concept: ConceptId, seed: number, difficulty: number): Problem =>
  GENERATORS[concept](seed >>> 0, Math.min(5, Math.max(1, Math.round(difficulty))))
