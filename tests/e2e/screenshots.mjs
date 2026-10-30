// Launches the built game, starts it, and photographs fixed camera angles on desktop + phone.
// Usage: npm run build && npm run shots   (writes PNGs to ./screenshots)
import { createRequire } from 'node:module'
import { execSync } from 'node:child_process'

// Use the project's Playwright if installed, otherwise the machine-wide one.
const require = createRequire(import.meta.url)
let playwright
try { playwright = require('playwright') } catch { playwright = require(`${execSync('npm root -g').toString().trim()}/playwright`) }
const { chromium } = playwright
import { spawn } from 'node:child_process'
import { mkdirSync } from 'node:fs'

const OUT = process.env.SHOTS_DIR ?? 'screenshots'
const PORT = 4173
mkdirSync(OUT, { recursive: true })

const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { stdio: 'ignore' })
const url = `http://localhost:${PORT}/`
for (let i = 0; i < 50; i++) {
  try { if ((await fetch(url)).ok) break } catch {}
  await new Promise((r) => setTimeout(r, 200))
}

const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })
const errors = []
const views = [
  { name: 'desktop', viewport: { width: 1280, height: 720 }, quality: 'high', touch: false },
  { name: 'phone', viewport: { width: 390, height: 844 }, quality: 'low', touch: true },
]
const angles = [
  { name: 'spawn', x: 1.5, z: -44, yaw: Math.PI, pitch: 0.02 },
  { name: 'shops', x: 2.5, z: -30, yaw: Math.PI * 0.62, pitch: 0.12 },
  { name: 'upstreet', x: -2.5, z: 10, yaw: Math.PI * 0.95, pitch: 0.16 },
  { name: 'alley', x: 0, z: 0, yaw: Math.PI / 2, pitch: 0.05 },
]
try {
  for (const v of views) {
    const ctx = await browser.newContext({ viewport: v.viewport, hasTouch: v.touch, isMobile: v.touch, deviceScaleFactor: 1 })
    await ctx.addInitScript((q) => localStorage.setItem('black-ledger:settings', JSON.stringify({ quality: q, sensitivity: 1 })), v.quality)
    const page = await ctx.newPage()
    page.on('pageerror', (e) => errors.push(`${v.name}: ${e.message}`))
    page.on('console', (m) => m.type() === 'error' && errors.push(`${v.name} console: ${m.text()}`))
    await page.goto(url)
    await page.waitForFunction(() => window.__bl !== undefined, null, { timeout: 60000 })
    await page.waitForTimeout(2500)
    await page.screenshot({ path: `${OUT}/${v.name}-title.png` })
    await page.getByRole('button', { name: /walk the narrows/i }).click()
    for (const a of angles) {
      await page.evaluate((a) => window.__bl.teleport(a.x, a.z, a.yaw, a.pitch), a)
      await page.waitForTimeout(1500)
      await page.screenshot({ path: `${OUT}/${v.name}-${a.name}.png` })
    }
    // Walk forward for a second with the keyboard and check that the player actually moved.
    await page.evaluate(() => window.__bl.teleport(1.5, -44, Math.PI, 0))
    const before = await page.evaluate(() => window.__bl.position)
    await page.keyboard.down('KeyW')
    await page.waitForTimeout(1200)
    await page.keyboard.up('KeyW')
    const after = await page.evaluate(() => window.__bl.position)
    const moved = after.z - before.z
    console.log(`${v.name}: walked ${moved.toFixed(2)} m`)
    // Software rendering in CI can run at a few fps (movement is frame-clamped), so only require real progress.
    if (moved < 0.05) errors.push(`${v.name}: player did not move forward (${moved})`)
    await ctx.close()
  }
} finally {
  await browser.close()
  server.kill()
}
if (errors.length) {
  console.error('ERRORS:\n' + errors.join('\n'))
  process.exit(1)
}
console.log('screenshots written to', OUT)
