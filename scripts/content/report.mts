/**
 * Write a human review report for a lesson: content-pipeline/reviews/<slug>.md
 *   npm run content:report -- <slug>
 */
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { checkLessonQuality } from "@/content/quality";
import { countWords, readingMinutes } from "@/lib/reading-time";
import { LOCALES } from "@/lib/i18n/config";
import { fail, loadLessons, PATHS, positional, readCatalog } from "./lib.mts";

const [slug] = positional();
const lessons = await loadLessons();
const lesson = lessons.find((l) => l.slug === slug);
if (!lesson) fail("usage: npm run content:report -- <slug>");
const report = checkLessonQuality(lesson, { lessons, catalog: readCatalog() });
const icon = { verified: "✅", derived: "🧮", "needs-review": "⚠️" } as const;

const md = `# Review: ${lesson.content.en.title}

- Slug: \`${lesson.slug}\` · status: **${lesson.status}** · created ${lesson.createdOn} · provenance: ${lesson.provenance.method}${lesson.provenance.candidateId ? ` (candidate \`${lesson.provenance.candidateId}\`)` : ""}
- Length: ${LOCALES.map((l) => `${l.toUpperCase()} ${countWords(lesson.content[l])} words`).join(" · ")} · ~${readingMinutes(lesson.content.en)} min
- Visuals: ${Object.entries(lesson.interactives).map(([ref, v]) => `\`${ref}\` (${v.kind})`).join(", ")}
- Automated gates: ${report.errors.length ? `**${report.errors.length} error(s)**` : "pass"} · ${report.reviewFlags.length} review flag(s) · ${report.warnings.length} warning(s)

## Sources
${lesson.sources.map((s) => `- [${s.title}](${s.url}): ${s.publisher}, ${s.authors.join(", ")}, published ${s.publishedOn ?? "**date not stated**"}, checked ${s.accessedOn} (${s.role})`).join("\n")}

## Claims to check (${lesson.review.claims.length})
| | Claim | Source | Evidence |
|---|---|---|---|
${lesson.review.claims.map((c) => `| ${icon[c.status]} | ${c.claim}${c.note ? ` _(${c.note})_` : ""} | ${c.sourceId ?? "ours"} | ${c.evidence.replaceAll("|", "\\|")} |`).join("\n")}

## Needs a human decision
${report.reviewFlags.length ? report.reviewFlags.map((f) => `- [ ] ${f}`).join("\n") : "- nothing flagged"}

## Errors
${report.errors.length ? report.errors.map((e) => `- ${e}`).join("\n") : "- none"}

## Warnings
${report.warnings.length ? report.warnings.map((w) => `- ${w}`).join("\n") : "- none"}

## Reviewer checklist
See \`content-pipeline/REVIEW.md\`. Tick each item, resolve every ⚠️ claim (verify and set \`status: "verified"\` with evidence, or remove/rewrite the claim), then run \`npm run content:publish -- ${lesson.slug}\`.
`;
const path = join(PATHS.reviews, `${lesson.slug}.md`);
writeFileSync(path, md);
console.log(`✔ wrote ${path}`);
