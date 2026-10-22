/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
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
