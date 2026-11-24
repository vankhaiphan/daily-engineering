import type { Lesson } from "@/content/schema";
import { en } from "./en";
import { fr } from "./fr";
import { review } from "./review";
import { sources } from "./sources";
import { visuals } from "./visuals";
import { vi } from "./vi";

const lesson: Lesson = {
  id: "lesson-0002",
  slug: "agent-evals",
  version: 1,
  createdOn: "2026-11-24",
  status: "draft",
  level: "intermediate",
  topics: ["ai-agents", "ai-sdlc", "claude-code"],
  keywords: [
    "agent evaluation",
    "evals",
    "graders",
    "llm judge",
    "pass@k",
    "pass^k",
    "capability evals",
    "regression evals",
    "transcripts",
    "non-determinism",
  ],
  sources,
  interactives: visuals,
  review,
  provenance: { method: "lesson-generation-skill", candidateId: "2026-11-24-anthropic-demystifying-evals" },
  content: { en, vi, fr },
};

export default lesson;
