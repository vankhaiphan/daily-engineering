import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { listAllLessons } from "@/content";
import { CATALOG, draftsVisible, isVisible } from "@/content/catalog";
import { buildCoverage, renderRegistry, scoreCandidate, validateCandidates, type CandidateFile } from "@/content/pipeline";
import { checkLessonQuality, findDuplicates, normalizeUrl, similarity } from "@/content/quality";
import type { ChartSpec, Lesson, SequenceSpec } from "@/content/schema";
import { validateChart, validateSequence } from "@/content/validate";

const lessons = listAllLessons();
const read = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
const lessonBySlug = (slug: string) => lessons.find((l) => l.slug === slug)!;
const clone = (l: Lesson): Lesson => structuredClone(l);

describe("catalog, registry and coverage stay in sync", () => {
  it("registry.ts is generated from catalog.json", () => {
    expect(read("src/content/lessons/registry.ts")).toBe(renderRegistry(CATALOG));
  });

  it("every catalog entry matches its lesson's slug, status and date", () => {
    expect(lessons.map((l) => ({ slug: l.slug, status: l.status, createdOn: l.createdOn }))).toEqual(CATALOG);
  });

  it("coverage.json is up to date (run npm run content:registry)", () => {
    expect(JSON.parse(read("content-pipeline/coverage.json"))).toEqual(buildCoverage(lessons));
  });

  it("candidates.json is valid and totals are computed", () => {
    const file = JSON.parse(read("content-pipeline/candidates.json")) as CandidateFile;
    expect(validateCandidates(file, lessons)).toEqual([]);
    for (const c of file.candidates.filter((c) => c.status === "selected")) {
      expect(lessons.some((l) => l.slug === c.lessonSlug && l.provenance.candidateId === c.id)).toBe(true);
    }
  });
});

describe("every registered lesson passes the quality gates", () => {
  it.each(lessons.map((l) => [l.slug, l] as const))("%s", (_slug, lesson) => {
    const report = checkLessonQuality(lesson, { lessons, catalog: CATALOG });
    expect(report.errors).toEqual([]);
  });

  it("published lessons have no claims awaiting review", () => {
    for (const l of lessons.filter((l) => l.status === "published")) {
      expect(l.review.claims.filter((c) => c.status === "needs-review")).toEqual([]);
    }
  });
});

describe("quality gates reject bad lessons", () => {
  const base = lessonBySlug("building-effective-agents");
  const errorsOf = (l: Lesson) => checkLessonQuality(l, { lessons, catalog: CATALOG }).errors;

  it("requires a visualization and three quiz questions", () => {
    const l = clone(base);
    for (const loc of ["en", "vi", "fr"] as const) {
      l.content[loc].sections = l.content[loc].sections
        .filter((s) => s.kind !== "quiz")
        .map((s) => ({ ...s, blocks: s.blocks.filter((b) => b.type !== "interactive") }));
    }
    const errors = errorsOf(l);
    expect(errors.some((e) => e.includes("interactive visualization"))).toBe(true);
    expect(errors.some((e) => e.includes("quiz"))).toBe(true);
  });

  it("detects a truncated translation", () => {
    const l = clone(base);
    // Simulate a translation that silently dropped most of its prose.
    l.content.fr.sections = l.content.fr.sections.map((s) => ({
      ...s,
      blocks: s.blocks.filter((b) => !["p", "list", "table", "callout"].includes(b.type)),
    }));
    expect(errorsOf(l).some((e) => e.startsWith("fr translation length ratio"))).toBe(true);
  });

  it("rejects long copied quotes and claims without evidence", () => {
    const l = clone(base);
    const quote = l.content.en.sections.flatMap((s) => s.blocks).find((b) => b.type === "quote");
    if (quote?.type === "quote") quote.text = "x".repeat(400);
    l.review.claims[0].evidence = "";
    const errors = errorsOf(l);
    expect(errors.some((e) => e.includes("quote longer than"))).toBe(true);
    expect(errors.some((e) => e.includes("claim and evidence are required"))).toBe(true);
  });

});

