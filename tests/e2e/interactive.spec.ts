import { expect, test } from "@playwright/test";
import { LESSON } from "./helpers";

test.describe("pattern explorer", () => {
  test("stepping shows exact cost vs latency counters", async ({ page }) => {
    await page.goto(`${LESSON}/explore`);
    const explorer = page.getByTestId("flow-explorer");
    await explorer.getByTestId("pattern-parallel").tap();
    await explorer.getByTestId("variant-voting").tap();
    await expect(explorer.getByTestId("flow-caption")).toContainText("Ready");

    await explorer.getByTestId("flow-next").tap();
    await expect(explorer.getByTestId("metric-calls")).toHaveText("3");
    await expect(explorer.getByTestId("metric-rounds")).toHaveText("1");
    await expect(explorer.locator('[data-node="w3"][data-active]')).toHaveCount(1);
    await expect(explorer.locator("path[data-active]")).toHaveCount(3);

    await explorer.getByTestId("flow-next").tap();
    await explorer.getByTestId("flow-next").tap();
    await expect(explorer.getByTestId("flow-caption")).toContainText("Completed");
    await expect(explorer.getByTestId("flow-next")).toBeDisabled();

    await explorer.getByTestId("flow-prev").tap();
    await expect(explorer.getByTestId("flow-step")).toHaveText("Step 2 / 3");
  });

  test("the input changes the route and the orchestrator's plan", async ({ page }) => {
    await page.goto(`${LESSON}/explore`);
    const explorer = page.getByTestId("flow-explorer");
    await explorer.getByTestId("pattern-routing").tap();
    await explorer.getByTestId("variant-tech").tap();
    await explorer.getByTestId("flow-next").tap();
    await explorer.getByTestId("flow-next").tap();
    await expect(explorer.locator('[data-node="tech"][data-active]')).toHaveCount(1);
    await expect(explorer.locator('[data-node="refund"][data-active]')).toHaveCount(0);

    await explorer.getByTestId("pattern-orchestrator").tap();
    await explorer.getByTestId("variant-large").tap();
    for (let i = 0; i < 4; i++) await explorer.getByTestId("flow-next").tap();
    await expect(explorer.getByTestId("metric-calls")).toHaveText("5");
    await expect(explorer.getByTestId("metric-rounds")).toHaveText("3");
  });

  test("agent stopping condition, played automatically", async ({ page }) => {
    await page.goto(`${LESSON}/explore`);
    const explorer = page.getByTestId("flow-explorer");
    await explorer.getByTestId("pattern-agent").tap();
    await explorer.getByTestId("variant-limit2").tap();
    await explorer.getByTestId("flow-play").tap();
    await expect(explorer.getByTestId("flow-caption")).toContainText("Stopped safely", { timeout: 20_000 });
    await expect(explorer.getByTestId("metric-calls")).toHaveText("2");
    await expect(explorer.getByTestId("flow-play")).toHaveAttribute("aria-label", "Play");
  });

  test("captions follow the language", async ({ page }) => {
    await page.goto("/vi/lessons/building-effective-agents/explore");
    const explorer = page.getByTestId("flow-explorer");
    await explorer.getByTestId("flow-next").tap();
    await expect(explorer.getByTestId("flow-caption")).toContainText("Lần gọi LLM thứ 1");
  });
});

