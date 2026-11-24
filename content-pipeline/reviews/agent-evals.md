# Review: Evals for AI Agents: How to Know Your Agent Really Works

- Slug: `agent-evals` · status: **draft** · created 2026-11-24 · provenance: lesson-generation-skill (candidate `2026-11-24-anthropic-demystifying-evals`)
- Length: VI 2994 words · EN 2317 words · FR 2685 words · ~19 min
- Visuals: `pipeline` (flow), `passk` (chart)
- Automated gates: pass · 1 review flag(s) · 0 warning(s)

## Sources
- [Demystifying evals for AI agents](https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents): Anthropic Engineering, Mikaela Grace, Jeremy Hadfield, Rodrigo Olivares, Jiri De Jonghe, published 2026-01-09, checked 2026-11-24 (primary)

## Claims to check (28)
| | Claim | Source | Evidence |
|---|---|---|---|
| ✅ | Good evals help teams ship agents more confidently. | demystifying-evals | Good evaluations help teams ship AI agents more confidently. |
| ✅ | Without evals, teams get stuck in reactive loops. | demystifying-evals | it’s easy to get stuck in reactive loops |
| ✅ | In multi-turn agent evals, mistakes can propagate and compound. | demystifying-evals | which means mistakes can propagate and compound |
| ✅ | A task is a single test with defined inputs and success criteria. | demystifying-evals | A task (a.k.a problem or test case) is a single test with defined inputs and success criteria. |
| ✅ | A trial is one attempt; a grader scores some aspect of performance. | demystifying-evals | Each attempt at a task is a trial. / A grader is logic that scores some aspect of the agent’s performance. |
| ✅ | The transcript is the full record of a trial; the outcome is the final state of the environment. | demystifying-evals | A transcript (also called a trace or trajectory) is the complete record of a trial / The outcome is the final state in the environment at the end of the trial. |
| ✅ | Claude Code is an example of an agent harness. | demystifying-evals | For example, [Claude Code] is a flexible agent harness |
| ✅ | Opus 4.5 'failed' a τ2-bench flight task by finding a policy loophole. | demystifying-evals | Opus 4.5 solved a 𝜏2-bench problem about booking a flight by discovering a loophole in the policy. |
| ✅ | Trials should start from a clean environment; Claude once used git history from earlier trials. | demystifying-evals | Each trial should be “isolated” by starting from a clean environment. / Claude gaining an unfair advantage on some tasks by examining the git history from previous trials. |
| ✅ | 0% across many trials usually signals a broken task. | demystifying-evals | a 0% pass rate across many trials (i.e. 0% pass@100) is most often a signal of a broken task |
| ✅ | Code-based graders: fast, cheap, objective, reproducible; brittle to valid variations. | demystifying-evals | Fast • Cheap • Objective • Reproducible • Easy to debug / Brittle to valid variations that don’t match expected patterns exactly |
| ✅ | Model-based graders: flexible, capture nuance; non-deterministic, costlier, need human calibration. | demystifying-evals | Flexible • Scalable • Captures nuance / Non-deterministic • More expensive than code • Requires calibration with human graders for accuracy |
| ✅ | Human graders: gold standard; expensive and slow. | demystifying-evals | Gold standard quality • Matches expert user judgment / Expensive • Slow • Often requires access to human experts at scale |
| ✅ | Prefer deterministic graders; LLM graders where necessary. | demystifying-evals | choosing deterministic graders where possible, LLM graders where necessary or for additional flexibility |
| ✅ | Grade what the agent produced, not the path it took. | demystifying-evals | it’s often better to grade what the agent produced, not the path it took. |
| ✅ | Give LLM judges an Unknown option; build in partial credit. | demystifying-evals | return “Unknown” when it doesn’t have enough information / For tasks with multiple components, build in partial credit. |
| ✅ | Graders should resist bypasses and hacks. | demystifying-evals | Make your graders resistant to bypasses or hacks. |
| ✅ | pass@k: likelihood of at least one correct solution in k attempts; it rises with k. | demystifying-evals | measures the likelihood that an agent gets at least one correct solution in k attempts / As k increases, pass@k score rises |
| ✅ | pass^k: probability that all k trials succeed; 75% per trial over 3 trials ≈ 42%. | demystifying-evals | measures the probability that all k trials succeed / (0.75)³ ≈ 42%. |
| 🧮 | With independent trials: pass@k = 1 − (1 − p)^k and pass^k = p^k. | ours | Our derivation from the two definitions, assuming independent trials; the chart values are checked by a unit test. |
| ✅ | Capability evals start at a low pass rate; regression evals check the agent still handles old tasks. | demystifying-evals | They should start at a low pass rate, targeting tasks the agent struggles with / Does the agent still handle all the tasks it used to? |
| ✅ | High-pass capability evals graduate into regression suites; a 100% eval gives no improvement signal. | demystifying-evals | capability evals with high pass rates can “graduate” to become a regression suite / An eval at 100% tracks regressions but provides no signal for improvement. |
| ✅ | On SWE-bench Verified, LLMs went from 40% to over 80% in one year. | demystifying-evals | LLMs have progressed from 40% to >80% on this eval in just one year. |
| ✅ | Opus 4.5 went from 42% to 95% on CORE-Bench after grading bugs were fixed and the scaffold was less constrained. | demystifying-evals | Opus 4.5 initially scored 42% on CORE-Bench / After fixing bugs and using a less constrained scaffold, Opus 4.5’s score jumped to 95%. |
| ✅ | 20–50 simple tasks from real failures is a great start. | demystifying-evals | 20-50 simple tasks drawn from real failures is a great start. |
| ✅ | A good task is one where two domain experts would reach the same verdict. | demystifying-evals | A good task is one where two domain experts would independently reach the same pass/fail verdict. |
| ✅ | Test both when a behavior should occur and when it shouldn't. | demystifying-evals | Test both the cases where a behavior should occur and where it shouldn't |
| ✅ | Like the Swiss Cheese Model, no single evaluation layer catches every issue. | demystifying-evals | Like the Swiss Cheese Model from safety engineering, no single evaluation layer catches every issue. |

## Needs a human decision
- [ ] status is draft: visible in dev/preview only until published

## Errors
- none

## Warnings
- none

## Reviewer checklist
See `content-pipeline/REVIEW.md`. Tick each item, resolve every ⚠️ claim (verify and set `status: "verified"` with evidence, or remove/rewrite the claim), then run `npm run content:publish -- agent-evals`.
