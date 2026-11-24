import type { LessonBody } from "@/content/schema";

export const fr: LessonBody = {
  title: "TODO",
  subtitle: "TODO",
  hook: "TODO",
  sections: [
    { id: "intro", kind: "intro", title: "TODO", blocks: [{ type: "p", text: "TODO" }] },
    { id: "intuition", kind: "concept", title: "TODO", blocks: [{ type: "p", text: "TODO" }] },
    { id: "deep-dive", kind: "deep-dive", title: "TODO", blocks: [{ type: "p", text: "TODO" }] },
    { id: "tradeoffs", kind: "tradeoffs", title: "TODO", blocks: [{ type: "p", text: "TODO" }] },
    { id: "quiz", kind: "quiz", title: "TODO", blocks: [{ type: "quiz", questions: [] }] },
    {
      id: "interview",
      kind: "interview",
      title: "TODO",
      blocks: [
        {
          type: "interview",
          pitchTitle: "TODO",
          pitch: "TODO",
          keyPointsTitle: "TODO",
          keyPoints: [],
          followUpsTitle: "TODO",
          followUps: [],
        },
      ],
    },
    { id: "sources", kind: "sources", title: "TODO", blocks: [{ type: "p", text: "TODO" }, { type: "sources" }] },
  ],
};
