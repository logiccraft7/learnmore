import type { Generator } from '../types'
import { $, make, price, r1, r2, rngFor, shuffleChoices } from './util'

export const unit_price: Generator = (seed, d) => {
  const rng = rngFor(seed)
  const qa = rng.int(2, 10)
  const qb = qa + rng.int(1, 8)
  const ua = rng.int(150, 350) / 100
  const ub = r2(ua * rng.range(0.85, 1.12))
  if (d === 1) {
    const total = r2(qa * ua)
    return make('unit_price', seed, d, {
      prompt: `A runner offers ${qa} gallons of grain alcohol for ${$(total)}. What's the price per gallon?`,
      kind: 'number', unit: 'money', answer: r2(total / qa), tolerance: 0.006,
      hint: { nudge: 'Per gallon means divide by the gallons.', method: 'unit price = total ÷ quantity.' },
      worked: [`${$(total)} ÷ ${qa} = ${$(total / qa)} per gallon`],
    })
  }
  const fee = d >= 3 ? rng.int(1, 6) : 0
  const disc = d >= 4 ? rng.pick([5, 10, 15]) : 0
  const totalA = r2(qa * ua + fee)
  const totalB = r2(qb * ub * (1 - disc / 100))
  const perA = totalA / qa
  const perB = totalB / qb
  const answer = r2(Math.min(perA, perB))
  return make('unit_price', seed, d, {
    prompt:
      `Two offers for grain alcohol. Lefty: ${qa} gal at ${$(ua)} a gallon${fee ? ` plus a ${$(fee)} delivery charge` : ''}. ` +
      `The Greek: ${qb} gal for ${$(r2(qb * ub))}${disc ? `, ${disc}% off if you take it all` : ''}. What's the cost per gallon of the cheaper deal?`,
    kind: 'number', unit: 'money', answer, tolerance: 0.011,
    hint: { nudge: "The bigger lot isn't automatically the cheaper one.", method: 'Work out total cost ÷ gallons for each, then compare.' },
    worked: [
      `Lefty: (${qa} × ${$(ua)}${fee ? ` + ${$(fee)}` : ''}) ÷ ${qa} = ${$(perA)}/gal`,
      `Greek: ${$(r2(qb * ub))}${disc ? ` × ${1 - disc / 100}` : ''} ÷ ${qb} = ${$(perB)}/gal`,
      `Cheaper: ${$(answer)}/gal (${perA <= perB ? 'Lefty' : 'the Greek'})`,
    ],
  })
}

export const profit_margin: Generator = (seed, d) => {
  const rng = rngFor(seed)
  const cost = rng.int(20, 80) / 100
  const sell = r2(cost + rng.int(10, 120) / 100)
  const n = rng.int(10, 60)
  if (d === 1) {
    const answer = r2((sell - cost) * n)
    return make('profit_margin', seed, d, {
      prompt: `Each pint of gin costs you ${price(cost)} to make and sells for ${price(sell)}. You sell ${n} pints. What's your profit?`,
      kind: 'number', unit: 'money', answer, tolerance: 0.011,
      hint: { nudge: 'Profit is what is left after paying for what you sold.', method: 'profit = (price − cost) × quantity.' },
      worked: [`Per pint: ${price(sell)} − ${price(cost)} = ${price(r2(sell - cost))}`, `× ${n} = ${$(answer)}`],
    })
  }
  if (d === 2 || d === 3) {
    const margin = d === 2
    const answer = r1(((sell - cost) / (margin ? sell : cost)) * 100)
    return make('profit_margin', seed, d, {
      prompt: `Cost ${price(cost)}, price ${price(sell)}. What's the ${margin ? 'profit margin (profit as a percent of the price)' : 'markup (profit as a percent of the cost)'}?`,
      kind: 'number', unit: 'percent', answer, tolerance: 0.15,
      hint: { nudge: 'Margin and markup divide the same profit by different things.', method: margin ? 'margin = (price − cost) ÷ price.' : 'markup = (price − cost) ÷ cost.' },
      worked: [`Profit = ${price(r2(sell - cost))}`, `÷ ${margin ? price(sell) : price(cost)} = ${answer}%`],
    })
  }
  if (d === 4) {
    const m = rng.pick([20, 25, 40, 50, 60])
    const answer = r2(cost / (1 - m / 100))
    return make('profit_margin', seed, d, {
      prompt: `A bottle costs you ${price(cost)}. The boss wants a ${m}% margin on the selling price. What price?`,
      kind: 'number', unit: 'money', answer, tolerance: 0.011,
      hint: { nudge: `If ${m}% of the price is profit, cost is the other ${100 - m}%.`, method: 'price = cost ÷ (1 − margin).' },
      worked: [`Cost is ${100 - m}% of the price`, `Price = ${price(cost)} ÷ ${1 - m / 100} = ${$(answer)}`],
    })
  }
  const fixed = rng.int(5, 40) * 5
  const target = rng.int(5, 30) * 5
  const answer = r2((fixed + target) / n + cost)
  return make('profit_margin', seed, d, {
    prompt: `This week: protection money ${$(fixed)}, each pint costs ${price(cost)}, and you can move ${n} pints. What price per pint clears ${$(target)} profit?`,
    kind: 'number', unit: 'money', answer, tolerance: 0.011,
    hint: { nudge: 'Revenue has to cover the fixed bill, every pint, and the profit.', method: 'price = (fixed + target) ÷ pints + unit cost.' },
    worked: [`Needed beyond pint costs: ${$(fixed)} + ${$(target)} = ${$(fixed + target)}`, `Per pint: ${$(fixed + target)} ÷ ${n} = ${$((fixed + target) / n)}`, `+ ${price(cost)} = ${$(answer)}`],
  })
}

