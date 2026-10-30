// Launches the built game and photographs it: night and day street views, the notebook and the newspaper.
// Usage: npm run build && npm run shots   (writes PNGs to ./screenshots)
import { createRequire } from 'node:module'
import { execSync, spawn } from 'node:child_process'
import { mkdirSync } from 'node:fs'

const require = createRequire(import.meta.url)
let playwright
try { playwright = require('playwright') } catch { playwright = require(`${execSync('npm root -g').toString().trim()}/playwright`) }
const { chromium } = playwright

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
try {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } })
  // Software rendering here is CPU-only, so default to medium; SHOTS_QUALITY=high for the full look.
  await ctx.addInitScript((q) => localStorage.setItem('black-ledger:settings', JSON.stringify({ quality: q, sensitivity: 1 })), process.env.SHOTS_QUALITY ?? 'medium')
  const page = await ctx.newPage()
  page.setDefaultTimeout(120000)
  page.on('pageerror', (e) => errors.push(e.message))
  page.on('console', (m) => m.type() === 'error' && errors.push(`console: ${m.text()}`))
  await page.goto(url)
  await page.waitForFunction(() => window.__bl?.models?.done, null, { timeout: 60000 })
  await page.waitForTimeout(1500)
  await page.screenshot({ path: `${OUT}/title.png` })
  await page.getByRole('button', { name: /walk the narrows/i }).click()
  await page.waitForFunction(() => window.__bl?.teleport, null, { timeout: 30000 })

  const shot = async (name, a, hour) => {
    if (hour !== undefined) await page.evaluate((h) => window.__bl.setHour(h), hour)
    await page.evaluate((a) => window.__bl.teleport(a.x, a.z, a.yaw, a.pitch), a)
    await page.waitForTimeout(1500)
    await page.screenshot({ path: `${OUT}/${name}.png` })
  }
  const spawnView = { x: 1.5, z: -44, yaw: Math.PI, pitch: 0.02 }
  const upstreet = { x: -2.5, z: 10, yaw: Math.PI * 0.95, pitch: 0.16 }
  await shot('night-spawn', spawnView, 21)
  await shot('night-upstreet', upstreet)
  await shot('dusk-upstreet', upstreet, 18.4)
  await shot('day-spawn', spawnView, 11)
  await shot('day-upstreet', upstreet)
  await page.evaluate(() => window.__bl.setHour(21))

  // Walk forward and check the player moved and the clock ran.
  await page.evaluate(() => window.__bl.teleport(1.5, -44, Math.PI, 0))
  const t0 = await page.evaluate(() => window.__bl.game.minutes)
  const before = await page.evaluate(() => window.__bl.position)
  await page.keyboard.down('KeyW')
  await page.waitForTimeout(1200)
  await page.keyboard.up('KeyW')
  const after = await page.evaluate(() => window.__bl.position)
  const t1 = await page.evaluate(() => window.__bl.game.minutes)
  console.log(`walked ${(after.z - before.z).toFixed(2)} m, clock advanced ${(t1 - t0).toFixed(2)} game min`)
  if (after.z - before.z < 0.05) errors.push('player did not move forward')
  if (t1 <= t0) errors.push('clock did not advance while playing')

  // Notebook.
  await page.keyboard.press('Tab')
  await page.waitForTimeout(600)
  await page.screenshot({ path: `${OUT}/notebook-before-paper.png` })
  const tPaused = await page.evaluate(() => window.__bl.game.minutes)
  await page.waitForTimeout(800)
  if ((await page.evaluate(() => window.__bl.game.minutes)) !== tPaused) errors.push('clock ran while the notebook was open')
  await page.keyboard.press('Tab')

  // Buy the paper at the newsstand: stand in front of it, face it, press E.
  const stand = await page.evaluate(() => window.__bl.spots.find((s) => s.id === 'newsstand'))
  // Step back 1.5 m from the door and look at it.
  await page.evaluate((s) => window.__bl.teleport(s.x + Math.sin(s.yaw) * 1.5, s.z + Math.cos(s.yaw) * 1.5, s.yaw, 0.05), stand)
  await page.waitForTimeout(800)
  await page.screenshot({ path: `${OUT}/newsstand-prompt.png` })
  const cash0 = await page.evaluate(() => window.__bl.game.cash)
  await page.keyboard.press('KeyE')
  await page.waitForTimeout(800)
  await page.screenshot({ path: `${OUT}/gazette.png` })
  const cash1 = await page.evaluate(() => window.__bl.game.cash)
  if (!(cash1 < cash0)) errors.push(`buying the Gazette did not cost money (${cash0} → ${cash1})`)
  await page.keyboard.press('Escape')
  await page.keyboard.press('Tab')
  await page.waitForTimeout(600)
  await page.screenshot({ path: `${OUT}/notebook-after-paper.png` })
  await page.keyboard.press('Tab')

  // Mind Palace: walk up to the office door, press E, train, answer one right and one wrong.
  const office = await page.evaluate(() => window.__bl.spots.find((s) => s.id === 'office'))
  await page.evaluate((s) => window.__bl.teleport(s.x + Math.sin(s.yaw) * 1.5, s.z + Math.cos(s.yaw) * 1.5, s.yaw, 0.05), office)
  await page.waitForTimeout(800)
  await page.keyboard.press('KeyE')
  await page.waitForTimeout(800)
  await page.screenshot({ path: `${OUT}/palace-board.png` })
  await page.getByRole('button', { name: /train weakest/i }).click()
  await page.waitForTimeout(500)
  await page.screenshot({ path: `${OUT}/palace-problem.png` })
  const answerCurrent = async (right) => {
    const cur = await page.evaluate(() => window.__bl.palace)
    if (!cur) throw new Error('no Mind Palace problem on screen')
    if (cur.kind === 'choice') {
      const letter = right ? cur.answer : 'ABCD'[('ABCD'.indexOf(cur.answer) + 1) % 4]
      await page.keyboard.press(letter.toLowerCase())
    } else {
      await page.fill('#mp-input', right ? cur.answer : String(Number(cur.answer) + 997))
      await page.keyboard.press('Enter')
    }
    await page.waitForTimeout(500)
    return cur
  }
  const first = await answerCurrent(true)
  await page.screenshot({ path: `${OUT}/palace-right.png` })
  await page.keyboard.press('Enter')
  await page.waitForTimeout(400)
  await page.keyboard.press('h')
  await page.waitForTimeout(300)
  await answerCurrent(false)
  await page.screenshot({ path: `${OUT}/palace-wrong.png` })
  const learned = await page.evaluate((c) => window.__bl.game.learning[c], first.concept)
  if (!learned || learned.correct < 1) errors.push(`Mind Palace did not record a correct answer for ${first.concept}`)
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press('Enter')
    await page.waitForTimeout(300)
    await answerCurrent(true)
  }
  await page.keyboard.press('Enter')
  await page.waitForTimeout(500)
  await page.screenshot({ path: `${OUT}/palace-summary.png` })
  await page.keyboard.press('Escape')
  await page.waitForTimeout(300)

  // Saving: reload and continue.
  await page.evaluate(() => window.dispatchEvent(new Event('beforeunload')))
  await page.reload()
  await page.waitForFunction(() => window.__bl?.models?.done, null, { timeout: 60000 })
  const cont = page.getByRole('button', { name: /continue/i })
  if (!(await cont.count())) errors.push('no Continue button after reload')
  else {
    await cont.click()
    await page.waitForTimeout(500)
    const restored = await page.evaluate(() => window.__bl.game.cash)
    if (Math.abs(restored - cash1) > 1e-9) errors.push(`save did not restore cash (${restored} vs ${cash1})`)
    const kept = await page.evaluate(() => Object.keys(window.__bl.game.learning).length)
    if (!kept) errors.push('save did not keep Mind Palace progress')
  }
  await ctx.close()
} finally {
  await browser.close()
  server.kill()
}
if (errors.length) {
  console.error('ERRORS:\n' + errors.join('\n'))
  process.exit(1)
}
console.log('screenshots written to', OUT)
