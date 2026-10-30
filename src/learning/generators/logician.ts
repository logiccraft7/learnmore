import type { Generator } from '../types'
import { $, make, price, r1, r2, rngFor, twoNames } from './util'

const ITEMS: [string, number][] = [
  ['egg cream', 0.05], ['pack of Luckies', 0.15], ['ham sandwich', 0.15], ['cup of coffee', 0.05], ['slice of pie', 0.1],
  ['newspaper', 0.02], ['shoeshine', 0.1], ['cigar', 0.25], ['bottle of "tonic"', 0.75], ['root beer float', 0.12],
]

export const arithmetic: Generator = (seed, d) => {
  const rng = rngFor(seed)
  if (d <= 2) {
    const n = d === 1 ? 2 : 3
    const picks = Array.from({ length: n }, () => rng.pick(ITEMS))
    const qty = picks.map(() => (d === 1 ? 1 : rng.int(1, 3)))
    const total = r2(picks.reduce((s, [, p], i) => s + p * qty[i], 0))
    const paid = d === 1 ? 0 : total <= 1 ? 1 : 5
    const list = picks.map(([name, p], i) => `${qty[i]} × ${name} (${price(p)})`).join(', ')
    const answer = paid ? r2(paid - total) : total
    return make('arithmetic', seed, d, {
      prompt: `Rosie rings up ${list}.${paid ? ` The customer pays with a ${$(paid)} bill. How much change?` : ' What is the total?'}`,
      kind: 'number', unit: 'money', answer, tolerance: 0.001,
      hint: { nudge: 'Add it up item by item. Cents first.', method: paid ? 'Total = Σ quantity × price; change = paid − total.' : 'Total = Σ quantity × price.' },
      worked: [...picks.map(([name, p], i) => `${qty[i]} × ${price(p)} = ${$(qty[i] * p)} (${name})`), `Total = ${$(total)}`, ...(paid ? [`Change = ${$(paid)} − ${$(total)} = ${$(answer)}`] : [])],
    })
  }
  if (d === 3) {
    const crates = rng.int(3, 9)
    const per = rng.pick([12, 24])
    const unit = rng.pick([0.35, 0.4, 0.45, 0.6, 0.75])
    const total = r2(crates * per * unit)
    return make('arithmetic', seed, d, {
      prompt: `A truck drops ${crates} crates of ${per} bottles each at ${price(unit)} a bottle. What does the driver want for the lot?`,
      kind: 'number', unit: 'money', answer: total, tolerance: 0.001,
      hint: { nudge: 'Count bottles first, then money.', method: 'bottles = crates × per crate; cost = bottles × price.' },
      worked: [`Bottles = ${crates} × ${per} = ${crates * per}`, `Cost = ${crates * per} × ${price(unit)} = ${$(total)}`],
    })
  }
  const [a, b] = twoNames(rng)
  const people = d === 4 ? 3 : rng.int(4, 6)
  const take = rng.int(40, 180) * 5
  const expenses = rng.int(4, 30) * 5
  const share = r2((take - expenses) / people)
  return make('arithmetic', seed, d, {
    prompt: `Last night's card game took in ${$(take)}. ${a} paid ${$(expenses)} for the room and the ice. ${b} says split what's left evenly among the ${people} of you. What's each share?`,
    kind: 'number', unit: 'money', answer: share, tolerance: 0.01,
    hint: { nudge: 'Costs come off the top before anyone gets paid.', method: 'share = (take − expenses) ÷ people.' },
    worked: [`Left after costs = ${$(take)} − ${$(expenses)} = ${$(take - expenses)}`, `Share = ${$(take - expenses)} ÷ ${people} = ${$(share)}`],
  })
}

