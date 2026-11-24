import type { SourceRef } from "@/content/schema";

/**
 * Every source below was opened and checked on `accessedOn`.
 * Authors are listed exactly as credited on the page at that date.
 */
export const sources: SourceRef[] = [
  {
    id: "building-effective-agents",
    title: "Building effective agents",
    publisher: "Anthropic Engineering",
    authors: ["Erik S.", "Barry Zhang"],
    url: "https://www.anthropic.com/engineering/building-effective-agents",
    publishedOn: "2024-12-19",
    accessedOn: "2026-11-24",
    role: "primary",
    note: {
      en: "Primary source for every pattern in this lesson. The page now notes that much of the tooling landscape has changed since December 2024; the design patterns are what this lesson teaches.",
      vi: "Nguồn chính cho mọi pattern trong bài. Trang hiện ghi chú rằng phần lớn hệ sinh thái công cụ đã thay đổi kể từ tháng 12/2024; bài học này tập trung vào các design pattern.",
      fr: "Source principale de tous les patterns de cette leçon. La page indique désormais qu'une grande partie de l'outillage a changé depuis décembre 2024 ; cette leçon se concentre sur les patterns de conception.",
    },
  },
  {
    id: "multi-agent-research-system",
    title: "How we built our multi-agent research system",
    publisher: "Anthropic Engineering",
    authors: [
      "Jeremy Hadfield",
      "Barry Zhang",
      "Kenneth Lien",
      "Florian Scholz",
      "Jeremy Fox",
      "Daniel Ford",
    ],
    url: "https://www.anthropic.com/engineering/multi-agent-research-system",
    publishedOn: "2025-06-13",
    accessedOn: "2026-11-24",
    role: "supporting",
    note: {
      en: "Used only for the token-cost and performance figures in the trade-offs section.",
      vi: "Chỉ dùng cho các số liệu về chi phí token và hiệu năng trong phần đánh đổi.",
      fr: "Utilisée uniquement pour les chiffres de coût en tokens et de performance de la section sur les compromis.",
    },
  },
];
