import { expect, type Page } from "@playwright/test";

export const LESSON = "/en/lessons/building-effective-agents";

/** Fails if the page can scroll sideways (the classic mobile layout bug). */
export async function expectNoHorizontalOverflow(page: Page) {
  const { scrollWidth, innerWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }));
  expect(scrollWidth, "page must not scroll horizontally").toBeLessThanOrEqual(innerWidth);
}

