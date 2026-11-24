import { expect, type Page } from "@playwright/test";

export const LESSON = "/en/lessons/building-effective-agents";

/** Draft lessons are visible locally and on previews, not on the production site. */
export const DRAFTS_VISIBLE = !process.env.E2E_BASE_URL || process.env.E2E_DRAFTS === "true";
// Read + explore paths of draft lessons (the lesson-generation skill adds them).
export const DRAFT_PATHS: string[] = [];

/** Fails if the page can scroll sideways (the classic mobile layout bug). */
export async function expectNoHorizontalOverflow(page: Page) {
  const { scrollWidth, innerWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }));
  expect(scrollWidth, "page must not scroll horizontally").toBeLessThanOrEqual(innerWidth);
}

