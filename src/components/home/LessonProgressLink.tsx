"use client";

import Link from "next/link";
import { useLearnerState } from "@/hooks/stores";
import type { Locale } from "@/lib/i18n/config";
import { getUI } from "@/lib/i18n/ui";
import { completion } from "@/lib/progress";

export function LessonProgressLink({
  locale,
  slug,
  sections,
}: {
  locale: Locale;
  slug: string;
  sections: { id: string; title: string }[];
}) {
  const ui = getUI(locale);
  const state = useLearnerState();
  const progress = state.lessons[slug];
  const pct = Math.round(completion(progress, sections.map((s) => s.id)) * 100);
  const last = sections.find((s) => s.id === progress?.lastSectionId);
  const href = `/${locale}/lessons/${slug}${last ? `#${last.id}` : ""}`;

  return (
    <div className="mt-4">
      {progress ? (
        <div className="mb-3">
          <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
            <div className="h-full rounded-full bg-accent" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-1 text-xs text-ink-3" data-testid="home-progress">{ui.home.percentRead(pct)}</p>
        </div>
      ) : null}
      <Link
        href={href}
        className="flex min-h-12 items-center justify-center rounded-xl bg-accent px-4 text-center font-semibold text-accent-ink"
        data-testid="home-continue"
      >
        {last ? ui.home.continueAt(last.title) : ui.home.start}
      </Link>
    </div>
  );
}
