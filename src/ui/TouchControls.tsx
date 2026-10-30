import { useRef, useState } from 'react'
import { useGame } from '../state/game'
import { input } from '../state/input'
import { isTouchDevice } from '../state/settings'

const RADIUS = 56

/** Left half: floating joystick. Right half: drag to look. */
export function TouchControls() {
  const phase = useGame((s) => s.phase)
  const stickId = useRef<number | null>(null)
  const lookId = useRef<number | null>(null)
  const origin = useRef({ x: 0, y: 0 })
  const last = useRef({ x: 0, y: 0 })
  const [stick, setStick] = useState<{ ox: number; oy: number; kx: number; ky: number } | null>(null)

  if (!isTouchDevice || phase !== 'playing') return null

  const start = (e: React.TouchEvent) => {
    for (const t of Array.from(e.changedTouches)) {
      if (t.clientX < window.innerWidth / 2 && stickId.current === null) {
        stickId.current = t.identifier
        origin.current = { x: t.clientX, y: t.clientY }
        setStick({ ox: t.clientX, oy: t.clientY, kx: 0, ky: 0 })
      } else if (lookId.current === null) {
        lookId.current = t.identifier
        last.current = { x: t.clientX, y: t.clientY }
      }
    }
  }
  const move = (e: React.TouchEvent) => {
    for (const t of Array.from(e.changedTouches)) {
      if (t.identifier === stickId.current) {
        let dx = t.clientX - origin.current.x
        let dy = t.clientY - origin.current.y
        const d = Math.hypot(dx, dy)
        if (d > RADIUS) {
          dx = (dx / d) * RADIUS
          dy = (dy / d) * RADIUS
        }
        input.stickX = dx / RADIUS
        input.stickY = -dy / RADIUS
        input.stickSprint = d > RADIUS * 1.15
        setStick({ ox: origin.current.x, oy: origin.current.y, kx: dx, ky: dy })
      } else if (t.identifier === lookId.current) {
        input.lookX += (t.clientX - last.current.x) * 1.6
        input.lookY += (t.clientY - last.current.y) * 1.6
        last.current = { x: t.clientX, y: t.clientY }
      }
    }
  }
  const end = (e: React.TouchEvent) => {
    for (const t of Array.from(e.changedTouches)) {
      if (t.identifier === stickId.current) {
        stickId.current = null
        input.stickX = input.stickY = 0
        input.stickSprint = false
        setStick(null)
      } else if (t.identifier === lookId.current) lookId.current = null
    }
  }

  return (
    <div className="touch" onTouchStart={start} onTouchMove={move} onTouchEnd={end} onTouchCancel={end}>
      {stick ? (
        <div className="stick" style={{ left: stick.ox, top: stick.oy }}>
          <div className="knob" style={{ transform: `translate(${stick.kx}px, ${stick.ky}px)` }} />
        </div>
      ) : (
        <div className="stick-hint">walk</div>
      )}
    </div>
  )
}
