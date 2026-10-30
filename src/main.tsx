import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { ErrorBoundary } from './ui/ErrorBoundary'
import { useAssets } from './state/assets'
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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
