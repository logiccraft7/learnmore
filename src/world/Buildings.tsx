import { useFrame } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { createRng } from '../sim/rng'
import { QUALITY, useSettings } from '../state/settings'
import type { Building } from './layout'
import { lightNow } from './Atmosphere'
import { awningStripes, bricks, shopInterior, signTexture, toonRamp } from './textures'

/** Box whose UVs are in metres / tile, so brick courses stay the same size on every building. */
function tiledBox(w: number, h: number, d: number, tile: number): THREE.BoxGeometry {
  const g = new THREE.BoxGeometry(w, h, d)
  const uv = g.attributes.uv as THREE.BufferAttribute
  // Face order: +x, -x, +y, -y, +z, -z (4 verts each).
  const sizes: [number, number][] = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]]
  for (let f = 0; f < 6; f++)
    for (let v = 0; v < 4; v++) {
      const i = f * 4 + v
      uv.setXY(i, (uv.getX(i) * sizes[f][0]) / tile, (uv.getY(i) * sizes[f][1]) / tile)
    }
  return g
}

type Inst = { m: THREE.Matrix4; c?: THREE.Color }

const WINDOW_LIT = ['#ffc870', '#ffd9a0', '#ffb35c', '#ffe6b8']
const WINDOW_VICE = '#ff5a4a' // the occasional red lamp in an upstairs window
const STONE = ['#b9ab92', '#a39886', '#8f8676', '#c4b59a']

function collectInstances(buildings: Building[]) {
  const frames: Inst[] = []
  const lit: Inst[] = []
  const dark: Inst[] = []
  const iron: Inst[] = []
  const trim: Inst[] = []
  const G = new THREE.Matrix4()
  const L = new THREE.Matrix4()
  const q = new THREE.Quaternion()
  const at = (x: number, y: number, z: number, sx: number, sy: number, sz: number, rotZ = 0) => {
    q.setFromEuler(new THREE.Euler(0, 0, rotZ))
    L.compose(new THREE.Vector3(x, y, z), q, new THREE.Vector3(sx, sy, sz))
    return new THREE.Matrix4().multiplyMatrices(G, L)
  }

  for (const b of buildings) {
    const rng = createRng(b.seed)
    G.makeRotationY(b.rotY).setPosition(b.px, 0, b.pz)
    const H = b.floors * b.floorH
    const stone = new THREE.Color(rng.pick(STONE))

    // Belt course above the shop floor, cornice on top, parapet cap.
    trim.push({ m: at(0, b.floorH, 0.12, b.width, 0.28, 0.3), c: stone })
    trim.push({ m: at(0, H + 0.25, 0.2, b.width + 0.3, 0.5, 0.45), c: stone })
    trim.push({ m: at(0, H + 0.62, 0.1, b.width + 0.1, 0.24, 0.25), c: stone.clone().multiplyScalar(0.8) })
    // Corner pilasters.
    for (const sx of [-1, 1]) trim.push({ m: at(sx * (b.width / 2 - 0.2), H / 2, 0.08, 0.4, H, 0.18), c: stone.clone().multiplyScalar(0.9) })

    const perFloor = Math.max(1, Math.floor((b.width - 1) / 2.4))
    const spacing = (b.width - 1) / perFloor
    for (let f = 1; f < b.floors; f++) {
      const y = f * b.floorH + 1.55
      for (let i = 0; i < perFloor; i++) {
        const x = -b.width / 2 + 0.5 + spacing * (i + 0.5)
        frames.push({ m: at(x, y, 0.04, 1.25, 1.85, 0.12) })
        trim.push({ m: at(x, y - 1.0, 0.12, 1.45, 0.12, 0.26), c: stone }) // sill
        const isLit = rng.chance(0.32)
        const glass = at(x, y, 0.11, 1.0, 1.6, 1)
        if (isLit) {
          const c = new THREE.Color(rng.chance(0.06) ? WINDOW_VICE : rng.pick(WINDOW_LIT)).multiplyScalar(rng.range(0.8, 1.2))
          lit.push({ m: glass, c })
        } else dark.push({ m: glass })
      }
    }

    if (b.fireEscape) {
      const fx = -b.width / 2 + 0.5 + spacing * 0.5 + (perFloor > 1 ? spacing * 0.5 : 0)
      for (let f = 1; f < b.floors; f++) {
        const y = f * b.floorH + 0.2
        iron.push({ m: at(fx, y, 0.7, 2.6, 0.07, 1.1) }) // platform
        iron.push({ m: at(fx, y + 0.95, 1.24, 2.6, 0.05, 0.05) }) // top rail
        for (const px of [-1.28, -0.4, 0.4, 1.28]) iron.push({ m: at(fx + px, y + 0.48, 1.24, 0.04, 0.95, 0.04) })
        for (const sx of [-1, 1]) iron.push({ m: at(fx + sx * 1.28, y + 0.95, 0.7, 0.05, 0.05, 1.1) })
        if (f < b.floors - 1) iron.push({ m: at(fx + 0.3, y + b.floorH / 2, 0.95, 0.5, b.floorH * 1.08, 0.05, -0.55) }) // stair
      }
      // Drop ladder hanging over the sidewalk.
      iron.push({ m: at(fx + 1.0, b.floorH * 0.62, 1.1, 0.45, 1.6, 0.04) })
    }
  }
  return { frames, lit, dark, iron, trim }
}

