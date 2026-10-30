import { createRng, deriveSeed } from '../sim/rng'
import type { Aabb } from '../sim/collision'

/**
 * The Narrows: one street in Ashport, generated from a seed.
 * The street runs along z. Road |x| < ROAD_HALF, sidewalks out to FACADE_X, then buildings.
 */
export const ROAD_HALF = 4
export const FACADE_X = 7
export const STREET_HALF_LENGTH = 55
const ALLEY_WIDTH = 3.2
const ALLEY_DEPTH = 5

export type Shop = { name: string; sub?: string; awning: string | null; lit: boolean }

/** Named storefronts, placed in order on the two sides of the street. */
export const SHOPS: readonly Shop[] = [
  { name: "ROSIE'S SODA & SMOKES", sub: 'open late', awning: '#7a1f24', lit: true }, // front for The Blind Pig
  { name: "O'MALLEY PAWN & LOAN", sub: 'cash for gold', awning: '#1f4a3a', lit: true },
  { name: 'ASHPORT SAVINGS BANK', sub: 'est. 1891', awning: null, lit: false },
  { name: 'HOTEL MERIDIAN', sub: 'rooms by the week', awning: '#5b2a5e', lit: true },
  { name: 'STARLIGHT LAUNDRY', sub: 'same day', awning: '#2a4b6e', lit: true },
  { name: 'POLICE · PRECINCT 9', awning: null, lit: true },
  { name: "SAL'S BARBERSHOP", sub: 'shave 10¢', awning: '#a33b2b', lit: false },
  { name: 'DELANEY & SONS · BUTCHERS', awning: '#6e2f1f', lit: false },
  { name: 'VICTORY PICTURE HOUSE', sub: 'talkies nightly', awning: '#8a6a1d', lit: true },
  { name: 'GOLDBERG TAILORS', sub: 'suits made to measure', awning: '#3a3a5e', lit: false },
  { name: 'PRIVATE INQUIRIES · 2ND FL.', awning: null, lit: true }, // the player's office
  { name: 'NEWS & TOBACCO', awning: '#4a5e2a', lit: true },
]

export const BRICK_PALETTE = ['#6b2e26', '#5a3a2e', '#7a4a36', '#4a4440', '#8a6f58', '#3e3a44', '#704036'] as const

export type Building = {
  id: number
  /** Where the facade sits and which way it faces. Local frame: width on x, facade at z=0 facing +z, body to z=-depth. */
  px: number
  pz: number
  rotY: number
  width: number
  depth: number
  floors: number
  floorH: number
  color: string
  shop: Shop | null
  fireEscape: boolean
  waterTower: boolean
  seed: number
  box: Aabb
}

export type Lamp = { x: number; z: number }
export type PropKind = 'firehydrant' | 'dumpster' | 'trash_A' | 'trash_B' | 'box_A' | 'box_B' | 'barrel' | 'crate_bottles'
export type Prop = { kind: PropKind; x: number; z: number; rotY: number }
export type Car = { model: 'car_sedan_black' | 'car_sedan_maroon' | 'car_sedan_green'; x: number; z: number; rotY: number }
export type Wall = { box: Aabb; height: number }

export type StreetLayout = {
  buildings: Building[]
  alleyWalls: Wall[]
  lamps: Lamp[]
  props: Prop[]
  manholes: { x: number; z: number }[]
  cars: Car[]
  colliders: Aabb[]
  spawn: { x: number; z: number; yaw: number }
}

