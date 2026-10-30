import { useMemo } from 'react'
import * as THREE from 'three'
import { useAssets } from '../state/assets'
import { loadAllModels } from './modelLoader'
import { toonRamp } from './textures'
import firehydrantUrl from '../assets/models/firehydrant.glb?url'
import dumpsterUrl from '../assets/models/dumpster.glb?url'
import trash_AUrl from '../assets/models/trash_A.glb?url'
import trash_BUrl from '../assets/models/trash_B.glb?url'
import box_AUrl from '../assets/models/box_A.glb?url'
import box_BUrl from '../assets/models/box_B.glb?url'
import watertowerUrl from '../assets/models/watertower.glb?url'
import barrelUrl from '../assets/models/barrel.glb?url'
import crate_bottlesUrl from '../assets/models/crate_bottles.glb?url'
import gas_lampUrl from '../assets/models/gas_lamp.glb?url'
import car_sedan_blackUrl from '../assets/models/car_sedan_black.glb?url'
import car_sedan_maroonUrl from '../assets/models/car_sedan_maroon.glb?url'
import car_sedan_greenUrl from '../assets/models/car_sedan_green.glb?url'

export const MODEL_URLS = {
  firehydrant: firehydrantUrl,
  dumpster: dumpsterUrl,
  trash_A: trash_AUrl,
  trash_B: trash_BUrl,
  box_A: box_AUrl,
  box_B: box_BUrl,
  watertower: watertowerUrl,
  barrel: barrelUrl,
  crate_bottles: crate_bottlesUrl,
  gas_lamp: gas_lampUrl,
  car_sedan_black: car_sedan_blackUrl,
  car_sedan_maroon: car_sedan_maroonUrl,
  car_sedan_green: car_sedan_greenUrl,
} as const

export type ModelName = keyof typeof MODEL_URLS

/** KayKit models are built at city-builder scale; this brings them to real-world metres. */
export const MODEL_SCALE: Partial<Record<ModelName, number>> = {
  firehydrant: 3.6,
  dumpster: 3.6,
  trash_A: 3.6,
  trash_B: 3.6,
  box_A: 3.6,
  box_B: 3.6,
  watertower: 5,
}

/** Swap every material for the game's cel-shaded look; "Glow*" materials become light sources. */
function toonify(root: THREE.Object3D) {
  root.traverse((o) => {
    const mesh = o as THREE.Mesh
    if (!mesh.isMesh) return
    mesh.castShadow = true
    mesh.receiveShadow = true
    const swap = (m: THREE.Material) => {
      const src = m as THREE.MeshStandardMaterial
      if (src.name.startsWith('Glow')) {
        const glow = new THREE.MeshBasicMaterial({ color: src.color.clone().multiplyScalar(2.2), toneMapped: false })
        glow.name = src.name
        return glow
      }
      const toon = new THREE.MeshToonMaterial({ color: src.color, map: src.map, gradientMap: toonRamp() })
      toon.name = src.name
      return toon
    }
    mesh.material = Array.isArray(mesh.material) ? mesh.material.map(swap) : swap(mesh.material)
  })
}

/** Start loading every model. Safe to call more than once. */
let started = false
export function startModelLoading() {
  if (started) return
  started = true
  void loadAllModels(MODEL_URLS, toonify)
}

/** Places a model; renders nothing until it has loaded (or if it failed). */
export function Model({ name, ...props }: { name: ModelName } & JSX.IntrinsicElements['group']) {
  const source = useAssets((s) => s.models[name])
  // Clones share geometry and materials with the source, so a hundred lamps cost one upload.
  const instance = useMemo(() => source?.clone(), [source])
  if (!instance) return null
  return (
    <group {...props}>
      <primitive object={instance} scale={MODEL_SCALE[name] ?? 1} />
    </group>
  )
}
