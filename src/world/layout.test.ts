import { describe, expect, it } from 'vitest'
import { FACADE_X, SHOPS, STREET_HALF_LENGTH, generateStreet } from './layout'
import { resolveCircle } from '../sim/collision'

const overlaps = (a: { x0: number; x1: number; z0: number; z1: number }, b: typeof a) =>
  a.x0 < b.x1 - 1e-6 && b.x0 < a.x1 - 1e-6 && a.z0 < b.z1 - 1e-6 && b.z0 < a.z1 - 1e-6

describe('generateStreet', () => {
  it('is deterministic for a seed', () => {
    expect(generateStreet(1925)).toEqual(generateStreet(1925))
  })

  for (const seed of [1, 7, 1925, 4242, 99999]) {
    it(`builds a closed, non-overlapping street (seed ${seed})`, () => {
      const s = generateStreet(seed)
      const boxes = s.buildings.map((b) => b.box)
      for (let i = 0; i < boxes.length; i++)
        for (let j = i + 1; j < boxes.length; j++) expect(overlaps(boxes[i], boxes[j])).toBe(false)

      for (const b of s.buildings) {
        expect(b.width).toBeGreaterThanOrEqual(4.99)
        expect(b.floors).toBeGreaterThanOrEqual(2)
      }

      // Each side is fully lined from end to end, except for alley gaps.
      for (const side of [-1, 1]) {
        const row = s.buildings.filter((b) => Math.sign(b.px) === side && b.rotY !== 0 && b.rotY !== Math.PI)
        const covered = row.reduce((sum, b) => sum + b.width, 0)
        const alleys = s.alleyWalls.filter((w) => Math.sign(w.box.x0) === side)
        const alleyWidth = alleys.reduce((sum, w) => sum + (w.box.z1 - w.box.z0), 0)
        expect(covered + alleyWidth).toBeCloseTo(2 * STREET_HALF_LENGTH, 5)
        expect(alleys.length).toBe(2)
      }

      // Every storefront name is used at most once.
      const names = s.buildings.flatMap((b) => (b.shop ? [b.shop.name] : []))
      expect(new Set(names).size).toBe(names.length)
      expect(names.length).toBeLessThanOrEqual(SHOPS.length)
    })

    it(`keeps a walker inside the street (seed ${seed})`, () => {
      const s = generateStreet(seed)
      let p = { x: s.spawn.x, z: s.spawn.z }
      // Walk hard into every direction; collision must stop us at the facades and end caps.
      for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        for (let i = 0; i < 400; i++) p = resolveCircle(p.x + dx * 0.1, p.z + dz * 0.1, 0.35, s.colliders)
        expect(Math.abs(p.z)).toBeLessThan(STREET_HALF_LENGTH)
        expect(Math.abs(p.x)).toBeLessThan(FACADE_X + 6)
      }
    })
  }
})