export function generateStreet(seed: number): StreetLayout {
  const rng = createRng(seed)
  const buildings: Building[] = []
  const alleyWalls: Wall[] = []
  const props: Prop[] = []
  let shopIndex = 0
  let id = 0

  const makeBuilding = (side: -1 | 1, z0: number, z1: number): Building => {
    const width = z1 - z0
    const depth = rng.range(9, 14)
    const floors = rng.int(2, 6)
    const shop = shopIndex < SHOPS.length && rng.chance(0.85) ? SHOPS[shopIndex++] : null
    const x0 = side < 0 ? -FACADE_X - depth : FACADE_X
    return {
      id: id++,
      px: side * FACADE_X,
      pz: (z0 + z1) / 2,
      rotY: side < 0 ? Math.PI / 2 : -Math.PI / 2,
      width,
      depth,
      floors,
      floorH: 3.3,
      color: rng.pick(BRICK_PALETTE),
      shop,
      fireEscape: floors >= 3 && rng.chance(0.45),
      waterTower: floors >= 4 && rng.chance(0.5),
      seed: deriveSeed(seed, `b${id}`),
      box: { x0, x1: x0 + depth, z0, z1 },
    }
  }

  for (const side of [-1, 1] as const) {
    let z = -STREET_HALF_LENGTH
    // Two alleys per side, at seeded positions away from the ends.
    const alleys = [rng.range(-35, -10), rng.range(10, 35)]
    while (z < STREET_HALF_LENGTH - 0.01) {
      const nextAlley = alleys.find((a) => a > z && a < z + 12)
      if (nextAlley !== undefined && nextAlley - z >= 5) {
        buildings.push(makeBuilding(side, z, nextAlley))
        const a0 = nextAlley
        const a1 = nextAlley + ALLEY_WIDTH
        const wx = side * (FACADE_X + ALLEY_DEPTH)
        alleyWalls.push({ box: { x0: Math.min(wx, wx + side * 0.4), x1: Math.max(wx, wx + side * 0.4), z0: a0, z1: a1 }, height: 3.2 })
        props.push({ kind: 'dumpster', x: side * (FACADE_X + ALLEY_DEPTH - 1), z: a0 + 1.1, rotY: side < 0 ? Math.PI / 2 : -Math.PI / 2 })
        props.push({ kind: rng.pick(['box_A', 'box_B'] as const), x: side * (FACADE_X + 1.5), z: a1 - 0.6, rotY: rng.range(0, Math.PI) })
        // Bootleg stock stashed in the alley.
        props.push({ kind: 'barrel', x: side * (FACADE_X + ALLEY_DEPTH - 0.5), z: a1 - 0.5, rotY: 0 })
        props.push({ kind: 'crate_bottles', x: side * (FACADE_X + ALLEY_DEPTH - 2.6), z: a1 - 0.45, rotY: rng.range(-0.3, 0.3) })
        alleys.splice(alleys.indexOf(nextAlley), 1)
        z = a1
        continue
      }
      if (nextAlley !== undefined) {
        // Alley too close for a building in front of it: slide the alley along.
        alleys[alleys.indexOf(nextAlley)] = z + 5
        continue
      }
      let w = rng.range(7, 12)
      const remaining = STREET_HALF_LENGTH - z
      if (remaining - w < 5) w = remaining
      buildings.push(makeBuilding(side, z, z + w))
      z += w
    }
  }

  // End caps close the street at both ends.
  for (const end of [-1, 1] as const) {
    const depth = 12
    const width = 2 * (FACADE_X + 8)
    const zf = end * STREET_HALF_LENGTH
    const floors = rng.int(4, 6)
    buildings.push({
      id: id++,
      px: 0,
      pz: zf,
      rotY: end < 0 ? 0 : Math.PI,
      width,
      depth,
      floors,
      floorH: 3.3,
      color: rng.pick(BRICK_PALETTE),
      shop: shopIndex < SHOPS.length ? SHOPS[shopIndex++] : null,
      fireEscape: true,
      waterTower: true,
      seed: deriveSeed(seed, `end${end}`),
      box: { x0: -width / 2, x1: width / 2, z0: end < 0 ? zf - depth : zf, z1: end < 0 ? zf : zf + depth },
    })
  }

  const lamps: Lamp[] = []
  for (let z = -STREET_HALF_LENGTH + 6, i = 0; z < STREET_HALF_LENGTH - 3; z += 13, i++) {
    lamps.push({ x: (i % 2 === 0 ? -1 : 1) * (FACADE_X - 2.6), z })
  }

  for (let i = 0; i < 6; i++) {
    const side = rng.chance(0.5) ? -1 : 1
    props.push({ kind: 'firehydrant', x: side * (ROAD_HALF + 0.6), z: rng.range(-50, 50), rotY: 0 })
  }
  for (let i = 0; i < 14; i++) {
    const side = rng.chance(0.5) ? -1 : 1
    props.push({ kind: rng.pick(['trash_A', 'trash_B'] as const), x: side * rng.range(ROAD_HALF + 0.3, FACADE_X - 0.3), z: rng.range(-52, 52), rotY: rng.range(0, 6.28) })
  }

  // Parked cars along both curbs, spaced so they never overlap.
  const cars: Car[] = []
  const models = ['car_sedan_black', 'car_sedan_maroon', 'car_sedan_green'] as const
  for (const side of [-1, 1] as const) {
    let z = -48 + rng.range(0, 8)
    while (z < 48) {
      if (rng.chance(0.55)) cars.push({ model: rng.pick(models), x: side * (ROAD_HALF - 1.05), z, rotY: side < 0 ? Math.PI : 0 })
      z += rng.range(7, 14)
    }
  }

  const manholes = [{ x: rng.range(-2, 2), z: rng.range(-30, -10) }, { x: rng.range(-2, 2), z: rng.range(10, 30) }]

  const colliders: Aabb[] = [
    ...buildings.map((b) => b.box),
    ...alleyWalls.map((w) => w.box),
    // Dumpsters are big enough to bump into.
    ...props.filter((p) => p.kind === 'dumpster').map((p) => ({ x0: p.x - 0.8, x1: p.x + 0.8, z0: p.z - 1.2, z1: p.z + 1.2 })),
    ...cars.map((c) => ({ x0: c.x - 0.9, x1: c.x + 0.9, z0: c.z - 2.4, z1: c.z + 2.4 })),
  ]

  return { buildings, alleyWalls, lamps, props, manholes, cars, colliders, spawn: { x: 1.5, z: -44, yaw: Math.PI } }
}