export const fractions_percent: Generator = (seed, d) => {
  const rng = rngFor(seed)
  if (d === 1) {
    const pct = rng.pick([10, 20, 25, 50, 75])
    const base = rng.int(2, 40)
    const answer = r2((base * pct) / 100)
    return make('fractions_percent', seed, d, {
      prompt: `O'Malley takes ${pct}% of every pawn sale as his cut. A watch sells for ${$(base)}. How much is his cut?`,
      kind: 'number', unit: 'money', answer, tolerance: 0.005,
      hint: { nudge: 'Percent means "per hundred".', method: 'cut = price × pct ÷ 100.' },
      worked: [`${pct}% = ${pct / 100}`, `${$(base)} × ${pct / 100} = ${$(answer)}`],
    })
  }
  if (d === 2) {
    const whole = rng.pick([40, 50, 80, 120, 200, 250])
    const part = Math.round((whole * rng.pick([5, 10, 15, 20, 30, 35, 40, 60])) / 100)
    const answer = r1((part / whole) * 100)
    return make('fractions_percent', seed, d, {
      prompt: `Of ${whole} bottles in the cellar, ${part} turned out to be watered down. What percent is that?`,
      kind: 'number', unit: 'percent', answer, tolerance: 0.15,
      hint: { nudge: 'Part over whole, then scale to 100.', method: 'percent = part ÷ whole × 100.' },
      worked: [`${part} ÷ ${whole} = ${r2(part / whole)}`, `× 100 = ${answer}%`],
    })
  }
  if (d === 3) {
    const from = rng.int(8, 30) * 5
    const to = from + rng.pick([-1, 1]) * rng.int(1, 6) * 5
    const answer = r1(((to - from) / from) * 100)
    return make('fractions_percent', seed, d, {
      prompt: `A pint of whisky went from ${price(from / 100)} to ${price(to / 100)}. By what percent did the price change? (Use a minus sign for a drop.)`,
      kind: 'number', unit: 'percent', answer, tolerance: 0.15,
      hint: { nudge: 'Change is always measured against where you started.', method: '% change = (new − old) ÷ old × 100.' },
      worked: [`Change = ${to} − ${from} = ${to - from}¢`, `${to - from} ÷ ${from} × 100 = ${answer}%`],
    })
  }
  if (d === 4) {
    const p = rng.pick([10, 20, 25, 30, 40, 50])
    const answer = r1(((1 + p / 100) * (1 - p / 100) - 1) * 100)
    return make('fractions_percent', seed, d, {
      prompt: `Gin goes up ${p}% after a raid, then falls ${p}% when supply returns. Overall, what percent did the price change from the start?`,
      kind: 'number', unit: 'percent', answer, tolerance: 0.15,
      hint: { nudge: "Up and down by the same percent don't cancel. Why not?", method: 'Multiply the factors: (1 + p)(1 − p) − 1.' },
      worked: [`Up ${p}%: × ${1 + p / 100}`, `Down ${p}%: × ${1 - p / 100}`, `Net factor = ${r2((1 + p / 100) * (1 - p / 100))} → ${answer}%`],
    })
  }
  const markup = rng.pick([20, 25, 40, 50, 60])
  const orig = rng.int(20, 300) / 100
  const after = r2(orig * (1 + markup / 100))
  const answer = r2(after / (1 + markup / 100))
  return make('fractions_percent', seed, d, {
    prompt: `After a ${markup}% markup, a bottle sells for ${$(after)}. What did it cost before the markup?`,
    kind: 'number', unit: 'money', answer, tolerance: 0.011,
    hint: { nudge: 'Taking 25% off the new price does NOT undo a 25% markup.', method: 'original = new ÷ (1 + markup).' },
    worked: [`New = original × ${1 + markup / 100}`, `Original = ${$(after)} ÷ ${1 + markup / 100} = ${$(answer)}`],
  })
}

