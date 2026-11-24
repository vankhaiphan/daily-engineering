import type { LessonBody } from "@/content/schema";
import { codeFor } from "./code";

const SRC = "demystifying-evals";
const code = codeFor("en");

export const en: LessonBody = {
  title: "Evals for AI Agents: How to Know Your Agent Really Works",
  subtitle:
    "Tasks, trials, graders, and two numbers that tell different stories: pass@k and pass^k. How teams measure agents before their users do.",
  hook: "Your agent passed the demo. Will it pass the next hundred runs? Learn how evals turn impressions into numbers.",
  sections: [
    {
      id: "intro",
      kind: "intro",
      title: "Passing the demo is not enough",
      blocks: [
        {
          type: "p",
          text: "You ship an agent that handles customer refunds. It nails every demo. A week later the tickets start: sometimes it refunds twice, sometimes it loops until the conversation times out. You fix one bug, and a different one appears somewhere else. Every change is a guess, because nothing tells you whether the agent got better or worse overall.",
        },
        {
          type: "p",
          text: "Anthropic's engineering team calls this getting stuck in reactive loops, and their January 2026 article “Demystifying evals for AI agents” is about the way out. Its first sentence states the goal:",
        },
        { type: "quote", text: "Good evaluations help teams ship AI agents more confidently.", sourceId: SRC },
        {
          type: "p",
          text: "An **eval** gives an AI system an input and grades its output. For a chatbot that is one question and one answer. For an agent it is harder: many steps, tools, a changing environment, and different behavior on every run. This lesson walks through how teams evaluate agents in practice, and why one score is never enough.",
        },
        {
          type: "callout",
          tone: "insight",
          title: "By the end you will be able to",
          text: "Define task, trial, grader, transcript and outcome; pick code, model or human graders for a given check; explain pass@k vs pass^k with real numbers; and outline a first eval suite for an agent you are building.",
        },
      ],
    },
    {
      id: "intuition",
      kind: "concept",
      title: "Intuition: a driving test, not a written quiz",
      blocks: [
        {
          type: "p",
          text: "A written quiz checks one answer at a time. A driving test watches you drive: dozens of decisions in a row, in a real environment, where an early mistake changes everything that follows. Evaluating a single model response is the quiz. Evaluating an agent is the driving test: across many turns, mistakes can propagate and compound.",
        },
        {
          type: "p",
          text: "Agents can also be creative. The article describes Claude Opus 4.5 “failing” a τ2-bench flight-booking task because it found a loophole in the airline policy, one that actually gave the user a better outcome. A grader that only accepted the expected sequence of steps would have marked a good result as a failure.",
        },
        { type: "p", text: "The vocabulary from the article, which we will use throughout:" },
        {
          type: "list",
          items: [
            "**Task**: one test with defined inputs and success criteria.",
            "**Trial**: one attempt at a task. Agents are non-deterministic, so you run several trials per task.",
            "**Grader**: logic that scores some aspect of the agent's performance. A task can have several graders.",
            "**Transcript** (also called a trace or trajectory): the complete record of a trial: messages, tool calls, results.",
            "**Outcome**: the final state of the environment at the end of the trial, for example whether the refund really exists in the database.",
            "**Harnesses**: the *evaluation harness* runs tasks and records results; the *agent harness* (or scaffold) is what lets a model act as an agent. The article names Claude Code as an example of an agent harness.",
          ],
        },
        {
          type: "quote",
          text: "A task (a.k.a problem or test case) is a single test with defined inputs and success criteria.",
          sourceId: SRC,
        },
        {
          type: "callout",
          tone: "analogy",
          title: "One distinction to remember",
          text: "The transcript is what the agent says it did. The outcome is what is actually true afterwards. When they disagree, trust the outcome.",
        },
      ],
    },
    {
      id: "anatomy",
      kind: "deep-dive",
      title: "Anatomy of an agent eval",
      blocks: [
        {
          type: "p",
          text: "An eval run is a small pipeline. For each task, the harness starts a clean environment, lets the agent attempt the task, records the transcript and the final outcome, and hands them to one or more graders. Then it does that again for the next trial, and aggregates. Step through three situations below: a coding task, a support conversation, and a task that fails every single time.",
        },
        { type: "interactive", widget: "flow", ref: "pipeline" },
        {
          type: "p",
          text: "Two details matter more than they look. **Isolation**: every trial should start from a clean environment. The article reports Claude gaining an unfair advantage on some tasks by reading the git history left behind by previous trials; shared state can also make failures correlated. **Broken tasks**: a 0% pass rate across many trials is most often a signal of a broken task, not an incapable agent. Read the transcripts before you blame the model.",
        },
        {
          type: "p",
          text: "Notice the counter in the diagram, too: an LLM judge costs an extra model call on every trial, while a code grader costs nothing. Across thousands of trials in a CI pipeline, that difference adds up.",
        },
      ],
    },
    {
      id: "graders",
      kind: "deep-dive",
      title: "Three kinds of graders",
      blocks: [
        {
          type: "p",
          text: "The grader decides what “good” means, so choosing graders is the core design decision of an eval. The article groups them into three families:",
        },
        {
          type: "table",
          caption: "Strengths and weaknesses as summarized in the article; examples condensed.",
          columns: ["Grader", "Examples", "Strengths", "Weaknesses"],
          rows: [
            ["Code-based", "Tests pass, state checks, tool-call checks, static analysis", "Fast, cheap, objective, reproducible, easy to debug", "Brittle to valid answers in an unexpected form"],
            ["Model-based (LLM judge)", "Rubric scoring, natural-language assertions, pairwise comparison", "Flexible, scalable, captures nuance and open-ended output", "Non-deterministic, costlier, needs calibration against humans"],
            ["Human", "Expert review, spot checks, A/B tests", "Gold standard; used to calibrate model-based graders", "Expensive, slow, hard to scale"],
          ],
        },
        {
          type: "p",
          text: "The practical rule: choose deterministic graders where possible, LLM graders where necessary or for extra flexibility, and humans sparingly, mainly to calibrate the others. A few habits make graders much more trustworthy:",
        },
        {
          type: "list",
          items: [
            "**Grade the outcome, not the path.** Don't fail an agent for taking a different route to a correct result.",
            "**Grade each dimension separately** (correct refund, polite tone, within the turn limit) so a failure tells you what broke.",
            "**Allow partial credit** for tasks with several components.",
            "**Give an LLM judge a way out:** let it answer “Unknown” instead of guessing when the transcript doesn't contain enough information.",
            "**Resist shortcuts:** if an agent can pass by editing the test instead of fixing the code, the eval measures gaming, not skill.",
          ],
        },
        {
          type: "quote",
          text: "it’s often better to grade what the agent produced, not the path it took.",
          sourceId: SRC,
        },
      ],
    },
    {
      id: "pass-k",
      kind: "explore",
      title: "One number is not enough: pass@k vs pass^k",
      blocks: [
        {
          type: "p",
          text: "Run the same task several times and an agent will sometimes succeed and sometimes fail. Two metrics summarize those trials, and they answer opposite questions:",
        },
        {
          type: "list",
          items: [
            "**pass@k**: the likelihood of at least one success in k attempts. Use it when one good answer is enough, for example when candidate fixes are checked by tests before anyone sees them.",
            "**pass^k**: the probability that all k trials succeed. Use it when users expect the agent to work every time, like a support agent customers talk to again and again.",
          ],
        },
        {
          type: "p",
          text: "If trials are independent and each succeeds with probability p, then pass@k = 1 − (1 − p)^k and pass^k = p^k. The article's example: at 75% per trial, the chance of passing three trials in a row is 0.75³ ≈ 42%. Pick a success rate and move the slider: as k grows, pass@k climbs toward 100% while pass^k falls.",
        },
        { type: "interactive", widget: "chart", ref: "passk" },
        {
          type: "callout",
          tone: "warning",
          title: "Read the right number",
          text: "A 90% agent sounds excellent. But a customer who contacts it five times has only a 59% chance (0.9⁵) that every conversation goes well. Decide which question your product needs answered before you celebrate a score.",
        },
      ],
    },
    {
      id: "suites",
      kind: "deep-dive",
      title: "Capability evals and regression evals",
      blocks: [
        {
          type: "p",
          text: "The article separates two kinds of suites, with different targets. A **capability eval** asks what the agent can do well. It should start at a low pass rate, on tasks the agent struggles with, giving the team a hill to climb. A **regression eval** asks whether the agent still handles all the tasks it used to. It should stay near 100%; any drop means something broke.",
        },
        {
          type: "p",
          text: "The two are connected: capability tasks with high pass rates can “graduate” into the regression suite. And every suite eventually saturates. An eval at 100% still catches regressions but gives no signal for improvement. The article notes that on SWE-bench Verified, a well-known coding benchmark, LLMs went from 40% to over 80% in a single year.",
        },
        {
          type: "callout",
          tone: "example",
          title: "In a CI pipeline",
          text: "Run the regression suite on every change, like unit tests: it must stay green. Run the capability suite less often (nightly, or when you change models or prompts) and track the trend. When a capability task stays green for weeks, move it to the regression suite and write a harder one.",
        },
      ],
    },
    {
      id: "example",
      kind: "example",
      title: "A worked example: evaluating a refund agent",
      blocks: [
        {
          type: "p",
          text: "Here is one task for a support agent, written as YAML. It is our own illustration, inspired by the structure the article describes, not the format of a specific framework. It combines a state check on the outcome, a tool-call check, an LLM rubric for tone, a turn limit, and several trials.",
        },
        {
          type: "code",
          language: "yaml",
          code: code.taskSpec,
          caption: "Deterministic checks for what can be verified; an LLM rubric only for what can't.",
        },
        {
          type: "p",
          text: "Once each task has several trials, turning them into the two metrics is a few lines of code. This version simply looks at the first k trials of each task:",
        },
        {
          type: "code",
          language: "ts",
          code: code.summarize,
          caption: "pass@k and pass^k measured directly from results, with no independence assumption.",
        },
      ],
    },
    {
      id: "pitfalls",
      kind: "tradeoffs",
      title: "Failure modes and how to avoid them",
      blocks: [
        {
          type: "table",
          caption: "Synthesized from the article's roadmap; symptoms and fixes phrased by us.",
          columns: ["Failure mode", "Symptom", "Fix"],
          rows: [
            ["Ambiguous task", "Experts disagree on pass/fail", "Two domain experts should reach the same verdict; add a reference solution"],
            ["Rigid grader", "Correct answers marked wrong", "Grade the outcome, normalize formats, allow partial credit"],
            ["Shared state", "Scores too high or failures in clusters", "Start every trial from a clean environment"],
            ["Unbalanced task set", "Agent always (or never) takes an action", "Test both when the behavior should and shouldn't happen"],
            ["Gameable grader", "Scores rise, users unhappy", "Make graders resist shortcuts; read transcripts"],
            ["Saturated suite", "100% for months, no signal", "Add harder capability tasks; keep old ones as regressions"],
          ],
        },
        {
          type: "p",
          text: "A striking example from the article: Claude Opus 4.5 initially scored 42% on CORE-Bench. After the team fixed grading bugs and used a less constrained scaffold, the score jumped to 95%. Most of the gap was the eval, not the model. Before celebrating or panicking about a score, check the eval itself.",
        },
        {
          type: "p",
          text: "Finally, automated evals are one layer of defense, not the whole system. The article compares them to the Swiss Cheese Model from safety engineering: production monitoring, A/B tests, user feedback, transcript review and human studies each catch problems the others miss.",
        },
        {
          type: "quote",
          text: "Like the Swiss Cheese Model from safety engineering, no single evaluation layer catches every issue.",
          sourceId: SRC,
        },
      ],
    },
    {
      id: "roadmap",
      kind: "concept",
      title: "From zero to a first suite",
      blocks: [
        {
          type: "p",
          text: "You don't need hundreds of tasks or a dedicated team to start. The article's advice condenses into a short roadmap:",
        },
        {
          type: "list",
          ordered: true,
          items: [
            "**Start early and small**: 20–50 simple tasks drawn from real failures is a great start.",
            "**Turn manual checks into tasks**: what you test by hand before a release, and the bugs users report.",
            "**Make tasks unambiguous**, with a reference solution, so two experts would agree on the verdict.",
            "**Balance the set**: cases where the behavior should happen and cases where it shouldn't.",
            "**Isolate trials** and record full transcripts.",
            "**Choose graders deliberately**: code first, LLM judges where needed, humans to calibrate.",
            "**Read transcripts regularly**, especially failures.",
            "**Maintain the suite**: retire saturated tasks into regression, add harder ones, let domain experts contribute tasks.",
          ],
        },
        { type: "quote", text: "20-50 simple tasks drawn from real failures is a great start.", sourceId: SRC },
      ],
    },
    {
      id: "quiz",
      kind: "quiz",
      title: "Check your understanding",
      blocks: [
        {
          type: "quiz",
          questions: [
            {
              id: "q-pass-hat-k",
              prompt:
                "A support agent succeeds on 90% of trials. Customers expect it to work every time they contact support. Which metric matches that expectation, and what is it over 5 conversations (independent trials)?",
              correctOptionId: "b",
              options: [
                {
                  id: "a",
                  text: "pass@5, about 100%",
                  feedback: "pass@5 answers “will at least one of five work?” That's the wrong question when every conversation has to go well.",
                },
                {
                  id: "b",
                  text: "pass^5, about 59%",
                  feedback: "Right. 0.9⁵ ≈ 0.59: four in ten customers who contact support five times will hit at least one failure. That's what pass^k makes visible.",
                },
                {
                  id: "c",
                  text: "pass@1, 90%: one number is enough",
                  feedback: "pass@1 describes a single trial. It hides how consistent the agent is across repeated use, which is what customers experience.",
                },
              ],
            },
            {
              id: "q-zero",
              prompt: "A new task fails in all 50 trials. What should you do first?",
              correctOptionId: "c",
              options: [
                {
                  id: "a",
                  text: "Switch to a larger model",
                  feedback: "Maybe later. But a 0% rate across many trials is most often a signal of a broken task, and a bigger model won't fix a broken grader.",
                },
                {
                  id: "b",
                  text: "Delete the task: it adds no information",
                  feedback: "You would lose coverage, and the same bug (a rigid grader, a vague spec) may be hiding in other tasks.",
                },
                {
                  id: "c",
                  text: "Read the transcripts and check the task and grader",
                  feedback: "Correct. Look for ambiguous criteria, exact-match grading of valid answers, or an impossible setup, as in the rigid-grader scenario above.",
                },
              ],
            },
            {
              id: "q-grader",
              prompt:
                "You need to check that a coding agent's fix makes the failing test pass without breaking the others. Which grader fits best?",
              correctOptionId: "a",
              options: [
                {
                  id: "a",
                  text: "Code-based: run the original test suite in a clean environment",
                  feedback: "Yes. It's verifiable, so use a fast, objective, reproducible check, and run the original tests so the agent can't pass by editing them.",
                },
                {
                  id: "b",
                  text: "An LLM judge reading the diff",
                  feedback: "Useful for qualities code can't check, such as readability, but non-deterministic and costlier. Don't use it for something tests can verify.",
                },
                {
                  id: "c",
                  text: "A human reviewer on every trial",
                  feedback: "Humans are the gold standard but slow and expensive. Use them to calibrate automated graders, not to run every trial.",
                },
              ],
            },
            {
              id: "q-path",
              prompt:
                "An agent books a valid, cheaper flight using a different sequence of tool calls than your reference solution, and the user's goal is met. Your grader fails it. What's wrong?",
              correctOptionId: "b",
              options: [
                {
                  id: "a",
                  text: "The agent should follow the reference steps",
                  feedback: "Requiring a specific path punishes creativity. The user's goal was met.",
                },
                {
                  id: "b",
                  text: "The grader checks the path instead of the outcome",
                  feedback: "Exactly. Grade what the agent produced (a valid booking that meets the goal), not the route it took.",
                },
                {
                  id: "c",
                  text: "You need more trials",
                  feedback: "More trials of a rigid grader just repeat the same wrong verdict. Fix the grader first.",
                },
              ],
            },
          ],
        },
      ],
    },
    {
      id: "interview",
      kind: "interview",
      title: "Interview summary",
      blocks: [
        {
          type: "interview",
          pitchTitle: "Your 30-second answer",
          pitch:
            "I evaluate an agent with a suite of tasks that have clear success criteria. I run several isolated trials per task and grade the outcome, not the path: code-based graders first because they're fast and objective, LLM judges with rubrics for qualities code can't check, and humans to calibrate them. I report pass@k when one success is enough and pass^k when users need consistency. I keep capability evals that start hard and regression evals near 100%, start with 20 to 50 tasks from real failures, and read transcripts, because a task at 0% is usually a broken task, not a weak agent.",
          keyPointsTitle: "Key points",
          keyPoints: [
            "Task, trial, grader, transcript, outcome: the transcript is what the agent said, the outcome is what's true.",
            "Grader choice: code where verifiable, LLM judge where needed, humans to calibrate.",
            "Grade outcomes, separate dimensions, allow partial credit and “Unknown”.",
            "pass@k = at least one success; pass^k = every trial succeeds. With independent trials: 1 − (1 − p)^k vs p^k.",
            "Capability evals start low and climb; regression evals stay near 100%; saturated tasks graduate.",
            "Isolate trials, read transcripts, and treat 0% as a bug report about the eval.",
          ],
          followUpsTitle: "Likely follow-up questions",
          followUps: [
            {
              question: "How do you make an LLM judge trustworthy?",
              answer:
                "Give it a precise rubric per dimension, grade dimensions separately, let it answer “Unknown”, and calibrate it against human labels on a sample, re-checking when the model or rubric changes. Keep anything verifiable in deterministic graders.",
            },
            {
              question: "Your score jumped 20 points after a prompt change. Do you ship?",
              answer:
                "Not yet. Check it's not noise (enough trials per task), read transcripts for grader gaming or leaked state, confirm the regression suite is still green, then validate in production with monitoring or an A/B test.",
            },
            {
              question: "pass@k or pass^k for a coding agent that proposes fixes?",
              answer:
                "If several candidate fixes are generated and verified by tests before a human sees one, pass@k is what matters. If each attempt lands in front of a user or merges directly, consistency matters, so track pass^k.",
            },
            {
              question: "How do evals fit with production monitoring?",
              answer:
                "They're complementary layers: automated evals before launch and in CI; monitoring for drift after launch; A/B tests to validate changes on real traffic; feedback and transcript review for what nobody anticipated.",
            },
          ],
        },
      ],
    },
    {
      id: "sources",
      kind: "sources",
      title: "Sources",
      blocks: [
        {
          type: "p",
          text: "This lesson is an original explanation. Quotes are reproduced verbatim from the source below. The scenarios, the refund-agent task, the pseudocode, the 90%/5-conversation example and the chart (computed from exact formulas) are our own illustrations.",
        },
        { type: "sources" },
      ],
    },
  ],
};
