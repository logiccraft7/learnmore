import { dayIndex } from '../sim/clock'
import { GOODS } from '../sim/economy'
import { ITEMS, type ItemId } from '../sim/game'
import { money } from '../sim/news'
import { useGame } from '../state/game'
import { useWorld } from '../state/world'
import { heatLevel } from './Hud'
import { Sparkline } from './Sparkline'

export function Notebook() {
  const phase = useGame((s) => s.phase)
  const setPhase = useGame((s) => s.setPhase)
  const game = useWorld((s) => s.game)
  if (phase !== 'notebook' || !game) return null
  const today = dayIndex(game.minutes)
  const lastPaper = game.papersBought.length ? Math.max(...game.papersBought) : null
  const age = lastPaper === null ? null : today - lastPaper
  const level = heatLevel(game.heat)
  return (
    <div className="overlay panel-overlay" onClick={(e) => e.target === e.currentTarget && setPhase('playing')}>
      <div className="notebook" role="dialog" aria-label="Notebook">
        <header>
          <h2>Notebook</h2>
          <span className="hint">Time stops while you write. <kbd>Tab</kbd> to close</span>
        </header>
        <div className="nb-grid">
          <section>
            <h3>Pockets</h3>
            <p className="nb-cash">{money(game.cash)}</p>
            <ul className="items">
              {(Object.keys(game.inventory) as ItemId[]).map((id) => (
                <li key={id}>
                  <b>{ITEMS[id].name}</b>
                  <span>{ITEMS[id].note}</span>
                </li>
              ))}
            </ul>
            <h3>Heat · {level.label}</h3>
            <div className={`heat-bar big ${level.tone}`}>
              <div style={{ width: `${game.heat}%` }} />
            </div>
            <p className="small">Police attention. It rises when you're seen doing something illegal and cools off by about 8 points a day.</p>
          </section>
          <section>
            <h3>Street prices</h3>
            {age === null ? (
              <p className="small">
                No idea yet. Prices move every day and the only honest source is the <b>Ashport Gazette</b>: 2¢ at the News &amp; Tobacco stand.
                Information costs money. Not having it usually costs more.
              </p>
            ) : (
              <>
                <p className="small">{age === 0 ? "From today's Gazette." : `From the Gazette ${age} day${age > 1 ? 's' : ''} ago. Prices may have moved since.`}</p>
                <table className="prices">
                  <tbody>
                    {GOODS.map((g) => {
                      const h = game.market[g.id].history
                      const seen = h.slice(0, Math.max(1, h.length - age!))
                      const price = seen[seen.length - 1]
                      return (
                        <tr key={g.id}>
                          <td>
                            {g.name}
                            {!g.legal && <em> contraband</em>}
                          </td>
                          <td className="num">
                            {money(price)}/{g.unit}
                          </td>
                          <td>
                            <Sparkline values={seen} />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </>
            )}
            <h3>Clippings</h3>
            {game.papersBought.every((d) => !game.news.find((n) => n.day === d)?.events.length) ? (
              <p className="small">{game.papersBought.length ? 'Quiet days. Nothing in the papers moved the market.' : 'Nothing yet.'}</p>
            ) : (
              <ul className="clips">
                {game.papersBought
                  .slice(-4)
                  .reverse()
                  .flatMap((d) => game.news.find((n) => n.day === d)?.events.map((e) => <li key={`${d}${e.headline}`}>{e.headline}</li>) ?? [])}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
