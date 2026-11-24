import { describe, expect, it } from "vitest";
import { getLesson, listLessons } from "@/content";
import type { Lesson } from "@/content/schema";
import { validateLesson } from "@/content/validate";
import { computeMetrics } from "@/lib/flow";
import { LOCALES } from "@/lib/i18n/config";

const clone = (lesson: Lesson): Lesson => structuredClone(lesson);
const lesson = getLesson("building-effective-agents")!;

describe("lesson content", () => {
  it("every registered lesson passes validation", () => {
    for (const l of listLessons()) expect(validateLesson(l)).toEqual([]);
  });

  it("has unique slugs", () => {
    const slugs = listLessons().map((l) => l.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("meets the Phase 1 lesson brief in every language", () => {
    for (const locale of LOCALES) {
      const body = lesson.content[locale];
      const kinds = body.sections.map((s) => s.kind);
      expect(kinds[0]).toBe("intro");
      expect(kinds).toEqual(expect.arrayContaining(["concept", "deep-dive", "explore", "example", "tradeoffs", "quiz", "interview", "sources"]));
      const blocks = body.sections.flatMap((s) => s.blocks);
      const quiz = blocks.find((b) => b.type === "quiz");
      expect(quiz?.type === "quiz" && quiz.questions.length).toBe(3);
      expect(blocks.some((b) => b.type === "interactive")).toBe(true);
      expect(blocks.filter((b) => b.type === "code").length).toBeGreaterThanOrEqual(3);
    }
  });

  it("cites the primary source with its real publication date", () => {
    const primary = lesson.sources.find((s) => s.role === "primary")!;
    expect(primary.url).toBe("https://www.anthropic.com/engineering/building-effective-agents");
    expect(primary.publishedOn).toBe("2024-12-19");
  });

  it("keeps quotes verbatim (identical English text) across locales", () => {
    const quotes = (locale: (typeof LOCALES)[number]) =>
      lesson.content[locale].sections.flatMap((s) => s.blocks).filter((b) => b.type === "quote").map((b) => b.type === "quote" && b.text);
    expect(quotes("vi")).toEqual(quotes("en"));
    expect(quotes("fr")).toEqual(quotes("en"));
  });

  it("detects a locale whose structure drifts from English", () => {
    const broken = clone(lesson);
    broken.content.fr.sections.pop();
    expect(validateLesson(broken).some((e) => e.includes("section count"))).toBe(true);
  });

  it("detects a wrong quiz answer key and a missing translation", () => {
    const broken = clone(lesson);
    const quiz = broken.content.vi.sections.flatMap((s) => s.blocks).find((b) => b.type === "quiz");
    if (quiz?.type === "quiz") quiz.questions[0].correctOptionId = "z";
    const quote = broken.content.fr.sections.flatMap((s) => s.blocks).find((b) => b.type === "quote");
    if (quote?.type === "quote") quote.translation = "";
    const errors = validateLesson(broken);
    expect(errors.some((e) => e.includes("structure differs"))).toBe(true);
    expect(errors.some((e) => e.includes("quote needs a translation"))).toBe(true);
  });

  it("detects broken references in the interactive diagram", () => {
    const broken = clone(lesson);
    broken.interactives.patterns.scenarios[0].variants[0].steps[0].nodes.push("ghost");
    expect(validateLesson(broken).some((e) => e.includes("unknown node ghost"))).toBe(true);
  });

  it("detects invalid source metadata", () => {
    const broken = clone(lesson);
    broken.sources[0].publishedOn = "2024-02-31";
    broken.sources[0].url = "http://example.com";
    const errors = validateLesson(broken);
    expect(errors.some((e) => e.includes("invalid publishedOn"))).toBe(true);
    expect(errors.some((e) => e.includes("https"))).toBe(true);
  });
});

describe("explorer traces match the numbers their captions claim", () => {
  const spec = lesson.interactives.patterns;
  const final = (scenario: string, variant: string) => {
    const steps = spec.scenarios.find((s) => s.id === scenario)!.variants.find((v) => v.id === variant)!.steps;
    return computeMetrics(steps, steps.length - 1);
  };

  it.each([
    ["chaining", "pass", 2, 2],
    ["chaining", "fail", 1, 1],
    ["routing", "refund", 2, 2],
    ["routing", "general", 2, 2],
    ["parallel", "sectioning", 2, 1],
    ["parallel", "voting", 3, 1],
    ["orchestrator", "small", 4, 3],
    ["orchestrator", "large", 5, 3],
    ["evaluator", "good", 2, 2],
    ["evaluator", "revise", 4, 4],
    ["agent", "limit5", 4, 4],
    ["agent", "limit2", 2, 2],
  ])("%s/%s → %i calls, %i rounds", (scenario, variant, calls, rounds) => {
    expect(final(scenario, variant)).toEqual({ calls, rounds });
  });
});

describe("translations are real, not copies of English", () => {
  const spec = lesson.interactives.patterns;
  const localized = spec.scenarios.flatMap((s) => [
    s.label,
    s.controlFlow,
    ...s.nodes.map((n) => n.label),
    ...s.variants.flatMap((v) => [v.label, ...Object.values(v.nodeLabels ?? {}), ...v.steps.map((st) => st.caption)]),
  ]);

  it("diagram captions and labels differ from English in VI and FR", () => {
    // Pattern names Vietnamese engineers use as-is (the VI prose uses them too).
    const KEPT_AS_TERMS = new Set(["Orchestrator-workers", "Evaluator-optimizer"]);
    const untranslated = localized
      .filter((l) => l.en.length >= 16 && !KEPT_AS_TERMS.has(l.en) && (l.vi === l.en || l.fr === l.en))
      .map((l) => l.en);
    expect(untranslated).toEqual([]);
  });

  it("code comments are localized while the code itself is identical", async () => {
    const { codeFor } = await import("@/content/lessons/building-effective-agents/code");
    const stripComments = (src: string) => src.replace(/\/\/.*$/gm, "").replace(/[ \t]+$/gm, "");
    for (const key of ["chaining", "routing", "agent", "toolDefinition"] as const) {
      const [en, vi, fr] = (["en", "vi", "fr"] as const).map((l) => codeFor(l)[key]);
      expect(vi).not.toBe(en);
      expect(fr).not.toBe(en);
      expect(stripComments(vi)).toBe(stripComments(en));
      expect(stripComments(fr)).toBe(stripComments(en));
    }
  });
});
