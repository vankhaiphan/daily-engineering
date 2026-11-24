import type { Block, LessonBody } from "@/content/schema";
import { stripInline } from "./inline";

function blockWords(block: Block): string[] {
  switch (block.type) {
    case "p":
    case "h3":
      return [block.text];
    case "list":
      return block.items;
    case "callout":
      return [block.title, block.text];
    case "quote":
      return [block.translation ?? block.text];
    case "code":
      return [block.caption ?? ""];
    case "table":
      return block.rows.flat();
    case "quiz":
      return block.questions.flatMap((q) => [q.prompt, ...q.options.map((o) => o.text)]);
    case "interview":
      return [block.pitch, ...block.keyPoints, ...block.followUps.flatMap((f) => [f.question, f.answer])];
    default:
      return [];
  }
}

export function countWords(body: LessonBody): number {
  return body.sections
    .flatMap((s) => [s.title, ...s.blocks.flatMap(blockWords)])
    .map((t) => stripInline(t).split(/\s+/).filter(Boolean).length)
    .reduce((a, b) => a + b, 0);
}

/** ~200 words/minute reading pace, plus time for code and the interactive. */
export function readingMinutes(body: LessonBody): number {
  const extras = body.sections
    .flatMap((s) => s.blocks)
    .reduce((acc, b) => acc + (b.type === "code" ? 0.5 : b.type === "interactive" ? 3 : 0), 0);
  return Math.max(1, Math.round(countWords(body) / 200 + extras));
}
