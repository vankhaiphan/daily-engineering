/**
 * Server-side safety check for scheduled-run PRs (content/<date>-<slot>).
 * Runs in GitHub Actions on `pull_request_target` from the BASE branch's copy
 * of this file, so a PR can't weaken it. It only reads the PR as git data
 * (no install, no PR code executed). Plain Node, no dependencies.
 *
 * A scheduled-run PR fails if it:
 *  - publishes a lesson (catalog entry or lesson index set to "published"),
 *  - removes or unpublishes an existing lesson,
 *  - changes anything except its own NEW lesson folder and the pipeline
 *    records (catalog, registry, coverage, candidates, sources, runs, reviews).
 * Other PRs (yours, e.g. publish/<slug>) pass untouched.
 */
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";

export const SCHEDULED_BRANCH = /^content\/\d{4}-\d{2}-\d{2}-(morning|evening)$/;
const ALLOWED_FILES = [
  "src/content/catalog.json",
  "src/content/lessons/registry.ts",
  "content-pipeline/candidates.json",
  "content-pipeline/coverage.json",
  "content-pipeline/sources.json",
];
const ALLOWED_DIRS = ["content-pipeline/runs/", "content-pipeline/reviews/"];

/**
 * @param {{ branch: string, changed: string[], baseCatalog: {slug:string,status:string}[],
 *   headCatalog: {slug:string,status:string}[], baseLessonDirs: string[], readHead: (path: string) => string | undefined }} input
 * @returns {string[]} violations (empty = pass)
 */
export function check({ branch, changed, baseCatalog, headCatalog, baseLessonDirs, readHead }) {
  if (!SCHEDULED_BRANCH.test(branch)) return [];
  const violations = [];
  for (const h of headCatalog) {
    const b = baseCatalog.find((x) => x.slug === h.slug);
    if (h.status === "published" && b?.status !== "published") violations.push(`publishes ${h.slug}`);
  }
  for (const b of baseCatalog) {
    const h = headCatalog.find((x) => x.slug === b.slug);
    if (!h || (b.status === "published" && h.status !== "published")) violations.push(`removes or unpublishes ${b.slug}`);
  }
  for (const path of changed) {
    const dir = path.startsWith("src/content/lessons/") ? path.split("/")[3] : undefined;
    const ownNewLesson = dir && path.split("/").length > 4 && !baseLessonDirs.includes(dir);
    if (!ALLOWED_FILES.includes(path) && !ALLOWED_DIRS.some((d) => path.startsWith(d)) && !ownNewLesson) {
      violations.push(`changes ${path} (scheduled runs may only add a new lesson and pipeline records)`);
    }
    if (ownNewLesson && path.endsWith("/index.ts") && /status:\s*"published"/.test(readHead(path) ?? "")) {
      violations.push(`${path} declares status "published"`);
    }
  }
  return violations;
}

function git(...args) {
  return execFileSync("git", args, { encoding: "utf8" });
}

function main() {
  const { HEAD_BRANCH: branch = "", BASE_SHA: base, HEAD_REF: head } = process.env;
  if (!base || !head) throw new Error("BASE_SHA and HEAD_REF are required");
  if (!SCHEDULED_BRANCH.test(branch)) {
    console.log(`not a scheduled-run branch (${branch}): nothing to check`);
    return;
  }
  const show = (ref, path) => {
    try {
      return git("show", `${ref}:${path}`);
    } catch {
      return undefined;
    }
  };
  const violations = check({
    branch,
    changed: git("diff", "--name-only", `${base}...${head}`).split("\n").filter(Boolean),
    baseCatalog: JSON.parse(show(base, "src/content/catalog.json") ?? "[]"),
    headCatalog: JSON.parse(show(head, "src/content/catalog.json") ?? "[]"),
    baseLessonDirs: git("ls-tree", "--name-only", `${base}`, "src/content/lessons/")
      .split("\n")
      .filter(Boolean)
      .map((p) => p.split("/").pop()),
    readHead: (path) => show(head, path),
  });
  for (const v of violations) console.log(`::error::${v}`);
  if (violations.length) {
    console.log(`✖ ${violations.length} violation(s): scheduled runs only add draft lessons`);
    process.exit(1);
  }
  console.log("✔ scheduled-run PR only adds a draft lesson and pipeline records");
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) main();
