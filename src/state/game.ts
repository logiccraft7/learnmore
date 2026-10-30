import { create } from 'zustand'

/** Top-level flow. Game time only runs while 'playing'; the panels freeze it. */
export type Phase = 'title' | 'playing' | 'paused' | 'notebook' | 'gazette' | 'palace'

type GameState = {
  phase: Phase
  setPhase(p: Phase): void
}

export const useGame = create<GameState>((set) => ({
  phase: 'title',
  setPhase: (phase) => set({ phase }),
}))
