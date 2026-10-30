import { create } from 'zustand'
import type * as THREE from 'three'

/** Loaded 3D models, filled in by `loadAllModels()` at boot. */
type AssetsState = {
  total: number
  loaded: number
  done: boolean
  models: Record<string, THREE.Object3D>
  failed: string[]
}

export const useAssets = create<AssetsState>(() => ({ total: 0, loaded: 0, done: false, models: {}, failed: [] }))
