# SMALL BATCH — a small-town hustle sim with a mind palace

> Replaces the 1920s BLACK LEDGER design (still in git history at `6d6e774`). The engine work from M1–M3 is reused; the setting, art and map are not.

## Context
The user didn't like the 1920s noir look and wants a game in the **Schedule I genre**:
- a first-person, stylized low-poly small town with cartoon-proportioned people;
- you start broke and grow a small drug business;
- a **Mind Palace** (Sherlock Holmes) and **Charlie Munger-style mental models**, delivered as the protagonist's internal dialogue.

Scope right now is **one in-game day** with **one small mission**, on a small but fully detailed map. Everything after that is expansion.

**Originality rule:** same genre and same art *family*, but nothing copied. That means our own town, characters, story, UI and names. No Schedule I characters, map layout, logos or UI.

### Decisions locked in
| Area | Choice |
|---|---|
| Engine | Web: Vite + TS + React Three Fiber, as now. Playable in the browser and as a claude.ai Artifact; fully testable in the cloud container |
| Assets | Free only. Original Blender-scripted buildings, characters and animations, KayKit CC0 props, canvas-drawn textures. $0 |
| Product | Weed grow-op. Every process is a gamified minigame, with no real-world technique |
| Platform | PC, keyboard and mouse |
| Learning | Keep the M3 engine (concept graph, generators, Elo + spaced repetition). Re-skin it as the Mind Palace "attic" and add mental models |

