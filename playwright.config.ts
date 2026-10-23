import { defineConfig, devices } from '@playwright/test'

const PORT = 4173

// E2E runs against the production build (vite preview), so the inline theme script in
// index.html and the bundled app are what is under test — not the dev server.
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: true,
  reporter: 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: `npm run build && npm run preview -- --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
})
