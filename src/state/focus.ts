import { create } from 'zustand'
import type { Interactable } from '../world/interactables'

/** What the crosshair is on right now (for the "[E] …" prompt). */
export const useFocus = create<{ focus: Interactable | null }>(() => ({ focus: null }))
