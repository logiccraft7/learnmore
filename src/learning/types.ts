export type VoiceId = 'logician' | 'economist' | 'empath' | 'skeptic'

export type ConceptId =
  | 'arithmetic'
  | 'fractions_percent'
  | 'ratio_proportion'
  | 'linear_eq'
  | 'probability'
  | 'unit_price'
  | 'profit_margin'
  | 'opportunity_cost'
  | 'supply_demand'
  | 'marginal_thinking'
  | 'expected_value'
  | 'anchoring'
  | 'reciprocity'
  | 'base_rates'
  | 'prisoners_dilemma'

/** How a numeric answer is written and compared. */
export type AnswerUnit = 'money' | 'percent' | 'plain'

export type Problem = {
  concept: ConceptId
  difficulty: number
  seed: number
  /** The scene and the question. */
  prompt: string
  kind: 'number' | 'choice'
  /** Numeric answer (dollars for money, 25 for 25%), or the index of the right choice. */
  answer: number
  choices?: string[]
  unit?: AnswerUnit
  /** Accepted absolute error for numeric answers. */
  tolerance: number
  hint: { nudge: string; method: string }
  /** The worked solution, one step per line. Shown after answering. */
  worked: string[]
}

export type Generator = (seed: number, difficulty: number) => Problem
