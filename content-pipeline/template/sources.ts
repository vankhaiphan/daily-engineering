import type { SourceRef } from "@/content/schema";

/** Open every source before citing it. Authors and dates exactly as shown; null when not stated. */
export const sources: SourceRef[] = [
  {
    id: "primary",
    title: "TODO",
    publisher: "TODO",
    authors: ["TODO"],
    url: "https://example.com/TODO",
    publishedOn: null, // TODO: YYYY-MM-DD as shown on the page (required for the primary source)
    accessedOn: "__TODAY__",
    role: "primary",
  },
];
