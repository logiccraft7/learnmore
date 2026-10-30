import { useState } from 'react'
import { useGame } from '../state/game'
import { useSettings, type Quality } from '../state/settings'
import { useWorld } from '../state/world'

export function QualityPicker() {
  const quality = useSettings((s) => s.quality)
  const setQuality = useSettings((s) => s.setQuality)
  return (
    <div className="seg" role="radiogroup" aria-label="Graphics quality">
      {(['low', 'medium', 'high'] as Quality[]).map((q) => (
        <button key={q} role="radio" aria-checked={quality === q} className={quality === q ? 'on' : ''} onClick={() => setQuality(q)}>
          {q}
        </button>
      ))}
    </div>
  )
}

export function TitleScreen() {
  const phase = useGame((s) => s.phase)
  const setPhase = useGame((s) => s.setPhase)
  const hasSave = useWorld((s) => s.hasSave)
  const [confirmNew, setConfirmNew] = useState(false)
  if (phase !== 'title') return null
  const start = (fresh: boolean) => {
    const w = useWorld.getState()
    if (fresh) w.newGame()
    else w.continueGame()
    setPhase('playing')
  }
  return (
    <div className="overlay title">
      <div className="title-card">
        <div className="eyebrow">Ashport · October 1925</div>
        <h1>Black Ledger</h1>
        <p className="tagline">Every crime is a transaction. Every lie has a price.</p>
        <div className="title-actions">
          {hasSave ? (
            <>
              <button className="primary" onClick={() => start(false)}>
                Continue
              </button>
              <button className="secondary" onClick={() => (confirmNew ? start(true) : setConfirmNew(true))}>
                {confirmNew ? 'Erase save and start over?' : 'New game'}
              </button>
            </>
          ) : (
            <button className="primary" onClick={() => start(true)}>
              Walk the Narrows
            </button>
          )}
        </div>
        <div className="settings-row">
          <span>Graphics</span>
          <QualityPicker />
        </div>
        <p className="controls">Click to look · WASD walk · Shift run · E use · Tab notebook · Esc pause</p>
        <p className="build">Step 2 · the living city · progress saves automatically</p>
      </div>
    </div>
  )
}
