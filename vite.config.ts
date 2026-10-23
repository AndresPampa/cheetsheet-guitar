/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'

interface VercelConfig {
  headers: Array<{ source: string; headers: Array<{ key: string; value: string }> }>
}

// vercel.json is the single source of the security headers. `vite preview` serves the same ones,
// so the E2E suite checks what production sends. Not the dev server: HMR needs inline scripts.
const vercel = JSON.parse(
  readFileSync(new URL('./vercel.json', import.meta.url), 'utf8'),
) as VercelConfig
const securityHeaders = Object.fromEntries(
  vercel.headers
    .filter((rule) => rule.source === '/(.*)')
    .flatMap((rule) => rule.headers.map(({ key, value }) => [key, value])),
)

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  preview: { headers: securityHeaders },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      // TESTING.md §17: the Tone.js and svguitar adapters are verified by ear / by eye;
      // consumers get fakes injected.
      exclude: [
        'src/main.tsx',
        'src/test/**',
        'src/**/*.test.{ts,tsx}',
        'src/audio/tone.ts',
        'src/ui/svguitarDiagram.ts',
      ],
      // theory/ is the core of the app: its coverage may only go up.
      thresholds: {
        'src/theory/**': { lines: 100, functions: 100, branches: 90 },
      },
    },
  },
})
