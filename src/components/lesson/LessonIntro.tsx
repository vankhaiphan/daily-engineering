"use client";

import { formatDate } from "@/lib/format";
import { getUI } from "@/lib/i18n/ui";
import { readingMinutes } from "@/lib/reading-time";
import { useLesson } from "./LessonContext";

export function LessonIntro({ compact = false }: { compact?: boolean }) {
  const { body, ui, level, sources, locale } = useLesson();
  const primary = sources.find((s) => s.role === "primary");
  return (
    <div className="pb-2 pt-6">
      <p className="text-xs font-semibold uppercase tracking-wider text-accent">
        {ui.lesson.level[level]} · {getUI(locale).home.minutes(readingMinutes(body))}
      </p>
      <h1 className={`mt-2 font-serif font-semibold leading-tight ${compact ? "text-2xl" : "text-[1.9rem]"}`}>{body.title}</h1>
      {!compact ? <p className="prose-lesson mt-3 text-ink-2">{body.subtitle}</p> : null}
      {primary ? (
        <p className="mt-3 text-sm text-ink-3">
          {ui.home.basedOn}{" "}
          <a href={primary.url} target="_blank" rel="noopener noreferrer" className="font-medium text-ink-2 underline underline-offset-2" lang="en">
            {primary.title}
          </a>{" "}
          · {primary.publisher} · <time dateTime={primary.publishedOn}>{formatDate(primary.publishedOn, locale)}</time>
        </p>
      ) : null}
    </div>
  );
}
