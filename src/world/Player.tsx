import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { resolveCircle, type Aabb } from '../sim/collision'
import { useGame } from '../state/game'
import { consumeLook, input } from '../state/input'
import { isTouchDevice, useSettings } from '../state/settings'

const EYE_HEIGHT = 1.68
const RADIUS = 0.35
const WALK = 3.4
const RUN = 6.6
const LOOK_SPEED = 0.0022

/** First-person walker: keyboard/mouse on desktop, joystick + drag on touch. */
export function Player({ spawn, colliders }: { spawn: { x: number; z: number; yaw: number }; colliders: Aabb[] }) {
  const camera = useThree((s) => s.camera)
  const gl = useThree((s) => s.gl)
  const pos = useRef(new THREE.Vector2(spawn.x, spawn.z))
  const vel = useRef(new THREE.Vector2())
  const yaw = useRef(spawn.yaw)
  const pitch = useRef(0.02)
  const bob = useRef(0)
  const euler = useRef(new THREE.Euler(0, 0, 0, 'YXZ'))

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      input.keys.add(e.code)
      const game = useGame.getState()
      if ((e.code === 'Escape' || e.code === 'KeyP') && game.phase === 'playing' && !document.pointerLockElement) game.setPhase('paused')
    }
    const up = (e: KeyboardEvent) => input.keys.delete(e.code)
    const blur = () => input.keys.clear()
    let dragging = false
    const pdown = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' || e.target !== gl.domElement) return
      dragging = true
      if (useGame.getState().phase === 'playing' && !isTouchDevice) {
        // Pointer lock is unavailable in some sandboxed frames; dragging still works there.
        try {
          const p = gl.domElement.requestPointerLock() as unknown as Promise<void> | undefined
          p?.catch?.(() => {})
        } catch {
          /* fall back to drag-to-look */
        }
      }
    }
    const pup = () => (dragging = false)
    const move = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      if (document.pointerLockElement === gl.domElement || dragging) {
        input.lookX += e.movementX
        input.lookY += e.movementY
      }
    }
    let wasLocked = false
    const lockChange = () => {
      const locked = document.pointerLockElement === gl.domElement
      const game = useGame.getState()
      if (wasLocked && !locked && game.phase === 'playing') game.setPhase('paused')
      wasLocked = locked
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', blur)
    window.addEventListener('pointerdown', pdown)
    window.addEventListener('pointerup', pup)
    window.addEventListener('pointermove', move)
    document.addEventListener('pointerlockchange', lockChange)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', blur)
      window.removeEventListener('pointerdown', pdown)
      window.removeEventListener('pointerup', pup)
      window.removeEventListener('pointermove', move)
      document.removeEventListener('pointerlockchange', lockChange)
    }
  }, [gl])

  // Test/debug hook: lets the screenshot script place the camera.
  useEffect(() => {
    ;(window as unknown as { __bl: unknown }).__bl = {
      teleport(x: number, z: number, y?: number, p?: number) {
        pos.current.set(x, z)
        if (y !== undefined) yaw.current = y
        if (p !== undefined) pitch.current = p
      },
      get position() {
        return { x: pos.current.x, z: pos.current.y, yaw: yaw.current }
      },
    }
  }, [])

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05)
    const playing = useGame.getState().phase === 'playing'
    const look = consumeLook()
    if (playing) {
      const sens = LOOK_SPEED * useSettings.getState().sensitivity
      yaw.current -= look.x * sens
      pitch.current = THREE.MathUtils.clamp(pitch.current - look.y * sens, -1.35, 1.35)
    }

    // Desired move in camera space: x = strafe right, y = forward.
    let mx = 0
    let my = 0
    let run = false
    if (playing) {
      const k = input.keys
      if (k.has('KeyW') || k.has('ArrowUp')) my += 1
      if (k.has('KeyS') || k.has('ArrowDown')) my -= 1
      if (k.has('KeyD') || k.has('ArrowRight')) mx += 1
      if (k.has('KeyA') || k.has('ArrowLeft')) mx -= 1
      run = k.has('ShiftLeft') || k.has('ShiftRight')
      mx += input.stickX
      my += input.stickY
      run ||= input.stickSprint
    }
    const len = Math.hypot(mx, my)
    if (len > 1) {
      mx /= len
      my /= len
    }
    const speed = run ? RUN : WALK
    const sin = Math.sin(yaw.current)
    const cos = Math.cos(yaw.current)
    const targetX = (-sin * my + cos * mx) * speed
    const targetZ = (-cos * my - sin * mx) * speed
    const blend = 1 - Math.exp(-12 * dt)
    vel.current.x += (targetX - vel.current.x) * blend
    vel.current.y += (targetZ - vel.current.y) * blend

    const next = resolveCircle(pos.current.x + vel.current.x * dt, pos.current.y + vel.current.y * dt, RADIUS, colliders)
    pos.current.set(next.x, next.z)

    const moving = vel.current.length()
    bob.current += dt * moving * 2.1
    const bobY = Math.sin(bob.current) * 0.035 * Math.min(1, moving / WALK)
    camera.position.set(pos.current.x, EYE_HEIGHT + bobY, pos.current.y)
    euler.current.set(pitch.current, yaw.current, Math.sin(bob.current * 0.5) * 0.004 * moving)
    camera.quaternion.setFromEuler(euler.current)
  })

  return null
}
