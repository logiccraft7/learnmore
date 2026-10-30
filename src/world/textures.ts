import * as THREE from 'three'
import { createRng } from '../sim/rng'

/** All textures are drawn at runtime on canvases: no image downloads, no font fetches. */

function canvasTexture(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, repeat = false): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const g = c.getContext('2d')!
  draw(g)
  const t = new THREE.CanvasTexture(c)
  t.colorSpace = THREE.SRGBColorSpace
  t.anisotropy = 4
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping
  return t
}

const cache = new Map<string, THREE.Texture>()
const memo = <T extends THREE.Texture>(key: string, make: () => T): T => {
  if (!cache.has(key)) cache.set(key, make())
  return cache.get(key) as T
}

/** Three-band ramp that gives every lit surface its flat, cel-shaded look. */
export const toonRamp = () =>
  memo('toonRamp', () => {
    const t = new THREE.DataTexture(new Uint8Array([70, 150, 255]), 3, 1, THREE.RedFormat)
    t.minFilter = t.magFilter = THREE.NearestFilter
    t.needsUpdate = true
    return t
  })

export const cobblestones = () =>
  memo('cobble', () =>
    canvasTexture(512, 512, (g) => {
      const rng = createRng(11)
      g.fillStyle = '#1a1b1f'
      g.fillRect(0, 0, 512, 512)
      const rowH = 32
      for (let row = 0; row < 512 / rowH; row++) {
        let x = row % 2 ? -20 : 0
        while (x < 512) {
          const w = rng.range(28, 44)
          const l = rng.int(38, 58)
          g.fillStyle = `rgb(${l},${l + 2},${l + 6})`
          g.beginPath()
          g.roundRect(x + 2, row * rowH + 2, w - 4, rowH - 4, 7)
          g.fill()
          // Wet sheen on the top edge of some stones.
          if (rng.chance(0.35)) {
            g.fillStyle = 'rgba(160,170,190,0.12)'
            g.fillRect(x + 6, row * rowH + 4, w - 12, 3)
          }
          x += w
        }
      }
    }, true),
  )

export const pavement = () =>
  memo('pavement', () =>
    canvasTexture(256, 256, (g) => {
      const rng = createRng(5)
      g.fillStyle = '#4a4744'
      g.fillRect(0, 0, 256, 256)
      for (let i = 0; i < 900; i++) {
        const l = rng.int(60, 90)
        g.fillStyle = `rgba(${l},${l},${l - 4},0.25)`
        g.fillRect(rng.range(0, 256), rng.range(0, 256), 2, 2)
      }
      g.strokeStyle = '#2c2a28'
      g.lineWidth = 3
      for (let i = 0; i <= 256; i += 128) {
        g.beginPath(); g.moveTo(i, 0); g.lineTo(i, 256); g.stroke()
        g.beginPath(); g.moveTo(0, i); g.lineTo(256, i); g.stroke()
      }
    }, true),
  )

/** Brick courses in greyscale; tinted per building by the material colour. */
export const bricks = () =>
  memo('bricks', () =>
    canvasTexture(256, 256, (g) => {
      const rng = createRng(3)
      g.fillStyle = '#8c8682'
      g.fillRect(0, 0, 256, 256)
      const bh = 16
      for (let row = 0; row < 256 / bh; row++) {
        const off = row % 2 ? 16 : 0
        for (let x = -32 + off; x < 256; x += 32) {
          const l = rng.int(190, 255)
          g.fillStyle = `rgb(${l},${l},${l})`
          g.fillRect(x + 1, row * bh + 1, 30, bh - 2)
        }
      }
    }, true),
  )

/** Soft round glow used for lamp pools on the ground and for steam puffs. */
export const softDisc = () =>
  memo('disc', () =>
    canvasTexture(128, 128, (g) => {
      const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64)
      grad.addColorStop(0, 'rgba(255,255,255,1)')
      grad.addColorStop(0.4, 'rgba(255,255,255,0.45)')
      grad.addColorStop(1, 'rgba(255,255,255,0)')
      g.fillStyle = grad
      g.fillRect(0, 0, 128, 128)
    }),
  )

