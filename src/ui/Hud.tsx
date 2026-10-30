import { useEffect, useState } from 'react'
import { useGame } from '../state/game'
import { isTouchDevice } from '../state/settings'

export function Hud() {
  const phase = useGame((s) => s.phase)
  const setPhase = useGame((s) => s.setPhase)
  const [showCard, setShowCard] = useState(true)
  useEffect(() => {
    if (phase !== 'playing') return
    const t = setTimeout(() => setShowCard(false), 7000)
    return () => clearTimeout(t)
  }, [phase])
  if (phase !== 'playing') return null
  return (
    <div className="hud">
      <div className="crosshair" />
      <div className={`location ${showCard ? 'show' : ''}`}>
        <div className="loc-name">The Narrows</div>
        <div className="loc-sub">Ashport · 11:40 PM · Oct 14, 1925</div>
      </div>
      {isTouchDevice && (
        <button className="pause-btn" aria-label="Pause" onClick={() => setPhase('paused')}>
          ❚❚
        </button>
      )}
    </div>
  )
}
