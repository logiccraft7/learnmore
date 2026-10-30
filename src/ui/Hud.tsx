import { useEffect, useState } from 'react'
import { clockLabel, dateLabel } from '../sim/clock'
import { money } from '../sim/news'
import { useFocus } from '../state/focus'
import { useGame } from '../state/game'
import { useWorld } from '../state/world'
import { dueConcepts } from '../learning/mastery'

export function heatLevel(heat: number) {
  if (heat >= 75) return { label: 'Wanted', tone: 'hot' }
  if (heat >= 50) return { label: 'Hot', tone: 'hot' }
  if (heat >= 25) return { label: 'Noticed', tone: 'warm' }
  return { label: 'Cool', tone: 'cool' }
}

function Toast() {
  const toast = useWorld((s) => s.toast)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    if (!toast) return
    setVisible(true)
    const t = setTimeout(() => setVisible(false), 4000 + toast.text.length * 35)
    return () => clearTimeout(t)
  }, [toast])
  return toast ? <div className={`toast ${visible ? 'show' : ''}`}>{toast.text}</div> : null
}

/** "Mind Palace · 3 due": the nudge to come back and review. Rechecked every in-game minute. */
function DueChip() {
  useWorld((s) => Math.floor(s.game?.minutes ?? 0))
  const learning = useWorld((s) => s.game?.learning)
  if (!learning) return null
  const tried = Object.values(learning).some((m) => m && m.attempts > 0)
  const due = dueConcepts(learning, Date.now()).length
  if (tried && !due) return null
  return <div className={`hud-due ${due ? 'on' : ''}`}>{due ? `Mind Palace · ${due} due` : 'Mind Palace: your office, right side'}</div>
}

export function Hud() {
  const phase = useGame((s) => s.phase)
  const minute = useWorld((s) => Math.floor(s.game?.minutes ?? 0))
  const cash = useWorld((s) => s.game?.cash ?? 0)
  const heat = useWorld((s) => s.game?.heat ?? 0)
  const focus = useFocus((s) => s.focus)
  const game = useWorld((s) => s.game)
  const [showCard, setShowCard] = useState(true)
  useEffect(() => {
    if (phase !== 'playing') return
    const t = setTimeout(() => setShowCard(false), 7000)
    return () => clearTimeout(t)
  }, [phase])
  if (phase === 'title' || !game) return null
  const level = heatLevel(heat)
  return (
    <div className="hud">
      {phase === 'playing' && <div className="crosshair" />}
      <div className="hud-clock">
        <div className="hud-time">{clockLabel(minute)}</div>
        <div className="hud-date">{dateLabel(minute)}</div>
        <div className="hud-cash">{money(cash)}</div>
        <DueChip />
      </div>
      <div className={`hud-heat ${level.tone}`} title="How much attention the police are paying you">
        <span>Heat</span>
        <div className="heat-bar">
          <div style={{ width: `${heat}%` }} />
        </div>
        <b>{level.label}</b>
      </div>
      {phase === 'playing' && focus && (
        <div className="prompt">
          <kbd>E</kbd> {focus.prompt(game)}
        </div>
      )}
      <div className={`location ${showCard ? 'show' : ''}`}>
        <div className="loc-name">The Narrows</div>
        <div className="loc-sub">Ashport · Prohibition, year six</div>
      </div>
      <div className="keys">
        <span><kbd>Tab</kbd> Notebook</span>
        <span><kbd>E</kbd> Use</span>
        <span><kbd>Esc</kbd> Pause</span>
      </div>
      <Toast />
    </div>
  )
}
