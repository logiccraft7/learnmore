import { describe, expect, it } from 'vitest'
import { findFocus } from './interact'

const spots = [
  { id: 'door', x: 0, z: -2, radius: 2.5 },
  { id: 'stand', x: 2, z: 0, radius: 2.5 },
]

describe('findFocus', () => {
  it('picks the spot in front of the player', () => {
    expect(findFocus(0, 0, 0, spots)?.id).toBe('door') // yaw 0 looks toward -z
    expect(findFocus(0, 0, -Math.PI / 2, spots)?.id).toBe('stand') // looking toward +x
  })
  it('ignores spots behind or out of reach', () => {
    expect(findFocus(0, 0, Math.PI, spots)).toBeNull()
    expect(findFocus(0, 10, 0, spots)).toBeNull()
  })
})
