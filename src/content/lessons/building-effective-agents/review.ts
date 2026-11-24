import type { LessonReview } from "@/content/schema";

const PRIMARY = "building-effective-agents";
const MULTI = "multi-agent-research-system";

/** Claims taught in this lesson, each checked against its source (2026-11-24). */
export const review: LessonReview = {
  reviewedBy: "Initial author (Phase 1), re-checked during Phase 3",
  reviewedOn: "2026-11-24",
  claims: [
    {
      id: "teams",
      claim: "The article draws on work with dozens of teams building LLM agents across industries.",
      sourceId: PRIMARY,
      evidence: "Over the past year, we've worked with dozens of teams building large language model (LLM) agents across industries.",
      status: "verified",
    },
    {
      id: "simple-patterns",
      claim: "The most successful implementations used simple, composable patterns rather than complex frameworks.",
      sourceId: PRIMARY,
      evidence: "the most successful implementations weren't using complex frameworks or specialized libraries",
      status: "verified",
    },
    {
      id: "workflow-definition",
      claim: "Workflows orchestrate LLMs and tools through predefined code paths.",
      sourceId: PRIMARY,
      evidence: "Workflows are systems where LLMs and tools are orchestrated through predefined code paths.",
      status: "verified",
    },
    {
      id: "agent-loop",
      claim: "Agents are typically LLMs using tools based on environmental feedback in a loop.",
      sourceId: PRIMARY,
      evidence: "They are typically just LLMs using tools based on environmental feedback in a loop.",
      status: "verified",
    },
    {
      id: "stopping-conditions",
      claim: "Agents commonly include stopping conditions such as a maximum number of iterations.",
      sourceId: PRIMARY,
      evidence: "it's also common to include stopping conditions (such as a maximum number of iterations) to maintain control.",
      status: "verified",
    },
    {
      id: "compounding",
      claim: "Agent autonomy means higher costs and potential for compounding errors.",
      sourceId: PRIMARY,
      evidence: "The autonomous nature of agents means higher costs, and the potential for compounding errors.",
      status: "verified",
    },
    {
      id: "human-review",
      claim: "Human review remains crucial for coding-agent solutions.",
      sourceId: PRIMARY,
      evidence: "human review remains crucial for ensuring solutions align with broader system requirements.",
      status: "verified",
    },
    {
      id: "tools-over-prompt",
      claim: "For SWE-bench, the team spent more time optimizing tools than the overall prompt.",
      sourceId: PRIMARY,
      evidence: "we actually spent more time optimizing our tools than the overall prompt.",
      status: "verified",
    },
    {
      id: "absolute-paths",
      claim: "Requiring absolute file paths fixed the model's relative-path mistakes.",
      sourceId: PRIMARY,
      evidence: "we changed the tool to always require absolute filepaths—and we found that the model used this method flawlessly.",
      status: "verified",
    },
    {
      id: "aci-guidelines",
      claim: "Tool formats: give the model tokens to think; keep formats close to natural internet text.",
      sourceId: PRIMARY,
      evidence:
        'Give the model enough tokens to "think" before it writes itself into a corner. / Keep the format close to what the model has seen naturally occurring in text on the internet.',
      status: "verified",
    },
    {
      id: "token-multiples",
      claim: "Agents use about 4× the tokens of chat; multi-agent systems about 15×.",
      sourceId: MULTI,
      evidence: "agents typically use about 4× more tokens than chat interactions / multi-agent systems use about 15× more tokens than chats",
      status: "verified",
    },
    {
      id: "multi-agent-gain",
      claim: "The multi-agent setup outperformed single-agent Claude Opus 4 by 90.2% on an internal research eval.",
      sourceId: MULTI,
      evidence: "outperformed single-agent Claude Opus 4 by 90.2% on our internal research eval.",
      status: "verified",
    },
    {
      id: "compounding-math",
      claim: "20 independent steps at 95% each succeed together with probability ≈ 36%.",
      evidence: "Our illustration: 0.95^20 = 0.358. Checked by a unit test.",
      status: "derived",
    },
  ],
};
