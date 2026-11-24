/**
 * Code samples. Pseudocode: `llm()`, `classify()`, `execute()` etc. are
 * placeholders, not a real SDK. Identifiers and string literals stay in
 * English (as in real code); explanatory comments are localized.
 */
import type { Locale } from "@/lib/i18n/config";

const COMMENTS = {
  en: {
    chainingTitle: "Workflow: prompt chaining with a gate.",
    chainingFlow: "Control flow lives in YOUR code.",
    gate: "gate = plain code, no LLM",
    routing: "Workflow: routing. One classification, then one specialized path.",
    agentTitle: "Agent: the MODEL chooses each action; YOUR code enforces limits.",
    stopping: "stopping condition",
    done: "model: goal met",
    checkpoint: "checkpoint",
    act: "act on the world",
    truth: "ground truth flows back",
    never: "never loop forever",
    before: "Before: ambiguous. Which path format? Replace or append?",
    after: "After: poka-yoke. Hard to misuse, errors explain themselves.",
  },
  vi: {
    chainingTitle: "Workflow: prompt chaining có cổng kiểm tra.",
    chainingFlow: "Luồng điều khiển nằm trong code CỦA BẠN.",
    gate: "cổng = code thuần, không dùng LLM",
    routing: "Workflow: routing. Một lần phân loại, rồi một nhánh chuyên biệt.",
    agentTitle: "Agent: MODEL chọn từng hành động; code CỦA BẠN áp đặt giới hạn.",
    stopping: "điều kiện dừng",
    done: "model: đã đạt mục tiêu",
    checkpoint: "checkpoint",
    act: "tác động lên thế giới",
    truth: "ground truth quay về",
    never: "không bao giờ lặp vô hạn",
    before: "Trước: mơ hồ. Đường dẫn dạng gì? Thay thế hay nối thêm?",
    after: "Sau: poka-yoke. Khó dùng sai, lỗi tự giải thích.",
  },
  fr: {
    chainingTitle: "Workflow : chaînage de prompts avec une porte.",
    chainingFlow: "Le contrôle du flux reste dans VOTRE code.",
    gate: "porte = simple code, sans LLM",
    routing: "Workflow : routage. Une classification, puis un chemin spécialisé.",
    agentTitle: "Agent : le MODÈLE choisit chaque action ; VOTRE code impose les limites.",
    stopping: "condition d'arrêt",
    done: "modèle : objectif atteint",
    checkpoint: "point de contrôle",
    act: "agir sur le monde",
    truth: "la vérité terrain revient",
    never: "jamais de boucle infinie",
    before: "Avant : ambigu. Quel format de chemin ? Remplacer ou ajouter ?",
    after: "Après : poka-yoke. Difficile à mal utiliser, les erreurs s'expliquent d'elles-mêmes.",
  },
} satisfies Record<Locale, Record<string, string>>;

export function codeFor(locale: Locale) {
  const c = COMMENTS[locale];
  return {
    chaining: `// ${c.chainingTitle}
// ${c.chainingFlow}
async function writeDoc(topic: string) {
  const outline = await llm(\`Outline a doc about: \${topic}\`);

  if (!meetsCriteria(outline)) {   // ${c.gate}
    throw new Error("Outline rejected before the expensive step");
  }

  return llm(\`Write the doc following this outline:\\n\${outline}\`);
}`,

    routing: `// ${c.routing}
const handlers = {
  refund:    (q: string) => llm(q, { prompt: REFUND_PROMPT, tools: [issueRefund] }),
  technical: (q: string) => llm(q, { prompt: TECH_PROMPT, tools: [searchDocs] }),
  general:   (q: string) => llm(q, { model: SMALL_MODEL }),
};

async function handle(query: string) {
  const route = await classify(query); // "refund" | "technical" | "general"
  return handlers[route](query);
}`,

    agent: `// ${c.agentTitle}
async function runAgent(goal: string, tools: Tool[], maxSteps = 20) {
  const history: Message[] = [{ role: "user", content: goal }];

  for (let step = 0; step < maxSteps; step++) {     // ${c.stopping}
    const reply = await llm(history, { tools });

    if (reply.type === "done") return reply.answer;  // ${c.done}
    if (reply.type === "ask_human") {                // ${c.checkpoint}
      return pauseForHuman(reply.question, history);
    }

    const result = await execute(reply.toolCall);    // ${c.act}
    history.push(reply.message, toolResult(result)); // ${c.truth}
  }

  return escalate("Step limit reached", history);     // ${c.never}
}`,

    toolDefinition: `// ${c.before}
{
  "name": "edit",
  "description": "Edit a file",
  "input_schema": {
    "type": "object",
    "properties": {
      "path": { "type": "string" },
      "content": { "type": "string" }
    }
  }
}

// ${c.after}
{
  "name": "replace_in_file",
  "description": "Replace exactly one occurrence of old_text with new_text. Fails if old_text matches 0 or 2+ times: re-read the file and include more surrounding lines. Use create_file for new files.",
  "input_schema": {
    "type": "object",
    "properties": {
      "absolute_path": {
        "type": "string",
        "description": "Absolute path, e.g. /repo/src/app.ts. Relative paths are rejected."
      },
      "old_text": { "type": "string", "description": "Exact text to replace, including whitespace." },
      "new_text": { "type": "string" }
    },
    "required": ["absolute_path", "old_text", "new_text"]
  }
}`,
  };
}
