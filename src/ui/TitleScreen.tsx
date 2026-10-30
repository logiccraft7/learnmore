import { useGame } from '../state/game'
import { isTouchDevice, useSettings, type Quality } from '../state/settings'

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
  if (phase !== 'title') return null
  const begin = () => {
    setPhase('playing')
    if (isTouchDevice) document.documentElement.requestFullscreen?.().catch(() => {})
  }
  return (
    <div className="overlay title">
      <div className="title-card">
        <div className="eyebrow">Ashport · October 1925</div>
        <h1>Black Ledger</h1>
        <p className="tagline">Every crime is a transaction. Every lie has a price.</p>
        <button className="primary" onClick={begin}>
          Walk the Narrows
        </button>
        <div className="settings-row">
          <span>Graphics</span>
          <QualityPicker />
        </div>
        <p className="controls">
          {isTouchDevice
            ? 'Left thumb: walk (push far to run) · Right thumb: look'
            : 'Click to look around · WASD to walk · Shift to run · Esc to pause'}
        </p>
        <p className="build">Milestone 1 · the street</p>
      </div>
    </div>
  )
}
