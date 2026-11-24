import type { LessonReview } from "@/content/schema";

const S = "demystifying-evals";

/** Every factual claim taught, with verbatim evidence from the source (checked 2026-11-24). */
export const review: LessonReview = {
  reviewedBy: "",
  reviewedOn: "2026-11-24",
  claims: [
    { id: "goal", claim: "Good evals help teams ship agents more confidently.", sourceId: S, evidence: "Good evaluations help teams ship AI agents more confidently.", status: "verified" },
    { id: "reactive-loop", claim: "Without evals, teams get stuck in reactive loops.", sourceId: S, evidence: "it’s easy to get stuck in reactive loops", status: "verified" },
    { id: "compounding", claim: "In multi-turn agent evals, mistakes can propagate and compound.", sourceId: S, evidence: "which means mistakes can propagate and compound", status: "verified" },
    { id: "task", claim: "A task is a single test with defined inputs and success criteria.", sourceId: S, evidence: "A task (a.k.a problem or test case) is a single test with defined inputs and success criteria.", status: "verified" },
    { id: "trial-grader", claim: "A trial is one attempt; a grader scores some aspect of performance.", sourceId: S, evidence: "Each attempt at a task is a trial. / A grader is logic that scores some aspect of the agent’s performance.", status: "verified" },
    { id: "transcript-outcome", claim: "The transcript is the full record of a trial; the outcome is the final state of the environment.", sourceId: S, evidence: "A transcript (also called a trace or trajectory) is the complete record of a trial / The outcome is the final state in the environment at the end of the trial.", status: "verified" },
    { id: "claude-code-harness", claim: "Claude Code is an example of an agent harness.", sourceId: S, evidence: "For example, [Claude Code] is a flexible agent harness", status: "verified" },
    { id: "loophole", claim: "Opus 4.5 'failed' a τ2-bench flight task by finding a policy loophole.", sourceId: S, evidence: "Opus 4.5 solved a 𝜏2-bench problem about booking a flight by discovering a loophole in the policy.", status: "verified" },
    { id: "isolation", claim: "Trials should start from a clean environment; Claude once used git history from earlier trials.", sourceId: S, evidence: "Each trial should be “isolated” by starting from a clean environment. / Claude gaining an unfair advantage on some tasks by examining the git history from previous trials.", status: "verified" },
    { id: "broken-task", claim: "0% across many trials usually signals a broken task.", sourceId: S, evidence: "a 0% pass rate across many trials (i.e. 0% pass@100) is most often a signal of a broken task", status: "verified" },
    { id: "graders-code", claim: "Code-based graders: fast, cheap, objective, reproducible; brittle to valid variations.", sourceId: S, evidence: "Fast • Cheap • Objective • Reproducible • Easy to debug / Brittle to valid variations that don’t match expected patterns exactly", status: "verified" },
    { id: "graders-model", claim: "Model-based graders: flexible, capture nuance; non-deterministic, costlier, need human calibration.", sourceId: S, evidence: "Flexible • Scalable • Captures nuance / Non-deterministic • More expensive than code • Requires calibration with human graders for accuracy", status: "verified" },
    { id: "graders-human", claim: "Human graders: gold standard; expensive and slow.", sourceId: S, evidence: "Gold standard quality • Matches expert user judgment / Expensive • Slow • Often requires access to human experts at scale", status: "verified" },
    { id: "grader-choice", claim: "Prefer deterministic graders; LLM graders where necessary.", sourceId: S, evidence: "choosing deterministic graders where possible, LLM graders where necessary or for additional flexibility", status: "verified" },
    { id: "outcome-not-path", claim: "Grade what the agent produced, not the path it took.", sourceId: S, evidence: "it’s often better to grade what the agent produced, not the path it took.", status: "verified" },
    { id: "unknown-partial", claim: "Give LLM judges an Unknown option; build in partial credit.", sourceId: S, evidence: "return “Unknown” when it doesn’t have enough information / For tasks with multiple components, build in partial credit.", status: "verified" },
    { id: "resist-hacks", claim: "Graders should resist bypasses and hacks.", sourceId: S, evidence: "Make your graders resistant to bypasses or hacks.", status: "verified" },
    { id: "pass-at-k", claim: "pass@k: likelihood of at least one correct solution in k attempts; it rises with k.", sourceId: S, evidence: "measures the likelihood that an agent gets at least one correct solution in k attempts / As k increases, pass@k score rises", status: "verified" },
    { id: "pass-hat-k", claim: "pass^k: probability that all k trials succeed; 75% per trial over 3 trials ≈ 42%.", sourceId: S, evidence: "measures the probability that all k trials succeed / (0.75)³ ≈ 42%.", status: "verified" },
    { id: "formulas", claim: "With independent trials: pass@k = 1 − (1 − p)^k and pass^k = p^k.", evidence: "Our derivation from the two definitions, assuming independent trials; the chart values are checked by a unit test.", status: "derived" },
    { id: "capability", claim: "Capability evals start at a low pass rate; regression evals check the agent still handles old tasks.", sourceId: S, evidence: "They should start at a low pass rate, targeting tasks the agent struggles with / Does the agent still handle all the tasks it used to?", status: "verified" },
    { id: "graduate-saturation", claim: "High-pass capability evals graduate into regression suites; a 100% eval gives no improvement signal.", sourceId: S, evidence: "capability evals with high pass rates can “graduate” to become a regression suite / An eval at 100% tracks regressions but provides no signal for improvement.", status: "verified" },
    { id: "swe-bench", claim: "On SWE-bench Verified, LLMs went from 40% to over 80% in one year.", sourceId: S, evidence: "LLMs have progressed from 40% to >80% on this eval in just one year.", status: "verified" },
    { id: "core-bench", claim: "Opus 4.5 went from 42% to 95% on CORE-Bench after grading bugs were fixed and the scaffold was less constrained.", sourceId: S, evidence: "Opus 4.5 initially scored 42% on CORE-Bench / After fixing bugs and using a less constrained scaffold, Opus 4.5’s score jumped to 95%.", status: "verified" },
    { id: "start-small", claim: "20–50 simple tasks from real failures is a great start.", sourceId: S, evidence: "20-50 simple tasks drawn from real failures is a great start.", status: "verified" },
    { id: "two-experts", claim: "A good task is one where two domain experts would reach the same verdict.", sourceId: S, evidence: "A good task is one where two domain experts would independently reach the same pass/fail verdict.", status: "verified" },
    { id: "balanced", claim: "Test both when a behavior should occur and when it shouldn't.", sourceId: S, evidence: "Test both the cases where a behavior should occur and where it shouldn't", status: "verified" },
    { id: "swiss-cheese", claim: "Like the Swiss Cheese Model, no single evaluation layer catches every issue.", sourceId: S, evidence: "Like the Swiss Cheese Model from safety engineering, no single evaluation layer catches every issue.", status: "verified" },
  ],
};