describe("duplicate detection", () => {
  it("normalizes moved and equivalent URLs", () => {
    expect(normalizeUrl("https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents/")).toBe(
      normalizeUrl("https://anthropic.com/research/demystifying-evals-for-ai-agents?ref=x#top"),
    );
    expect(normalizeUrl("https://aws.amazon.com/builders-library/timeouts-retries-and-backoff-with-jitter/")).toBe(
      normalizeUrl("https://builder.aws.com/content/3EumjoZascWd1oZiEgL8ORlv3qE/timeouts-retries-and-backoff-with-jitter"),
    );
  });

  it("flags the same primary source as a duplicate and a cited source as a near-duplicate", () => {
    const dup = findDuplicates({ url: "https://www.anthropic.com/research/building-effective-agents" }, lessons);
    expect(dup[0]).toMatchObject({ slug: "building-effective-agents", severity: "duplicate" });
    const near = findDuplicates({ url: "https://www.anthropic.com/engineering/multi-agent-research-system" }, lessons);
    expect(near[0]).toMatchObject({ slug: "building-effective-agents", severity: "near-duplicate" });
  });

  it("uses keyword overlap for topics found under a different URL", () => {
    const matches = findDuplicates({ keywords: ["prompt chaining", "routing", "orchestrator-workers", "agent loop"] }, lessons);
    expect(matches.some((m) => m.slug === "building-effective-agents" && m.severity === "near-duplicate")).toBe(true);
    expect(findDuplicates({ keywords: ["consistent hashing", "sharding", "rebalancing"] }, lessons)).toEqual([]);
    expect(similarity(["a b"], ["c d"])).toBe(0);
  });
});

describe("candidate scoring", () => {
  const scores = { technicalRelevance: 5, educationalDepth: 5, credibility: 5, novelty: 5, careerValue: 5, engagement: null };
  it("is 0–100 and ignores unverifiable engagement", () => {
    expect(scoreCandidate(scores)).toBe(100);
    expect(scoreCandidate({ ...scores, technicalRelevance: 1, educationalDepth: 1, credibility: 1, novelty: 1, careerValue: 1 })).toBe(0);
    expect(scoreCandidate({ ...scores, novelty: 2, engagement: 5 })).toBeGreaterThan(scoreCandidate({ ...scores, novelty: 2 }));
  });
});

describe("draft visibility", () => {
  it.each([
    [{ NODE_ENV: "development" }, true],
    [{ NODE_ENV: "production" }, false],
    [{ NODE_ENV: "production", VERCEL_ENV: "preview" }, true],
    [{ NODE_ENV: "production", VERCEL_ENV: "production" }, false],
    [{ NODE_ENV: "production", VERCEL_ENV: "production", SHOW_DRAFT_LESSONS: "true" }, true],
    [{ NODE_ENV: "development", SHOW_DRAFT_LESSONS: "false" }, false],
  ])("%o → drafts visible: %s", (env, visible) => {
    expect(draftsVisible(env)).toBe(visible);
    expect(isVisible("published", env)).toBe(true);
  });
});

describe("visual spec validators", () => {
  it("catch broken sequence and chart specs", () => {
    const seq: SequenceSpec = {
      kind: "sequence",
      id: "s",
      participants: [{ id: "a", kind: "io", label: { en: "A", vi: "A", fr: "A" } }],
      scenarios: [{ id: "x", label: { en: "X", vi: "X", fr: "X" }, summary: { en: "s", vi: "s", fr: "s" }, steps: [{ from: "a", to: "ghost", style: "request", label: { en: "m", vi: "m", fr: "m" }, caption: { en: "c", vi: "c", fr: "c" } }] }],
    };
    const errors = validateSequence(seq, "seq");
    expect(errors.some((e) => e.includes("2–4 participants"))).toBe(true);
    expect(errors.some((e) => e.includes("unknown participant"))).toBe(true);
    expect(errors.some((e) => e.includes("outcome"))).toBe(true);

    const L = (t: string) => ({ en: t, vi: t, fr: t });
    const chart: ChartSpec = {
      kind: "chart",
      id: "c",
      valueLabel: L("v"),
      valueFormat: "percent",
      yMax: 1,
      xLabels: "all",
      method: L("m"),
      scenarios: [{ id: "s", label: L("s"), frames: [{ label: L("f"), caption: L("c"), bars: [{ label: L("b"), value: 2 }] }] }],
    };
    expect(validateChart(chart, "chart").some((e) => e.includes("above yMax"))).toBe(true);
  });
});
