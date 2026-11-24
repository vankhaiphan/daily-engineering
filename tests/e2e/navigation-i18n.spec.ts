import { expect, test } from "@playwright/test";
import { DRAFT_PATHS, expectNoHorizontalOverflow, LESSON } from "./helpers";

test("root redirects using Accept-Language", async ({ browser }) => {
  const context = await browser.newContext({ locale: "fr-FR" });
  const page = await context.newPage();
  await page.goto("/");
  await expect(page).toHaveURL(/\/fr$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "fr");
  await context.close();
});

test("language switch translates the UI and is remembered", async ({ page }) => {
  await page.goto("/en");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Workflows vs. Agents");

  await page.getByTestId("language-switcher").getByRole("link", { name: "Tiếng Việt" }).tap();
  await expect(page).toHaveURL(/\/vi$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "vi");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Workflow hay Agent");
  await expect(page.getByText("Bài học hôm nay")).toBeVisible();

  // The cookie sends the next visit to "/" straight to Vietnamese.
  await page.goto("/");
  await expect(page).toHaveURL(/\/vi$/);

  await page.getByTestId("language-switcher").getByRole("link", { name: "Français" }).tap();
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Workflows ou agents");
});

test("switching language mid-lesson keeps the reader's section", async ({ page }) => {
  await page.goto(`${LESSON}#tradeoffs`);
  await expect(page.locator("#tradeoffs")).toBeInViewport();
  await page.getByTestId("open-settings").tap();
  await page.getByTestId("settings-sheet").getByRole("link", { name: "Français" }).tap();
  await expect(page).toHaveURL(/\/fr\/lessons\/building-effective-agents#tradeoffs$/);
  await expect(page.getByRole("heading", { name: /Des compromis à savoir défendre/ })).toBeInViewport();
});

for (const locale of ["en", "vi", "fr"]) {
  for (const path of ["", "/lessons/building-effective-agents", "/lessons/building-effective-agents/explore", ...DRAFT_PATHS]) {
    test(`no horizontal overflow: /${locale}${path}`, async ({ page }) => {
      await page.goto(`/${locale}${path}`);
      await expect(page.locator("main")).toBeVisible();
      await expectNoHorizontalOverflow(page);
    });
  }
}

test("mode tabs navigate between Read and Explore", async ({ page }) => {
  await page.goto(LESSON);
  await expect(page.getByTestId("read-view")).toBeVisible();
  await page.getByTestId("mode-explore").tap();
  await expect(page.getByTestId("explore-view")).toBeVisible();
  await expect(page.getByTestId("mode-explore")).toHaveAttribute("aria-current", "page");
  // Explore shows only the interactive + practice sections. (The Read page stays
  // mounted but hidden thanks to React Activity, so count visible sections.)
  await expect(page.locator("[data-section-id]").filter({ visible: true })).toHaveCount(3);
  await expect(page.getByTestId("mode-listen")).toHaveCount(0);
  await page.getByTestId("mode-read").tap();
  await expect(page.getByTestId("read-view")).toBeVisible();
});

test("contents sheet jumps to a section", async ({ page }) => {
  await page.goto(LESSON);
  await page.getByTestId("open-contents").tap();
  await page.getByTestId("contents-sheet").getByRole("link", { name: /Interview summary/ }).tap();
  await expect(page).toHaveURL(/#interview$/);
  await expect(page.locator("#interview-title")).toBeInViewport();
});

test("unknown lesson and the removed Listen mode return 404", async ({ page }) => {
  expect((await page.goto("/en/lessons/does-not-exist"))?.status()).toBe(404);
  expect((await page.goto(`${LESSON}/listen`))?.status()).toBe(404);
});

test("no console errors or hydration failures in any language", async ({ page }) => {
  const problems: string[] = [];
  page.on("pageerror", (error) => problems.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") problems.push(message.text());
  });
  for (const locale of ["vi", "en", "fr"]) {
    for (const path of ["", "/lessons/building-effective-agents", "/lessons/building-effective-agents/explore", ...DRAFT_PATHS]) {
      await page.goto(`/${locale}${path}`, { waitUntil: "networkidle" });
    }
  }
  expect(problems).toEqual([]);
});

test("language switching works even before/without JavaScript", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, locale: "en-US" });
  const page = await context.newPage();
  await page.goto("/en");
  await page.getByTestId("language-switcher").getByRole("link", { name: "Tiếng Việt" }).click();
  await expect(page).toHaveURL(/\/vi$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "vi");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Workflow hay Agent");
  await context.close();
});
