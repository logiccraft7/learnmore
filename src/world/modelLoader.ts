import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { useAssets } from '../state/assets'

/**
 * Read a model's bytes without network access when possible.
 * The artifact build inlines models as data: URLs, and the artifact viewer's CSP blocks fetch() of those,
 * so they are decoded in JS. Dev and dist builds use ordinary URLs and fetch.
 */
async function readBytes(url: string): Promise<ArrayBuffer> {
  if (url.startsWith('data:')) {
    const comma = url.indexOf(',')
    const meta = url.slice(5, comma)
    const payload = url.slice(comma + 1)
    if (meta.endsWith(';base64')) {
      const bin = atob(payload)
      const bytes = new Uint8Array(bin.length)
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
      return bytes.buffer
    }
    return new TextEncoder().encode(decodeURIComponent(payload)).buffer as ArrayBuffer
  }
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.arrayBuffer()
}

/**
 * Plain GLTFLoader: no Draco or Meshopt, since their WebAssembly decoders are blocked in the viewer.
 * Embedded textures go through <img> (allowed for blob: URLs) instead of ImageBitmapLoader, which uses fetch().
 */
const loader = new GLTFLoader().register((parser) => {
  parser.textureLoader = new THREE.TextureLoader(parser.options.manager)
  return { name: 'black_ledger_img_textures' }
})

/**
 * Load every model once, in parallel. A model that fails is recorded and skipped,
 * so the street stays playable with whatever did load.
 */
export async function loadAllModels(urls: Record<string, string>, prepare: (root: THREE.Object3D) => void) {
  const entries = Object.entries(urls)
  useAssets.setState({ total: entries.length, loaded: 0, done: false, failed: [] })
  await Promise.all(
    entries.map(async ([name, url]) => {
      try {
        const gltf = await loader.parseAsync(await readBytes(url), '')
        prepare(gltf.scene)
        useAssets.setState((s) => ({ models: { ...s.models, [name]: gltf.scene }, loaded: s.loaded + 1 }))
      } catch (err) {
        console.warn(`model ${name} failed to load`, err)
        useAssets.setState((s) => ({ failed: [...s.failed, name] }))
      }
    }),
  )
  useAssets.setState({ done: true })
}
