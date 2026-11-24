/**
 * Reject a generated lesson: removes it from the app and records why, so the
 * same article is not picked again by mistake.
 *   npm run content:reject -- <slug> --reason "<why>" [--keep-files]
 * To regenerate instead, reject with a reason, then run the skill again with
 * the same source URL: the reason is visible to the next run in candidates.json.
 */
import { rmSync } from "node:fs";
import { join } from "node:path";
import { arg, fail, flag, PATHS, positional, readCandidates, readCatalog, writeCandidates, writeCatalog, writeCoverage, writeRegistry } from "./lib.mts";

const [slug] = positional();
const reason = arg("reason");
if (!slug || !reason) fail('usage: npm run content:reject -- <slug> --reason "<why>"');
const catalog = readCatalog();
const entry = catalog.find((e) => e.slug === slug);
if (!entry) fail(`${slug} is not in the catalog`);
if (entry.status === "published") fail(`${slug} is published; unpublishing needs a deliberate code review, not this script`);

writeCatalog(catalog.filter((e) => e.slug !== slug));
writeRegistry(catalog.filter((e) => e.slug !== slug));
if (!flag("keep-files")) rmSync(join(PATHS.lessons, slug), { recursive: true, force: true });

const candidates = readCandidates();
for (const c of candidates.candidates) {
  if (c.lessonSlug === slug) {
    c.status = "rejected";
    c.decision = `Lesson rejected in review: ${reason}`;
    delete c.lessonSlug;
  }
}
writeCandidates(candidates);
await writeCoverage();
console.log(`✔ ${slug} rejected and removed${flag("keep-files") ? " from the registry (files kept)" : ""}.`);
