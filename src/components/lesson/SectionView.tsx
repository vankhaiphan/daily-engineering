"use client";

import type { Section } from "@/content/schema";
import { BlockView } from "@/components/blocks/BlockView";
import { IconBookmark, IconCheck } from "@/components/icons";
import { learnerStore, useLearnerState } from "@/hooks/stores";
import { isBookmarked, toggleBookmark } from "@/lib/progress";
import { useLesson } from "./LessonContext";

/**
 * `anchor` sections own the real `#section-id` anchors (Read view only).
 * Next keeps previously visited routes mounted-but-hidden (React Activity),
 * so Explore must not render duplicate ids.
 */
export function SectionView({ section, index, anchor = true }: { section: Section; index: number; anchor?: boolean }) {
  const { slug, ui } = useLesson();
  const state = useLearnerState();
  const marked = isBookmarked(state, slug, section.id);
  const read = state.lessons[slug]?.readSections.includes(section.id) ?? false;
  const domId = anchor ? section.id : undefined;
  const titleId = `${anchor ? "" : "alt-"}${section.id}-title`;

  return (
    <section
      id={domId}
      data-section-id={section.id}
      aria-labelledby={titleId}
      className="lesson-section pt-8 first:pt-2"
    >
      <div className="mb-3 flex items-start gap-2">
        <h2 id={titleId} className="flex-1 font-serif text-[1.45em] font-semibold leading-tight">
          <span className="mr-2 align-[0.12em] font-sans text-[0.55em] font-semibold text-ink-3 tabular-nums" aria-hidden="true">
            {String(index + 1).padStart(2, "0")}
          </span>
          {section.title}
        </h2>
        {read ? (
          <span className="mt-1 grid size-6 place-items-center rounded-full bg-ok-soft text-ok" title={ui.lesson.read}>
            <IconCheck size={14} />
            <span className="sr-only">{ui.lesson.read}</span>
          </span>
        ) : null}
        <button
          type="button"
          aria-pressed={marked}
          aria-label={marked ? ui.lesson.unbookmark : ui.lesson.bookmark}
          onClick={() => learnerStore.set((s) => toggleBookmark(s, slug, section.id))}
          className={`-mr-2 -mt-1.5 grid size-11 shrink-0 place-items-center rounded-full active:bg-surface-2 ${
            marked ? "text-accent" : "text-ink-3"
          }`}
          data-testid={`bookmark-${section.id}`}
        >
          <IconBookmark filled={marked} />
        </button>
      </div>
      <div className="space-y-4">
        {section.blocks.map((block, i) => (
          <BlockView key={i} block={block} blockKey={`${section.id}:${i}`} />
        ))}
      </div>
      <div data-section-end={section.id} aria-hidden="true" className="h-px" />
    </section>
  );
}
