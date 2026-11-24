import type { Lesson } from "@/content/schema";
import { en } from "./en";
import { fr } from "./fr";
import { review } from "./review";
import { sources } from "./sources";
import { visuals } from "./visuals";
import { vi } from "./vi";

const lesson: Lesson = {
  id: "__LESSON_ID__",
  slug: "__SLUG__",
  version: 1,
  createdOn: "__TODAY__",
  status: "draft",
  level: "intermediate",
  topics: ["system-design"], // TODO: pick from Topic in src/content/schema.ts
  keywords: ["TODO"], // TODO: ≥ 4 lower-case concepts, used for duplicate detection
  sources,
  interactives: visuals,
  review,
  provenance: { method: "lesson-generation-skill", candidateId: "__CANDIDATE__" },
  content: { en, vi, fr },
};

export default lesson;
