import type { Lesson } from "@/content/schema";
import { en } from "./en";
import { agenticPatternsExplorer } from "./explorer";
import { fr } from "./fr";
import { sources } from "./sources";
import { vi } from "./vi";

export const buildingEffectiveAgents: Lesson = {
  id: "lesson-0001",
  slug: "building-effective-agents",
  version: 1,
  createdOn: "2026-11-24",
  level: "intermediate",
  topics: ["ai-agents", "multi-agent-systems", "claude-code", "system-design"],
  sources,
  interactives: { patterns: agenticPatternsExplorer },
  content: { en, vi, fr },
};
