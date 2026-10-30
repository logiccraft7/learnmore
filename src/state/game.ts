import { create } from 'zustand'

/** Top-level flow: title screen → walking around → paused menu. */
export type Phase = 'title' | 'playing' | 'paused'

type GameState = {
  phase: Phase
  setPhase(p: Phase): void
}

export const useGame = create<GameState>((set) => ({
  phase: 'title',
  setPhase: (phase) => set({ phase }),
}))
