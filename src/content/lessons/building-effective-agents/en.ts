import type { LessonBody } from "@/content/schema";
import { codeFor } from "./code";

const SRC = "building-effective-agents";
const code = codeFor("en");

export const en: LessonBody = {
  title: "Workflows vs. Agents: Building Effective LLM Systems",
  subtitle:
    "When should your code decide the next step, and when should the model? Six patterns, their costs, and how to defend the choice in a design interview.",
  hook: "The most successful agent systems are surprisingly simple. Learn the six patterns and when each one earns its cost.",
  sections: [
    {
      id: "intro",
      kind: "intro",
      title: "A surprising finding",
      blocks: [
        {
          type: "p",
          text: "Imagine an interviewer asks: “Design an AI system that fixes failing tests in a large codebase.” It is tempting to draw a multi-agent framework with planners, critics and memory stores on your very first whiteboard stroke.",
        },
        {
          type: "p",
          text: "In December 2024, Anthropic engineers published what they had learned from working with dozens of teams building LLM agents across industries. Their headline observation runs against that instinct:",
        },
        {
          type: "quote",
          text: "the most successful implementations weren't using complex frameworks or specialized libraries",
          sourceId: SRC,
        },
        {
          type: "p",
          text: "Instead, those teams built with a small set of **simple, composable patterns**. This lesson teaches the patterns the way an engineer uses them: what each one does, what it costs, how it fails, and how to justify choosing it.",
        },
        {
          type: "callout",
          tone: "insight",
          title: "By the end you will be able to",
          text: "Explain the difference between a workflow and an agent in one sentence; pick a pattern for a problem and justify it with latency, cost and reliability; and sketch an agent loop in pseudocode, including its stopping conditions.",
        },
      ],
    },
    {
      id: "intuition",
      kind: "concept",
      title: "Intuition: a recipe vs. a chef",
      blocks: [
        {
          type: "p",
          text: "Picture two kitchens. In the first, a cook follows a recipe card: chop, then sauté, then season. The order was decided in advance by whoever wrote the card. In the second, a chef is given a goal, “make dinner from what's in the fridge”, and decides each next step by looking, tasting and adjusting.",
        },
        {
          type: "p",
          text: "That is the core distinction in the article. Both kitchens are **agentic systems**, but they differ in who controls the flow:",
        },
        {
          type: "list",
          items: [
            "**Workflow**: LLMs and tools are orchestrated through predefined code paths. *Your code* decides what happens next.",
            "**Agent**: the LLM dynamically directs its own process and tool usage. *The model* decides what happens next.",
          ],
        },
        {
          type: "quote",
          text: "Workflows are systems where LLMs and tools are orchestrated through predefined code paths.",
          sourceId: SRC,
        },
        {
          type: "p",
          text: "The chef's tasting is the important part. A good agent does not trust its own guesses: at every step it gathers **ground truth from the environment**, such as a tool result, a test run or a compiler error, and uses it to choose the next action.",
        },
        {
          type: "callout",
          tone: "analogy",
          title: "One question to keep in mind",
          text: "Who decides what happens next: your code or the model? This single question classifies almost every LLM system you will design.",
        },
      ],
    },
    {
      id: "simplest",
      kind: "concept",
      title: "Start with the simplest thing that works",
      blocks: [
        {
          type: "p",
          text: "The article's first rule is restraint: find the simplest solution possible, and only increase complexity when needed. Agentic systems usually trade **latency and cost** for better task performance, so every extra LLM call has to pay for itself.",
        },
        {
          type: "p",
          text: "A useful mental model is a ladder. Climb one rung only when measurements show the current rung is not enough:",
        },
        {
          type: "list",
          ordered: true,
          items: [
            "**A single LLM call**, optimized with retrieval and in-context examples. For many applications this is enough.",
            "**A workflow**: several calls connected by your code. Workflows offer predictability and consistency for well-defined tasks.",
            "**An agent**: the model chooses its own steps. Better when flexibility and model-driven decisions are needed at scale.",
          ],
        },
        {
          type: "p",
          text: "Every rung is built from the same brick: the **augmented LLM**, a model enhanced with retrieval, tools and memory. The article stresses two things about this brick: tailor those capabilities to your use case, and give the model an easy, well-documented interface to them. The Model Context Protocol (MCP) is one way to connect it to third-party tools.",
        },
        {
          type: "callout",
          tone: "warning",
          title: "Common interview mistake",
          text: "Proposing an autonomous agent for a task with a fixed, known sequence of steps, such as “extract fields from an invoice, validate them, store them”. A workflow is cheaper, faster, easier to test, and fails in predictable ways.",
        },
      ],
    },
    {
      id: "workflows",
      kind: "deep-dive",
      title: "Five workflow patterns",
      blocks: [
        {
          type: "p",
          text: "In each workflow below, the control flow lives in your code. Read the descriptions, then use the interactive explorer in the next section to watch each one run step by step.",
        },
        { type: "h3", text: "1. Prompt chaining" },
        {
          type: "p",
          text: "Split a task into a fixed sequence of steps; each LLM call processes the output of the previous one. Between steps you can add a programmatic **gate**: plain code that checks the intermediate result and stops the chain if something is wrong.",
        },
        {
          type: "p",
          text: "**Use when** the task decomposes cleanly into fixed subtasks. You trade latency for accuracy, because each call gets an easier job. Example from the article: write an outline, check it against criteria, then write the document.",
        },
        { type: "h3", text: "2. Routing" },
        {
          type: "p",
          text: "Classify the input, then send it to a specialized follow-up: a different prompt, toolset or model. This creates **separation of concerns**: tuning the prompt for one category cannot degrade the others.",
        },
        {
          type: "p",
          text: "**Use when** there are distinct categories that are better handled separately, and the classification can be done accurately, by an LLM or a traditional classifier. Examples: customer-service queries split into general questions, refund requests and technical support; easy questions sent to a smaller, cheaper model and hard ones to a more capable one.",
        },
        { type: "h3", text: "3. Parallelization" },
        {
          type: "p",
          text: "Run several LLM calls at the same time and aggregate their outputs in code. Two variants: **sectioning** splits a task into independent subtasks (one model answers the user while another screens the request for inappropriate content); **voting** runs the same task several times for diverse outputs (several prompts review code for vulnerabilities, and a threshold decides).",
        },
        {
          type: "p",
          text: "**Use when** the subtasks are independent and you want speed, or when you want several perspectives for higher confidence. Be precise about the trade-off: parallel calls add **cost** (more calls) but not **latency depth** (still one round).",
        },
        { type: "h3", text: "4. Orchestrator-workers" },
        {
          type: "p",
          text: "A central LLM breaks the task down at runtime, delegates the pieces to worker LLMs, and synthesizes their results. It looks like parallelization, but the key difference is **flexibility**: the subtasks are not predefined; the orchestrator decides them from the specific input.",
        },
        {
          type: "p",
          text: "**Use when** you cannot predict the subtasks in advance. Example: a coding change where the number of files to edit, and which files, depends on the request.",
        },
        { type: "h3", text: "5. Evaluator-optimizer" },
        {
          type: "p",
          text: "One LLM generates a response; another evaluates it and gives feedback; repeat. The article compares it to the way a human writer iterates on a draft.",
        },
        {
          type: "p",
          text: "**Use when** you have clear evaluation criteria and iteration provides measurable value. Two signs of a good fit: a human's feedback would demonstrably improve the output, and an LLM is able to provide such feedback. Examples: literary translation with nuanced critique; complex search that needs several rounds, where the evaluator decides whether more searching is warranted.",
        },
        {
          type: "callout",
          tone: "insight",
          title: "Pattern-recognition shortcut",
          text: "Fixed steps → chaining. Different kinds of input → routing. Independent pieces or a need for consensus → parallelization. Pieces unknown until you see the input → orchestrator-workers. Quality improves with critique → evaluator-optimizer.",
        },
      ],
    },
    {
      id: "explorer",
      kind: "explore",
      title: "Watch the patterns run",
      blocks: [
        {
          type: "p",
          text: "Pick a pattern and a scenario, then press Play or step through. Watch two counters: **LLM calls** (a proxy for cost) and **sequential rounds** (a proxy for latency). The traces are illustrative examples written for this lesson, not measurements.",
        },
        { type: "interactive", widget: "flow", ref: "patterns" },
      ],
    },
    {
      id: "agents",
      kind: "deep-dive",
      title: "Agents: tools in a loop",
      blocks: [
        {
          type: "p",
          text: "An agent starts from a command or a conversation with a human. Once the task is clear, it plans and operates independently, and it can pause for human feedback at checkpoints or when it hits a blocker.",
        },
        {
          type: "quote",
          text: "They are typically just LLMs using tools based on environmental feedback in a loop.",
          sourceId: SRC,
        },
        { type: "p", text: "Three ideas in that sentence are worth unpacking:" },
        {
          type: "list",
          items: [
            "**Tools**: the agent acts on the world through tools such as reading a file, running tests or calling an API. Tool design is therefore as important as prompt design.",
            "**Environmental feedback**: after each action the agent observes real results. For a coding agent, test output is ground truth; the model's confidence is not.",
            "**A loop with exits**: the agent repeats until the goal is met, a human is needed, or a stopping condition such as a maximum number of iterations is reached.",
          ],
        },
        {
          type: "p",
          text: "**Use when** the problem is open-ended, it is hard or impossible to predict the number of steps, and you can trust the model's decisions in that environment. The article is explicit about the price: autonomy means higher costs and the potential for compounding errors, so it recommends extensive testing in sandboxed environments with appropriate guardrails.",
        },
        { type: "h3", text: "Why errors compound" },
        {
          type: "p",
          text: "A back-of-the-envelope illustration (ours, not the article's): if each step of a 20-step run independently succeeds 95% of the time, the whole run succeeds with probability 0.95²⁰ ≈ 36%. Real steps are not independent and agents can recover from mistakes, but only if they get feedback. That is exactly why ground truth, checkpoints and stopping conditions matter.",
        },
        {
          type: "callout",
          tone: "example",
          title: "Where agents shine: coding",
          text: "Coding is a natural fit: solutions can be verified with automated tests, the agent can iterate using test results as feedback, and the problem space is well defined. The article mentions agents resolving real GitHub issues in the SWE-bench Verified benchmark from the pull-request description alone, while stressing that human review remains crucial.",
        },
      ],
    },
    {
      id: "pseudocode",
      kind: "example",
      title: "Pseudocode: from workflow to agent",
      blocks: [
        {
          type: "p",
          text: "The sketches below are TypeScript-flavored pseudocode. `llm()` stands for any model call; it is not a real SDK function. In each one, notice **where the control flow lives**.",
        },
        {
          type: "code",
          language: "ts",
          code: code.chaining,
          caption: "Prompt chaining: each call has one narrow job, and the gate stops bad output early.",
        },
        {
          type: "code",
          language: "ts",
          code: code.routing,
          caption: "Routing: one classification, then exactly one specialized path.",
        },
        {
          type: "code",
          language: "ts",
          code: code.agent,
          caption: "Agent loop: the model picks actions; your code owns the limits.",
        },
        {
          type: "p",
          text: "Compare the shapes. For a workflow you can draw the control-flow graph before running anything. For an agent, the graph only exists after the run, as a trace. That is why agents need observability, logging every step, and why the article recommends making the agent's planning steps transparent.",
        },
      ],
    },
    {
      id: "tradeoffs",
      kind: "tradeoffs",
      title: "Trade-offs you should be able to defend",
      blocks: [
        {
          type: "table",
          caption: "Comparison synthesized from the article; the cost column is qualitative.",
          columns: ["Pattern", "Who picks the path", "Cost & latency", "Main risk"],
          rows: [
            ["Single call", "Nobody: one shot", "Lowest", "Not enough for multi-step tasks"],
            ["Prompt chaining", "Your code", "+1 sequential call per step", "Early errors propagate (use gates)"],
            ["Routing", "Classifier, then your code", "+1 classification call", "Misclassified input takes the wrong path"],
            ["Parallelization", "Your code", "More calls, same depth", "Cost multiplies; aggregation logic"],
            ["Orchestrator-workers", "Orchestrator LLM", "Variable, hard to bound", "Bad plan; inconsistent worker outputs"],
            ["Evaluator-optimizer", "Your loop, LLM verdict", "Grows with each round", "Never satisfied without a round cap"],
            ["Autonomous agent", "The model", "Highest, unpredictable", "Compounding errors"],
          ],
        },
        {
          type: "p",
          text: "Concrete numbers help in interviews. In a later Anthropic Engineering post about their multi-agent research system (June 2025), the authors report that agents typically use about **4× more tokens** than chat interactions, and multi-agent systems about **15× more**. In return, their multi-agent setup outperformed a single-agent Claude Opus 4 by **90.2%** on their internal research eval. The lesson: multi-agent orchestration can be worth it, but only when the value of the task justifies the token bill.",
        },
        {
          type: "callout",
          tone: "warning",
          title: "About frameworks",
          text: "Frameworks make it easy to start, but they add abstraction layers that can hide the underlying prompts and responses, making debugging harder, and they make it tempting to add complexity you don't need. The article suggests starting with LLM APIs directly, since many patterns take a few lines of code, and making sure you understand the underlying code if you do use a framework.",
        },
      ],
    },
    {
      id: "aci",
      kind: "deep-dive",
      title: "The agent-computer interface (ACI)",
      blocks: [
        {
          type: "p",
          text: "A telling detail from the article's appendix: while building their agent for SWE-bench, the team spent more time on the tools than on the prompt. Tools are the agent's hands, and every tool definition is a prompt the model reads.",
        },
        {
          type: "quote",
          text: "we actually spent more time optimizing our tools than the overall prompt.",
          sourceId: SRC,
        },
        {
          type: "p",
          text: "Their concrete example: the model made mistakes with relative file paths after it had moved out of the root directory. The fix was not a smarter prompt. They changed the tool to always require absolute file paths, and the model then used it flawlessly. This is **poka-yoke**, a manufacturing term for designing parts so they cannot be assembled the wrong way.",
        },
        {
          type: "list",
          items: [
            "**Give the model enough tokens to think** before it writes itself into a corner.",
            "**Keep formats close to text that occurs naturally on the internet.**",
            "**Avoid formatting overhead**: a diff requires knowing how many lines change in the chunk header before writing the code; code inside JSON needs extra escaping of newlines and quotes.",
            "**Document tools like a great docstring for a junior developer**: example usage, edge cases, input format requirements, and clear boundaries from other tools.",
            "**Test** how the model actually uses your tools on many example inputs, then iterate.",
          ],
        },
        {
          type: "code",
          language: "jsonc",
          code: code.toolDefinition,
          caption: "Illustrative tool definitions (our example, applying the article's guidance).",
        },
        {
          type: "p",
          text: "The article closes with three principles that tie everything together: **maintain simplicity** in the agent's design; **prioritize transparency** by explicitly showing the agent's planning steps; and **carefully craft the agent-computer interface** through thorough tool documentation and testing.",
        },
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
              id: "q-routing",
              prompt:
                "A support system classifies each incoming email as billing, bug report or sales lead, then answers with a prompt and toolset specialized for that category. Which pattern is this?",
              correctOptionId: "b",
              options: [
                {
                  id: "a",
                  text: "Orchestrator-workers",
                  feedback:
                    "Not quite. An orchestrator invents subtasks at runtime. Here the categories are fixed in advance, and each email goes down exactly one predefined path.",
                },
                {
                  id: "b",
                  text: "Routing",
                  feedback:
                    "Correct. Classify, then dispatch to a specialized path. Thanks to separation of concerns, tuning the billing prompt cannot degrade bug-report handling.",
                },
                {
                  id: "c",
                  text: "Parallelization (voting)",
                  feedback:
                    "Voting runs the same task several times and aggregates the answers. Here each email is handled once, by a single specialized path.",
                },
              ],
            },
            {
              id: "q-parallel",
              prompt:
                "Your code-review assistant runs three independent reviewers (security, performance, style) at the same time instead of one after another. What changes?",
              correctOptionId: "a",
              options: [
                {
                  id: "a",
                  text: "Same number of calls, lower end-to-end latency",
                  feedback:
                    "Right. Cost stays at three calls, but they happen in one round instead of three. This is sectioning: independent subtasks run simultaneously.",
                },
                {
                  id: "b",
                  text: "Fewer LLM calls, so lower cost",
                  feedback:
                    "No. There are still three calls. Running them in parallel does not make them cheaper.",
                },
                {
                  id: "c",
                  text: "It becomes an autonomous agent",
                  feedback:
                    "No. Your code still decides exactly which three calls run. The model is not directing the process.",
                },
              ],
            },
            {
              id: "q-stopping",
              prompt:
                "Your coding agent sometimes loops for a long time, editing files and re-running tests. Which change best follows the article's guidance?",
              correctOptionId: "c",
              options: [
                {
                  id: "a",
                  text: "Remove the tests from the loop so it finishes faster",
                  feedback:
                    "That removes the agent's ground truth. Test results are exactly the environmental feedback that lets it detect and correct its mistakes.",
                },
                {
                  id: "b",
                  text: "Move to a bigger framework with more abstraction",
                  feedback:
                    "The article warns that abstraction layers can obscure the underlying prompts and responses, which makes exactly this kind of problem harder to debug.",
                },
                {
                  id: "c",
                  text: "Add a maximum number of iterations and hand the trace to a human when it is reached",
                  feedback:
                    "Correct. The article recommends stopping conditions, such as a maximum number of iterations, to maintain control, and agents can pause for human feedback when they hit blockers.",
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
            "I start with the simplest thing that works: a single well-prompted LLM call with retrieval. If the task has known steps, I use a workflow, such as chaining, routing, parallelization, orchestrator-workers or evaluator-optimizer, because the control flow lives in code: it is predictable, testable and cheaper. I only reach for an autonomous agent when the number of steps cannot be predicted and success can be verified, like code changes checked by tests. Then I invest in tool design, stopping conditions, sandboxing and tracing, because autonomy adds cost and compounding errors.",
          keyPointsTitle: "Key points",
          keyPoints: [
            "Workflow: your code decides the path. Agent: the model decides the path.",
            "Climb the complexity ladder only when measurements justify it.",
            "Parallel calls cost more but cut latency depth; loops multiply cost.",
            "Agents need ground truth from the environment, checkpoints and stopping conditions.",
            "Tools are prompts: invest in the agent-computer interface (absolute paths, clear docs, tests).",
            "Three principles: simplicity, transparency, and well-documented, well-tested tools.",
          ],
          followUpsTitle: "Likely follow-up questions",
          followUps: [
            {
              question: "When would you not use an agent?",
              answer:
                "When the steps are known in advance, when latency or cost budgets are tight, when errors are expensive and hard to detect, or when there is no reliable way to verify success. A workflow or a single call is more predictable and easier to test.",
            },
            {
              question: "How would you evaluate an agent before shipping it?",
              answer:
                "Build a set of realistic tasks with verifiable outcomes, such as tests that must pass. Run the agent in a sandbox, keep full traces, and measure success rate, cost per task and failure modes. Watch for loops and compounding errors, and keep a human checkpoint for high-impact actions.",
            },
            {
              question: "Orchestrator-workers vs. parallelization?",
              answer:
                "Both fan out to several LLM calls. With parallelization, your code predefines the subtasks. With orchestrator-workers, an LLM decides the subtasks at runtime from the input: more flexible, but harder to bound in cost and harder to test.",
            },
            {
              question: "How do you make tools easier for a model to use?",
              answer:
                "Treat tool definitions as prompts: clear names, docstring-style descriptions with examples and edge cases, formats close to natural text, and constraints that make mistakes impossible, like requiring absolute file paths.",
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
          text: "This lesson is an original explanation. Quotes are reproduced verbatim from the sources below. The analogies, diagrams, scenarios, pseudocode, tool-definition example and error-compounding calculation are our own illustrations.",
        },
        { type: "sources" },
      ],
    },
  ],
};
