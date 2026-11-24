"use client";

import type { Block } from "@/content/schema";
import { InlineText } from "@/components/InlineText";
import { IconChevronLeft } from "@/components/icons";
import { useLesson } from "@/components/lesson/LessonContext";

type InterviewData = Extract<Block, { type: "interview" }>;

export function InterviewBlock({ block }: { block: InterviewData }) {
  const { ui } = useLesson();
  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-accent-soft p-4">
        <p className="text-[0.8em] font-semibold uppercase tracking-wide text-accent">{block.pitchTitle}</p>
        <p className="mt-2">
          <InlineText text={block.pitch} />
        </p>
      </div>
      <div>
        <h3 className="font-serif text-[1.1em] font-semibold">{block.keyPointsTitle}</h3>
        <ul className="mt-2 space-y-2">
          {block.keyPoints.map((point, i) => (
            <li key={i} className="flex gap-3">
              <span className="mt-[0.55em] size-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
              <span>
                <InlineText text={point} />
              </span>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h3 className="font-serif text-[1.1em] font-semibold">{block.followUpsTitle}</h3>
        <div className="mt-2 space-y-2">
          {block.followUps.map((f, i) => (
            <details key={i} className="group rounded-xl border border-line bg-surface">
              <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 font-medium [&::-webkit-details-marker]:hidden">
                <span className="min-w-0">{f.question}</span>
                <span className="sr-only">{ui.interview.showAnswer}</span>
                <IconChevronLeft size={18} className="shrink-0 -rotate-90 text-accent transition-transform group-open:rotate-90" />
              </summary>
              <p className="border-t border-line px-4 py-3 text-ink-2">{f.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}
