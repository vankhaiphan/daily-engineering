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
 * - Inline text supports a tiny markup subset: **bold**, *italic* and `code`.
 * - Lessons carry a `review` record: every non-trivial claim is listed with
 *   evidence, and anything not verified is flagged for a human before publish.
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
  /** null when the source page does not state a date (never guess one). */
  publishedOn: IsoDate | null;
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
  | { type: "code"; language: "ts" | "jsonc" | "yaml" | "text"; code: string; caption?: string }
  | { type: "table"; caption?: string; columns: string[]; rows: string[][] }
  | { type: "interactive"; widget: VisualKind; ref: string }
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
/* Visualizations (data-driven, reusable across lessons)               */
/*   flow     → architecture / data flow / state machines              */
/*   sequence → request-response timelines between participants       */
/*   chart    → interactive numeric comparisons (scenarios × steps)    */
/* ------------------------------------------------------------------ */

export type VisualKind = "flow" | "sequence" | "chart";

/** success · stopped safely (a limit fired) · rejected early (a gate stopped bad input) · failed. */
export type StepOutcome = "success" | "stopped" | "rejected" | "failed";

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
  outcome?: StepOutcome;
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
  kind: "flow";
  id: string;
  /** Label of the first chip row (default: "Pattern"). */
  scenarioLabel?: Localized;
  /** Which counters to show (default: LLM calls + sequential rounds). */
  metrics?: "calls+rounds" | "calls" | "none";
  viewBox: { width: number; height: number };
  scenarios: FlowScenario[];
}

export type MessageStyle = "request" | "response" | "error" | "timeout" | "note";

export interface SequenceStep {
  from: string;
  /** Same as `from` for a note/wait on one lifeline. */
  to: string;
  label: Localized;
  style: MessageStyle;
  caption: Localized;
  outcome?: StepOutcome;
}

export interface SequenceScenario {
  id: string;
  label: Localized;
  summary: Localized;
  steps: SequenceStep[];
}

export interface SequenceSpec {
  kind: "sequence";
  id: string;
  participants: { id: string; label: Localized; kind: FlowNodeKind }[];
  scenarios: SequenceScenario[];
}

export type BarTone = "accent" | "muted" | "ok" | "bad";

export interface ChartFrame {
  /** Short step label, e.g. "k = 3" or "Round 2". */
  label: Localized;
  caption: Localized;
  bars: { label: Localized; value: number; tone?: BarTone }[];
}

export interface ChartScenario {
  id: string;
  label: Localized;
  frames: ChartFrame[];
}

export interface ChartSpec {
  kind: "chart";
  id: string;
  /** What the bars measure, e.g. "Probability" or "Requests". */
  valueLabel: Localized;
  valueFormat: "percent" | "integer" | "multiplier";
  /** Fixed scale across frames so changes are visible. */
  yMax: number;
  /** Show every bar label, or only first/middle/last (histograms). */
  xLabels: "all" | "sparse";
  /** Where the numbers come from (formula or simulation), shown to readers. */
  method: Localized;
  scenarios: ChartScenario[];
}

export type VisualSpec = FlowExplorerSpec | SequenceSpec | ChartSpec;

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
  | "algorithms"
  | "mcp"
  | "agent-evals"
  | "reliability"
  | "interview-prep";

export type ClaimStatus =
  /** Checked against the cited source; `evidence` holds a short quote. */
  | "verified"
  /** Our own math/illustration; `evidence` explains how it was derived/tested. */
  | "derived"
  /** Could not be confirmed: blocks publishing until a human resolves it. */
  | "needs-review";

export interface ClaimCheck {
  id: string;
  /** The claim as taught (English). */
  claim: string;
  sourceId?: string;
  /** Short verbatim quote (≤ 300 chars) or derivation note. Never a long passage. */
  evidence: string;
  status: ClaimStatus;
  note?: string;
}

export interface LessonReview {
  claims: ClaimCheck[];
  reviewedBy?: string;
  reviewedOn?: IsoDate;
}

export type LessonStatus = "draft" | "published";

export interface Lesson {
  id: string;
  slug: string;
  /** Bump when content changes meaningfully. */
  version: number;
  /** When this lesson was written/published in the app. */
  createdOn: IsoDate;
  /** Drafts show in development and preview deployments only. */
  status: LessonStatus;
  level: "foundation" | "intermediate" | "advanced";
  topics: Topic[];
  /** Lower-case concepts used for duplicate / near-duplicate detection. */
  keywords: string[];
  sources: SourceRef[];
  interactives: Record<string, VisualSpec>;
  review: LessonReview;
  /** How the lesson was produced (manual, or the lesson-generation skill). */
  provenance: { method: "manual" | "lesson-generation-skill"; candidateId?: string };
  content: Localized<LessonBody>;
}