function Instances({ items, geometry, material }: { items: Inst[]; geometry: THREE.BufferGeometry; material: THREE.Material }) {
  const ref = useRef<THREE.InstancedMesh>(null!)
  useLayoutEffect(() => {
    const mesh = ref.current
    items.forEach((it, i) => {
      mesh.setMatrixAt(i, it.m)
      if (it.c) mesh.setColorAt(i, it.c)
    })
    mesh.instanceMatrix.needsUpdate = true
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
    mesh.computeBoundingSphere()
  }, [items])
  return <instancedMesh ref={ref} args={[geometry, material, items.length]} frustumCulled={false} />
}

function Storefront({ b }: { b: Building }) {
  const shop = b.shop!
  const shopLights = QUALITY[useSettings((s) => s.quality)].shopLights
  const signMat = useMemo(() => {
    const m = new THREE.MeshBasicMaterial({ map: signTexture(shop.name, shop.sub, shop.lit), toneMapped: !shop.lit })
    if (shop.lit) m.color.setScalar(1.35)
    return m
  }, [shop])
  const ww = Math.min(b.width * 0.5, 5)
  const lit = shop.lit
  const lamp = useRef<THREE.PointLight>(null)
  useFrame(({ clock }) => {
    if (lamp.current) lamp.current.intensity = 6 * lightNow(clock.elapsedTime).night
  })
  return (
    <group>
      {/* Display window */}
      <mesh position={[-b.width * 0.12, 1.45, 0.06]}>
        <planeGeometry args={[ww, 1.9]} />
        {lit ? <meshBasicMaterial map={shopInterior(b.seed)} color={[1.15, 1.1, 1.05]} toneMapped={false} /> : <meshToonMaterial color="#1a222b" gradientMap={toonRamp()} />}
      </mesh>
      <mesh position={[-b.width * 0.12, 0.25, 0.15]}>
        <boxGeometry args={[ww + 0.3, 0.5, 0.3]} />
        <meshToonMaterial color="#2b1d14" gradientMap={toonRamp()} />
      </mesh>
      {/* Door */}
      <mesh position={[b.width * 0.3, 1.2, 0.05]}>
        <boxGeometry args={[1.15, 2.4, 0.12]} />
        <meshToonMaterial color="#3a2516" gradientMap={toonRamp()} />
      </mesh>
      <mesh position={[b.width * 0.3, 1.75, 0.12]}>
        <planeGeometry args={[0.7, 0.6]} />
        {lit ? <meshBasicMaterial color={[1.1, 0.7, 0.32]} toneMapped={false} /> : <meshToonMaterial color="#141a20" gradientMap={toonRamp()} />}
      </mesh>
      {/* Sign board */}
      <mesh position={[0, 2.85, 0.16]} material={signMat}>
        <planeGeometry args={[Math.min(b.width - 0.6, 7.5), 0.75]} />
      </mesh>
      {shop.awning && (
        <mesh position={[-b.width * 0.12, 2.45, 0.75]} rotation={[0.42, 0, 0]}>
          <boxGeometry args={[ww + 0.6, 0.05, 1.6]} />
          <meshToonMaterial map={awningStripes(shop.awning)} gradientMap={toonRamp()} />
        </mesh>
      )}
      {lit && shopLights && <pointLight ref={lamp} position={[-b.width * 0.12, 1.6, 1.4]} color="#ffb25c" intensity={6} distance={7} decay={1.6} />}
    </group>
  )
}

function BuildingBody({ b }: { b: Building }) {
  const H = b.floors * b.floorH
  const geometry = useMemo(() => tiledBox(b.width, H, b.depth, 2.2), [b.width, H, b.depth])
  return (
    <group position={[b.px, 0, b.pz]} rotation={[0, b.rotY, 0]}>
      <mesh geometry={geometry} position={[0, H / 2, -b.depth / 2]} receiveShadow castShadow>
        <meshToonMaterial color={b.color} map={bricks()} gradientMap={toonRamp()} />
      </mesh>
      {b.shop && <Storefront b={b} />}
    </group>
  )
}

export function Buildings({ buildings }: { buildings: Building[] }) {
  const inst = useMemo(() => collectInstances(buildings), [buildings])
  const box = useMemo(() => new THREE.BoxGeometry(1, 1, 1), [])
  const plane = useMemo(() => new THREE.PlaneGeometry(1, 1), [])
  const mats = useMemo(
    () => ({
      frame: new THREE.MeshToonMaterial({ color: '#2a2420', gradientMap: toonRamp() }),
      lit: new THREE.MeshBasicMaterial({ toneMapped: false }),
      dark: new THREE.MeshToonMaterial({ color: '#1c2633', gradientMap: toonRamp() }),
      iron: new THREE.MeshToonMaterial({ color: '#16181b', gradientMap: toonRamp() }),
      trim: new THREE.MeshToonMaterial({ color: '#ffffff', gradientMap: toonRamp() }),
    }),
    [],
  )
  useFrame(({ clock }) => {
    // Lit windows glow at night; by day they read as warm glass.
    mats.lit.color.setScalar(0.3 + 0.7 * lightNow(clock.elapsedTime).night)
  })
  return (
    <group>
      {buildings.map((b) => (
        <BuildingBody key={b.id} b={b} />
      ))}
      <Instances items={inst.frames} geometry={box} material={mats.frame} />
      <Instances items={inst.lit} geometry={plane} material={mats.lit} />
      <Instances items={inst.dark} geometry={plane} material={mats.dark} />
      <Instances items={inst.iron} geometry={box} material={mats.iron} />
      <Instances items={inst.trim} geometry={box} material={mats.trim} />
    </group>
  )
}
