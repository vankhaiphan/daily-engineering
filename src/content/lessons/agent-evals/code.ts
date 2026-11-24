/**
 * Code samples (our own examples). Identifiers and data stay in English;
 * explanatory comments are localized.
 */
import type { Locale } from "@/lib/i18n/config";

const C = {
  en: {
    taskTitle: "Illustrative task spec (our example, not a real framework format)",
    state: "code-based: what is true afterwards",
    tools: "code-based: no dangerous side effects",
    rubric: "model-based: what code can't judge",
    unknown: 'Answer "unknown" if the transcript is ambiguous.',
    trials: "agents are non-deterministic: run several",
    sumTitle: "Turn trial results into the two numbers (our sketch).",
    at: "pass@k: at least one of the first k trials passed",
    hat: "pass^k: all of the first k trials passed",
  },
  vi: {
    taskTitle: "Đặc tả task minh họa (ví dụ của chúng tôi, không phải định dạng framework thật)",
    state: "dựa trên code: điều gì thực sự đúng sau khi chạy",
    tools: "dựa trên code: không có side effect nguy hiểm",
    rubric: "dựa trên model: những gì code không chấm được",
    unknown: 'Trả lời "unknown" nếu transcript không rõ ràng.',
    trials: "agent không tất định: hãy chạy nhiều lần",
    sumTitle: "Biến kết quả các trial thành hai con số (phác thảo của chúng tôi).",
    at: "pass@k: ít nhất một trong k trial đầu tiên đạt",
    hat: "pass^k: cả k trial đầu tiên đều đạt",
  },
  fr: {
    taskTitle: "Spécification de tâche illustrative (notre exemple, pas un format de framework réel)",
    state: "en code : ce qui est vrai après coup",
    tools: "en code : aucun effet de bord dangereux",
    rubric: "par modèle : ce que le code ne peut pas juger",
    unknown: 'Répondre "unknown" si la transcription est ambiguë.',
    trials: "les agents ne sont pas déterministes : plusieurs essais",
    sumTitle: "Transformer les résultats des essais en deux chiffres (notre esquisse).",
    at: "pass@k : au moins un des k premiers essais a réussi",
    hat: "pass^k : les k premiers essais ont tous réussi",
  },
} satisfies Record<Locale, Record<string, string>>;

export function codeFor(locale: Locale) {
  const c = C[locale];
  return {
    taskSpec: `# ${c.taskTitle}
task: refund-duplicate-charge
input:
  user: "I was charged twice for order 1042."
environment:
  orders: { "1042": { amount: 89.00, charges: 2 } }
graders:
  - type: state_check        # ${c.state}
    expect: { "1042": { refunds: 1, refund_amount: 89.00 } }
  - type: tool_calls         # ${c.tools}
    forbid: [ "refund_order(order=1042) called twice" ]
  - type: llm_rubric         # ${c.rubric}
    rubric: |
      Polite? Clear? Confirms the refunded amount? Score each 1-5.
      ${c.unknown}
limits:
  max_turns: 10
trials: 5                    # ${c.trials}`,

    summarize: `// ${c.sumTitle}
type Trial = { taskId: string; passed: boolean };

function summarize(trials: Trial[], k: number) {
  const byTask = Map.groupBy(trials, (t) => t.taskId);
  let atLeastOne = 0;
  let all = 0;
  for (const results of byTask.values()) {
    const firstK = results.slice(0, k);
    if (firstK.some((t) => t.passed)) atLeastOne++;   // ${c.at}
    if (firstK.every((t) => t.passed)) all++;         // ${c.hat}
  }
  return { passAtK: atLeastOne / byTask.size, passHatK: all / byTask.size };
}`,
  };
}
