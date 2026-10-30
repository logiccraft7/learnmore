import { dateLabel, MINUTES_PER_DAY } from './clock'
import { GOODS, goodSpec, type GoodId, type MarketEvent } from './economy'
import type { GameState } from './game'
import { createRng, deriveSeed } from './rng'

export type Story = { headline: string; deck: string; lesson?: string }
export type PriceRow = { id: GoodId; name: string; unit: string; legal: boolean; price: number; changePct: number; history: number[] }
export type Edition = { date: string; stories: Story[]; prices: PriceRow[]; classified: string }

const LOCAL = [
  ['Mayor Whitlock vows "clean streets by Christmas"', 'Reporters note the Mayor\'s new Packard.'],
  ['Stock market climbs for ninth straight week', 'Shoeshine boys are trading tips on Radio Corporation.'],
  ['Jazz band arrested, released, arrested again', 'Neighbours complain of "syncopation at all hours".'],
  ['Ashport Savings Bank pays 4% on deposits', '"Safe as houses," says the president, from his new house.'],
  ['Fire at the docks: arson suspected', 'The warehouse was insured for twice its value.'],
  ['Flagpole sitter enters day eleven above Main Street', 'He has not come down to vote, eat or explain himself.'],
  ['Dry agents pledge war on the Narrows', 'The Narrows did not respond. It was busy.'],
]

const CLASSIFIEDS = [
  'WANTED: Driver, good nerves, no questions. Apply rear of Starlight Laundry.',
  'LOST: Gentleman\'s pocket watch, inscribed "To L., for luck". Reward. Box 14.',
  'FOR SALE: Copper boiler, "for laundry". Hardly used. $12. Ask at the docks.',
  'PIANO LESSONS. Also other lessons. Ask for Vera.',
  'ROOMS by the week, Hotel Meridian. No pets, no police.',
]

/** Plain-language economics behind a market event: what moved, and which way the price goes. */
function explain(e: MarketEvent): string {
  const what = e.good === 'all' ? 'everything on the street' : goodSpec(e.good).name.toLowerCase()
  if (e.kind === 'supply')
    return e.size < 0
      ? `Less ${what} reaching buyers, same thirst for it: supply falls, so the price climbs.`
      : `More ${what} on the street than buyers want at today's price: supply rises, so the price slides.`
  return e.size > 0
    ? `More people want ${what} at every price: demand rises, so sellers can ask more.`
    : `Fewer buyers for ${what}: demand falls, so prices soften.`
}

export function edition(game: GameState): Edition {
  const day = Math.floor(game.minutes / MINUTES_PER_DAY)
  const rng = createRng(deriveSeed(game.seed, `gazette-${day}`))
  const today = game.news.find((n) => n.day === day)?.events ?? []
  const stories: Story[] = today.map((e) => ({ headline: e.headline, deck: 'Street prices expected to react.', lesson: explain(e) }))
  const local = [...LOCAL]
  while (stories.length < 3) {
    const [headline, deck] = local.splice(rng.int(0, local.length - 1), 1)[0]
    stories.push({ headline, deck })
  }
  const prices = GOODS.map((g) => {
    const h = game.market[g.id].history
    const prev = h.length > 1 ? h[h.length - 2] : h[h.length - 1]
    const price = game.market[g.id].price
    return { id: g.id, name: g.name, unit: g.unit, legal: g.legal, price, changePct: ((price - prev) / prev) * 100, history: h }
  })
  return { date: dateLabel(game.minutes), stories, prices, classified: rng.pick(CLASSIFIEDS) }
}

/** "$1.10" or "7¢" */
export function money(amount: number): string {
  if (Math.abs(amount) < 1 && amount !== 0) return `${Math.round(amount * 100)}¢`
  return `$${amount.toFixed(2)}`
}