export const opportunity_cost: Generator = (seed, d) => {
  const rng = rngFor(seed)
  const options: [string, number][] = [
    ['run the still all night', rng.int(6, 20)],
    ['tail the Greek for the Commissioner', rng.int(5, 18)],
    ['deal cards at the Hotel Meridian', rng.int(4, 16)],
    ['drive a truck for Mickey', rng.int(7, 22)],
  ]
  const n = d <= 2 ? 2 : d <= 4 ? 3 : 4
  const pool = options.slice(0, n)
  const chosen = rng.int(0, n - 1)
  const others = pool.filter((_, i) => i !== chosen)
  const best = others.reduce((a, b) => (b[1] > a[1] ? b : a))
  const sunk = d >= 4 ? rng.int(2, 9) : 0
  return make('opportunity_cost', seed, d, {
    prompt:
      `Tonight you could: ${pool.map(([t, v]) => `${t} (${$(v)})`).join('; ')}. You decide to ${pool[chosen][0]}.` +
      (sunk ? ` You already spent ${$(sunk)} on a new hat for it, non-refundable.` : '') +
      ' What is the opportunity cost of your choice, in dollars?',
    kind: 'number', unit: 'money', answer: best[1], tolerance: 0.001,
    hint: { nudge: "It's not the sum of everything you gave up. You could only have done one other thing.", method: 'Opportunity cost = the value of the best alternative you gave up.' + (sunk ? ' Money already spent and unrecoverable does not count.' : '') },
    worked: [`Alternatives: ${others.map(([t, v]) => `${t} ${$(v)}`).join(', ')}`, `Best one given up: ${best[0]} = ${$(best[1])}`, ...(sunk ? [`The ${$(sunk)} hat is a sunk cost: spent whatever you choose, so ignore it.`] : [])],
  })
}

