/**
 * Raw player input, written by keyboard/mouse handlers and read every frame by the player.
 * A plain mutable object (not React state) so 60 fps input never triggers re-renders.
 */
export const input = {
  /** Accumulated look delta in pixels since the last frame. */
  lookX: 0,
  lookY: 0,
  keys: new Set<string>(),
}

export function consumeLook() {
  const d = { x: input.lookX, y: input.lookY }
  input.lookX = 0
  input.lookY = 0
  return d
}
