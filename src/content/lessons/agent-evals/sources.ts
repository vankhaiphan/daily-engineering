import type { SourceRef } from "@/content/schema";

/** Opened and checked on accessedOn. Authors exactly as credited on the page. */
export const sources: SourceRef[] = [
  {
    id: "demystifying-evals",
    title: "Demystifying evals for AI agents",
    publisher: "Anthropic Engineering",
    authors: ["Mikaela Grace", "Jeremy Hadfield", "Rodrigo Olivares", "Jiri De Jonghe"],
    url: "https://www.anthropic.com/engineering/demystifying-evals-for-ai-agents",
    publishedOn: "2026-01-09",
    accessedOn: "2026-11-24",
    role: "primary",
    note: {
      en: "Primary source for the vocabulary, grader types, pass@k / pass^k, capability vs regression evals and the roadmap. Scenarios, pseudocode and the refund-agent example are ours.",
      vi: "Nguồn chính cho thuật ngữ, các loại grader, pass@k / pass^k, eval năng lực và eval hồi quy, cùng lộ trình. Kịch bản, pseudocode và ví dụ agent hoàn tiền là của chúng tôi.",
      fr: "Source principale pour le vocabulaire, les types de graders, pass@k / pass^k, les évals de capacité et de régression, et la feuille de route. Les scénarios, le pseudocode et l'exemple d'agent de remboursement sont les nôtres.",
    },
  },
];
