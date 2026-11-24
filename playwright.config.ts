import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    locale: "en-US",
    trace: "retain-on-failure",
  },
  projects: [
    // iPhone 13: Mobile Safari engine (WebKit), touch, 390×664 viewport.
    { name: "iphone-webkit", use: { ...devices["iPhone 13"] } },
    // Narrowest realistic iPhone width (iPhone SE 1st gen / zoomed display).
    { name: "iphone-320", use: { ...devices["iPhone 13"], viewport: { width: 320, height: 568 } } },
  ],
  webServer: {
    command: `npx next start --port ${PORT}`,
    url: `http://localhost:${PORT}/en`,
    reuseExistingServer: false,
    timeout: 60_000,
  },
});
