import { create } from 'zustand'
import type { SessionMode } from '../learning/session'
import type { Problem } from '../learning/types'

/**
 * How the Mind Palace was opened: from the office (pick on the board) or straight into
 * a session, e.g. the Gazette's "Work it out" with a ready-made problem.
 */
export type PalaceRequest = { kind: 'board' } | { kind: 'session'; mode: SessionMode } | { kind: 'problems'; problems: Problem[]; title: string }

export const usePalace = create<{ request: PalaceRequest; open(r?: PalaceRequest): void }>((set) => ({
  request: { kind: 'board' },
  open: (request = { kind: 'board' }) => set({ request }),
}))
