import { create } from 'zustand'
import { GAME_MINUTES_PER_REAL_SECOND } from '../sim/clock'
import { SAVE_KEY, advanceTime, deserialize, newGame, serialize, type GameState } from '../sim/game'
import { WORLD_SEED, generateStreet } from '../world/layout'
import { recordResult } from '../learning/mastery'
import { levelUpLine, voiceLevels } from '../learning/voices'
import type { ConceptId } from '../learning/types'

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
  /** Score an answer in the Mind Palace; returns the rating change. */
  recordAnswer(concept: ConceptId, difficulty: number, correct: boolean, hinted: boolean): number
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
  recordAnswer(concept, difficulty, correct, hinted) {
    const g = get().game
    if (!g) return 0
    const before = g.learning[concept]?.rating ?? 1000
    const levelsBefore = voiceLevels(g.learning)
    const learning = { ...g.learning, [concept]: recordResult(g.learning[concept], difficulty, correct, hinted, Date.now()) }
    set({ game: { ...g, learning } })
    const levelsAfter = voiceLevels(learning)
    for (const v of Object.keys(levelsAfter) as (keyof typeof levelsAfter)[])
      if (levelsAfter[v] > levelsBefore[v]) get().showToast(`${levelUpLine(v)} (Level ${levelsAfter[v]})`)
    get().save()
    return learning[concept]!.rating - before
  },
}))
