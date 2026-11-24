import { expect, type Page } from "@playwright/test";

export const LESSON = "/en/lessons/building-effective-agents";

/** Draft lessons are visible locally and on previews, not on the production site. */
export const DRAFTS_VISIBLE = !process.env.E2E_BASE_URL || process.env.E2E_DRAFTS === "true";
export const DRAFT_PATHS = DRAFTS_VISIBLE
  ? [
      "/lessons/agent-evals",
      "/lessons/agent-evals/explore",
      "/lessons/timeouts-retries-backoff",
      "/lessons/timeouts-retries-backoff/explore",
    ]
  : [];

/** Fails if the page can scroll sideways (the classic mobile layout bug). */
export async function expectNoHorizontalOverflow(page: Page) {
  const { scrollWidth, innerWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }));
  expect(scrollWidth, "page must not scroll horizontally").toBeLessThanOrEqual(innerWidth);
}

