/** Something the player can use by looking at it and pressing E. */
export type Spot = { id: string; x: number; z: number; radius: number }

/**
 * The spot the player is facing: within reach and roughly in front of the camera.
 * yaw follows the camera convention (forward = (-sin yaw, -cos yaw)).
 */
export function findFocus<T extends Spot>(px: number, pz: number, yaw: number, spots: readonly T[]): T | null {
  const fx = -Math.sin(yaw)
  const fz = -Math.cos(yaw)
  let best: T | null = null
  let bestScore = Infinity
  for (const s of spots) {
    const dx = s.x - px
    const dz = s.z - pz
    const dist = Math.hypot(dx, dz)
    if (dist > s.radius) continue
    const facing = dist < 0.3 ? 1 : (dx * fx + dz * fz) / dist
    if (facing < 0.55) continue
    const score = dist * (2 - facing)
    if (score < bestScore) {
      bestScore = score
      best = s
    }
  }
  return best
}
