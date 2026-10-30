import { useEffect } from 'react'
import { useGame } from '../state/game'
import { useWorld } from '../state/world'

/** Saves every in-game hour, whenever play stops (pause, panels), and when the tab is hidden or closed. */
export function AutoSave() {
  useEffect(() => {
    const save = () => useWorld.getState().save()
    let lastHour = -1
    const unsubWorld = useWorld.subscribe((s) => {
      const hour = Math.floor((s.game?.minutes ?? 0) / 60)
      if (s.game && hour !== lastHour) {
        if (lastHour !== -1) save()
        lastHour = hour
      }
    })
    const unsubGame = useGame.subscribe((s, prev) => {
      if (prev.phase === 'playing' && s.phase !== 'playing') save()
    })
    const onHide = () => document.visibilityState === 'hidden' && save()
    document.addEventListener('visibilitychange', onHide)
    window.addEventListener('beforeunload', save)
    return () => {
      unsubWorld()
      unsubGame()
      document.removeEventListener('visibilitychange', onHide)
      window.removeEventListener('beforeunload', save)
    }
  }, [])
  return null
}
