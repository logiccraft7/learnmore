import { edition, money } from '../sim/news'
import { useGame } from '../state/game'
import { useWorld } from '../state/world'
import { Sparkline } from './Sparkline'
import { generate } from '../learning/generators'
import { targetDifficulty } from '../learning/mastery'
import { usePalace } from '../state/palace'
import { deriveSeed } from '../sim/rng'

/** Turn today's market story into a supply-and-demand problem in the Mind Palace. */
function workItOut(headline: string) {
  const g = useWorld.getState().game
  if (!g) return
  const p = generate('supply_demand', deriveSeed(g.seed, `gazette-${g.minutes}`), Math.max(3, targetDifficulty(g.learning.supply_demand)))
  const problem = { ...p, prompt: `Today's Gazette: "${headline}." Suppose the Narrows gin market looks like this. ${p.prompt}` }
  usePalace.getState().open({ kind: 'problems', problems: [problem], title: 'From the Gazette' })
  useGame.getState().setPhase('palace')
}

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
              <button className="fold work" onClick={() => workItOut(lead.headline)}>
                Work it out in the Mind Palace
              </button>
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
