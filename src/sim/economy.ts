import { createRng, deriveSeed } from './rng'

/**
 * A small textbook market for each good in the district.
 * Demand:  Qd = a·(1 + demandShock) − b·P
 * Supply:  Qs = c·(1 + supplyShock) + d·P
 * Equilibrium P* solves Qd = Qs. Each day the street price moves part of the way toward P*
 * (prices are sticky), then shocks fade. Everything is deterministic for a given seed.
 */
export type GoodId = 'sugar' | 'grain_alcohol' | 'bottles' | 'gin' | 'whiskey' | 'beer'

export type GoodSpec = {
  id: GoodId
  name: string
  unit: string
  legal: boolean
  /** Price that clears the market with no shocks, in 1925 dollars. */
  base: number
  /** How strongly quantity reacts to price (relative slopes of the two curves). */
  demandSlope: number
  supplySlope: number
}

export const GOODS: readonly GoodSpec[] = [
  { id: 'sugar', name: 'Sugar', unit: 'lb', legal: true, base: 0.07, demandSlope: 1.2, supplySlope: 1.0 },
  { id: 'grain_alcohol', name: 'Grain alcohol', unit: 'gal', legal: false, base: 2.6, demandSlope: 0.8, supplySlope: 0.6 },
  { id: 'bottles', name: 'Empty bottles', unit: 'doz', legal: true, base: 0.3, demandSlope: 1.0, supplySlope: 1.5 },
  { id: 'gin', name: 'Bathtub gin', unit: 'pint', legal: false, base: 1.1, demandSlope: 1.0, supplySlope: 0.8 },
  { id: 'whiskey', name: 'Canadian whisky', unit: 'pint', legal: false, base: 3.4, demandSlope: 0.6, supplySlope: 0.5 },
  { id: 'beer', name: 'Needle beer', unit: 'bottle', legal: false, base: 0.25, demandSlope: 1.4, supplySlope: 1.2 },
]

export const goodSpec = (id: GoodId) => GOODS.find((g) => g.id === id)!

export type MarketGood = { price: number; demandShock: number; supplyShock: number; history: number[] }
export type Market = Record<GoodId, MarketGood>

export type MarketEvent = {
  good: GoodId | 'all'
  kind: 'demand' | 'supply'
  size: number
  headline: string
}

/** Events the city can throw at the market. `size` is the shock to that side of the market. */
const EVENTS: readonly MarketEvent[] = [
  { good: 'whiskey', kind: 'supply', size: -0.35, headline: 'Coast Guard seizes rum-runner off Ashport Point' },
  { good: 'whiskey', kind: 'supply', size: 0.3, headline: 'Fog on the lake: smugglers land a record haul' },
  { good: 'sugar', kind: 'supply', size: -0.3, headline: 'Hurricane flattens Cuban cane fields' },
  { good: 'sugar', kind: 'supply', size: 0.25, headline: 'Bumper beet harvest floods the sugar market' },
  { good: 'grain_alcohol', kind: 'supply', size: -0.4, headline: 'Dry agents raid industrial alcohol depot' },
  { good: 'grain_alcohol', kind: 'supply', size: 0.25, headline: 'Paint factory "loses" 500 gallons of alcohol' },
  { good: 'bottles', kind: 'supply', size: -0.3, headline: 'Glassworks strike enters second week' },
  { good: 'gin', kind: 'demand', size: 0.3, headline: 'College football weekend: thirsty crowds pour into town' },
  { good: 'gin', kind: 'demand', size: -0.25, headline: 'Six blinded by poisoned gin; drinkers grow wary' },
  { good: 'beer', kind: 'demand', size: 0.3, headline: 'Heat wave grips Ashport' },
  { good: 'all', kind: 'demand', size: 0.15, headline: 'Payday at the docks: longshoremen flush with cash' },
  { good: 'all', kind: 'demand', size: -0.15, headline: 'Mill lays off 300 workers' },
]

const curve = (g: GoodSpec, m: MarketGood) => {
  // Calibrate the intercepts so that with zero shocks P* equals the base price (quantity 100 at base).
  const b = (g.demandSlope * 100) / g.base
  const d = (g.supplySlope * 100) / g.base
  const a = 100 + b * g.base
  const c = 100 - d * g.base
  // A demand shock scales the whole demand curve; a supply shock shifts the supply curve sideways.
  return { a: a * (1 + m.demandShock), b, c: c + 100 * m.supplyShock, d }
}

/** Price where quantity demanded equals quantity supplied. */
export function equilibriumPrice(g: GoodSpec, m: MarketGood): number {
  const { a, b, c, d } = curve(g, m)
  return Math.max(g.base * 0.2, (a - c) / (b + d))
}

/** Quantity demanded at a price: used later by the racket to decide how much customers buy. */
export function quantityDemanded(g: GoodSpec, m: MarketGood, price: number): number {
  const { a, b } = curve(g, m)
  return Math.max(0, a - b * price)
}

export function newMarket(): Market {
  const market = {} as Market
  for (const g of GOODS) market[g.id] = { price: g.base, demandShock: 0, supplyShock: 0, history: [g.base] }
  return market
}

const STICKINESS = 0.4 // share of the gap to equilibrium closed each day
const SHOCK_DECAY = 0.7 // shocks keep 70% of their size each day
const HISTORY_DAYS = 14

/** Advance the market by one day. Returns today's events (for the newspaper). */
export function stepMarket(market: Market, seed: number, day: number): { market: Market; events: MarketEvent[] } {
  const rng = createRng(deriveSeed(seed, `market-day-${day}`))
  const next = structuredClone(market)
  for (const g of GOODS) {
    const m = next[g.id]
    m.demandShock = m.demandShock * SHOCK_DECAY + rng.range(-0.03, 0.03)
    m.supplyShock = m.supplyShock * SHOCK_DECAY + rng.range(-0.03, 0.03)
  }
  const events: MarketEvent[] = []
  const count = rng.chance(0.75) ? (rng.chance(0.35) ? 2 : 1) : 0
  for (let i = 0; i < count; i++) {
    const e = rng.pick(EVENTS)
    if (events.includes(e)) continue
    events.push(e)
    for (const g of GOODS) {
      if (e.good !== 'all' && e.good !== g.id) continue
      const m = next[g.id]
      if (e.kind === 'demand') m.demandShock += e.size
      else m.supplyShock += e.size
    }
  }
  for (const g of GOODS) {
    const m = next[g.id]
    const target = equilibriumPrice(g, m)
    m.price = Math.round((m.price + (target - m.price) * STICKINESS) * 1000) / 1000
    m.history = [...m.history, m.price].slice(-HISTORY_DAYS)
  }
  return { market: next, events }
}
