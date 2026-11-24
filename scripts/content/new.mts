/**
 * Scaffold a draft lesson from content-pipeline/template.
 *   npm run content:new -- <slug> [--candidate <candidate-id>]
 * Creates src/content/lessons/<slug>/, registers it as a draft, and links the
 * candidate. The template intentionally fails validation until filled in.
 */
import { cpSync, existsSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { arg, fail, PATHS, positional, readCandidates, readCatalog, today, writeCandidates, writeCatalog, writeCoverage, writeRegistry } from "./lib.mts";

const [slug] = positional();
if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) fail("usage: npm run content:new -- <kebab-case-slug> [--candidate <id>]");
const dir = join(PATHS.lessons, slug);
if (existsSync(dir)) fail(`${dir} already exists`);

const catalog = readCatalog();
const candidateId = arg("candidate");
const lessonId = `lesson-${String(catalog.length + 1).padStart(4, "0")}`;

cpSync(PATHS.template, dir, { recursive: true });
for (const file of readdirSync(dir)) {
  const path = join(dir, file);
  const text = readFileSync(path, "utf8")
    .replaceAll("__SLUG__", slug)
    .replaceAll("__LESSON_ID__", lessonId)
    .replaceAll("__TODAY__", today())
    .replaceAll("__CANDIDATE__", candidateId ?? "");
  writeFileSync(path, text);
}

catalog.push({ slug, status: "draft", createdOn: today() });
writeCatalog(catalog);
writeRegistry(catalog);

if (candidateId) {
  const file = readCandidates();
  const candidate = file.candidates.find((c) => c.id === candidateId);
  if (!candidate) fail(`candidate ${candidateId} not found in candidates.json`);
  candidate.status = "selected";
  candidate.lessonSlug = slug;
  writeCandidates(file);
}
await writeCoverage();
console.log(`✔ scaffolded draft lesson ${slug} at src/content/lessons/${slug}/ — fill every TODO, then run npm run content:validate -- ${slug}`);