export const supply_demand: Generator = (seed, d) => {
  const rng = rngFor(seed)
  // Qd = a − b·P, Qs = c + e·P, with prices in cents so answers stay tidy.
  const P = rng.int(4, 30) * 5
  const b = rng.int(1, 4)
  const e = rng.int(1, 4)
  const Q = rng.int(100, 400)
  const a = Q + b * P
  const c = Q - e * P
  const curves = `Demand: Q = ${a} − ${b}P. Supply: Q = ${c < 0 ? `−${-c}` : c} + ${e}P. (P in cents, Q in pints a night.)`
  if (d <= 2) {
    return make('supply_demand', seed, d, {
      prompt: `The Narrows gin market. ${curves} ${d === 1 ? 'What price clears the market?' : 'How many pints sell at the market-clearing price?'}`,
      kind: 'number', unit: 'plain', answer: d === 1 ? P : Q, tolerance: 0.01,
      hint: { nudge: 'The market clears where buyers want exactly what sellers offer.', method: 'Set demand = supply and solve for P' + (d === 2 ? ', then put P back into either curve.' : '.') },
      worked: [`${a} − ${b}P = ${c} + ${e}P`, `${a - c} = ${b + e}P → P = ${P}¢`, ...(d === 2 ? [`Q = ${a} − ${b}×${P} = ${Q}`] : [])],
    })
  }
  if (d === 3) {
    const shift = (b + e) * rng.int(2, 10)
    const P2 = P + shift / (b + e)
    return make('supply_demand', seed, d, {
      prompt: `${curves} A heat wave adds ${shift} pints of demand at every price. What's the new market price, in cents?`,
      kind: 'number', unit: 'plain', answer: P2, tolerance: 0.01,
      hint: { nudge: 'More demand at every price shifts the demand curve out.', method: `New demand: Q = ${a + shift} − ${b}P. Set it equal to supply.` },
      worked: [`${a + shift} − ${b}P = ${c} + ${e}P`, `${a + shift - c} = ${b + e}P`, `P = ${P2}¢ (up ${P2 - P}¢)`],
    })
  }
  if (d === 4) {
    const cap = Math.max(5, P - rng.int(2, 6) * 5)
    const shortage = a - b * cap - (c + e * cap)
    return make('supply_demand', seed, d, {
      prompt: `${curves} The Mayor's "fair price" order caps gin at ${cap}¢. How many pints short is the market each night?`,
      kind: 'number', unit: 'plain', answer: shortage, tolerance: 0.01,
      hint: { nudge: 'Below the clearing price, buyers want more than sellers offer.', method: 'shortage = demand at the cap − supply at the cap.' },
      worked: [`Demand at ${cap}¢: ${a} − ${b}×${cap} = ${a - b * cap}`, `Supply at ${cap}¢: ${c} + ${e}×${cap} = ${c + e * cap}`, `Shortage = ${shortage} pints`],
    })
  }
  const tax = (b + e) * rng.int(1, 4)
  const buyerPrice = P + (e * tax) / (b + e)
  return make('supply_demand', seed, d, {
    prompt: `${curves} The precinct starts "taxing" sellers ${tax}¢ per pint. What price do drinkers now pay, in cents?`,
    kind: 'number', unit: 'plain', answer: buyerPrice, tolerance: 0.01,
    hint: { nudge: 'Sellers only keep the price minus the tax, so supply responds to P − t.', method: `Supply becomes Q = ${c} + ${e}(P − ${tax}). Set equal to demand.` },
    worked: [`${a} − ${b}P = ${c} + ${e}(P − ${tax})`, `${a - c + e * tax} = ${b + e}P`, `P = ${buyerPrice}¢: drinkers bear ${buyerPrice - P}¢ of the ${tax}¢ tax`],
  })
}

export const marginal_thinking: Generator = (seed, d) => {
  const rng = rngFor(seed)
  // Runners sell bottles with diminishing returns.
  const first = rng.int(30, 60)
  const drop = rng.int(4, 10)
  const extra = Array.from({ length: 6 }, (_, i) => Math.max(2, first - drop * i))
  const totals = extra.reduce<number[]>((acc, x) => [...acc, (acc[acc.length - 1] ?? 0) + x], [])
  const profitPer = rng.pick([0.4, 0.5, 0.6, 0.75])
  const wage = rng.int(8, 25)
  const table = totals.map((t, i) => `${i + 1} runner${i ? 's' : ''}: ${t}`).join(', ')
  if (d <= 2) {
    const k = rng.int(2, 6)
    const answer = d === 1 ? extra[k - 1] : r2(extra[k - 1] * profitPer)
    return make('marginal_thinking', seed, d, {
      prompt: `Bottles sold a night: ${table}. ${d === 1 ? `How many extra bottles does runner #${k} add?` : `Each bottle clears ${price(profitPer)}. How much extra profit does runner #${k} bring in, before wages?`}`,
      kind: 'number', unit: d === 1 ? 'plain' : 'money', answer, tolerance: 0.011,
      hint: { nudge: "Marginal means 'the extra from one more'.", method: `Look at the jump from ${k - 1} to ${k} runners.` },
      worked: [`${totals[k - 1]} − ${totals[k - 2]} = ${extra[k - 1]} bottles`, ...(d === 2 ? [`× ${price(profitPer)} = ${$(answer)}`] : [])],
    })
  }
  const w = d === 5 ? wage + rng.int(3, 8) : wage
  let best = 0
  for (let i = 0; i < 6; i++) if (extra[i] * profitPer >= w) best = i + 1
  return make('marginal_thinking', seed, d, {
    prompt: `Bottles sold a night: ${table}. Each bottle clears ${price(profitPer)}; each runner costs ${$(w)} a night${d === 5 ? ' (wages just went up)' : ''}. How many runners should you hire?`,
    kind: 'number', unit: 'plain', answer: best, tolerance: 0.01,
    hint: { nudge: 'Hire while the next runner earns more than he costs.', method: 'Compare each runner\'s extra profit (extra bottles × profit per bottle) with the wage.' },
    worked: [...extra.map((x, i) => `Runner ${i + 1}: ${x} × ${price(profitPer)} = ${$(x * profitPer)} ${x * profitPer >= w ? '≥' : '<'} ${$(w)}`), `Hire ${best}`],
  })
}

