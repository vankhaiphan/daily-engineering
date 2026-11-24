import { expect, test } from "@playwright/test";
import { LESSON } from "./helpers";

test("dark mode applies immediately and survives reload without flash", async ({ page }) => {
  await page.goto("/en");
  await page.getByTestId("open-settings").tap();
  await page.getByTestId("theme-switcher").getByRole("button", { name: "Dark" }).tap();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  const bg = () => page.evaluate(() => getComputedStyle(document.body).backgroundColor);
  expect(await bg()).toBe("rgb(18, 18, 18)");

  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  expect(await bg()).toBe("rgb(18, 18, 18)");

  await page.getByTestId("open-settings").tap();
  await page.getByTestId("theme-switcher").getByRole("button", { name: "Light" }).tap();
  expect(await bg()).toBe("rgb(246, 244, 239)");
});

test("text size changes reading size and persists", async ({ page }) => {
  await page.goto(LESSON);
  const size = () => page.locator("#intro p").first().evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
  const before = await size();
  await page.getByTestId("open-settings").tap();
  await page.getByTestId("text-larger").tap();
  await page.getByTestId("text-larger").tap();
  await expect(page.getByTestId("text-size-value")).toHaveText("Extra large");
  await expect(page.getByTestId("text-larger")).toBeDisabled();
  await page.keyboard.press("Escape");
  expect(await size()).toBeGreaterThan(before);
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-text-size", "xl");
  expect(await size()).toBeGreaterThan(before);
});

test("quiz gives per-option feedback, scores, and remembers answers", async ({ page }) => {
  await page.goto(`${LESSON}/explore`);
  const q1 = page.getByTestId("quiz-q-routing");
  await q1.getByRole("button", { name: /Orchestrator-workers/ }).tap();
  await expect(q1.getByTestId("quiz-feedback")).toContainText("Not quite");
  await q1.getByRole("button", { name: "Routing", exact: true }).tap();
  await expect(q1.getByTestId("quiz-feedback")).toContainText("Correct");
  await expect(page.getByTestId("quiz-score")).toHaveText("1 of 3 correct");

  await page.reload();
  await expect(page.getByTestId("quiz-q-routing").getByTestId("quiz-feedback")).toContainText("Correct");
  await page.getByRole("button", { name: "Reset answers" }).tap();
  await expect(page.getByTestId("quiz-feedback")).toHaveCount(0);
});

test("bookmarks appear on the home screen and link back", async ({ page }) => {
  // Wait for the app's scripts: a tap before hydration is dropped (seen once against
  // the deployed site, where scripts arrive more slowly than from localhost).
  await page.goto(LESSON, { waitUntil: "networkidle" });
  const toggle = page.getByTestId("bookmark-agents");
  await toggle.scrollIntoViewIfNeeded();
  await toggle.tap();
  await expect(toggle).toHaveAttribute("aria-pressed", "true");

  await page.goto("/en");
  const list = page.getByTestId("bookmarks");
  await expect(list).toContainText("Agents: tools in a loop");
  await list.getByRole("link").tap();
  await expect(page).toHaveURL(/#agents$/);

  await page.getByTestId("bookmark-agents").tap();
  await expect(page.getByTestId("bookmark-agents")).toHaveAttribute("aria-pressed", "false");
  await page.goto("/en");
  await expect(page.getByTestId("bookmarks")).toHaveCount(0);
});

test("reading progress is tracked and the lesson can be resumed", async ({ page }) => {
  await page.goto(LESSON);
  // Scroll down the page in screen-sized steps, like a reader flicking.
  for (let i = 0; i < 8; i++) {
    await page.evaluate(() => window.scrollBy(0, window.innerHeight * 0.9));
    await page.waitForTimeout(60);
  }
  await expect(page.getByTestId("lesson-progress")).not.toHaveAttribute("aria-valuenow", "0");

  await page.goto("/en");
  await expect(page.getByTestId("home-progress")).toContainText("% read");
  await expect(page.getByTestId("home-continue")).toContainText("Continue at");

  await page.goto(LESSON);
  const banner = page.getByTestId("resume-banner");
  await expect(banner).toBeVisible();
  await banner.getByRole("button").first().tap();
  await expect(page).toHaveURL(/#[a-z]+$/);
  await expect(banner).toHaveCount(0);
});

test("quiz answers and reading progress carry across a language switch", async ({ page }) => {
  await page.goto(`${LESSON}/explore`);
  await page.getByTestId("quiz-q-parallel").getByRole("button", { name: /Same number of calls/ }).tap();
  await expect(page.getByTestId("quiz-q-parallel").getByTestId("quiz-feedback")).toContainText("Cost stays at three calls");

  await page.goto("/vi/lessons/building-effective-agents/explore");
  const q = page.getByTestId("quiz-q-parallel");
  await expect(q.getByRole("button", { name: /Số lần gọi như cũ/ })).toHaveAttribute("aria-pressed", "true");
  await expect(q.getByTestId("quiz-feedback")).toContainText("Chi phí vẫn là ba lần gọi");
  await expect(page.getByTestId("quiz-score")).toHaveText("Đúng 1/3");

  await page.goto("/fr/lessons/building-effective-agents/explore");
  await expect(page.getByTestId("quiz-q-parallel").getByTestId("quiz-feedback")).toContainText("Le coût reste de trois appels");
  await expect(page.getByTestId("quiz-score")).toHaveText("1 sur 3 correctes");
});

test("pseudocode comments follow the language", async ({ page }) => {
  await page.goto("/vi/lessons/building-effective-agents#pseudocode");
  await expect(page.locator("#pseudocode pre").first()).toContainText("Luồng điều khiển nằm trong code CỦA BẠN.");
  await page.goto("/fr/lessons/building-effective-agents#pseudocode");
  await expect(page.locator("#pseudocode pre").nth(2)).toContainText("condition d'arrêt");
});
