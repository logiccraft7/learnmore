import { dayIndex, hourOfDay } from '../sim/clock'
import { GAZETTE_PRICE, buyGazette, type GameState } from '../sim/game'
import type { Spot } from '../sim/interact'
import { useGame } from '../state/game'
import { street, useWorld } from '../state/world'
import type { Building } from './layout'

export type Interactable = Spot & {
  /** Camera yaw that looks straight at it. */
  yaw: number
  /** Text after "[E]" in the prompt. */
  prompt(game: GameState): string
  use(): void
}

/** World position of a point given in a building's facade frame (x along the facade, z out to the street). */
function facadePoint(b: Building, x: number, z: number) {
  const cos = Math.cos(b.rotY)
  const sin = Math.sin(b.rotY)
  return { x: b.px + x * cos + z * sin, z: b.pz - x * sin + z * cos }
}

const shopDoor = (name: string) => {
  const b = street.buildings.find((x) => x.shop?.name === name)
  // Looking at a facade means looking along its inward normal, which is yaw = rotY.
  return b ? { ...facadePoint(b, b.width * 0.3, 0.9), yaw: b.rotY } : null
}

const toast = (t: string) => useWorld.getState().showToast(t)

function build(): Interactable[] {
  const list: Interactable[] = []
  const add = (shop: string, id: string, prompt: Interactable['prompt'], use: () => void) => {
    const p = shopDoor(shop)
    if (p) list.push({ id, ...p, radius: 2.6, prompt, use })
  }

  add(
    'NEWS & TOBACCO',
    'newsstand',
    (g) => (g.papersBought.includes(dayIndex(g.minutes)) ? "Read today's Gazette" : `Buy the Ashport Gazette · ${Math.round(GAZETTE_PRICE * 100)}¢`),
    () => {
      const w = useWorld.getState()
      const g = w.game
      if (!g) return
      const result = buyGazette(g)
      if (result === 'broke') return toast("You're out of pennies. Even the news costs money in this town.")
      if (result !== 'already') {
        w.update(() => result)
        toast('Paid 2¢. "Read all about it."')
      }
      document.exitPointerLock?.()
      useGame.getState().setPhase('gazette')
    },
  )

  add(
    "ROSIE'S SODA & SMOKES",
    'rosie',
    (g) => (hourOfDay(g.minutes) >= 19 || hourOfDay(g.minutes) < 4 ? "Knock on Rosie's door" : "Rosie's Soda & Smokes"),
    () => {
      const g = useWorld.getState().game
      if (!g) return
      const h = hourOfDay(g.minutes)
      toast(
        h >= 19 || h < 4
          ? 'A slot slides open. Two eyes. "Password?" You don\'t have one. The slot slams shut. Jazz leaks through the wall.'
          : 'Rosie wipes the soda counter and doesn\'t look up. "Egg cream\'s a nickel. Anything else, come back after dark."',
      )
    },
  )

  add(
    'POLICE · PRECINCT 9',
    'precinct',
    () => 'Slip into Precinct 9',
    () =>
      toast(
        'Sergeant Doyle, without looking up: "Commissioner wants you invisible, rookie. Get in with the Blind Pig crowd. And don\'t come through the front door again."',
      ),
  )

  add(
    'PRIVATE INQUIRIES · 2ND FL.',
    'office',
    () => 'Your office (2nd floor)',
    () => toast('Your key sticks in the lock. The landlord is "fixing" the stairs. (Your office and the Mind Palace open in the next update.)'),
  )

  add(
    "O'MALLEY PAWN & LOAN",
    'pawn',
    (g) => (hourOfDay(g.minutes) >= 9 && hourOfDay(g.minutes) < 18 ? "O'Malley's: window-shop" : "O'Malley's (closed)"),
    () => {
      const g = useWorld.getState().game
      if (!g) return
      const open = hourOfDay(g.minutes) >= 9 && hourOfDay(g.minutes) < 18
      toast(
        open
          ? 'Watches, wedding rings, a trumpet. A sign in the window: "LOANS — 10% A WEEK". That\'s 520% a year, before compounding.'
          : 'A CLOSED sign and a sleeping cat. O\'Malley opens at 9.',
      )
    },
  )

  return list
}

export const INTERACTABLES = build()
