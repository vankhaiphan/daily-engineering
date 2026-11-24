/**
 * Lesson registry. Today lessons are TypeScript modules; a future scheduled
 * generator can produce the same `Lesson` shape as JSON, run it through
 * `validateLesson`, and register it here (or load it from storage).
 */
import { buildingEffectiveAgents } from "./lessons/building-effective-agents";
import type { Lesson } from "./schema";

const LESSONS: readonly Lesson[] = [buildingEffectiveAgents];

export function listLessons(): readonly Lesson[] {
  return LESSONS;
}

export function getLesson(slug: string): Lesson | undefined {
  return LESSONS.find((lesson) => lesson.slug === slug);
}
