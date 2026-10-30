# BLACK LEDGER — project guide

Full design: `docs/GAME_DESIGN.md` (read it before starting a milestone; don't re-plan).

## Commands
- `npm run dev` — local dev server
- `npm test` — unit tests (Vitest, `src/**/*.test.ts`)
- `npm run build` — typecheck + production build to `dist/`
- `npm run shots` — after a build: Playwright screenshots (desktop + phone) into `screenshots/`, fails on page errors or if the player can't walk
- `npm run build:artifact` — single self-contained HTML (`artifact/black-ledger.html`, all models inlined) for hosting as a claude.ai Artifact

## Conventions
- Stack: Vite + TypeScript + React + @react-three/fiber/drei/postprocessing, zustand. No physics engine: collision is `src/sim/collision.ts` (circle vs AABB).
- Keep simulation (`src/sim`, `src/learning`, `src/world/layout.ts`) pure TS with seeded RNG (`src/sim/rng.ts`) and no React, so it stays testable.
- Problem generators: `generate(seed, difficulty) -> {prompt, data, answer, check, workedSolution}`; test answers across many seeds.
- Look: `MeshToonMaterial` + `toonRamp()` for everything lit; emissive things use `MeshBasicMaterial` with `toneMapped: false` so bloom picks them up. Textures are canvas-drawn in `src/world/textures.ts` (no image or font downloads).
- Models live in `src/assets/models/*.glb`, imported with `?url` and registered in `src/world/models.tsx`. Credit them in `src/assets/models/CREDITS.md`.

## Asset pipeline (works inside the cloud container)
- CC0 packs: `git clone --depth 1 https://github.com/KayKit-Game-Assets/<pack>` (kenney.nl, quaternius.com, poly.pizza are blocked by the network policy). Convert with `npx gltf-transform copy in.gltf out.glb`.
- Custom props: `pip install bpy==5.2.3` into a venv (Python 3.13), then `python tools/blender/props_1920s.py src/assets/models`.
- `window.__bl.teleport(x, z, yaw, pitch)` / `window.__bl.position` exist for test scripts.

## Workflow
- One milestone per session. Run `npm test`, `npm run build` and `npm run shots` before committing.
- Develop on branch `claude/great-johnson-kthcx6`.

## Progress
- [x] M1 Foundation: The Narrows street, first-person walking (desktop + touch), stylized night look, quality presets, artifact hosting
- [ ] M2 Sim core · [ ] M3 Learning engine · [ ] M4 Racket v0 · [ ] M5 Case 1 · [ ] M6 Art & feel pass
