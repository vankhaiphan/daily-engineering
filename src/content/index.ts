/**
 * Lesson registry. Lessons are TypeScript modules registered through
 * `catalog.json` → `lessons/registry.ts` (generated). Pages only ever see
 * visible lessons (published, or drafts outside production).
 *
 * Publish status comes ONLY from catalog.json (a plain data file the CI check
 * can verify exactly). A lesson module's own `status` field is checked for
 * consistency by the validator but never decides visibility.
 */
import { CATALOG, isVisible } from "./catalog";
import { REGISTERED_LESSONS } from "./lessons/registry";
import type { Lesson } from "./schema";

// The catalog decides visibility by slug, so every registered module must be the
// lesson its catalog entry names. Fail the build instead of serving a mismatch.
if (
  REGISTERED_LESSONS.length !== CATALOG.length ||
  REGISTERED_LESSONS.some((lesson, i) => lesson.slug !== CATALOG[i].slug)
) {
  throw new Error("Lesson registry does not match src/content/catalog.json (run npm run content:registry and check each lesson's slug)");
}

/** Every registered lesson, drafts included (validation and scripts). */
export function listAllLessons(): readonly Lesson[] {
  return REGISTERED_LESSONS;
}

/** Visible lessons, newest first. */
export function listLessons(): readonly Lesson[] {
  return REGISTERED_LESSONS.filter((lesson) => {
    const entry = CATALOG.find((e) => e.slug === lesson.slug);
    return entry !== undefined && isVisible(entry.status);
  }).toSorted(
    (a, b) => b.createdOn.localeCompare(a.createdOn),
  );
}

export function getLesson(slug: string): Lesson | undefined {
  return listLessons().find((lesson) => lesson.slug === slug);
}
