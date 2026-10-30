# SMALL BATCH — project guide

Full design: `docs/GAME_DESIGN.md` (read it before starting a milestone; don't re-plan).
The project pivoted from the 1920s BLACK LEDGER game to a small-town hustle sim in the Schedule I *genre*: original town, characters, story and UI, nothing copied. M1–M3 engine code (clock, collision, model loader, learning engine, artifact pipeline) is reused; the 1920s street, Gazette and voices get replaced.

## Commands
- `npm run dev` — local dev server
- `npm test` — unit tests (Vitest, `src/**/*.test.ts`)
- `npm run build` — typecheck + production build to `dist/`
- `npm run shots` — after a build: Playwright screenshots (day/night street, notebook, newspaper) into `screenshots/`; fails on page errors, a stuck player or clock, a failed purchase or a broken save. Runs at medium quality because the container renders on CPU (`SHOTS_QUALITY=high` for the full look)
- `npm run build:artifact` — single self-contained HTML (`artifact/black-ledger.html`, all models inlined) for hosting as a claude.ai Artifact
- `npm run check:artifact` — loads that file under the artifact viewer's strict CSP (no fetch, no eval/WASM) and fails on black screen, errors, missing models or a stuck player. **Always run it before publishing.**

## Conventions
- **PC only** (keyboard + mouse). Don't spend effort on phone/touch support.
- Stack: Vite + TypeScript + React + @react-three/fiber/drei/postprocessing, zustand. No physics engine: collision is `src/sim/collision.ts` (circle vs AABB).
- Keep simulation (`src/sim`, `src/learning`, `src/world/layout.ts`) pure TS with seeded RNG (`src/sim/rng.ts`) and no React, so it stays testable.
- Problem generators: `generate(seed, difficulty) -> {prompt, data, answer, check, workedSolution}`; test answers across many seeds.
- Look: `MeshToonMaterial` + `toonRamp()` for everything lit; emissive things use `MeshBasicMaterial` with `toneMapped: false` so bloom picks them up. Textures are canvas-drawn in `src/world/textures.ts` (no image or font downloads).
- Models live in `src/assets/models/*.glb`, imported with `?url` and registered in `src/world/models.tsx`. Credit them in `src/assets/models/CREDITS.md`.
- Never use drei's `useGLTF` or anything that fetches `data:` URLs or uses WebAssembly: the artifact viewer blocks both. Models load through `src/world/modelLoader.ts` (base64 decode + plain `GLTFLoader`, `<img>` textures) into `src/state/assets.ts`.
- Errors must never blank the page: keep `ErrorBoundary`/`GlobalErrors` (`src/ui/ErrorBoundary.tsx`) in place.

## Asset pipeline (works inside the cloud container)
- CC0 packs: `git clone --depth 1 https://github.com/KayKit-Game-Assets/<pack>` (kenney.nl, quaternius.com, poly.pizza are blocked by the network policy). Convert with `npx gltf-transform copy in.gltf out.glb`.
- Custom props: `pip install bpy==5.2.3` into a venv (Python 3.13), then `python tools/blender/props_1920s.py src/assets/models`.
- `window.__bl.teleport(x, z, yaw, pitch)` / `window.__bl.position` exist for test scripts.

## Workflow
- One milestone per session. Run `npm test`, `npm run build` and `npm run shots` before committing.
- Develop on branch `claude/great-johnson-kthcx6`.

## Progress
- [x] (old) M1 Foundation · M2 Sim core · M3 Learning engine: engine kept, 1920s content to be replaced
- [ ] T1 Town & look · [ ] T2 People · [ ] T3 Grow loop · [ ] T4 Sell loop · [ ] T5 Mind & mission · [ ] T6 Feel & ship

## Where things live (M2)
- Pure sim: `src/sim/clock.ts`, `economy.ts` (curves + events), `game.ts` (GameState, daily update, saving), `news.ts` (Gazette), `interact.ts`
- Stores: `src/state/world.ts` (game state, save/load, `playerPose`), `game.ts` (phase), `focus.ts` (E-prompt target)
- Street interactions: `src/world/interactables.ts`; lighting by hour: `src/world/daylight.ts` + `lightNow()` in `Atmosphere.tsx`
- Debug hook `window.__bl`: `teleport`, `position`, `setHour(h)`, `spots`, `game`, `models`, `palace` (current problem + answer)

## Where things live (M3)
- `src/learning/`: `concepts.ts` (graph + voices), `generators/{logician,economist,psychology,skeptic}.ts` (+ `index.ts` registry), `parse.ts` (typed answers), `mastery.ts` (Elo, levels, SRS ladder, unlocks), `session.ts` (plans/interleaving), `voices.ts` (levels, hints, lines)
- UI: `src/ui/MindPalace.tsx` (board → session → summary), opened via `usePalace` (`src/state/palace.ts`) + phase `'palace'`
- New concept = add to `ConceptId` + `CONCEPTS` + a generator in the registry; the generator test sweep covers it automatically.
- zustand 5: never return a fresh object/array from a selector (`?? {}`) — it loops forever. Use a module-level constant.
