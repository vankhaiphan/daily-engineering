import { defineConfig, devices } from "@playwright/test";

const PORT = 3100;
/** Set E2E_BASE_URL to test a deployed site instead of a local production build. */
const EXTERNAL_URL = process.env.E2E_BASE_URL;

export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  retries: 0,
  reporter: [["list"]],
  use: {
    baseURL: EXTERNAL_URL ?? `http://localhost:${PORT}`,
    locale: "en-US",
    trace: "retain-on-failure",
  },
  projects: [
    // iPhone 13: Mobile Safari engine (WebKit), touch, 390×664 viewport.
    { name: "iphone-webkit", use: { ...devices["iPhone 13"] } },
    // Narrowest realistic iPhone width (iPhone SE 1st gen / zoomed display).
    { name: "iphone-320", use: { ...devices["iPhone 13"], viewport: { width: 320, height: 568 } } },
  ],
  webServer: EXTERNAL_URL
    ? undefined
    : {
        command: `npx next start --port ${PORT}`,
        // Draft lessons are part of what we test locally (they are hidden in production).
        env: { SHOW_DRAFT_LESSONS: "true" },
        url: `http://localhost:${PORT}/en`,
        reuseExistingServer: false,
        timeout: 60_000,
      },
});