export const ratio_proportion: Generator = (seed, d) => {
  const rng = rngFor(seed)
  if (d === 1) {
    const water = rng.int(2, 5)
    const alc = rng.int(1, 8)
    return make('ratio_proportion', seed, d, {
      prompt: `Bathtub gin recipe: 1 part grain alcohol to ${water} parts water. You have ${alc} gallons of alcohol. How many gallons of water?`,
      kind: 'number', unit: 'plain', answer: alc * water, tolerance: 0.01,
      hint: { nudge: 'Every gallon of alcohol needs the same amount of water.', method: `water = alcohol × ${water}.` },
      worked: [`${alc} gal × ${water} = ${alc * water} gal of water`],
    })
  }
  if (d === 2) {
    const a = rng.int(1, 3)
    const b = rng.int(2, 6)
    const total = (a + b) * rng.int(2, 8)
    const answer = (total * a) / (a + b)
    return make('ratio_proportion', seed, d, {
      prompt: `A ${total}-gallon batch is mixed alcohol to water at ${a}:${b}. How many gallons of it are alcohol?`,
      kind: 'number', unit: 'plain', answer, tolerance: 0.01,
      hint: { nudge: 'How many equal "parts" is the batch split into?', method: `alcohol = total × ${a} ÷ (${a} + ${b}).` },
      worked: [`Parts = ${a} + ${b} = ${a + b}`, `One part = ${total} ÷ ${a + b} = ${total / (a + b)} gal`, `Alcohol = ${a} × ${total / (a + b)} = ${answer} gal`],
    })
  }
  if (d === 3) {
    const sugar = rng.int(2, 6)
    const mash = rng.pick([4, 5, 8, 10])
    const want = mash * rng.int(2, 6) + rng.pick([0, mash / 2])
    const answer = r2((sugar * want) / mash)
    return make('ratio_proportion', seed, d, {
      prompt: `The mash needs ${sugar} lb of sugar for every ${mash} gallons. How many pounds for a ${want}-gallon batch?`,
      kind: 'number', unit: 'plain', answer, tolerance: 0.011,
      hint: { nudge: 'Find the sugar for one gallon, then scale.', method: 'sugar = want × (sugar ÷ mash).' },
      worked: [`Per gallon: ${sugar} ÷ ${mash} = ${r2(sugar / mash)} lb`, `× ${want} gal = ${answer} lb`],
    })
  }
  if (d === 4) {
    const v1 = rng.int(2, 6)
    const c1 = rng.pick([90, 80, 70, 60])
    const v2 = rng.int(2, 8)
    const c2 = rng.pick([20, 30, 40, 0])
    const answer = r1((v1 * c1 + v2 * c2) / (v1 + v2))
    return make('ratio_proportion', seed, d, {
      prompt: `You pour ${v1} gal of ${c1}% alcohol into ${v2} gal of ${c2 === 0 ? 'plain water' : `${c2}% spirit`}. What percent alcohol is the mix?`,
      kind: 'number', unit: 'percent', answer, tolerance: 0.15,
      hint: { nudge: 'Track the pure alcohol, not the liquid.', method: 'strength = total pure alcohol ÷ total volume.' },
      worked: [`Pure alcohol = ${v1}×${c1 / 100} + ${v2}×${c2 / 100} = ${r2((v1 * c1 + v2 * c2) / 100)} gal`, `÷ ${v1 + v2} gal = ${answer}%`],
    })
  }
  const v = rng.int(2, 10)
  const from = rng.pick([90, 80, 60, 50])
  const to = rng.pick([40, 30, 25, 20].filter((x) => x < from))
  const answer = r2((v * from) / to - v)
  return make('ratio_proportion', seed, d, {
    prompt: `You have ${v} gal of ${from}% alcohol and want to cut it to ${to}% for the speakeasy. How many gallons of water do you add?`,
    kind: 'number', unit: 'plain', answer, tolerance: 0.011,
    hint: { nudge: 'Water adds volume but no alcohol.', method: 'final volume = pure alcohol ÷ target strength; water = final − start.' },
    worked: [`Pure alcohol = ${v} × ${from / 100} = ${r2((v * from) / 100)} gal`, `Final volume = ${r2((v * from) / 100)} ÷ ${to / 100} = ${r2((v * from) / to)} gal`, `Water = ${r2((v * from) / to)} − ${v} = ${answer} gal`],
  })
}

export const linear_eq: Generator = (seed, d) => {
  const rng = rngFor(seed)
  if (d <= 2) {
    const fixed = rng.int(2, 20) * (d === 1 ? 1 : 5)
    const per = d === 1 ? rng.int(2, 9) : rng.int(3, 15) / 2
    const x = rng.int(3, 20)
    const total = r2(fixed + per * x)
    return make('linear_eq', seed, d, {
      prompt: `The garage charges ${$(fixed)} to store the truck plus ${$(per)} per crate. The bill is ${$(total)}. How many crates?`,
      kind: 'number', unit: 'plain', answer: x, tolerance: 0.01,
      hint: { nudge: 'Take off the fixed part first.', method: `${fixed} + ${per}·x = ${total} → x = (${total} − ${fixed}) ÷ ${per}.` },
      worked: [`${fixed} + ${per}x = ${total}`, `${per}x = ${r2(total - fixed)}`, `x = ${x}`],
    })
  }
  if (d === 3) {
    const fa = rng.int(5, 30)
    const pa = rng.int(8, 20) / 10
    const fb = 0
    const x = rng.int(5, 40)
    const pb = r2(pa + fa / x)
    return make('linear_eq', seed, d, {
      prompt: `Supplier A charges a ${$(fa)} delivery fee plus ${$(pa)} a gallon. Supplier B has no fee but charges ${$(pb)} a gallon. At how many gallons do they cost the same?`,
      kind: 'number', unit: 'plain', answer: r2(fa / (pb - pa)), tolerance: 0.051,
      hint: { nudge: 'Write each supplier\'s cost as a formula and set them equal.', method: `${fa} + ${pa}x = ${fb} + ${pb}x.` },
      worked: [`${fa} + ${pa}x = ${pb}x`, `${fa} = ${r2(pb - pa)}x`, `x = ${fa} ÷ ${r2(pb - pa)} = ${r2(fa / (pb - pa))} gal`],
    })
  }
  const fixedCost = rng.int(4, 40) * 5
  const cost = rng.int(30, 90) / 100
  const priceEach = r2(cost + rng.int(10, 60) / 100)
  const units = Math.ceil(fixedCost / (priceEach - cost))
  const exact = r2(fixedCost / (priceEach - cost))
  return make('linear_eq', seed, d, {
    prompt: `A new still costs ${$(fixedCost)}. Each bottle costs ${price(cost)} to make and sells for ${price(priceEach)}. How many bottles must you sell to break even? (Whole bottles.)`,
    kind: 'number', unit: 'plain', answer: units, tolerance: 0.01,
    hint: { nudge: 'Each bottle pays back a little of the still.', method: 'break-even = fixed cost ÷ (price − unit cost), rounded up.' },
    worked: [`Profit per bottle = ${price(priceEach)} − ${price(cost)} = ${price(r2(priceEach - cost))}`, `${$(fixedCost)} ÷ ${price(r2(priceEach - cost))} = ${exact}`, `Round up: ${units} bottles`],
  })
}

