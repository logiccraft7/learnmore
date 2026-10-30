# BLACK LEDGER — 1920s undercover crime game that teaches math, economics & psychology

## Context
The user wants a game they can play for hours on end that also makes them seriously good at applied math, economics and psychology. It should be crime/detective themed and pull you back the way **Schedule I** does. The repo (`logiccraft7/learnmore`, branch `claude/great-johnson-kthcx6`) is empty. The budget is about $100 of cloud-session credit, so we build a **vertical slice first, then expand**. The game is for the user only (personal mastery tool), played in a browser on PC and phone, in English.

### Decisions locked in (from the interview)
| Area | Choice |
|---|---|
| Purpose | Personal mastery tool |
| Platform | Web browser (PC + phone) |
| Genre | Detective in a living, simulated economy |
| Starting level | Basic school math, so the curriculum starts from foundations |
| Setting | Fictional city **Ashport**, 1925→1929 boom to crash, Prohibition |
| Hero | Rookie detective with 4 inner **mind voices** (Logician, Economist, Empath, Skeptic) |
| Role | **Undercover double life**: cases by day, run a bootleg/vice racket by night (Schedule I-style) |
| Tone / maturity | Witty noir, dark humor. Mature crime (drugs, booze, gambling, vice, murder, corruption); sex is implied only |
| Look | Stylized low-poly 3D like Schedule I, **first-person** |
| Engine | **Three.js via React Three Fiber** (TypeScript) |
| Assets | Claude handles them: free CC0 low-poly packs plus custom props scripted in headless Blender |
| Learning | Puzzles inside the world + **Mind Palace** training room (generated drills, spaced repetition) |
| Hooks | Empire growth + automation, recipe discovery, mind-voice skill tree, living city events |
| Time | ~20-min day/night cycle; **time freezes** during any puzzle or interrogation |
| Failure | Consequences (money, heat, reputation, story branches), never game over |
| Story | 5-act main arc ending in the 1929 Crash, multiple endings, then an endless Depression-era sandbox |

## Research basis (why this design should be both fun and educational)
- **Schedule I's hooks** ([PC Gamer](https://www.pcgamer.com/games/sim/you-may-act-like-walter-white-and-look-like-rick-and-morty-but-this-drug-dealer-sim-blowing-up-on-steam-isnt-just-a-goofy-meme-game), [PC Gamer on crafting](https://pcgamer.com/games/sim/schedule-1-is-great-because-it-knows-crafting-sucks-unless-you-turn-everything-into-a-fun-minigame), [Prima](https://primagames.com/tips/how-to-use-the-mixing-station-in-schedule-1)):
  - Small-time to empire scaling, with new mechanics drip-fed just before boredom sets in.
  - Crafting turned into hands-on minigames.
  - Mixing where ingredients add or transform effects: a logic puzzle you discover rather than memorize.
  - Customers with preferences and an "addiction" stat that drives repeat demand.
  - Dealers/employees automate sales.
  - Absurd dark humor.
- **Retention psychology:**
  - Nested loops: seconds (action), minutes (deal/case), days (empire/arc).
  - Variable rewards (recipe discoveries, case twists).
  - Self-determination theory: autonomy, competence, relatedness.
  - Flow: difficulty tracks skill. We use these ethically: rewards come only from real competence.
