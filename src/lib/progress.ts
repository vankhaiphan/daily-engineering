/**
 * Learner state persisted on-device (MVP: localStorage, no account).
 * Pure reducers so the logic is unit-testable and storage-agnostic; a future
 * sync backend can reuse them.
 */
export interface LessonProgress {
  /** Sections the reader has scrolled through. */
  readSections: string[];
  /** Section most recently in view: where "Resume" jumps to. */
  lastSectionId?: string;
  /** questionId → chosen optionId. */
  quizAnswers: Record<string, string>;
  updatedAt: number;
}

export interface Bookmark {
  lessonSlug: string;
  sectionId: string;
  createdAt: number;
}

export interface LearnerState {
  version: 1;
  lessons: Record<string, LessonProgress>;
  bookmarks: Bookmark[];
}

export const EMPTY_STATE: LearnerState = Object.freeze({
  version: 1,
  lessons: Object.freeze({}) as Record<string, LessonProgress>,
  bookmarks: Object.freeze([]) as unknown as Bookmark[],
}) as LearnerState;

const emptyProgress = (now: number): LessonProgress => ({ readSections: [], quizAnswers: {}, updatedAt: now });

function updateLesson(
  state: LearnerState,
  slug: string,
  now: number,
  fn: (p: LessonProgress) => LessonProgress,
): LearnerState {
  const current = state.lessons[slug] ?? emptyProgress(now);
  const next = fn(current);
  if (next === current) return state;
  return { ...state, lessons: { ...state.lessons, [slug]: { ...next, updatedAt: now } } };
}

export function markSectionRead(state: LearnerState, slug: string, sectionId: string, now = Date.now()) {
  return updateLesson(state, slug, now, (p) =>
    p.readSections.includes(sectionId) ? p : { ...p, readSections: [...p.readSections, sectionId] },
  );
}

export function setLastSection(state: LearnerState, slug: string, sectionId: string, now = Date.now()) {
  return updateLesson(state, slug, now, (p) => (p.lastSectionId === sectionId ? p : { ...p, lastSectionId: sectionId }));
}

export function recordQuizAnswer(
  state: LearnerState,
  slug: string,
  questionId: string,
  optionId: string,
  now = Date.now(),
) {
  return updateLesson(state, slug, now, (p) =>
    p.quizAnswers[questionId] === optionId ? p : { ...p, quizAnswers: { ...p.quizAnswers, [questionId]: optionId } },
  );
}

export function resetQuiz(state: LearnerState, slug: string, now = Date.now()) {
  return updateLesson(state, slug, now, (p) => ({ ...p, quizAnswers: {} }));
}

export function isBookmarked(state: LearnerState, slug: string, sectionId: string): boolean {
  return state.bookmarks.some((b) => b.lessonSlug === slug && b.sectionId === sectionId);
}

export function toggleBookmark(state: LearnerState, slug: string, sectionId: string, now = Date.now()): LearnerState {
  const bookmarks = isBookmarked(state, slug, sectionId)
    ? state.bookmarks.filter((b) => !(b.lessonSlug === slug && b.sectionId === sectionId))
    : [{ lessonSlug: slug, sectionId, createdAt: now }, ...state.bookmarks];
  return { ...state, bookmarks };
}

/** Fraction (0..1) of the given section ids that have been read. */
export function completion(progress: LessonProgress | undefined, sectionIds: readonly string[]): number {
  if (!progress || sectionIds.length === 0) return 0;
  const read = sectionIds.filter((id) => progress.readSections.includes(id)).length;
  return read / sectionIds.length;
}

/** Defensive parse: never let corrupted storage crash the app. */
export function parseLearnerState(raw: string | null): LearnerState {
  if (!raw) return EMPTY_STATE;
  try {
    const data = JSON.parse(raw) as Partial<LearnerState>;
    if (data?.version !== 1 || typeof data.lessons !== "object" || !Array.isArray(data.bookmarks)) return EMPTY_STATE;
    const lessons: Record<string, LessonProgress> = {};
    for (const [slug, p] of Object.entries(data.lessons ?? {})) {
      if (!p || !Array.isArray(p.readSections)) continue;
      lessons[slug] = {
        readSections: p.readSections.filter((s): s is string => typeof s === "string"),
        lastSectionId: typeof p.lastSectionId === "string" ? p.lastSectionId : undefined,
        quizAnswers: p.quizAnswers && typeof p.quizAnswers === "object" ? { ...p.quizAnswers } : {},
        updatedAt: typeof p.updatedAt === "number" ? p.updatedAt : 0,
      };
    }
    const bookmarks = data.bookmarks.filter(
      (b): b is Bookmark => !!b && typeof b.lessonSlug === "string" && typeof b.sectionId === "string",
    );
    return { version: 1, lessons, bookmarks };
  } catch {
    return EMPTY_STATE;
  }
}
