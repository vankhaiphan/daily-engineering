/** File-system helpers for the content scripts (run with `tsx`). */
import { readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import type { CatalogEntry } from "@/content/catalog";
import { buildCoverage, renderRegistry, type CandidateFile } from "@/content/pipeline";
import type { Lesson } from "@/content/schema";

export const ROOT = resolve(import.meta.dirname, "../..");
export const PATHS = {
  catalog: join(ROOT, "src/content/catalog.json"),
  registry: join(ROOT, "src/content/lessons/registry.ts"),
  lessons: join(ROOT, "src/content/lessons"),
  candidates: join(ROOT, "content-pipeline/candidates.json"),
  coverage: join(ROOT, "content-pipeline/coverage.json"),
  reviews: join(ROOT, "content-pipeline/reviews"),
  template: join(ROOT, "content-pipeline/template"),
};

export const readJson = <T,>(path: string): T => JSON.parse(readFileSync(path, "utf8")) as T;
export const writeJson = (path: string, data: unknown) => writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`);

export const readCatalog = () => readJson<CatalogEntry[]>(PATHS.catalog);
export const writeCatalog = (catalog: CatalogEntry[]) => writeJson(PATHS.catalog, catalog);
export const readCandidates = () => readJson<CandidateFile>(PATHS.candidates);
export const writeCandidates = (file: CandidateFile) => writeJson(PATHS.candidates, file);

export function writeRegistry(catalog: CatalogEntry[]) {
  writeFileSync(PATHS.registry, renderRegistry(catalog));
}

/** Load lessons fresh from source (drafts included). */
export async function loadLessons(): Promise<readonly Lesson[]> {
  const { listAllLessons } = await import("@/content");
  return listAllLessons();
}

/**
 * Pass `lessons` when this process already imported the lesson modules and
 * then edited them on disk: ES module caching would otherwise return stale data.
 */
export async function writeCoverage(lessons?: readonly Lesson[]) {
  writeJson(PATHS.coverage, buildCoverage(lessons ?? (await loadLessons())));
}

export function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : undefined;
}

export const flag = (name: string) => process.argv.includes(`--${name}`);
const VALUE_FLAGS = new Set(["--url", "--title", "--keywords", "--reason", "--candidate", "--reviewer", "--date", "--slot", "--now", "--slug", "--blocker"]);
/** Arguments that are neither flags nor the value of a value-taking flag. */
export const positional = () =>
  process.argv.slice(2).filter((a, i, all) => !a.startsWith("--") && !VALUE_FLAGS.has(all[i - 1] ?? ""));

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function fail(message: string): never {
  console.error(`✖ ${message}`);
  process.exit(1);
}