- **Learning science:**
  - **Intrinsic integration** (Habgood & Ainsworth, 2011): when the learning content IS the game mechanic, kids learned more and played **7× longer** than with quiz-gated versions ([paper](https://eprints.nottingham.ac.uk/10385)). So there are no quiz gates; the math is the gameplay.
  - Also used: retrieval practice, spaced repetition, interleaving, worked examples on failure, and adaptive difficulty.

## The game in one paragraph
You're Detective **[name]**, a broke rookie in Ashport, 1925. The Commissioner sends you undercover to bring down the city's kingpin. To get in, you must become a criminal: bathtub gin in an alley still → speakeasies → cocaine/opium cutting → gambling dens → laundering through a "legit" laundromat → stock-market speculation. By day you work cases that are mostly crimes your own world creates: skimming, poisoning, murders over debts, fraud, blackmail. Four voices in your head comment, argue and hint; they get smarter as *you* master concepts. Every rising price, police raid and rival gang is driven by a real economic simulation heading toward the 1929 Crash. Endings: bring down the kingpin, become the kingpin, or burn out.

## Core loops
1. **Seconds:** walk the city in first person, pick up evidence, brew, mix, haggle. Mini-puzzles are embedded in actions (measure ratios, count change, read a ledger).
2. **Minutes:**
   - **Night (racket):** produce → mix recipes → set prices → sell to customers/runners → manage heat → launder.
   - **Day (cases):** scene → clues/data → interrogate → case board deduction → accuse.
3. **Days/weeks:** grow the empire and automate (hire runners, distillers, accountants), level up mind voices, unlock districts and acts, Mind Palace reviews of due concepts.

## Learning woven into mechanics (curriculum map)
Each concept is a node in a **concept graph** (prerequisites). It has a **problem generator** (randomized parameters → problem, checker, worked solution) and a **mastery score** (Elo-style plus a spaced-repetition due date). Concepts appear in the world first, then get drilled in the Mind Palace.

| Game mechanic | Math | Economics | Psychology |
|---|---|---|---|
| Distilling / cutting product | ratios, fractions, percentages, units, dilution equations | cost of inputs, margins | — |
| Recipe mixing station | combinatorics, logic, effect "algebra" | product differentiation | preferences |
| Setting prices, customer demand | linear functions, graphs | supply & demand, elasticity, price discrimination | anchoring, decoy effect, reference prices |
| Hiring runners / automation | rates, optimization | marginal cost/benefit, opportunity cost, labor | motivation, trust, principal-agent |
| Police heat, bribes, raids | probability, expected value | risk, insurance, corruption economics | — |
| Interrogating two accomplices | game theory matrices | — | Prisoner's dilemma, reciprocity, commitment, cognitive biases |
| Deception reading (Skeptic voice) | base rates, Bayes' theorem | — | the real science: lie "tells" are unreliable; consistency + evidence work |
| Cooked ledgers / fraud cases | statistics, Benford's law, averages, outliers | accounting, cash flow | rationalization, the fraud triangle |
| Laundering & banking | interest, compound growth, exponentials | money, banking, credit, reserves | — |
| Loan sharking / debts | amortization, logarithms | interest rates, default risk | present bias, sunk cost |
| Stock speculation (Acts 4–5) | regression, volatility, leverage math | bubbles, margin buying, inflation, the 1929 crash, bank runs | herding, overconfidence, FOMO |
| Smuggling logistics (later) | linear programming, graphs/shortest paths | trade, tariffs, comparative advantage | — |
| City events (Depression sandbox) | data reading, forecasting | macro: GDP, unemployment, monetary policy | social psychology, persuasion, negotiation |

**Phase 1 concept set (~15 nodes):** arithmetic fluency, fractions/decimals/percent, ratio & proportion, unit price, profit & margin, linear equations (one variable), basic probability, expected value, supply & demand, opportunity cost, marginal thinking, anchoring, reciprocity, prisoner's dilemma, base-rate/Bayes intuition.

## Tech stack
- **Vite + TypeScript + React 18**; **@react-three/fiber**, **@react-three/drei**, **@react-three/rapier** (physics + first-person controller), **@react-three/postprocessing**.
- **zustand** for game state; **inkjs** (Ink scripting) for dialogue and branching story; **Vitest** for tests; **Playwright** (pre-installed) for screenshot tests.
- **Stylized "Schedule I" look:** low-poly models, toon/flat shading, outline pass, warm sodium streetlights, fog, bloom, vignette, film grain, sepia/teal color grade.
- **Mobile:** touch joystick + look-drag, larger UI hit areas, quality presets (shadows/postprocessing off on low).
- **Saves:** IndexedDB autosave + export/import save file.
- **Hosting:** GitHub Actions → GitHub Pages. If the private repo can't use Pages, fall back to Cloudflare Pages/Netlify free (the user clicks "connect repo" once).

## Asset pipeline (Claude does all of it)
- **CC0 packs** (free, no account): Quaternius (animated characters, town), KayKit (city/props/characters), Kenney (city kit, cars, furniture), Poly Pizza. Kept in `public/assets/` with a `CREDITS.md`.
- **Headless Blender** (installed in the cloud container) running Python scripts in `tools/blender/` → custom 1920s props as `.glb`: fedora, trench coat, copper still, barrels, typewriter, ticker-tape machine, Tommy gun, vintage car, stock exchange façade.
- Optimize with `@gltf-transform/cli` (meshopt + texture compression). Target: under ~40 MB total for phone loading.
- Risk: if the network policy blocks a pack download, fall back to Blender-scripted and procedural geometry. Check this first in M1.

## Code architecture (simulation separate from rendering, so it can be tested)
```
src/
  sim/        pure TS, seeded RNG, no React: clock, economy, racket, heat, events, cases runtime
  learning/   concept graph, generators/<concept>.ts, mastery (Elo + SRS), hint levels per voice
  content/    data: cases/*.json (clue graphs), recipes.json, customers.json, ink/*.ink dialogue
  world/      R3F scenes: district, interiors, player controller, NPCs, interactables
  ui/         HUD, panels (ledger, mixing, pricing, case board, interrogation, Mind Palace), voices feed
  state/      zustand stores + save/load
tools/blender/  prop generation scripts
tests/        vitest (sim + generators), playwright smoke/screenshot
CLAUDE.md     conventions so each new session starts cheaply
```
- Every problem generator has the same interface: `generate(seed, difficulty) → {prompt, data, answer, check(), workedSolution}`. Tests verify that answers are correct across thousands of seeds.
- The economy sim is a tick-based market per district: demand curves, price, stock, inflation index, interest rate, police heat. It is deterministic and testable without the 3D layer.

## Phase 1 — Vertical slice (~35% of budget)
District **"The Narrows"** (one street plus side alleys), with interiors: your office/Mind Palace, the speakeasy "The Blind Pig", an alley still, the precinct. 6–8 NPCs.

| Milestone | Deliverable |
|---|---|
| **M1 Foundation** | Vite/R3F scaffold, greybox street, first-person walking (keyboard/mouse + touch), stylized post-FX, quality presets, deploy pipeline, CLAUDE.md, test setup |
| **M2 Sim core** | Clock + day/night (~20 min/day, pause on panels), money, inventory, heat, district economy tick, HUD, autosave |
| **M3 Learning engine** | Concept graph (15 nodes), generators, mastery/SRS, Mind Palace room + drill UI, 4 mind voices with level-scaled hints/commentary |
| **M4 Racket v0** | Bathtub-gin still minigame (ratios), mixing station with 4–6 ingredients → discoverable recipes, 6 customers with preferences + addiction/loyalty, pricing panel with live demand curve, 1 hireable runner (automation), police heat & bribe (EV) |
| **M5 Case 1: "The Watered Whiskey"** | Someone is skimming and cutting the Blind Pig's stock and a customer dies. Ledger puzzle (percent/ratio/outliers), interrogate two bartenders (prisoner's dilemma + anchoring), Skeptic/Bayes clue, case board with red string, accusation with branching consequences |
| **M6 Art & feel pass** | Swap greybox for CC0 + Blender props, NPC animations, audio (CC0 jazz/ambience), juice (cash-register sounds, discovery fanfare), phone playtest, bug fixes |

**Playtest gate:** you play the slice and tell us what's fun or boring. Phase 2 priorities are re-ranked based on that.

## Phase 2 — Expand (~45%)
- Districts: Docks (smuggling/opium), Casino Row (gambling odds, house edge), Uptown (stock exchange, banks), City Hall (corruption/elections).
- Acts 1–5 story with Ink, more cases (some handwritten, plus procedural "side cases").
- Product tiers (gin → whiskey → cocaine/opium), employees and automation chains, rival gang AI, laundering.
- 1929 bubble and crash event. Curriculum grows toward algebra, functions, exponentials, statistics, game theory, macro.

## Phase 3 — Polish + endless sandbox (~20%)
Depression-era sandbox with procedural cases and events, harder curriculum tiers (regression, optimization, calculus-of-margins), balancing, performance on phone.

## Budget discipline
- One milestone per session, with tight prompts. CLAUDE.md holds conventions so sessions don't re-explore.
- Minimal subagent use. Commit and push after each milestone to `claude/great-johnson-kthcx6`.
- Content is data-driven (JSON/Ink), so adding cases and recipes is cheap later.

## Verification (each milestone)
- `npm run build` and `npm run typecheck` pass. `npx vitest run` passes: sim determinism, every generator's answers verified over many seeds, economy invariants (no negative stock, prices bounded), save/load round-trip.
- A Playwright script launches `vite preview`, walks the player, opens each panel, and takes **desktop and phone-viewport screenshots**. Claude inspects them visually for the art direction.
- End of Phase 1: Case 1 is completable start to finish via an automated playthrough script, and the deployed URL loads on the user's phone.
