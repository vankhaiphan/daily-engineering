import { expect, test } from "@playwright/test";
import { VISIBLE_LESSONS } from "./helpers";

const visible = (slug: string) => VISIBLE_LESSONS.some((l) => l.slug === slug);
test.skip(!visible("agent-evals") || !visible("timeouts-retries-backoff"), "lessons not visible on this site (drafts in production)");

const EVALS = "/en/lessons/agent-evals";
const RETRIES = "/en/lessons/timeouts-retries-backoff";

test("home lists every visible lesson, with a badge only on drafts", async ({ page }) => {
  await page.goto("/en", { waitUntil: "networkidle" });
  const library = page.getByTestId("library");
  await expect(library.getByRole("link")).toHaveCount(VISIBLE_LESSONS.length);
  for (const lesson of VISIBLE_LESSONS) {
    const badge = library.getByTestId(`library-${lesson.slug}`).getByText("Draft · in review");
    await expect(badge).toHaveCount(lesson.status === "draft" ? 1 : 0);
  }
  await library.getByTestId("library-timeouts-retries-backoff").tap();
  await expect(page).toHaveURL(/timeouts-retries-backoff$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Timeouts, Retries and Backoff");
});

test.describe("agent-evals lesson", () => {
  test("eval pipeline: a polite transcript can hide a wrong outcome", async ({ page }) => {
    await page.goto(EVALS, { waitUntil: "networkidle" });
    const flow = page.locator("#anatomy").getByTestId("flow-explorer");
    await expect(flow.getByText("Task type")).toBeVisible();
    await flow.getByTestId("pattern-support").tap();
    await flow.getByTestId("variant-double-refund").tap();
    for (let i = 0; i < 5; i++) await flow.getByTestId("flow-next").tap();
    await expect(flow.getByTestId("flow-caption")).toContainText("trust the outcome");
    await expect(flow.getByTestId("flow-caption")).toContainText("Failed");
    await expect(flow.getByTestId("metric-calls")).toHaveText("10");
    await expect(flow.getByTestId("metric-rounds")).toHaveCount(0);
  });

  test("pass@k vs pass^k chart: scrub with the slider and step buttons", async ({ page }) => {
    await page.goto(EVALS, { waitUntil: "networkidle" });
    const chart = page.locator("#pass-k").getByTestId("chart-explorer");
    await chart.getByTestId("chart-scenario-p75").tap();
    await chart.getByTestId("chart-slider").fill("2");
    await expect(chart.getByTestId("chart-frame")).toHaveText("k = 3");
    await expect(chart.getByTestId("chart-caption")).toContainText("all succeed 42%");
    await chart.getByTestId("chart-next").tap();
    await expect(chart.getByTestId("chart-frame")).toHaveText("k = 4");
    await chart.getByTestId("chart-reset").tap();
    await expect(chart.getByTestId("chart-frame")).toHaveText("k = 1");
  });

  test("reads naturally in Vietnamese and French", async ({ page }) => {
    await page.goto("/vi/lessons/agent-evals");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Eval cho AI Agent");
    await expect(page.locator("#pass-k").getByTestId("chart-explorer")).toContainText("Xác suất");
    await page.goto("/fr/lessons/agent-evals/explore");
    await expect(page.getByTestId("quiz-q-zero")).toContainText("Une nouvelle tâche échoue");
  });
});

test.describe("timeouts-retries-backoff lesson", () => {
  test("sequence: a blind retry double-charges, an idempotency key does not", async ({ page }) => {
    await page.goto(RETRIES, { waitUntil: "networkidle" });
    const seq = page.locator("#retries").getByTestId("sequence-diagram");
    await seq.getByTestId("seq-scenario-double-charge").tap();
    for (let i = 0; i < 7; i++) await seq.getByTestId("seq-next").tap();
    await expect(seq.locator("[data-step]")).toHaveCount(7);
    await expect(seq.getByTestId("seq-caption")).toContainText("charged twice");
    await expect(seq.getByTestId("seq-caption")).toContainText("Failed");

    await seq.getByTestId("seq-scenario-idempotent").tap();
    await expect(seq.locator("[data-step]")).toHaveCount(0);
    for (let i = 0; i < 7; i++) await seq.getByTestId("seq-next").tap();
    await expect(seq.getByTestId("seq-caption")).toContainText("without charging again");
    await expect(seq.getByTestId("seq-caption")).toContainText("Completed");
  });

  test("amplification chart plays to 243 requests", async ({ page }) => {
    await page.goto(RETRIES, { waitUntil: "networkidle" });
    const chart = page.locator("#amplification").getByTestId("chart-explorer");
    await chart.getByTestId("chart-play").tap();
    await expect(chart.getByTestId("chart-caption")).toContainText("= 243 requests", { timeout: 15_000 });
    await chart.getByTestId("chart-scenario-one-point").tap();
    await expect(chart.getByTestId("chart-caption")).toContainText("Only the top layer retries");
  });

  test("jitter chart spreads retries instead of synchronized spikes", async ({ page }) => {
    await page.goto(RETRIES, { waitUntil: "networkidle" });
    const chart = page.locator("#jitter").getByTestId("chart-explorer");
    const peak = () =>
      chart.locator(".chart-bar").evaluateAll((bars) => Math.max(...bars.map((b) => Number((b as HTMLElement).dataset.value))));
    await chart.getByTestId("chart-scenario-exponential").tap();
    expect(await peak()).toBe(100);
    await chart.getByTestId("chart-scenario-full-jitter").tap();
    expect(await peak()).toBeLessThan(100);
    await expect(chart.locator(".chart-bar")).toHaveCount(20);
  });

  test("explore mode shows the interactive and practice sections", async ({ page }) => {
    await page.goto(`${RETRIES}/explore`);
    await expect(page.locator("[data-section-id]").filter({ visible: true })).toHaveCount(4);
    await expect(page.getByTestId("quiz")).toBeVisible();
  });

  test("an undated source says so instead of inventing a date", async ({ page }) => {
    await page.goto(`${RETRIES}#sources`);
    await expect(page.getByTestId("sources")).toContainText("date not stated by the source");
  });
});
