import { edition, money } from '../sim/news'
import { useGame } from '../state/game'
import { useWorld } from '../state/world'
import { Sparkline } from './Sparkline'

export function Gazette() {
  const phase = useGame((s) => s.phase)
  const setPhase = useGame((s) => s.setPhase)
  const game = useWorld((s) => s.game)
  if (phase !== 'gazette' || !game) return null
  const e = edition(game)
  const [lead, ...rest] = e.stories
  return (
    <div className="overlay panel-overlay" onClick={(ev) => ev.target === ev.currentTarget && setPhase('playing')}>
      <article className="gazette" role="dialog" aria-label="The Ashport Gazette">
        <header className="masthead">
          <div className="mast-row">
            <span>{e.date}</span>
            <span>Ashport's Own Newspaper</span>
            <span>Two Cents</span>
          </div>
          <h1>The Ashport Gazette</h1>
        </header>
        <section className="lead">
          <h2>{lead.headline}</h2>
          <p className="deck">{lead.deck}</p>
          {lead.lesson && (
            <aside className="voice">
              <b>The Economist</b> <span>(a voice in your head)</span>
              <p>{lead.lesson}</p>
            </aside>
          )}
        </section>
        <div className="columns">
          {rest.map((s) => (
            <section key={s.headline}>
              <h3>{s.headline}</h3>
              <p className="deck">{s.deck}</p>
              {s.lesson && (
                <p className="voice-line">
                  <b>Economist:</b> {s.lesson}
                </p>
              )}
            </section>
          ))}
          <section className="market">
            <h3>Street Prices</h3>
            <p className="deck">As whispered to our reporter. The Gazette does not condone.</p>
            <table>
              <tbody>
                {e.prices.map((p) => (
                  <tr key={p.id}>
                    <td>{p.name}</td>
                    <td className="num">{money(p.price)}</td>
                    <td className={`num chg ${p.changePct > 0.5 ? 'up' : p.changePct < -0.5 ? 'down' : ''}`}>
                      {p.changePct > 0.5 ? '▲' : p.changePct < -0.5 ? '▼' : '–'} {Math.abs(p.changePct).toFixed(0)}%
                    </td>
                    <td>
                      <Sparkline values={p.history} width={64} height={18} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
        <footer>
          <p className="classified">
            <b>Classified.</b> {e.classified}
          </p>
          <button className="fold" onClick={() => setPhase('playing')}>
            Fold the paper <kbd>Esc</kbd>
          </button>
        </footer>
      </article>
    </div>
  )
}
