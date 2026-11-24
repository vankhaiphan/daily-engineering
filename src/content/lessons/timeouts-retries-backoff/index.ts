import type { Lesson } from "@/content/schema";
import { en } from "./en";
import { fr } from "./fr";
import { review } from "./review";
import { sources } from "./sources";
import { visuals } from "./visuals";
import { vi } from "./vi";

const lesson: Lesson = {
  id: "lesson-0003",
  slug: "timeouts-retries-backoff",
  version: 1,
  createdOn: "2026-11-24",
  status: "published",
  level: "intermediate",
  topics: ["distributed-systems", "backend", "aws", "system-design"],
  keywords: [
    "timeouts",
    "retries",
    "exponential backoff",
    "jitter",
    "retry amplification",
    "token bucket",
    "idempotency",
    "idempotency key",
    "circuit breaker",
    "partial failure",
  ],
  sources,
  interactives: visuals,
  review,
  provenance: { method: "lesson-generation-skill", candidateId: "2026-11-24-aws-timeouts-retries-jitter" },
  content: { en, vi, fr },
};

export default lesson;
