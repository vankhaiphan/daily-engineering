/**
 * Lesson registry. Lessons are TypeScript modules registered through
 * `catalog.json` → `lessons/registry.ts` (generated). Pages only ever see
 * visible lessons (published, or drafts outside production).
 */
import { isVisible } from "./catalog";
import { REGISTERED_LESSONS } from "./lessons/registry";
import type { Lesson } from "./schema";

/** Every registered lesson, drafts included (validation and scripts). */
export function listAllLessons(): readonly Lesson[] {
  return REGISTERED_LESSONS;
}

/** Visible lessons, newest first. */
export function listLessons(): readonly Lesson[] {
  return REGISTERED_LESSONS.filter((lesson) => isVisible(lesson.status)).toSorted(
    (a, b) => b.createdOn.localeCompare(a.createdOn),
  );
}

export function getLesson(slug: string): Lesson | undefined {
  return listLessons().find((lesson) => lesson.slug === slug);
}
