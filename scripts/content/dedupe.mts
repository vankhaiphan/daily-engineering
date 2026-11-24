/**
 * Is this topic already covered?
 *   npm run content:dedupe -- --url <article-url> [--title "<title>"] [--keywords "a, b, c"]
 * Checks existing lessons (any status) and previously evaluated candidates.
 * Exit code 1 on a duplicate, 0 otherwise (near-duplicates are printed).
 */
import { findDuplicates, normalizeUrl } from "@/content/quality";
import { arg, fail, loadLessons, readCandidates } from "./lib.mts";

const url = arg("url");
const title = arg("title");
const keywords = arg("keywords")?.split(",").map((k) => k.trim()).filter(Boolean);
if (!url && !title && !keywords) fail("pass --url, --title and/or --keywords");

const matches = findDuplicates({ url, title, keywords }, await loadLessons());
const key = url ? normalizeUrl(url) : undefined;
const prior = key ? readCandidates().candidates.filter((c) => normalizeUrl(c.url) === key) : [];

for (const c of prior) console.log(`• already evaluated as candidate ${c.id}: ${c.status} (${c.decision})`);
for (const m of matches) console.log(`${m.severity === "duplicate" ? "✖" : "•"} ${m.severity} of lesson ${m.slug}: ${m.reason}`);
if (!prior.length && !matches.length) console.log("✔ no duplicates or near-duplicates found");
process.exit(matches.some((m) => m.severity === "duplicate") || prior.some((c) => c.status !== "shortlisted") ? 1 : 0);
