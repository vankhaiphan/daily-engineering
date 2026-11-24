"use client";

import Link from "next/link";
import { useLearnerState } from "@/hooks/stores";
import type { Locale } from "@/lib/i18n/config";
import { getUI } from "@/lib/i18n/ui";
import { completion } from "@/lib/progress";

interface LibraryItem {
  slug: string;
  title: string;
  minutes: number;
  level: "foundation" | "intermediate" | "advanced";
  draft: boolean;
  sectionIds: string[];
}

/** Every visible lesson, newest first, with on-device progress. */
export function LessonLibrary({ locale, lessons }: { locale: Locale; lessons: LibraryItem[] }) {
  const ui = getUI(locale);
  const state = useLearnerState();
  if (lessons.length < 2) return null;
  return (
    <section aria-labelledby="library-title">
      <h2 id="library-title" className="text-xs font-semibold uppercase tracking-wider text-ink-3">
        {ui.home.library}
      </h2>
      <ul className="mt-2 divide-y divide-line rounded-2xl border border-line bg-surface" data-testid="library">
        {lessons.map((lesson) => {
          const pct = Math.round(completion(state.lessons[lesson.slug], lesson.sectionIds) * 100);
          return (
            <li key={lesson.slug}>
              <Link href={`/${locale}/lessons/${lesson.slug}`} className="block px-4 py-3" data-testid={`library-${lesson.slug}`}>
                <span className="block font-serif font-semibold leading-snug">{lesson.title}</span>
                <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-3">
                  <span>{ui.lesson.level[lesson.level]}</span>
                  <span aria-hidden="true">·</span>
                  <span>{ui.home.minutes(lesson.minutes)}</span>
                  {pct > 0 ? (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="text-accent">{ui.home.percentRead(pct)}</span>
                    </>
                  ) : null}
                  {lesson.draft ? <span className="rounded-full bg-bad-soft px-2 py-0.5 font-semibold text-bad">{ui.home.draft}</span> : null}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