## Research: what makes this genre work
Sources: [PC Gamer on Schedule I](https://www.pcgamer.com/games/sim/you-may-act-like-walter-white-and-look-like-rick-and-morty-but-this-drug-dealer-sim-blowing-up-on-steam-isnt-just-a-goofy-meme-game), [PC Gamer on crafting](https://pcgamer.com/games/sim/schedule-1-is-great-because-it-knows-crafting-sucks-unless-you-turn-everything-into-a-fun-minigame), [Notebookcheck](https://www.notebookcheck.net/Steam-This-game-looks-like-trash-but-gets-Overwhelmingly-Positive-reviews.977584.0.html), [SteamDB](https://steamdb.info/app/3164500/ufs).
- **The art is cheap on purpose.** It was made in Unity by one developer. The look is low-poly, flat-shaded and caricatured, with simple faces. Players forgive it because the *loop* is tactile and fast. So the budget goes into **feel** (hands, animations, sounds, readable UI) and **density** (every corner has something), not polycount.
- **Hands-on chores.** Every step is a physical action in first person: pour soil, plant, water, trim, bag. No "press button, wait".
- **Phone as the UI hub.** Customers text you, you agree on price and place, then walk there and hand off in person.
- **A living town.** NPCs run on daily schedules, police patrol, and a night curfew raises the risk.
- **Scaling drip-feed.** One pot becomes a room, then employees and automation. A new verb arrives just before boredom sets in.
- **Dark humor and odd characters.** Stylized people with strong silhouettes, distinct colors and one memorable trait each.

### Where we beat it (on budget)
1. **Inner life.** The protagonist has a Mind Palace and a council of mental-model voices that argue at real decision points: price, risk, trust and expansion. Decisions are *thinking puzzles*, not just timers.
2. **Real competence.** Pricing, cutting and risk use real math and economics (the M3 generators). The voices get sharper as *you* master concepts.
3. **Consequences have reasons.** Heat, customer trust and NPC gossip are simulated, so the voices can explain *why* something happened (second-order effects).

## Can we hit "full detail" here? Honest feasibility
| Need | How we get it in this container | Quality ceiling |
|---|---|---|
| Houses, shops, roads | Blender Python kit: modular walls, roofs, porches, windows with frames, fences, trim, rain gutters; bevelled, toon-shaded, vertex-colored | High for the stylized look |
| Interiors | Blender kit, plus KayKit Furniture/Restaurant Bits (CC0, reachable on GitHub) | High |
| People | Blender character generator: chunky stylized body and head, ~8 face presets, hair and hat meshes, clothing color sets, simple painted eyes and mouth | Good. Original and Schedule I-adjacent |
| Animation | Rig generated in Blender with auto-weights. Keyframed walk, idle, talk, wave, sit, give/take, phone, cower | Decent. Less natural than mocap; Mixamo is the upgrade path later |
| First-person hands | Blender arms with ~10 clips (hold item, pour, water, trim, hand over cash) | Good. This is where "feel" lives |
| Audio | WebAudio-synthesized SFX (footsteps, cash, phone buzz, UI), plus CC0 sound repos on GitHub if reachable | OK. A music track is a later wish |
| Lighting and look | Existing toon ramp, bloom, fog and day/night, retuned to bright, saturated small-town daylight | High |

Blocked from this container: kenney.nl, quaternius.com, poly.pizza, Mixamo, Sketchfab, Poly Haven, freesound. Reachable: GitHub (KayKit packs, MakeHuman base mesh), npm, PyPI (`bpy`).

**Nothing is needed from you to start.** Optional upgrades later:
- ~10 Mixamo clips (free Adobe account) for more natural motion.
- Your playtest notes after each milestone.

## The game in one paragraph
You're **Cal**, a laid-off line cook in **Hollis Creek**, a tired small town of maybe 40 people with one diner, a gas station and too many lawn ornaments. You owe **$600** to **Marlo Vance**, the pawn-shop owner who covered your rent, and he wants it **by midnight**. In the back room of your rented half-duplex, your vanished roommate left a grow tent, a jar of seeds and a notebook. Your late grandfather, a chess hustler who read Charlie Munger, taught you to think in a memory palace: **the Attic**. Today you either find the money or find out what Marlo does instead.

## Mission 1: "Seed Money" (one day, 7:00 → 24:00, ~20 real minutes plus pauses)
| Time | Beat | Mechanics introduced | Mind moment |
|---|---|---|---|
| 07:00 | Wake up. Marlo's text: "$600. Midnight. Don't make me drive over." | Phone, texts, objectives | **Inversion** (Grandpa): "Don't ask how to get $600. Ask what guarantees you *don't*." The inversion list becomes the objective checklist |
| 07:30 | Find the roommate's notebook, the tent and a seed jar | Pick up, inspect, inventory and hotbar | — |
| 08:00 | Walk to **Hank's Hardware**: soil, 2 pots, a watering can. $80 budget | Shop UI, cash, walking the town | **Opportunity cost / unit price**: the bulk soil deal versus the small bag. A generator problem in-world |
| 09:00 | Plant: pour soil, plant seed, water | Hands-on minigames, grow timer (accelerated) | — |
| Day | Plants grow over ~8 in-game hours. Meanwhile, meet the town: the diner owner, a jittery mailman, the deputy on patrol | NPC schedules, dialogue, reputation | **Incentives**: "Deputy Price gets judged on traffic stops, not drugs. Follow the incentive." |
| 17:00 | Harvest, trim, bag (gram scale) | Precision minigame | **Ratio / percent**: yield and bag splits |
| 18:00 | First customer texts: **Dewey** (a mechanic) wants 2 bags | Phone deals: price, place, time | **Anchoring**: let him name a number first? The council argues |
| 19:00–23:00 | 3–4 handoffs at chosen spots. A deputy patrols, and the 22:00 curfew raises risk | Meetups, handoff animation, heat and line of sight | **Expected value / margin of safety**: is a $40 sale under the streetlight worth it? |
| 23:30 | Pay Marlo at the pawn shop | Story choice: pay in full, pay part and negotiate, or skip | **Second-order thinking**: overpay to build trust, or keep capital to grow? |
| 24:00 | End-of-day ledger: money, trust, heat, concepts mastered. "Tomorrow: Marlo has a proposal." | Save. Hook for day 2 | Mind Palace summary of the day's models |

Failure is never game over. If you're short, Marlo takes the TV and doubles the next debt. If you're caught, you lose the stash and pay a fine. You always keep playing.

## The Mind Palace ("the Attic") and mental models
- **The Attic** is a dreamlike space (press **M**, or sleep). Each mental model is an object on a shelf. Drills are the M3 generators re-skinned, and "rooms" unlock as models are mastered. Time freezes while you're there.
- **Internal dialogue:** at decision points the camera tightens, the world desaturates and 2–3 voices speak in turn. Pick a line of thought: the choice changes your options, not just flavor text. Voices level up with concept mastery (M3's level-scaled hints).
- **The council (replaces the 1920s voices):**
  | Voice | Covers | Example line |
  |---|---|---|
  | **Grandpa** (Munger latticework) | inversion, incentives, second-order effects, circle of competence, margin of safety, Lollapalooza effects | "Show me the incentive and I'll show you the outcome." |
  | **The Ledger** (math/econ) | arithmetic, percent, ratio, unit price, margin, EV, supply and demand, compounding | "Four bags at $30 beats three at $35. Run it." |
  | **The Read** (people) | anchoring, reciprocity, social proof, commitment, liking, scarcity | "He's already said yes in his head. Don't talk him out of it." |
  | **The Doubt** (risk/evidence) | base rates, probability, sunk cost, confirmation bias, prisoner's dilemma | "One quiet street isn't a pattern. Deputies loop." |
- **New concepts** added to the graph (each one a generator, plus an in-world decision template): `inversion`, `incentives`, `second_order`, `margin_of_safety`, `sunk_cost`, `social_proof`, `compounding`, `circle_of_competence`. Total: 23.

## Art direction
- **Palette:** bright, saturated, slightly washed-out daylight with warm, cozy evenings. Clean toon ramp with 2–3 bands and soft outlines (inverted-hull on characters and props). No film grain or sepia; that was the 1920s look the user disliked.
- **Proportions:** heads ~1/5 of height, wide shoulders, chunky hands, simple painted faces with expressive eyes and brows. Strong silhouettes from hats, hair and body shapes.
- **Town density:** mailboxes, sprinklers, garden gnomes, porch chairs, power lines, chain-link, potted plants, parked pickups, a basketball hoop, bins, a dog house. Every 10 m has something to look at.
- **Map** (~180 × 140 m, walkable in about 90 s end to end):
  - Main Street: diner, Hank's Hardware, gas station with mini-mart, pawn shop, laundromat.
  - A residential loop of 6 houses, including your half-duplex.
  - A creek with a footbridge and a trailer park edge (meet spots).
  - A small park with a gazebo.
  - A police substation.

  It's surrounded by tree lines and hills, with fog to hide the edges.

## Tech plan (reuse first)
**Keep:**
- `src/sim/clock.ts`, `rng.ts`, `collision.ts`, `interact.ts`
- `src/world/modelLoader.ts`, `daylight.ts`, `textures.ts` (toon ramp)
- `src/state/*` patterns, save/load with migration
- `src/learning/*` (all)
- Artifact build and check, and the screenshot test rig
- `ErrorBoundary`

**Replace:** the 1920s street (`Street.tsx`, `Buildings.tsx`, `layout.ts`), the Gazette, the 1920s props and voices.

**New modules:**
- `tools/blender/town_kit.py` exports houses, shops, roads and props as `.glb`. `tools/blender/people.py` exports a character base with a rig and an animation library, plus head, hair and outfit variants.
- `src/world/town/layout.ts` (pure): the map as data (lots, roads, colliders, nav graph, meet spots).
- `src/sim/npc.ts` (pure): schedules and a waypoint graph with A*; `src/world/Npc.tsx` renders it (SkinnedMesh, AnimationMixer, crossfades, look-at).
- `src/sim/grow.ts`, `deals.ts`, `heat.ts`, `mission.ts` (all pure): plants, customers and offers, patrol line of sight and suspicion, and the scripted Mission 1 state machine.
- `src/ui/Phone.tsx` (texts, contacts, map, objectives), `Hotbar.tsx`, `InnerVoice.tsx` (decision scenes), `Attic.tsx` (re-skinned Mind Palace).
- `src/world/Hands.tsx`: first-person arms and held items.

**Performance budget:**
- Under 150 draw calls (merge static town geometry per material, instance props).
- Under 12 MB of models.
- Up to 12 animated NPCs at once.
- 60 fps at medium quality on a mid-range laptop.

## Milestones (one per session, then commit and push)
| # | Deliverable | Verify |
|---|---|---|
| **T1 Town & look** | `town_kit.py` (4 house types, 5 shops, road kit, 25+ props) + map layout + new lighting grade + player walking the town. Old 1920s scene removed | Screenshots day/dusk/night from 6 spots; under 150 draw calls; artifact check |
| **T2 People** | `people.py` (rig + 8 clips) + 10 named NPCs with schedules, pathing, look-at, greet/talk; first-person hands | NPC walk loop screenshots; schedule unit tests; no T-poses |
| **T3 Grow loop** | Phone + inventory/hotbar, hardware store shop, pots/soil/seed/water/harvest/trim/bag minigames, plant growth stages | Automated playthrough grows and bags a plant |
| **T4 Sell loop** | Customers + texted offers + meetups + handoff + haggle; deputy patrol, curfew, heat/LOS, bust consequence | Sim tests (offers, heat), e2e completes a deal |
| **T5 Mind & mission** | The Attic (M3 re-skin), council voices + decision scenes, 8 new mental-model generators, Mission 1 script start → end-of-day ledger, save v3 | Mission completable by script; generator sweep; screenshots |
| **T6 Feel & ship** | SFX, juice (cash pops, phone buzz, camera bob), tutorial prompts, balance, perf pass, publish artifact | `npm run check:artifact`, full playthrough under 25 min |

**After the slice:** day 2+ with Marlo's proposal, a second product tier, hiring a dealer (automation), more customers, rival, a bigger map.
