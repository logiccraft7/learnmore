# BLACK LEDGER — project guide

Full design: `docs/GAME_DESIGN.md` (read it before starting a milestone; don't re-plan).

- Stack: Vite + TypeScript + React + @react-three/fiber/drei/rapier/postprocessing, zustand, inkjs, Vitest, Playwright.
- Keep simulation (`src/sim`, `src/learning`) pure TS with seeded RNG and no React, so it stays testable.
- Problem generators: `generate(seed, difficulty) -> {prompt, data, answer, check, workedSolution}`; test answers across many seeds.
- Content is data-driven (`src/content`: JSON + Ink). Assets: CC0 only, credited in `public/assets/CREDITS.md`.
- One milestone per session. Run `npm run build`, `npx vitest run` and a Playwright screenshot pass before committing.
- Develop on branch `claude/great-johnson-kthcx6`.