export const expected_value: Generator = (seed, d) => {
  const rng = rngFor(seed)
  if (d <= 2) {
    const p = rng.pick([10, 20, 25, 30, 40, 50])
    const win = rng.int(2, 20)
    const lose = rng.int(1, 8)
    const answer = r2((p / 100) * win - (1 - p / 100) * lose)
    return make('expected_value', seed, d, {
      prompt: `A bet at the Meridian: ${p}% chance to win ${$(win)}, otherwise you lose ${$(lose)}. What's the expected value per bet? (Negative if you lose on average.)`,
      kind: 'number', unit: 'money', answer, tolerance: 0.011,
      hint: { nudge: 'Weigh each outcome by how often it happens.', method: 'EV = p × win − (1 − p) × loss.' },
      worked: [`${p / 100} × ${$(win)} = ${$((p / 100) * win)}`, `${r2(1 - p / 100)} × ${$(lose)} = ${$((1 - p / 100) * lose)}`, `EV = ${$(answer)}`],
    })
  }
  if (d <= 4) {
    const p = rng.pick([5, 10, 15, 20, 25])
    const fine = rng.int(10, 60) * 5
    const ev = r2((p / 100) * fine)
    let bribe = rng.int(5, 40)
    if (Math.abs(bribe - ev) < 0.5) bribe += 3 // avoid a coin-flip decision
    const right = ev > bribe ? 'Pay the bribe' : "Don't pay"
    if (d === 3)
      return make('expected_value', seed, d, {
        prompt: `Without protection there's a ${p}% chance of a raid this week, costing ${$(fine)} in seized stock. What's the expected cost of NOT paying the cop?`,
        kind: 'number', unit: 'money', answer: ev, tolerance: 0.011,
        hint: { nudge: 'Expected cost = chance × damage.', method: `EV = ${p / 100} × ${$(fine)}.` },
        worked: [`${p / 100} × ${$(fine)} = ${$(ev)}`],
      })
    const { choices, answer } = shuffleChoices(rng, right, [right === 'Pay the bribe' ? "Don't pay" : 'Pay the bribe', 'It makes no difference', 'Pay double to be safe'])
    return make('expected_value', seed, d, {
      prompt: `Officer Kowalski wants ${$(bribe)} a week. Without it: ${p}% chance of a raid costing ${$(fine)}. Going only by expected money, what should you do?`,
      kind: 'choice', choices, answer, tolerance: 0,
      hint: { nudge: 'Turn the risk into an expected cost, then compare it with the sure cost.', method: `Expected raid cost = ${p / 100} × ${$(fine)}.` },
      worked: [`Expected raid cost = ${$(ev)}`, `Bribe = ${$(bribe)}`, ev > bribe ? 'The raid costs more on average: pay.' : 'The bribe costs more than the risk: don\'t pay (on money alone).'],
    })
  }
  const win = rng.int(5, 40)
  const lose = rng.int(5, 40)
  const answer = r1((lose / (win + lose)) * 100)
  return make('expected_value', seed, d, {
    prompt: `A fixed fight: you win ${$(win)} if your man takes the dive on cue, and lose ${$(lose)} if he doesn't. Above what chance of him cooperating is the bet worth taking? (Percent.)`,
    kind: 'number', unit: 'percent', answer, tolerance: 0.15,
    hint: { nudge: 'Find the probability where the bet breaks even.', method: 'p × win − (1 − p) × loss = 0 → p = loss ÷ (win + loss).' },
    worked: [`p × ${win} = (1 − p) × ${lose}`, `p = ${lose} ÷ ${win + lose} = ${answer}%`],
  })
}