export const awningStripes = (color: string) =>
  memo(`awning${color}`, () =>
    canvasTexture(128, 64, (g) => {
      for (let i = 0; i < 8; i++) {
        g.fillStyle = i % 2 ? '#e8dcc0' : color
        g.fillRect(i * 16, 0, 16, 64)
      }
      // Scalloped hem.
      g.fillStyle = 'rgba(0,0,0,0.35)'
      g.fillRect(0, 56, 128, 8)
    }),
  )

/** Painted shop sign: Art Deco-ish lettering on a dark board with a gold rule. */
export const signTexture = (text: string, sub: string | undefined, glow: boolean) =>
  memo(`sign:${text}:${sub}:${glow}`, () =>
    canvasTexture(1024, 192, (g) => {
      g.fillStyle = glow ? '#141210' : '#1d1a17'
      g.fillRect(0, 0, 1024, 192)
      g.strokeStyle = '#c9a24a'
      g.lineWidth = 6
      g.strokeRect(10, 10, 1004, 172)
      g.textAlign = 'center'
      g.textBaseline = 'middle'
      const fit = (s: string, max: number, px: number, weight: string) => {
        let size = px
        do {
          g.font = `${weight} ${size}px "Futura", "Century Gothic", "Trebuchet MS", sans-serif`
          size -= 2
        } while (g.measureText(s).width > max && size > 20)
      }
      fit(text, 940, 92, '700')
      g.fillStyle = glow ? '#ffd27a' : '#e6d3a3'
      if (glow) {
        g.shadowColor = '#ffb347'
        g.shadowBlur = 18
      }
      g.fillText(text, 512, sub ? 80 : 96)
      if (sub) {
        g.shadowBlur = 0
        fit(sub.toUpperCase(), 700, 38, '400')
        g.fillStyle = '#b8a37a'
        g.fillText(sub.toUpperCase(), 512, 148)
      }
    }),
  )

/** A glimpse into a lit shop: warm light, shelves of goods, mullions and a half-drawn blind. */
export const shopInterior = (seed: number) =>
  memo(`interior${seed}`, () =>
    canvasTexture(256, 128, (g) => {
      const rng = createRng(seed)
      const grad = g.createLinearGradient(0, 0, 0, 128)
      grad.addColorStop(0, '#6b3a16')
      grad.addColorStop(0.55, '#d98a3a')
      grad.addColorStop(1, '#8a4a1c')
      g.fillStyle = grad
      g.fillRect(0, 0, 256, 128)
      // Shelves with goods on them.
      for (const y of [44, 74]) {
        g.fillStyle = '#3a1e0c'
        g.fillRect(0, y, 256, 4)
        for (let x = 4; x < 252; x += rng.range(6, 14)) {
          const h = rng.range(6, 16)
          g.fillStyle = rng.pick(['#4a2a12', '#2e1a0c', '#6e3e1a', '#1e2a1a'])
          g.fillRect(x, y - h, rng.range(4, 8), h)
        }
      }
      // A shopkeeper's silhouette behind the counter.
      if (rng.chance(0.6)) {
        const x = rng.range(40, 210)
        g.fillStyle = 'rgba(25,12,6,0.85)'
        g.beginPath(); g.arc(x, 70, 9, 0, Math.PI * 2); g.fill()
        g.fillRect(x - 13, 79, 26, 40)
      }
      g.fillStyle = '#2a170a'
      g.fillRect(0, 100, 256, 28) // counter
      g.fillStyle = 'rgba(30,16,8,0.75)'
      g.fillRect(0, 0, 256, rng.range(10, 30)) // blind
      g.fillStyle = '#1a120c'
      g.fillRect(126, 0, 5, 128) // mullion
      g.fillRect(0, 0, 256, 4)
      g.fillRect(0, 124, 256, 4)
    }),
  )
