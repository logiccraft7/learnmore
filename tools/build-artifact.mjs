// Builds the game into a single self-contained HTML file for hosting as a claude.ai Artifact.
// The artifact host adds its own <!doctype>/<head>/<body>, so we emit only the page content.
import { execSync } from 'node:child_process'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { join } from 'node:path'

execSync('npx vite build --mode artifact', { stdio: 'inherit' })
const dir = 'dist-artifact'
const html = readFileSync(join(dir, 'index.html'), 'utf8')

const js = [...html.matchAll(/<script type="module" crossorigin src="\.\/([^"]+)"><\/script>/g)].map((m) => m[1])
const css = [...html.matchAll(/<link rel="stylesheet" crossorigin href="\.\/([^"]+)">/g)].map((m) => m[1])
if (js.length !== 1) throw new Error(`expected one script chunk, found ${js.length}`)

const scripts = js.map((f) => `<script type="module">${readFileSync(join(dir, f), 'utf8').replaceAll('</script', '<\\/script')}</script>`)
const styles = css.map((f) => `<style>${readFileSync(join(dir, f), 'utf8')}</style>`)

const page = [
  '<title>Black Ledger</title>',
  '<meta name="theme-color" content="#0b0f14">',
  '<style>:root{color-scheme:dark;background:#0b0f14}html,body{height:100%;background:#0b0f14}</style>',
  ...styles,
  '<div id="root"></div>',
  ...scripts,
].join('\n')

mkdirSync('artifact', { recursive: true })
writeFileSync('artifact/black-ledger.html', page)
console.log(`artifact/black-ledger.html: ${(page.length / 1024 / 1024).toFixed(2)} MB`)
