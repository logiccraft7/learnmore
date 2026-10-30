import type { Rng } from '../../sim/rng'
import type { ConceptId, Generator } from '../types'
import { $, make, rngFor, shuffleChoices, twoNames } from './util'

type Scenario = (rng: Rng) => { prompt: string; right: string; wrong: string[]; why: string[]; nudge: string; method: string }

/** Scenarios are ordered roughly by subtlety; difficulty picks from the matching band. */
function scenarioGenerator(concept: ConceptId, scenarios: Scenario[]): Generator {
  return (seed, d) => {
    const rng = rngFor(seed)
    const band = Math.min(scenarios.length - 1, Math.floor(((d - 1) / 5) * scenarios.length) + rng.int(0, 1))
    const s = scenarios[band](rng)
    const { choices, answer } = shuffleChoices(rng, s.right, s.wrong)
    return make(concept, seed, d, { prompt: s.prompt, kind: 'choice', choices, answer, tolerance: 0, hint: { nudge: s.nudge, method: s.method }, worked: s.why })
  }
}

export const anchoring = scenarioGenerator('anchoring', [
  (rng) => {
    const worth = rng.int(15, 40)
    const ask = worth * 3
    return {
      prompt: `A fence opens at ${$(ask)} for a watch worth about ${$(worth)}. You haggle him to ${$(Math.round(worth * 1.8))} and feel you won. What happened?`,
      right: 'Anchoring: his first number set the range, so a bad price felt like a bargain',
      wrong: ['Reciprocity: you owed him for his time', 'Sunk cost: you had already spent time haggling', 'Nothing: you got 40% off, which is a good deal'],
      why: ['The first number named becomes the reference point for everything after.', `Measured against ${$(ask)}, ${$(Math.round(worth * 1.8))} looks cheap. Measured against the real value, ${$(worth)}, it's a rip-off.`, 'Fix: decide your own reference price before you hear theirs.'],
      nudge: 'Ask yourself what made the final price feel good.',
      method: 'Anchoring: people adjust from the first number they hear, and they adjust too little.',
    }
  },
  (rng) => {
    const market = rng.int(90, 140) / 100
    const hi = Math.round(market * 1.45 * 20) / 20
    return {
      prompt: `You're selling gin to Rosie. Street price is about ${$(market)} a pint and you'd like ${$(Math.round(market * 1.2 * 20) / 20)}. Which opening gets you closest?`,
      right: `Open at ${$(hi)} with a reason ("it's cut clean, nobody goes blind"), then concede slowly`,
      wrong: [`Open at ${$(market)} to build trust`, "Ask Rosie to name her price first", `Open at exactly your target so she knows you're fair`],
      why: ['A confident, justified first offer anchors the talk in your favour.', 'Concessions from a high anchor still land above your target.', 'Letting her open hands her the anchor; opening at market gives away your room to move.'],
      nudge: 'Who speaks the first number usually shapes the deal.',
      method: 'Make the first offer, a bit ambitious, with a reason attached.',
    }
  },
  (rng) => {
    const [a] = twoNames(rng)
    return {
      prompt: `Questioning a witness about a getaway driver, your partner asks: "Was he going faster than 60?" The witness says "about 55". Why is that answer suspect?`,
      right: 'The number 60 in the question anchored the witness\'s estimate upward',
      wrong: ['Witnesses always exaggerate speed', `${a} was probably lying to protect the driver`, 'Nobody can estimate speed, so ignore it'],
      why: ['Numbers inside a question act as anchors for the answer.', 'Ask open questions ("How fast was he going?") so you don\'t plant the number.'],
      nudge: 'Where did the witness\'s number come from?',
      method: 'Leading numbers in questions anchor estimates. Use open questions.',
    }
  },
  (rng) => {
    const cheap = rng.pick([35, 40, 50])
    const mid = cheap + 25
    const top = mid * 2
    return {
      prompt: `The Blind Pig menu: house gin ${cheap}¢, "the Gatsby" ${mid}¢, "Champagne Royale" ${top}¢. Almost nobody orders the Royale, so why keep it on the menu?`,
      right: `It makes the ${mid}¢ cocktail look reasonable and pulls orders up from the ${cheap}¢ gin`,
      wrong: ['To use up old champagne', 'Customers like having more choices, so sales go up evenly', 'It signals the bar is honest'],
      why: ['An expensive "decoy" anchors what feels normal to pay.', `Next to ${top}¢, ${mid}¢ feels moderate, so more people trade up from ${cheap}¢.`],
      nudge: 'Think about what the Royale does to how the other prices feel.',
      method: 'A high-priced item anchors perceptions and shifts choices toward the middle option.',
    }
  },
  () => ({
    prompt: 'O\'Malley opens at an absurd number for a pistol you need tonight. What\'s the best response?',
    right: 'Don\'t counter his number. Re-anchor with your own figure and the reasons for it',
    wrong: ['Split the difference between his price and yours', 'Counter just below his number to keep him talking', 'Pay it: you need it tonight'],
    why: ['Countering near an extreme anchor accepts it as the reference point.', 'Splitting the difference rewards the extreme opening.', 'Set a new reference with your own justified number, or walk away.'],
    nudge: 'Every counter-offer near his number makes his number the centre of the deal.',
    method: 'Neutralise an extreme anchor: name it as unrealistic and put your own anchor on the table.',
  }),
])

