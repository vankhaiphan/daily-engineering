"use client";

import Link from "next/link";
import { IconBookmark } from "@/components/icons";
import { useLearnerState } from "@/hooks/stores";
import type { Locale } from "@/lib/i18n/config";
import { getUI } from "@/lib/i18n/ui";

interface LessonIndex {
  slug: string;
  title: string;
  sections: { id: string; title: string }[];
}

export function BookmarksList({ locale, lessons }: { locale: Locale; lessons: LessonIndex[] }) {
  const ui = getUI(locale);
  const { bookmarks } = useLearnerState();
  const items = bookmarks
    .map((b) => {
      const lesson = lessons.find((l) => l.slug === b.lessonSlug);
      const section = lesson?.sections.find((s) => s.id === b.sectionId);
      return lesson && section ? { key: `${b.lessonSlug}:${b.sectionId}`, lesson, section } : null;
    })
    .filter((x) => x !== null);

  return (
    <section aria-labelledby="bookmarks-title">
      <h2 id="bookmarks-title" className="text-xs font-semibold uppercase tracking-wider text-ink-3">
        {ui.home.bookmarks}
      </h2>
      {items.length === 0 ? (
        <p className="mt-2 text-sm text-ink-3">{ui.home.noBookmarks}</p>
      ) : (
        <ul className="mt-2 divide-y divide-line rounded-2xl border border-line bg-surface" data-testid="bookmarks">
          {items.map(({ key, lesson, section }) => (
            <li key={key}>
              <Link href={`/${locale}/lessons/${lesson.slug}#${section.id}`} className="flex min-h-14 items-center gap-3 px-4 py-2">
                <IconBookmark size={18} filled className="shrink-0 text-accent" />
                <span className="min-w-0">
                  <span className="block truncate font-medium">{section.title}</span>
                  <span className="block truncate text-xs text-ink-3">{lesson.title}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
