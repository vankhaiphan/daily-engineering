import type { Lesson } from "@/content/schema";
import { en } from "./en";
import { agenticPatternsExplorer } from "./explorer";
import { fr } from "./fr";
import { review } from "./review";
import { sources } from "./sources";
import { vi } from "./vi";

export const buildingEffectiveAgents: Lesson = {
  id: "lesson-0001",
  slug: "building-effective-agents",
  version: 1,
  createdOn: "2026-11-24",
  status: "published",
  level: "intermediate",
  topics: ["ai-agents", "multi-agent-systems", "claude-code", "system-design"],
  keywords: [
    "agentic systems",
    "workflows vs agents",
    "prompt chaining",
    "routing",
    "parallelization",
    "orchestrator-workers",
    "evaluator-optimizer",
    "agent loop",
    "agent-computer interface",
    "tool design",
  ],
  sources,
  interactives: { patterns: agenticPatternsExplorer },
  review,
  provenance: { method: "manual" },
  content: { en, vi, fr },
};

export default buildingEffectiveAgents;
