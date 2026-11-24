/**
 * Lesson quality gates, layered on top of `validateLesson` (structure).
 *
 * - errors      → the lesson is broken or below the bar; validation fails.
 * - warnings    → worth a look, never blocks.
 * - reviewFlags → needs a human decision; blocks publishing (`--publish`).
 *
 * Pure functions only: used by unit tests and by `scripts/content/*`.
 */
import { LOCALES } from "@/lib/i18n/config";
import { countWords } from "@/lib/reading-time";
import type { CatalogEntry } from "./catalog";
import type { Block, Lesson, SectionKind } from "./schema";
import { validateLesson } from "./validate";

export interface QualityReport {
  slug: string;
  errors: string[];
  warnings: string[];
  reviewFlags: string[];
}

export const QUALITY_RULES = {
  minEnglishWords: 1200,
  /** Word-count ratio of a translation vs English (catches truncated translations). */
  localeWordRatio: { min: 0.6, max: 2.2 },
  minQuizQuestions: 3,
  minClaims: 5,
  maxEvidenceChars: 300,
  maxQuoteChars: 300,
  maxQuotes: 6,
  /** Keyword Jaccard similarity with another lesson. */
  duplicateSimilarity: 0.5,
  nearDuplicateSimilarity: 0.3,
} as const;

/** Informational flag on every draft. Publishing is what clears it, so it never blocks publishing. */
export const DRAFT_FLAG = "status is draft: visible in dev/preview only until published";

/** Review flags that must be resolved before a lesson can be published (everything except the draft marker). */
export function blockingReviewFlags(report: QualityReport): string[] {
  return report.reviewFlags.filter((flag) => flag !== DRAFT_FLAG);
}

const REQUIRED_KINDS: SectionKind[] = ["intro", "concept", "deep-dive", "tradeoffs", "quiz", "interview", "sources"];

/* ---------------------------------------------------------------- */
/* Duplicate detection                                               */
/* ---------------------------------------------------------------- */

const STOP_WORDS = new Set(
  "a an and are as at be by for from how in into is it of on or the to vs with your we our what why when".split(" "),
);

export function tokens(text: string): string[] {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .split(/[^a-z0-9^@]+/)
    .filter((t) => t.length > 1 && !STOP_WORDS.has(t));
}

/** Jaccard similarity of two bags of phrases (compared as token sets). */
export function similarity(a: readonly string[], b: readonly string[]): number {
  const sa = new Set(a.flatMap(tokens));
  const sb = new Set(b.flatMap(tokens));
  if (sa.size === 0 || sb.size === 0) return 0;
  let shared = 0;
  for (const t of sa) if (sb.has(t)) shared++;
  return shared / (sa.size + sb.size - shared);
}

/**
 * Canonical form of a source URL, so the same article found under a different
 * address is still recognised (http/https, www, trailing slash, query, hash,
 * and known site moves: anthropic.com/engineering → /research, AWS Builders'
 * Library → builder.aws.com/content/<id>/<slug>).
 */
export function normalizeUrl(raw: string): string {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return raw.trim().toLowerCase();
  }
  const host = url.hostname.replace(/^www\./, "").toLowerCase();
  let path = url.pathname.replace(/\/+$/, "").toLowerCase();
  if (host === "anthropic.com") path = path.replace(/^\/(engineering|research)\//, "/article/");
  if (host === "aws.amazon.com" && path.startsWith("/builders-library/")) {
    return `aws-builders-library/${path.split("/").pop()}`;
  }
  if (host === "builder.aws.com" && path.startsWith("/content/")) {
    return `aws-builders-library/${path.split("/").pop()}`;
  }
  return `${host}${path}`;
}

export interface DuplicateMatch {
  slug: string;
  reason: string;
  score: number;
  severity: "duplicate" | "near-duplicate";
}

