import { expect, type Page } from "@playwright/test";
import catalog from "../../src/content/catalog.json" with { type: "json" };

const CATALOG = catalog as { slug: string; status: "draft" | "published"; createdOn: string }[];

export const LESSON = "/en/lessons/building-effective-agents";

/** Draft lessons are visible locally and on previews, not on the production site. */
export const DRAFTS_VISIBLE = !process.env.E2E_BASE_URL || process.env.E2E_DRAFTS === "true";

/** Lessons the target site should serve, from the catalog (drafts only where visible). */
export const VISIBLE_LESSONS = CATALOG.filter((l) => l.status === "published" || DRAFTS_VISIBLE);

/** Read + explore paths of every visible lesson except the original one (covered explicitly elsewhere). */
export const DRAFT_PATHS = VISIBLE_LESSONS.filter((l) => l.slug !== "building-effective-agents").flatMap((l) => [
  `/lessons/${l.slug}`,
  `/lessons/${l.slug}/explore`,
]);

/** Fails if the page can scroll sideways (the classic mobile layout bug). */
export async function expectNoHorizontalOverflow(page: Page) {
  const { scrollWidth, innerWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
  }));
  expect(scrollWidth, "page must not scroll horizontally").toBeLessThanOrEqual(innerWidth);
}

