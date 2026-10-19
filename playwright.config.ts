import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: 'tests/e2e',
  webServer: {
    command: 'E2E=1 npm run build && npm run preview',
    port: 4173,
    reuseExistingServer: !process.env.CI,
  },
  use: { baseURL: 'http://localhost:4173' },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
    },
    { name: 'mobile', testIgnore: /editor\.spec/, use: { ...devices['Pixel 7'] } },
    { name: 'iphone', testIgnore: /editor\.spec/, use: { ...devices['iPhone 14'], browserName: 'webkit' } },
  ],
})
