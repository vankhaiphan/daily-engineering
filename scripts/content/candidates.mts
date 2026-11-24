/**
 * List and check discovered article candidates.
 *   npm run content:candidates               # ranked list + validation
 *   npm run content:candidates -- --rescore  # recompute totals from scores
 */
import { scoreCandidate, validateCandidates } from "@/content/pipeline";
import { flag, loadLessons, readCandidates, writeCandidates } from "./lib.mts";

const file = readCandidates();
if (flag("rescore")) {
  for (const c of file.candidates) c.total = scoreCandidate(c.scores);
  writeCandidates(file);
  console.log("✔ totals recomputed");
}
const ranked = [...file.candidates].sort((a, b) => b.total - a.total);
for (const c of ranked) {
  console.log(`${String(c.total).padStart(3)}  ${c.status.padEnd(11)} ${c.kind.padEnd(9)} ${c.publishedOn ?? "no date   "}  ${c.title}`);
  console.log(`     ${c.url}`);
  console.log(`     → ${c.decision}${c.lessonSlug ? ` [${c.lessonSlug}]` : ""}`);
}
const errors = validateCandidates(file, await loadLessons());
for (const e of errors) console.error(`✖ ${e}`);
process.exit(errors.length ? 1 : 0);
