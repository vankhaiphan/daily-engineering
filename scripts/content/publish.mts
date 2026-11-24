/**
 * Approve a reviewed draft: runs the publish gate, then flips status to
 * "published" in the lesson and the catalog.
 *   npm run content:publish -- <slug> --reviewer "<name>"
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { blockingReviewFlags, checkLessonQuality } from "@/content/quality";
import { arg, fail, loadLessons, PATHS, positional, readCandidates, readCatalog, today, writeCandidates, writeCatalog, writeCoverage, writeRegistry } from "./lib.mts";

// Publishing is a human decision. Refuse in any cloud or scheduled session,
// whatever command form was used to start this script.
const scheduledMarkers = ["DAILY_ENGINEERING_SCHEDULED", "CLAUDE_CODE_REMOTE"].filter((k) => {
  const v = process.env[k];
  return v !== undefined && v !== "" && v !== "0" && v !== "false";
});
if (scheduledMarkers.length) {
  fail(`content:publish is human-only and refuses to run in a cloud/scheduled session (${scheduledMarkers.join(", ")} set). Publish from your own machine after review.`);
}

const [slug] = positional();
const reviewer = arg("reviewer");
if (!slug || !reviewer) fail('usage: npm run content:publish -- <slug> --reviewer "<name>"');
const lessons = await loadLessons();
const lesson = lessons.find((l) => l.slug === slug);
if (!lesson) fail(`no lesson ${slug}`);
if (lesson.status === "published") fail(`${slug} is already published`);

const catalog = readCatalog();
const report = checkLessonQuality(lesson, { lessons, catalog });
const blocking = [...report.errors, ...blockingReviewFlags(report)];
if (blocking.length) {
  for (const b of blocking) console.error(`  ✖ ${b}`);
  fail(`${slug} cannot be published until these are resolved`);
}

const indexPath = join(PATHS.lessons, slug, "index.ts");
const source = readFileSync(indexPath, "utf8");
if (!source.includes('status: "draft"')) fail(`could not find status: "draft" in ${indexPath}`);
writeFileSync(indexPath, source.replace('status: "draft"', 'status: "published"'));

const reviewPath = join(PATHS.lessons, slug, "review.ts");
const reviewSource = readFileSync(reviewPath, "utf8");
writeFileSync(
  reviewPath,
  reviewSource.replace(/reviewedBy: "[^"]*"/, `reviewedBy: ${JSON.stringify(reviewer)}`).replace(/reviewedOn: "[^"]*"/, `reviewedOn: "${today()}"`),
);

const entry = catalog.find((e) => e.slug === slug);
if (entry) entry.status = "published";
writeCatalog(catalog);
writeRegistry(catalog);

const candidates = readCandidates();
for (const c of candidates.candidates) if (c.lessonSlug === slug) c.status = "published";
writeCandidates(candidates);
// The lesson modules were imported before the edits above; patch the status in memory.
await writeCoverage(lessons.map((l) => (l.slug === slug ? { ...l, status: "published" as const } : l)));
console.log(`✔ ${slug} published (reviewed by ${reviewer}). Commit, open a PR, and merge to deploy.`);