export const probability: Generator = (seed, d) => {
  const rng = rngFor(seed)
  if (d === 1) {
    const k = rng.int(1, 4)
    const answer = r1(((7 - k) / 6) * 100)
    return make('probability', seed, d, {
      prompt: `In a back-room dice game you win if one die shows ${k} or more. What's your chance of winning, as a percent?`,
      kind: 'number', unit: 'percent', answer, tolerance: 0.15,
      hint: { nudge: 'Count the winning faces.', method: 'P = winning outcomes ÷ all outcomes.' },
      worked: [`Winning faces: ${k}…6 = ${7 - k}`, `${7 - k} ÷ 6 = ${answer}%`],
    })
  }
  if (d <= 3) {
    const target = d === 2 ? rng.int(4, 10) : rng.int(8, 11)
    let ways = 0
    for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) if (d === 2 ? a + b === target : a + b >= target) ways++
    const answer = r1((ways / 36) * 100)
    return make('probability', seed, d, {
      prompt: d === 2 ? `Two dice. What's the chance they add up to exactly ${target}? (Percent.)` : `Two dice. The shooter needs ${target} or more. What's his chance? (Percent.)`,
      kind: 'number', unit: 'percent', answer, tolerance: 0.15,
      hint: { nudge: 'Two dice make 36 equally likely pairs.', method: 'Count the pairs that work, divide by 36.' },
      worked: [`Pairs that work: ${ways}`, `${ways} ÷ 36 = ${answer}%`],
    })
  }
  if (d === 4) {
    const n = rng.int(8, 16)
    const m = rng.int(2, 4)
    const answer = r1(((m / n) * ((m - 1) / (n - 1))) * 100)
    return make('probability', seed, d, {
      prompt: `${n} bottles in a crate; ${m} are poisoned with wood alcohol. You grab two at random. What's the chance both are poisoned? (Percent.)`,
      kind: 'number', unit: 'percent', answer, tolerance: 0.15,
      hint: { nudge: 'After the first pick, the crate has one bottle fewer.', method: `P = (${m}/${n}) × (${m - 1}/${n - 1}).` },
      worked: [`First: ${m}/${n}`, `Second: ${m - 1}/${n - 1}`, `Multiply: ${answer}%`],
    })
  }
  const p = rng.pick([5, 10, 15, 20])
  const nights = rng.int(3, 10)
  const answer = r1((1 - (1 - p / 100) ** nights) * 100)
  return make('probability', seed, d, {
    prompt: `Each night there's a ${p}% chance the dry agents raid the Blind Pig. What's the chance of at least one raid in the next ${nights} nights? (Percent.)`,
    kind: 'number', unit: 'percent', answer, tolerance: 0.15,
    hint: { nudge: '"At least one" is easiest through its opposite.', method: 'P(at least one) = 1 − P(none) = 1 − (1 − p)^n.' },
    worked: [`P(no raid one night) = ${1 - p / 100}`, `P(no raid ${nights} nights) = ${1 - p / 100}^${nights} = ${r2((1 - p / 100) ** nights)}`, `1 − that = ${answer}%`],
  })
}
