import { describe, expect, it } from 'vitest'
import { resolveCircle } from './collision'

const box = { x0: 0, x1: 2, z0: 0, z1: 2 }

describe('resolveCircle', () => {
  it('leaves a circle that does not touch any box alone', () => {
    expect(resolveCircle(-1, 1, 0.3, [box])).toEqual({ x: -1, z: 1 })
  })

  it('pushes a circle out of an edge', () => {
    const p = resolveCircle(-0.1, 1, 0.3, [box])
    expect(p.x).toBeCloseTo(-0.3)
    expect(p.z).toBeCloseTo(1)
  })

  it('pushes a centre that is inside the box out the nearest side', () => {
    const p = resolveCircle(1.9, 1, 0.3, [box])
    expect(p.x).toBeCloseTo(2.3)
  })

  it('settles in a corner between two boxes without overlapping either', () => {
    const other = { x0: -2, x1: 0, z0: 2, z1: 4 }
    const p = resolveCircle(-0.1, 1.9, 0.3, [box, other])
    for (const b of [box, other]) {
      const cx = Math.max(b.x0, Math.min(p.x, b.x1))
      const cz = Math.max(b.z0, Math.min(p.z, b.z1))
      expect(Math.hypot(p.x - cx, p.z - cz)).toBeGreaterThanOrEqual(0.299)
    }
  })
})
