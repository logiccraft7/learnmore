import { create } from 'zustand'
import { GAME_MINUTES_PER_REAL_SECOND } from '../sim/clock'
import { SAVE_KEY, advanceTime, deserialize, newGame, serialize, type GameState } from '../sim/game'
import { WORLD_SEED, generateStreet } from '../world/layout'

export const street = generateStreet(WORLD_SEED)

/** Where the player stands. Written every frame by the player, read when saving. Not React state. */
export const playerPose = { ...street.spawn }

function readSave(): GameState | null {
  try {
    return deserialize(localStorage.getItem(SAVE_KEY))
  } catch {
    return null
  }
}

type WorldState = {
  game: GameState | null
  hasSave: boolean
  toast: { text: string; id: number } | null
  newGame(): void
  continueGame(): void
  /** Advance game time by a real-time delta (seconds). */
  advance(realSeconds: number): void
  /** Replace the game state through a pure update. */
  update(fn: (g: GameState) => GameState): void
  save(): void
  showToast(text: string): void
}

export const useWorld = create<WorldState>((set, get) => ({
  game: null,
  hasSave: readSave() !== null,
  toast: null,
  newGame() {
    const g = newGame(WORLD_SEED, street.spawn)
    Object.assign(playerPose, g.player)
    set({ game: g })
    get().save()
  },
  continueGame() {
    const g = readSave()
    if (!g) return get().newGame()
    Object.assign(playerPose, g.player)
    set({ game: g })
  },
  advance(realSeconds) {
    const g = get().game
    if (!g) return
    set({ game: advanceTime(g, realSeconds * GAME_MINUTES_PER_REAL_SECOND) })
  },
  update(fn) {
    const g = get().game
    if (g) set({ game: fn(g) })
  },
  save() {
    const g = get().game
    if (!g) return
    try {
      localStorage.setItem(SAVE_KEY, serialize({ ...g, player: { ...playerPose } }))
      set({ hasSave: true })
    } catch {
      /* storage blocked: the game still plays, it just won't remember */
    }
  },
  showToast(text) {
    set({ toast: { text, id: Date.now() } })
  },
}))
