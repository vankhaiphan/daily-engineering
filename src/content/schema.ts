/**
 * Daily Engineering — lesson content model.
 *
 * Design notes
 * - Content is plain, serializable data (no JSX, no functions) so a future
 *   scheduled generator can emit the same shape as JSON and run it through
 *   `validateLesson` before publishing.
 * - Long-form prose is authored per locale (`LessonBody`), because whole
 *   paragraphs are easier to write and review one language at a time.
 * - Structure-heavy data shared by all locales (sources, interactive
 *   diagrams) lives once on `Lesson` and uses `Localized<string>` for its
 *   short labels. `validateLesson` enforces that every locale body has the
 *   same section/block skeleton.
 * - Inline text supports a tiny markup subset: **bold** and `code`.
 */
import type { Locale } from "@/lib/i18n/config";

export type Localized<T = string> = Record<Locale, T>;

/** ISO calendar date, e.g. "2024-12-19". */
export type IsoDate = string;

export interface SourceRef {
  id: string;
  title: string;
  publisher: string;
  /** Authors exactly as credited on the source page. */
  authors: string[];
  url: string;
  publishedOn: IsoDate;
  accessedOn: IsoDate;
  role: "primary" | "supporting";
  note?: Localized;
}

export type SectionKind =
  | "intro"
  | "concept"
  | "deep-dive"
  | "explore"
  | "example"
  | "tradeoffs"
  | "quiz"
  | "interview"
  | "sources";

/** Sections shown in Explore mode (interactive + practice). */
export const EXPLORE_SECTION_KINDS: readonly SectionKind[] = ["explore", "quiz", "interview"];

export interface QuizOption {
  id: string;
  text: string;
  /** Shown after the learner picks this option: why it is right or wrong. */
  feedback: string;
}

export interface QuizQuestion {
  id: string;
  prompt: string;
  options: QuizOption[];
  correctOptionId: string;
}

export interface InterviewFollowUp {
  question: string;
  answer: string;
}

export type Block =
  | { type: "p"; text: string }
  | { type: "h3"; text: string }
  | { type: "list"; ordered?: boolean; items: string[] }
  | {
      type: "callout";
      tone: "insight" | "warning" | "analogy" | "example";
      title: string;
      text: string;
    }
  /** `text` is verbatim from the source (never translated); `translation` is ours. */
  | { type: "quote"; text: string; translation?: string; sourceId: string }
  | { type: "code"; language: "ts" | "jsonc" | "text"; code: string; caption?: string }
  | { type: "table"; caption?: string; columns: string[]; rows: string[][] }
  | { type: "interactive"; widget: "flow-explorer"; ref: string }
  | { type: "quiz"; questions: QuizQuestion[] }
  | {
      type: "interview";
      pitchTitle: string;
      pitch: string;
      keyPointsTitle: string;
      keyPoints: string[];
      followUpsTitle: string;
      followUps: InterviewFollowUp[];
    }
  | { type: "sources" };

export type BlockType = Block["type"];

export interface Section {
  /** Stable across locales; used for anchors, progress and bookmarks. */
  id: string;
  kind: SectionKind;
  title: string;
  blocks: Block[];
}

/** Everything in a lesson that is written in one language. */
export interface LessonBody {
  title: string;
  subtitle: string;
  /** One-line teaser for the home screen. */
  hook: string;
  sections: Section[];
}

/* ------------------------------------------------------------------ */
/* Interactive flow explorer (data-driven, reusable across lessons)    */
/* ------------------------------------------------------------------ */

export type FlowNodeKind = "io" | "llm" | "code" | "tool" | "human" | "stop";

export interface FlowNode {
  id: string;
  kind: FlowNodeKind;
  label: Localized;
  /** Centre position inside the explorer's viewBox. */
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface FlowEdge {
  id: string;
  from: string;
  to: string;
  /** Perpendicular curve offset in viewBox units (0 = straight). */
  bend?: number;
}

export interface FlowStep {
  /** Nodes highlighted during this step. */
  nodes: string[];
  /** Edges animated during this step. */
  edges: string[];
  /** LLM calls made in this step (0 for plain code / tool steps). */
  calls: number;
  caption: Localized;
  outcome?: "success" | "stopped" | "rejected";
}

export interface FlowVariant {
  id: string;
  label: Localized;
  /** Per-variant label overrides, e.g. worker names that differ by scenario. */
  nodeLabels?: Record<string, Localized>;
  /** Nodes that do not take part in this variant (drawn faded). */
  hiddenNodes?: string[];
  steps: FlowStep[];
}

export interface FlowScenario {
  id: string;
  label: Localized;
  /** Who decides the control flow, in one line. */
  controlFlow: Localized;
  nodes: FlowNode[];
  edges: FlowEdge[];
  variants: FlowVariant[];
}

export interface FlowExplorerSpec {
  id: string;
  viewBox: { width: number; height: number };
  scenarios: FlowScenario[];
}

/* ------------------------------------------------------------------ */

export type Topic =
  | "ai-agents"
  | "multi-agent-systems"
  | "claude-code"
  | "ai-sdlc"
  | "system-design"
  | "distributed-systems"
  | "aws"
  | "backend"
  | "algorithms";

export interface Lesson {
  id: string;
  slug: string;
  /** Bump when content changes meaningfully. */
  version: number;
  /** When this lesson was written/published in the app. */
  createdOn: IsoDate;
  level: "foundation" | "intermediate" | "advanced";
  topics: Topic[];
  sources: SourceRef[];
  interactives: Record<string, FlowExplorerSpec>;
  content: Localized<LessonBody>;
}
