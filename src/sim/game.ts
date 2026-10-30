import { MINUTES_PER_DAY, dayIndex } from './clock'
import { newMarket, stepMarket, type Market, type MarketEvent } from './economy'
import type { Learning } from '../learning/mastery'

export type ItemId = 'badge' | 'notebook' | 'revolver' | 'cigarettes' | 'gazette'

export const ITEMS: Record<ItemId, { name: string; note: string }> = {
  badge: { name: 'Detective badge', note: 'Keep it out of sight. Nobody in the Narrows knows you are a cop.' },
  notebook: { name: 'Notebook', note: 'Everything worth remembering.' },
  revolver: { name: '.38 revolver', note: 'Six rounds. Hope you never need them.' },
  cigarettes: { name: 'Pack of Luckies', note: 'Half full. Useful for breaking the ice.' },
  gazette: { name: 'Ashport Gazette', note: "Today's paper." },
}

export type NewsDay = { day: number; events: MarketEvent[] }

export type GameState = {
  version: 2
  seed: number
  /** Game minutes since midnight on day 0. */
  minutes: number
  cash: number
  /** Police attention on you, 0–100. Rises with illegal acts, cools off a little every day. */
  heat: number
  inventory: Partial<Record<ItemId, number>>
  market: Market
  /** What happened in the city, one entry per day (most recent last). */
  news: NewsDay[]
  /** Days on which the player bought the paper. */
  papersBought: number[]
  player: { x: number; z: number; yaw: number }
  /** Mastery per concept (Mind Palace). */
  learning: Learning
}

export const START_MINUTES = 20 * 60 + 15 // 8:15 PM on the first evening
const HEAT_COOLDOWN_PER_DAY = 8

export function newGame(seed: number, spawn: { x: number; z: number; yaw: number }): GameState {
  return {
    version: 2,
    seed,
    minutes: START_MINUTES,
    cash: 14.2,
    heat: 0,
    inventory: { badge: 1, notebook: 1, revolver: 1, cigarettes: 1 },
    market: newMarket(),
    news: [{ day: 0, events: [] }],
    papersBought: [],
    player: { ...spawn },
    learning: {},
  }
}

/** Advance the clock; each midnight crossed runs the daily update (market, heat, news). */
export function advanceTime(state: GameState, gameMinutes: number): GameState {
  if (gameMinutes <= 0) return state
  let s = state
  const target = state.minutes + gameMinutes
  while (dayIndex(target) > dayIndex(s.minutes)) {
    const day = dayIndex(s.minutes) + 1
    s = startDay({ ...s, minutes: day * MINUTES_PER_DAY }, day)
  }
  return { ...s, minutes: target }
}

function startDay(s: GameState, day: number): GameState {
  const { market, events } = stepMarket(s.market, s.seed, day)
  return {
    ...s,
    market,
    heat: Math.max(0, s.heat - HEAT_COOLDOWN_PER_DAY),
    news: [...s.news, { day, events }].slice(-14),
  }
}

export function spend(state: GameState, amount: number): GameState | null {
  if (amount > state.cash + 1e-9) return null
  return { ...state, cash: Math.round((state.cash - amount) * 100) / 100 }
}

export function addHeat(state: GameState, amount: number): GameState {
  return { ...state, heat: Math.min(100, Math.max(0, state.heat + amount)) }
}

export const GAZETTE_PRICE = 0.02

/** Buy today's Ashport Gazette (once per day). */
export function buyGazette(state: GameState): GameState | 'already' | 'broke' {
  const day = dayIndex(state.minutes)
  if (state.papersBought.includes(day)) return 'already'
  const paid = spend(state, GAZETTE_PRICE)
  if (!paid) return 'broke'
  return { ...paid, papersBought: [...paid.papersBought, day], inventory: { ...paid.inventory, gazette: 1 } }
}

// ---- Saving -----------------------------------------------------------------------------------------

export const SAVE_KEY = 'black-ledger:save'

export function serialize(state: GameState): string {
  return JSON.stringify(state)
}

/** Parse a save; returns null for anything missing, corrupt or from an incompatible version. Older saves are upgraded. */
export function deserialize(raw: string | null): GameState | null {
  if (!raw) return null
  try {
    let s = JSON.parse(raw) as GameState
    // v1 (step 2) had no learning yet.
    if ((s as { version?: number })?.version === 1) s = { ...s, version: 2, learning: {} }
    if (s?.version !== 2) return null
    if (typeof s.minutes !== 'number' || typeof s.cash !== 'number' || !s.market || !s.player) return null
    return s
  } catch {
    return null
  }
}
