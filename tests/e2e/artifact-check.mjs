// Loads the single-file artifact build the way the claude.ai viewer does: wrapped in the host's skeleton
// and under a strict Content-Security-Policy (no fetch, no eval/WebAssembly). Fails on anything that would
// leave the player staring at a black screen.
// Usage: npm run build:artifact && npm run check:artifact   (screenshots go to ./screenshots/artifact-*.png)
import { createRequire } from 'node:module'
import { execSync } from 'node:child_process'
import { mkdirSync, readFileSync } from 'node:fs'

const require = createRequire(import.meta.url)
let playwright
try { playwright = require('playwright') } catch { playwright = require(`${execSync('npm root -g').toString().trim()}/playwright`) }
const { chromium } = playwright

const OUT = process.env.SHOTS_DIR ?? 'screenshots'
mkdirSync(OUT, { recursive: true })
const page = readFileSync('artifact/black-ledger.html', 'utf8')

const CSP = [
  "default-src 'none'",
  "script-src 'unsafe-inline' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net https://unpkg.com",
  "style-src 'unsafe-inline' https://fonts.googleapis.com",
  'font-src https://fonts.gstatic.com',
  'img-src data: blob:',
  "connect-src 'none'",
].join('; ')
const SKELETON_HEAD =
  '<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover">' +
  '<style>:root{color-scheme:light;box-sizing:border-box;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}' +
  'body{margin:0;padding:0;font:14px -apple-system,BlinkMacSystemFont,sans-serif;background:#fff;color:#000}</style></head><body>'

const browser = await chromium.launch({ args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] })
const failures = []
const views = [
  { name: 'desktop', viewport: { width: 1280, height: 720 }, touch: false },
]
try {
  for (const v of views) {
    const ctx = await browser.newContext({ viewport: v.viewport, hasTouch: v.touch, isMobile: v.touch })
    const p = await ctx.newPage()
    const errors = []
    p.on('pageerror', (e) => errors.push(`pageerror: ${e.message.slice(0, 200)}`))
    p.on('console', (m) => m.type() === 'error' && errors.push(`console: ${m.text().slice(0, 200)}`))
    await p.route('https://artifact.test/', (r) =>
      r.fulfill({ contentType: 'text/html', headers: { 'content-security-policy': CSP }, body: SKELETON_HEAD + page + '</body></html>' }),
    )
    await p.goto('https://artifact.test/')

    const start = p.getByRole('button', { name: /walk the narrows/i })
    try {
      await start.waitFor({ timeout: 15000 })
    } catch {
      failures.push(`${v.name}: title screen never appeared (black screen)`)
      await p.screenshot({ path: `${OUT}/artifact-${v.name}-FAILED.png` })
      failures.push(...errors.map((e) => `${v.name} ${e}`))
      await ctx.close()
      continue
    }
    await p.waitForFunction(() => window.__bl?.models?.done === true, null, { timeout: 60000 }).catch(() => {})
    const models = await p.evaluate(() => window.__bl?.models)
    if (!models || models.loaded !== models.total || models.failed.length)
      failures.push(`${v.name}: models not all loaded: ${JSON.stringify(models)}`)

    try {
      await start.click({ timeout: 10000 })
    } catch {
      failures.push(`${v.name}: title screen vanished before it could be clicked (app crashed to black)`)
      failures.push(...errors.map((e) => `${v.name} ${e}`))
      await p.screenshot({ path: `${OUT}/artifact-${v.name}-FAILED.png` })
      await ctx.close()
      continue
    }
    await p.waitForTimeout(2500)
    await p.screenshot({ path: `${OUT}/artifact-${v.name}.png` })

    const before = await p.evaluate(() => window.__bl.position)
    await p.keyboard.down('KeyW')
    await p.waitForTimeout(1500)
    await p.keyboard.up('KeyW')
    const after = await p.evaluate(() => window.__bl.position)
    if (Math.hypot(after.x - before.x, after.z - before.z) < 0.05) failures.push(`${v.name}: player did not move`)

    const panel = await p.locator('.error-panel').count()
    if (panel) failures.push(`${v.name}: error panel shown: ${await p.locator('.error-panel').innerText()}`)
    failures.push(...errors.map((e) => `${v.name} ${e}`))
    console.log(`${v.name}: models ${models?.loaded}/${models?.total}, walked ${Math.hypot(after.x - before.x, after.z - before.z).toFixed(2)} m`)
    await ctx.close()
  }
} finally {
  await browser.close()
}
if (failures.length) {
  console.error('ARTIFACT CHECK FAILED:\n' + [...new Set(failures)].join('\n'))
  process.exit(1)
}
console.log('artifact check passed')
