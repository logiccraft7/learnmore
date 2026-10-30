import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { ErrorBoundary } from './ui/ErrorBoundary'
import { useAssets } from './state/assets'
import { useWorld } from './state/world'
import { MINUTES_PER_DAY } from './sim/clock'
import { INTERACTABLES } from './world/interactables'
import './styles.css'

// Debug/test hook; the player adds teleport/position to the same object.
const w = window as unknown as { __bl?: object }
w.__bl ??= {}
Object.defineProperty(w.__bl, 'models', {
  get: () => {
    const { loaded, total, done, failed } = useAssets.getState()
    return { loaded, total, done, failed }
  },
})

Object.defineProperties(w.__bl, {
  /** Jump the clock to an hour of the current day (for screenshots). */
  setHour: {
    value: (hour: number) =>
      useWorld.getState().update((g) => ({ ...g, minutes: Math.floor(g.minutes / MINUTES_PER_DAY) * MINUTES_PER_DAY + hour * 60 })),
  },
  spots: { get: () => INTERACTABLES.map(({ id, x, z, yaw }) => ({ id, x, z, yaw })) },
  game: { get: () => useWorld.getState().game },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
