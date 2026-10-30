import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { resolveCircle, type Aabb } from '../sim/collision'
import { findFocus } from '../sim/interact'
import { useGame } from '../state/game'
import { consumeLook, input } from '../state/input'
import { useSettings } from '../state/settings'
import { playerPose, useWorld } from '../state/world'
import { INTERACTABLES } from './interactables'
import { useFocus } from '../state/focus'

const EYE_HEIGHT = 1.68
const RADIUS = 0.35
const WALK = 3.4
const RUN = 6.6
const LOOK_SPEED = 0.0022

function lockPointer(el: HTMLElement) {
  try {
    const p = el.requestPointerLock() as unknown as Promise<void> | undefined
    p?.catch?.(() => {})
  } catch {
    /* pointer lock unavailable in this frame: drag-to-look still works */
  }
}

/** First-person walker: WASD + mouse, E to use what you're facing, Tab for the notebook. */
export function Player({ colliders }: { colliders: Aabb[] }) {
  const camera = useThree((s) => s.camera)
  const gl = useThree((s) => s.gl)
  const pos = useRef(new THREE.Vector2(playerPose.x, playerPose.z))
  const vel = useRef(new THREE.Vector2())
  const yaw = useRef(playerPose.yaw)
  const pitch = useRef(0.02)
  const bob = useRef(0)
  const euler = useRef(new THREE.Euler(0, 0, 0, 'YXZ'))

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const game = useGame.getState()
      if (e.code === 'Tab') {
        e.preventDefault()
        if (game.phase === 'playing') {
          game.setPhase('notebook')
          document.exitPointerLock?.()
        } else if (game.phase === 'notebook') {
          game.setPhase('playing')
          lockPointer(gl.domElement)
        }
        return
      }
      if (e.code === 'Escape' || e.code === 'KeyP') {
        if (game.phase === 'notebook' || game.phase === 'gazette' || game.phase === 'palace') game.setPhase('playing')
        else if (game.phase === 'playing' && !document.pointerLockElement) game.setPhase('paused')
        return
      }
      if (e.code === 'KeyE' && game.phase === 'playing' && !e.repeat) {
        useFocus.getState().focus?.use()
        return
      }
      if (game.phase === 'playing') input.keys.add(e.code)
    }
    const up = (e: KeyboardEvent) => input.keys.delete(e.code)
    const blur = () => input.keys.clear()
    let dragging = false
    const pdown = (e: PointerEvent) => {
      if (e.target !== gl.domElement) return
      dragging = true
      if (useGame.getState().phase === 'playing') lockPointer(gl.domElement)
    }
    const pup = () => (dragging = false)
    let skipNextMove = false
    const move = (e: PointerEvent) => {
      if (document.pointerLockElement !== gl.domElement && !dragging) return
      // Chrome reports one bogus, huge movement right after the pointer locks; drop it and any other spike.
      if (skipNextMove || Math.abs(e.movementX) > 300 || Math.abs(e.movementY) > 300) {
        skipNextMove = false
        return
      }
      input.lookX += e.movementX
      input.lookY += e.movementY
    }
    let wasLocked = false
    const lockChange = () => {
      const locked = document.pointerLockElement === gl.domElement
      if (locked) skipNextMove = true
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

  // Test/debug hook: lets the screenshot scripts place the camera and read the position.
  useEffect(() => {
    const w = window as unknown as { __bl?: object }
    w.__bl ??= {}
    Object.defineProperties(w.__bl, {
      teleport: {
        configurable: true,
        value(x: number, z: number, y?: number, p?: number) {
          pos.current.set(x, z)
          consumeLook()
          if (y !== undefined) yaw.current = y
          if (p !== undefined) pitch.current = p
        },
      },
      position: { configurable: true, get: () => ({ x: pos.current.x, z: pos.current.y, yaw: yaw.current, pitch: pitch.current }) },
    })
  }, [])

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05)
    const playing = useGame.getState().phase === 'playing'
    const look = consumeLook()
    if (playing) {
      const sens = LOOK_SPEED * useSettings.getState().sensitivity
      yaw.current -= look.x * sens
      pitch.current = THREE.MathUtils.clamp(pitch.current - look.y * sens, -1.35, 1.35)
      // Game time only runs while you're walking around.
      useWorld.getState().advance(rawDt)
    }

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
    playerPose.x = next.x
    playerPose.z = next.z
    playerPose.yaw = yaw.current

    const focus = playing ? findFocus(next.x, next.z, yaw.current, INTERACTABLES) : null
    if (focus !== useFocus.getState().focus) useFocus.setState({ focus })

    const moving = vel.current.length()
    bob.current += dt * moving * 2.1
    const bobY = Math.sin(bob.current) * 0.035 * Math.min(1, moving / WALK)
    camera.position.set(pos.current.x, EYE_HEIGHT + bobY, pos.current.y)
    euler.current.set(pitch.current, yaw.current, Math.sin(bob.current * 0.5) * 0.004 * moving)
    camera.quaternion.setFromEuler(euler.current)
  })

  return null
}
