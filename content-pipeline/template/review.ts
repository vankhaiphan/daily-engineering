import type { LessonReview } from "@/content/schema";

/**
 * Every factual claim the lesson teaches, with a short verbatim quote as
 * evidence. Anything you could not confirm: status "needs-review" + note.
 */
export const review: LessonReview = {
  reviewedBy: "",
  reviewedOn: "__TODAY__",
  claims: [],
};
