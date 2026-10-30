import { create } from 'zustand'

export type Quality = 'low' | 'medium' | 'high'

const KEY = 'black-ledger:settings'
export const isTouchDevice = typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches

function load(): { quality: Quality; sensitivity: number } {
  const fallback = { quality: (isTouchDevice ? 'low' : 'high') as Quality, sensitivity: 1 }
  try {
    const raw = localStorage.getItem(KEY)
    return raw ? { ...fallback, ...JSON.parse(raw) } : fallback
  } catch {
    return fallback
  }
}

type SettingsState = {
  quality: Quality
  sensitivity: number
  setQuality(q: Quality): void
  setSensitivity(s: number): void
}

export const useSettings = create<SettingsState>((set, get) => {
  const save = () => {
    try {
      const { quality, sensitivity } = get()
      localStorage.setItem(KEY, JSON.stringify({ quality, sensitivity }))
    } catch {
      /* storage unavailable (private mode, sandboxed iframe): settings just won't persist */
    }
  }
  return {
    ...load(),
    setQuality: (quality) => (set({ quality }), save()),
    setSensitivity: (sensitivity) => (set({ sensitivity }), save()),
  }
})

/** What each quality level turns on. */
export const QUALITY = {
  low: { dpr: [0.75, 1] as [number, number], shadows: false, post: false, shopLights: false, steam: false },
  medium: { dpr: [1, 1.5] as [number, number], shadows: false, post: true, shopLights: false, steam: true },
  high: { dpr: [1, 2] as [number, number], shadows: true, post: true, shopLights: true, steam: true },
} satisfies Record<Quality, unknown>