/** Compare a candidate topic (or a lesson) against existing lessons. */
export function findDuplicates(
  candidate: { url?: string; title?: string; keywords?: readonly string[]; slug?: string },
  lessons: readonly Lesson[],
): DuplicateMatch[] {
  const matches: DuplicateMatch[] = [];
  const candidateUrl = candidate.url ? normalizeUrl(candidate.url) : undefined;
  for (const lesson of lessons) {
    if (lesson.slug === candidate.slug) continue;
    const primary = lesson.sources.find((s) => s.role === "primary");
    if (candidateUrl && primary && normalizeUrl(primary.url) === candidateUrl) {
      matches.push({ slug: lesson.slug, reason: "same primary source", score: 1, severity: "duplicate" });
      continue;
    }
    if (candidateUrl && lesson.sources.some((s) => normalizeUrl(s.url) === candidateUrl)) {
      matches.push({ slug: lesson.slug, reason: "already cited as a supporting source", score: 0.6, severity: "near-duplicate" });
    }
    if (candidate.keywords?.length) {
      const score = similarity(candidate.keywords, lesson.keywords);
      if (score >= QUALITY_RULES.duplicateSimilarity) {
        matches.push({ slug: lesson.slug, reason: `keyword overlap ${score.toFixed(2)}`, score, severity: "duplicate" });
      } else if (score >= QUALITY_RULES.nearDuplicateSimilarity) {
        matches.push({ slug: lesson.slug, reason: `keyword overlap ${score.toFixed(2)}`, score, severity: "near-duplicate" });
      }
    }
    if (candidate.title) {
      const score = similarity([candidate.title], [lesson.content.en.title, primary?.title ?? ""]);
      if (score >= 0.6) matches.push({ slug: lesson.slug, reason: `title overlap ${score.toFixed(2)}`, score, severity: "near-duplicate" });
    }
  }
  return matches;
}

/* ---------------------------------------------------------------- */
/* Lesson quality                                                    */
/* ---------------------------------------------------------------- */

function allBlocks(lesson: Lesson, locale: (typeof LOCALES)[number] = "en"): Block[] {
  return lesson.content[locale].sections.flatMap((s) => s.blocks);
}

