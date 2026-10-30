import { useGame } from '../state/game'
import { useSettings } from '../state/settings'
import { QualityPicker } from './TitleScreen'

export function PauseMenu() {
  const phase = useGame((s) => s.phase)
  const setPhase = useGame((s) => s.setPhase)
  const sensitivity = useSettings((s) => s.sensitivity)
  const setSensitivity = useSettings((s) => s.setSensitivity)
  if (phase !== 'paused') return null
  return (
    <div className="overlay pause">
      <div className="title-card small">
        <h2>Paused</h2>
        <button className="primary" onClick={() => setPhase('playing')}>
          Resume
        </button>
        <div className="settings-row">
          <span>Graphics</span>
          <QualityPicker />
        </div>
        <label className="settings-row">
          <span>Look speed</span>
          <input id="look-speed" type="range" min={0.3} max={2.5} step={0.1} value={sensitivity} onChange={(e) => setSensitivity(Number(e.target.value))} />
        </label>
        <p className="small saved">Game saved. Time is stopped.</p>
        <button className="secondary" onClick={() => setPhase('title')}>
          Quit to title
        </button>
      </div>
    </div>
  )
}