export const reciprocity = scenarioGenerator('reciprocity', [
  () => ({
    prompt: 'A bootlegger sends you a free bottle "for the new neighbour". A week later he asks you to look the other way. Which principle is he using?',
    right: 'Reciprocity: people feel obliged to repay a favour, even one they never asked for',
    wrong: ['Anchoring', 'Scarcity', 'Sunk cost'],
    why: ['Unrequested gifts still create a felt debt.', 'That\'s why bribes so often start as "gifts".'],
    nudge: 'What does a gift make the receiver feel?',
    method: 'Reciprocity: we repay what others give us.',
  }),
  (rng) => {
    const [w] = twoNames(rng)
    return {
      prompt: `${w}, a nervous dishwasher, saw something the night of the poisoning but won't talk. Which approach is most likely to open him up?`,
      right: 'Do something for him first, with no strings: cover his lost wages for the night, then ask',
      wrong: ['Threaten to call immigration', 'Promise to pay him after he talks', 'Ask the same question louder until he answers'],
      why: ['Giving first triggers the urge to give back. Promising later doesn\'t, because nothing has been given yet.', 'Threats get compliance or lies, not cooperation.'],
      nudge: 'Who moves first matters.',
      method: 'Reciprocity works best when you give first, personally, and without strings.',
    }
  },
  (rng) => {
    const big = rng.int(50, 200)
    return {
      prompt: `You ask a club owner to hide ${big} cases in his cellar. He refuses. You then ask if he'll just store two cases for a night. Why is he now more likely to say yes?`,
      right: 'Door-in-the-face: your retreat feels like a concession he should return',
      wrong: ['Anchoring on the number of cases', 'He felt guilty about lying', 'Two cases is legal'],
      why: ['A big request followed by a smaller one feels like you gave something up.', 'People reciprocate concessions too, not just gifts.'],
      nudge: 'What did you just "give" him by asking for less?',
      method: 'Reciprocal concessions: retreating from a large request invites agreement to a smaller one.',
    }
  },
  () => ({
    prompt: 'Negotiating with a rival gang, they drop their demand from 40% to 30% of the docks. What usually keeps the deal moving?',
    right: 'Make a small concession of your own in return',
    wrong: ['Hold firm: they are clearly weak', 'Immediately accept 30%', 'Walk out to show strength'],
    why: ['Concessions are expected to be reciprocated. Holding firm reads as bad faith.', 'A small return concession keeps the exchange going toward a deal you can live with.'],
    nudge: 'They just gave something. What do they expect?',
    method: 'Match concessions, in smaller steps than theirs.',
  }),
  () => ({
    prompt: 'A city councilman keeps doing you small favours and refuses anything in return. Why should the Skeptic in you be worried?',
    right: 'He is building up a debt he can call in later, at a price he chooses',
    wrong: ['He is lonely', 'Small favours never matter', 'He is just honest'],
    why: ['Refusing repayment keeps the obligation open, and it grows.', 'When he finally asks, saying no will feel like betrayal. That\'s the point.'],
    nudge: 'What does an unpaid favour turn into over time?',
    method: 'Reciprocity can be weaponised: unrepaid favours create leverage.',
  }),
])
