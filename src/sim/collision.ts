/** Axis-aligned box on the ground plane (x/z), used for walls and buildings. */
export type Aabb = { x0: number; x1: number; z0: number; z1: number }

/**
 * Push a circle (the player's feet) out of every box it overlaps.
 * Runs a few passes so corners between two boxes resolve cleanly.
 */
export function resolveCircle(x: number, z: number, radius: number, boxes: readonly Aabb[]): { x: number; z: number } {
  for (let pass = 0; pass < 3; pass++) {
    let moved = false
    for (const b of boxes) {
      const cx = Math.max(b.x0, Math.min(x, b.x1))
      const cz = Math.max(b.z0, Math.min(z, b.z1))
      const dx = x - cx
      const dz = z - cz
      const d2 = dx * dx + dz * dz
      if (d2 >= radius * radius) continue
      if (d2 > 1e-9) {
        const d = Math.sqrt(d2)
        x = cx + (dx / d) * radius
        z = cz + (dz / d) * radius
      } else {
        // Centre is inside the box: leave by the nearest edge.
        const exits = [
          { d: x - b.x0, x: b.x0 - radius, z },
          { d: b.x1 - x, x: b.x1 + radius, z },
          { d: z - b.z0, x, z: b.z0 - radius },
          { d: b.z1 - z, x, z: b.z1 + radius },
        ].sort((p, q) => p.d - q.d)
        x = exits[0].x
        z = exits[0].z
      }
      moved = true
    }
    if (!moved) break
  }
  return { x, z }
}
