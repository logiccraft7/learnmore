/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// `--mode artifact` inlines every asset (models included) so the game ships as one HTML file.
export default defineConfig(({ mode }) => ({
  base: './',
  plugins: [react()],
  assetsInclude: ['**/*.glb'],
  build: {
    chunkSizeWarningLimit: 3000,
    assetsInlineLimit: mode === 'artifact' ? 50_000_000 : 4096,
    outDir: mode === 'artifact' ? 'dist-artifact' : 'dist',
  },
  test: { include: ['src/**/*.test.ts'] },
}))
