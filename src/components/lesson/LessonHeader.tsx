"use client";

import Link from "next/link";
import { useState } from "react";
import { IconBookmark, IconCheck, IconChevronLeft, IconList } from "@/components/icons";
import { SettingsButton } from "@/components/SettingsButton";
import { Sheet } from "@/components/Sheet";
import { useLearnerState } from "@/hooks/stores";
import { completion, isBookmarked } from "@/lib/progress";
import { useLesson } from "./LessonContext";

export function LessonHeader() {
  const { locale, ui, slug, body, sectionIds, basePath } = useLesson();
  const state = useLearnerState();
  const [contentsOpen, setContentsOpen] = useState(false);
  const progress = state.lessons[slug];
  const pct = Math.round(completion(progress, sectionIds) * 100);

  return (
    <header className="pt-safe sticky top-0 z-30 border-b border-line bg-bg">
      <div className="mx-auto flex h-[var(--header-h)] max-w-2xl items-center gap-1 px-2">
        <Link
          href={`/${locale}`}
          className="grid size-11 place-items-center rounded-full text-ink-2 active:bg-surface-2"
          aria-label={ui.lesson.home}
        >
          <IconChevronLeft />
        </Link>
        <p className="min-w-0 flex-1 truncate text-sm font-semibold">{body.title}</p>
        <button
          type="button"
          onClick={() => setContentsOpen(true)}
          className="grid size-11 place-items-center rounded-full text-ink-2 active:bg-surface-2"
          aria-label={ui.lesson.contents}
          data-testid="open-contents"
        >
          <IconList />
        </button>
        <SettingsButton locale={locale} />
      </div>
      <div
        className="h-0.5 bg-accent transition-[width] duration-500"
        style={{ width: `${pct}%` }}
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        aria-label={ui.lesson.progress(pct)}
        data-testid="lesson-progress"
      />

      <Sheet open={contentsOpen} onClose={() => setContentsOpen(false)} title={ui.lesson.contents} closeLabel={ui.close} testId="contents-sheet">
        <p className="mb-3 text-sm text-ink-2">{ui.lesson.progress(pct)}</p>
        <ol className="space-y-1">
          {body.sections.map((section, i) => {
            const read = progress?.readSections.includes(section.id);
            const marked = isBookmarked(state, slug, section.id);
            return (
              <li key={section.id}>
                <Link
                  href={`${basePath}#${section.id}`}
                  onClick={() => setContentsOpen(false)}
                  className="flex min-h-12 items-center gap-3 rounded-xl px-2 active:bg-surface-2"
                >
                  <span className="w-6 text-right text-xs tabular-nums text-ink-3">{i + 1}</span>
                  <span className="flex-1">{section.title}</span>
                  {marked ? <IconBookmark size={16} filled className="text-accent" /> : null}
                  {read ? <IconCheck size={16} className="text-ok" /> : null}
                </Link>
              </li>
            );
          })}
        </ol>
      </Sheet>
    </header>
  );
}