export function checkLessonQuality(
  lesson: Lesson,
  context: { lessons: readonly Lesson[]; catalog: readonly CatalogEntry[] },
): QualityReport {
  const errors = [...validateLesson(lesson)];
  const warnings: string[] = [];
  const reviewFlags: string[] = [];
  const en = lesson.content.en;

  // Required pedagogy
  const kinds = en.sections.map((s) => s.kind);
  for (const kind of REQUIRED_KINDS) if (!kinds.includes(kind)) errors.push(`missing a "${kind}" section`);
  if (kinds[0] !== "intro") errors.push("the first section must be the intro");
  if (kinds.at(-1) !== "sources") errors.push("the last section must be the sources");

  const blocks = allBlocks(lesson);
  if (!blocks.some((b) => b.type === "interactive")) errors.push("needs at least one interactive visualization");
  if (!blocks.some((b) => b.type === "code" || b.type === "table")) {
    warnings.push("no code sample or comparison table: is there a concrete engineering example?");
  }

  // Quiz
  const questions = blocks.flatMap((b) => (b.type === "quiz" ? b.questions : []));
  if (questions.length < QUALITY_RULES.minQuizQuestions) {
    errors.push(`needs ≥ ${QUALITY_RULES.minQuizQuestions} quiz questions (has ${questions.length})`);
  }
  for (const q of questions) {
    if (q.options.length < 3) warnings.push(`quiz ${q.id}: fewer than 3 options makes guessing easy`);
  }
  const answerPositions = new Set(questions.map((q) => q.options.findIndex((o) => o.id === q.correctOptionId)));
  if (questions.length >= 3 && answerPositions.size === 1) warnings.push("every quiz answer is in the same position");

  // Interview summary
  const interview = blocks.find((b) => b.type === "interview");
  if (interview?.type === "interview") {
    if (interview.keyPoints.length < 3) errors.push("interview summary needs ≥ 3 key points");
    if (interview.followUps.length < 2) errors.push("interview summary needs ≥ 2 follow-up questions");
  }

  // Depth and translation completeness
  const enWords = countWords(en);
  if (enWords < QUALITY_RULES.minEnglishWords) errors.push(`English body is ${enWords} words (< ${QUALITY_RULES.minEnglishWords})`);
  for (const locale of LOCALES) {
    if (locale === "en") continue;
    const ratio = countWords(lesson.content[locale]) / Math.max(1, enWords);
    const { min, max } = QUALITY_RULES.localeWordRatio;
    if (ratio < min || ratio > max) errors.push(`${locale} translation length ratio ${ratio.toFixed(2)} is outside ${min}–${max}`);
  }

  // No large passages copied from sources
  const quotes = blocks.filter((b) => b.type === "quote");
  if (quotes.length > QUALITY_RULES.maxQuotes) errors.push(`${quotes.length} quotes (max ${QUALITY_RULES.maxQuotes}): explain, don't copy`);
  for (const q of quotes) {
    if (q.type === "quote" && q.text.length > QUALITY_RULES.maxQuoteChars) errors.push(`quote longer than ${QUALITY_RULES.maxQuoteChars} chars`);
  }

  // Claims and review
  const sourceIds = new Set(lesson.sources.map((s) => s.id));
  const claims = lesson.review.claims;
  if (claims.length < QUALITY_RULES.minClaims) errors.push(`only ${claims.length} checked claims (min ${QUALITY_RULES.minClaims})`);
  const claimIds = new Set<string>();
  for (const c of claims) {
    if (claimIds.has(c.id)) errors.push(`duplicate claim id ${c.id}`);
    claimIds.add(c.id);
    if (!c.claim.trim() || !c.evidence.trim()) errors.push(`claim ${c.id}: claim and evidence are required`);
    if (c.evidence.length > QUALITY_RULES.maxEvidenceChars) errors.push(`claim ${c.id}: evidence longer than ${QUALITY_RULES.maxEvidenceChars} chars`);
    if (c.sourceId && !sourceIds.has(c.sourceId)) errors.push(`claim ${c.id}: unknown source ${c.sourceId}`);
    if (c.status === "verified" && !c.sourceId) errors.push(`claim ${c.id}: verified claims must cite a source`);
    if (c.status === "needs-review") reviewFlags.push(`claim ${c.id} needs review: ${c.claim}${c.note ? ` (${c.note})` : ""}`);
  }
  const usedSources = new Set([
    ...claims.map((c) => c.sourceId),
    ...quotes.map((q) => (q.type === "quote" ? q.sourceId : undefined)),
  ]);
  for (const s of lesson.sources) if (!usedSources.has(s.id)) warnings.push(`source ${s.id} is never quoted or used as claim evidence`);

  // Visual references
  const referenced = new Set(blocks.flatMap((b) => (b.type === "interactive" ? [b.ref] : [])));
  for (const ref of Object.keys(lesson.interactives)) if (!referenced.has(ref)) warnings.push(`interactive ${ref} is never used`);

  // Duplicates
  for (const match of findDuplicates(
    { slug: lesson.slug, url: lesson.sources.find((s) => s.role === "primary")?.url, keywords: lesson.keywords },
    context.lessons,
  )) {
    const message = `${match.severity} of ${match.slug}: ${match.reason}`;
    if (match.severity === "duplicate") errors.push(message);
    else warnings.push(message);
  }

  // Catalog consistency
  const entry = context.catalog.find((e) => e.slug === lesson.slug);
  if (!entry) errors.push("not listed in src/content/catalog.json");
  else {
    if (entry.status !== lesson.status) errors.push(`catalog status ${entry.status} ≠ lesson status ${lesson.status}`);
    if (entry.createdOn !== lesson.createdOn) errors.push(`catalog date ${entry.createdOn} ≠ lesson date ${lesson.createdOn}`);
  }
  if (lesson.keywords.length < 4) errors.push("needs ≥ 4 keywords (used for duplicate detection)");

  // Publishing gate
  if (lesson.status === "draft") reviewFlags.push(DRAFT_FLAG);
  if (lesson.status === "published" && claims.some((c) => c.status === "needs-review")) {
    errors.push("published lesson still has claims that need review");
  }

  return { slug: lesson.slug, errors, warnings, reviewFlags };
}
