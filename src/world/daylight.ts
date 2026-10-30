import * as THREE from 'three'

/** Everything about the light at a given hour, blended between keyframes. */
export type Daylight = {
  /** 1 at night, 0 in daylight: drives street lamps and window glow. */
  night: number
  /** 1 while the sun is up. */
  sun: number
  lightDir: THREE.Vector3
  lightColor: THREE.Color
  lightIntensity: number
  hemiSky: THREE.Color
  hemiGround: THREE.Color
  hemiIntensity: number
  fog: THREE.Color
  skyTop: THREE.Color
  skyHorizon: THREE.Color
  skyGlow: THREE.Color
}

type Key = { h: number; top: string; horizon: string; glow: string; fog: string; sky: string; ground: string; hemi: number; light: string; li: number; night: number }

const KEYS: Key[] = [
  { h: 0, top: '#05070d', horizon: '#1f2a3c', glow: '#4a3a3a', fog: '#0f1824', sky: '#5a6d94', ground: '#2a1f18', hemi: 1.25, light: '#a8b8ff', li: 0.9, night: 1 },
  { h: 5.3, top: '#080c18', horizon: '#2e3048', glow: '#5a4044', fog: '#161c2a', sky: '#5a6a90', ground: '#2a2018', hemi: 1.2, light: '#a8b8ff', li: 0.8, night: 1 },
  { h: 6.5, top: '#46648f', horizon: '#e3a47c', glow: '#ff9a6a', fog: '#8a7c7c', sky: '#a4accb', ground: '#6a5040', hemi: 1.45, light: '#ffb486', li: 1.5, night: 0.35 },
  { h: 8, top: '#4f86c4', horizon: '#c9d3d8', glow: '#e6dccb', fog: '#a9b4ba', sky: '#c9d8ee', ground: '#7a6a58', hemi: 1.65, light: '#fff0d6', li: 2.3, night: 0 },
  { h: 16.5, top: '#4f86c4', horizon: '#cfd4d2', glow: '#eadbc4', fog: '#adb5b6', sky: '#c9d8ee', ground: '#7a6a58', hemi: 1.6, light: '#ffeacc', li: 2.2, night: 0 },
  { h: 18.3, top: '#384a7c', horizon: '#ee8e58', glow: '#ff7a48', fog: '#7a6272', sky: '#9a94b8', ground: '#5a4038', hemi: 1.35, light: '#ff9462', li: 1.4, night: 0.55 },
  { h: 19.6, top: '#0b0f1e', horizon: '#2c2c4a', glow: '#5c3c3c', fog: '#141c2c', sky: '#5a6a94', ground: '#2a1f18', hemi: 1.2, light: '#a8b8ff', li: 0.85, night: 1 },
  { h: 24, top: '#05070d', horizon: '#1f2a3c', glow: '#4a3a3a', fog: '#0f1824', sky: '#5a6d94', ground: '#2a1f18', hemi: 1.25, light: '#a8b8ff', li: 0.9, night: 1 },
]

const MOON_DIR = new THREE.Vector3(-40, 70, 50).normalize()
const c = (hex: string) => new THREE.Color(hex)

export function daylight(hour: number): Daylight {
  const h = ((hour % 24) + 24) % 24
  let i = 0
  while (i < KEYS.length - 2 && KEYS[i + 1].h <= h) i++
  const a = KEYS[i]
  const b = KEYS[i + 1]
  const t = (h - a.h) / (b.h - a.h)
  const mix = (x: string, y: string) => c(x).lerp(c(y), t)
  const num = (x: number, y: number) => x + (y - x) * t

  // Sun rises in the east (+x) at 6:00, peaks at noon, sets in the west at 18:00.
  const angle = ((h - 6) / 12) * Math.PI
  const elevation = Math.sin(angle)
  const sun = THREE.MathUtils.clamp(elevation * 5, 0, 1)
  const sunDir = new THREE.Vector3(Math.cos(angle), Math.max(elevation, 0.05), 0.35).normalize()
  const lightDir = MOON_DIR.clone().lerp(sunDir, sun).normalize()

  return {
    night: num(a.night, b.night),
    sun,
    lightDir,
    lightColor: mix(a.light, b.light),
    lightIntensity: num(a.li, b.li),
    hemiSky: mix(a.sky, b.sky),
    hemiGround: mix(a.ground, b.ground),
    hemiIntensity: num(a.hemi, b.hemi),
    fog: mix(a.fog, b.fog),
    skyTop: mix(a.top, b.top),
    skyHorizon: mix(a.horizon, b.horizon),
    skyGlow: mix(a.glow, b.glow),
  }
}
