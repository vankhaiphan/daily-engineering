/**
 * Lesson-specific checks for the Phase 3 generated lessons: computed visual
 * data matches its formula, and uncertain claims stay flagged.
 */
import { describe, expect, it } from "vitest";
import { listAllLessons } from "@/content";
import { CATALOG } from "@/content/catalog";
import { passAtK, passHatK, passKChart } from "@/content/lessons/agent-evals/visuals";
import { amplification, histogram, JITTER, simulateRetries } from "@/content/lessons/timeouts-retries-backoff/visuals";
import { blockingReviewFlags, checkLessonQuality, DRAFT_FLAG, findDuplicates } from "@/content/quality";

const lessons = listAllLessons();
const retries = lessons.find((l) => l.slug === "timeouts-retries-backoff")!;

describe("agent-evals visuals", () => {
  it("pass@k / pass^k frames match the formulas (75% over 3 trials ≈ 42%)", () => {
    expect(passHatK(0.75, 3)).toBeCloseTo(0.421875);
    expect(passAtK(0.75, 3)).toBeCloseTo(0.984375);
    const p75 = passKChart.scenarios.find((s) => s.id === "p75")!;
    expect(p75.frames[2].bars.map((b) => b.value)).toEqual([passAtK(0.75, 3), passHatK(0.75, 3)]);
    expect(p75.frames[2].caption.en).toContain("42%");
    expect(p75.frames[4].caption.en).toContain("99.9%");
  });
});

describe("timeouts-retries-backoff visuals", () => {
  it("retry amplification is attempts^depth (243 at the bottom of five layers)", () => {
    expect(amplification("every-layer")).toEqual([3, 9, 27, 81, 243]);
    expect(amplification("one-point")).toEqual([3, 3, 3, 3, 3]);
  });

  it("the jitter simulation is deterministic and conserves retries", () => {
    expect(simulateRetries("full-jitter")).toEqual(simulateRetries("full-jitter"));
    for (const policy of ["fixed", "exponential", "full-jitter"] as const) {
      for (let round = 1; round <= JITTER.rounds; round++) {
        expect(histogram(policy, round).reduce((a, b) => a + b, 0)).toBe(JITTER.clients * round);
      }
    }
    expect(Math.max(...histogram("exponential", 1))).toBe(JITTER.clients);
    expect(Math.max(...histogram("full-jitter", 1))).toBeLessThan(JITTER.clients);
  });
});

describe("review gates on the generated lessons", () => {
  it("the full-jitter claim is verified against a source the lesson cites", () => {
    const claim = retries.review.claims.find((c) => c.id === "full-jitter-formula")!;
    expect(claim.status).toBe("verified");
    expect(retries.sources.some((s) => s.id === claim.sourceId)).toBe(true);
    expect(claim.evidence).toContain("delay = random(0, 1) × min(20,000 ms, base_delay × 2^retry)");
    const report = checkLessonQuality(retries, { lessons, catalog: CATALOG });
    expect(blockingReviewFlags(report)).toEqual([]);
  });

  it("blocks publishing while a claim needs review", () => {
    const l = structuredClone(retries);
    l.review.claims.push({ id: "unconfirmed", claim: "x", evidence: "not found in any source", status: "needs-review" });
    l.status = "published";
    const catalog = CATALOG.map((e) => (e.slug === l.slug ? { ...e, status: "published" as const } : e));
    expect(checkLessonQuality(l, { lessons, catalog }).errors).toContain("published lesson still has claims that need review");
  });

  it("only the draft marker is non-blocking; any needs-review claim blocks", () => {
    const l = structuredClone(retries);
    l.review.claims.push({ id: "unconfirmed", claim: "x", evidence: "not found in any source", status: "needs-review" });
    const report = checkLessonQuality(l, { lessons, catalog: CATALOG });
    expect(report.reviewFlags).toContain(DRAFT_FLAG);
    expect(blockingReviewFlags(report)).toEqual([expect.stringContaining("claim unconfirmed needs review")]);
  });

  it("keyword overlap finds the retries lesson under any URL", () => {
    const matches = findDuplicates({ keywords: ["retries", "exponential backoff", "jitter", "timeouts", "idempotency"] }, lessons);
    expect(matches.some((m) => m.slug === "timeouts-retries-backoff")).toBe(true);
  });
});
