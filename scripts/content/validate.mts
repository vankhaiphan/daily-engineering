/**
 * Quality gates for lessons.
 *   npm run content:validate                 # every lesson
 *   npm run content:validate -- <slug>       # one lesson
 *   npm run content:validate -- <slug> --publish   # also fail on unresolved review flags
 * Exit code 1 when any error (or, with --publish, any review flag) remains.
 */
import { CATALOG } from "@/content/catalog";
import { validateCandidates } from "@/content/pipeline";
import { blockingReviewFlags, checkLessonQuality } from "@/content/quality";
import { flag, loadLessons, positional, readCandidates, readCatalog } from "./lib.mts";

const lessons = await loadLessons();
const catalog = readCatalog();
const [slug] = positional();
const publish = flag("publish");
const targets = slug ? lessons.filter((l) => l.slug === slug) : lessons;
if (slug && targets.length === 0) {
  console.error(`✖ No lesson "${slug}" in the registry. Known: ${lessons.map((l) => l.slug).join(", ")}`);
  process.exit(1);
}

let failed = false;
const registered = new Set(lessons.map((l) => l.slug));
for (const entry of catalog) {
  if (!registered.has(entry.slug)) {
    console.error(`✖ catalog lists "${entry.slug}" but the registry does not (run npm run content:registry)`);
    failed = true;
  }
}
if (JSON.stringify(catalog) !== JSON.stringify(CATALOG)) {
  console.error("✖ catalog.json changed on disk since load; re-run");
  failed = true;
}

for (const lesson of targets) {
  const report = checkLessonQuality(lesson, { lessons, catalog });
  // --publish: every evidence flag blocks; only the draft marker itself (cleared by publishing) does not.
  const ok = report.errors.length === 0 && (!publish || blockingReviewFlags(report).length === 0);
  failed ||= !ok;
  console.log(`\n${ok ? "✔" : "✖"} ${lesson.slug} (${lesson.status})`);
  for (const e of report.errors) console.log(`  error   ${e}`);
  for (const f of report.reviewFlags) console.log(`  review  ${f}`);
  for (const w of report.warnings) console.log(`  warn    ${w}`);
  if (report.errors.length + report.reviewFlags.length + report.warnings.length === 0) console.log("  all gates passed");
}

const candidateErrors = validateCandidates(readCandidates(), lessons);
if (candidateErrors.length) {
  failed = true;
  console.log("\n✖ content-pipeline/candidates.json");
  for (const e of candidateErrors) console.log(`  error   ${e}`);
}

console.log(failed ? "\nValidation failed." : `\nValidation passed${publish ? " (publish gate)" : ""}.`);
process.exit(failed ? 1 : 0);
