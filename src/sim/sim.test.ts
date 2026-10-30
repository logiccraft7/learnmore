import { describe, expect, it } from 'vitest'
import { calendar, clockLabel, dateLabel, dayIndex, MINUTES_PER_DAY } from './clock'
import { GOODS, equilibriumPrice, newMarket, stepMarket, quantityDemanded } from './economy'
import { advanceTime, buyGazette, deserialize, GAZETTE_PRICE, newGame, serialize, START_MINUTES } from './game'

const spawn = { x: 0, z: 0, yaw: 0 }

describe('clock', () => {
  it('starts on Wednesday 14 October 1925', () => {
    expect(calendar(0)).toMatchObject({ weekday: 'Wednesday', month: 'Oct', day: 14, year: 1925 })
    expect(dateLabel(START_MINUTES)).toBe('Wed, Oct 14, 1925')
  })
  it('formats 12-hour times', () => {
    expect(clockLabel(0)).toBe('12:00 AM')
    expect(clockLabel(12 * 60 + 5)).toBe('12:05 PM')
    expect(clockLabel(23 * 60 + 40)).toBe('11:40 PM')
  })
  it('rolls over months', () => {
    expect(dateLabel(18 * MINUTES_PER_DAY)).toBe('Sun, Nov 1, 1925')
  })
})

describe('market', () => {
  it('clears at the base price with no shocks', () => {
    for (const g of GOODS) expect(equilibriumPrice(g, newMarket()[g.id])).toBeCloseTo(g.base, 6)
  })
  it('responds to shocks the way supply and demand say it should', () => {
    for (const g of GOODS) {
      const m = newMarket()[g.id]
      expect(equilibriumPrice(g, { ...m, demandShock: 0.3 })).toBeGreaterThan(g.base)
      expect(equilibriumPrice(g, { ...m, demandShock: -0.3 })).toBeLessThan(g.base)
      expect(equilibriumPrice(g, { ...m, supplyShock: -0.3 })).toBeGreaterThan(g.base)
      expect(equilibriumPrice(g, { ...m, supplyShock: 0.3 })).toBeLessThan(g.base)
      expect(quantityDemanded(g, m, g.base * 2)).toBeLessThan(quantityDemanded(g, m, g.base))
    }
  })
  it('is deterministic and keeps prices positive and bounded over a long run', () => {
    let a = newMarket()
    let b = newMarket()
    for (let day = 1; day <= 400; day++) {
      a = stepMarket(a, 1925, day).market
      b = stepMarket(b, 1925, day).market
      for (const g of GOODS) {
        expect(a[g.id].price).toBeGreaterThan(0)
        expect(a[g.id].price).toBeLessThan(g.base * 4)
        expect(a[g.id].history.length).toBeLessThanOrEqual(14)
      }
    }
    expect(a).toEqual(b)
  })
})

describe('game state', () => {
  it('runs the daily update once per midnight crossed', () => {
    const s0 = newGame(7, spawn)
    const s1 = advanceTime(s0, 3 * MINUTES_PER_DAY)
    expect(dayIndex(s1.minutes)).toBe(3)
    expect(s1.news.map((n) => n.day)).toEqual([0, 1, 2, 3])
    expect(s1.market.gin.history.length).toBe(4)
  })
  it('cools heat off by day', () => {
    const s = advanceTime({ ...newGame(7, spawn), heat: 20 }, MINUTES_PER_DAY)
    expect(s.heat).toBe(12)
  })
  it('sells one paper a day and refuses when broke', () => {
    const s0 = newGame(7, spawn)
    const s1 = buyGazette(s0)
    if (typeof s1 === 'string') throw new Error(s1)
    expect(s1.cash).toBeCloseTo(s0.cash - GAZETTE_PRICE)
    expect(buyGazette(s1)).toBe('already')
    expect(buyGazette({ ...s0, cash: 0.01 })).toBe('broke')
  })
  it('round-trips through a save and rejects junk', () => {
    const s = advanceTime(newGame(3, spawn), 2000)
    expect(deserialize(serialize(s))).toEqual(s)
    expect(deserialize('{nope')).toBeNull()
    expect(deserialize(JSON.stringify({ version: 99 }))).toBeNull()
    // A step-2 save (v1, no learning) upgrades instead of being thrown away.
    const { learning: _drop, ...v1 } = { ...s, version: 1 }
    void _drop
    expect(deserialize(JSON.stringify(v1))).toEqual({ ...s, learning: {} })
    expect(deserialize(null)).toBeNull()
  })
})

import { edition, money } from './news'

describe('gazette', () => {
  it('always prints three stories and every price, explaining real market events', () => {
    let g = newGame(11, spawn)
    for (let d = 0; d < 30; d++) {
      g = advanceTime(g, MINUTES_PER_DAY)
      const e = edition(g)
      expect(e.stories.length).toBeGreaterThanOrEqual(3)
      expect(e.prices.length).toBe(6)
      const events = g.news[g.news.length - 1].events
      expect(e.stories.filter((s) => s.lesson).length).toBe(events.length)
    }
  })
  it('formats money the 1925 way', () => {
    expect(money(0.02)).toBe('2¢')
    expect(money(14.2)).toBe('$14.20')
  })
})
