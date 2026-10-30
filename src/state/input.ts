/**
 * Raw player input, written by keyboard/mouse/touch handlers and read every frame by the player.
 * A plain mutable object (not React state) so 60 fps input never triggers re-renders.
 */
export const input = {
  /** Analogue move from the touch joystick, -1..1 (x = strafe right, y = forward). */
  stickX: 0,
  stickY: 0,
  stickSprint: false,
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
