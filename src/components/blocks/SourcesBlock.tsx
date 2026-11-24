"use client";

import { IconExternal } from "@/components/icons";
import { useLesson } from "@/components/lesson/LessonContext";
import { SourceDate } from "@/components/SourceDate";
import { formatDate } from "@/lib/format";

export function SourcesBlock() {
  const { sources, ui, locale } = useLesson();
  return (
    <ul className="space-y-3" data-testid="sources">
      {sources.map((source) => (
        <li key={source.id} className="rounded-2xl border border-line bg-surface p-4">
          <p className="text-[0.75em] font-semibold uppercase tracking-wide text-ink-3">
            {source.role === "primary" ? ui.sources.primary : ui.sources.supporting}
          </p>
          <p className="mt-1 font-serif text-[1.05em] font-semibold" lang="en">{source.title}</p>
          <p className="text-[0.9em] text-ink-2">
            {source.publisher} · {ui.sources.by} {source.authors.join(", ")}
          </p>
          <p className="mt-1 text-[0.85em] text-ink-3">
            {ui.sources.published} <SourceDate iso={source.publishedOn} locale={locale} fallback={ui.sources.noDate} /> ·{" "}
            {ui.sources.accessed} <time dateTime={source.accessedOn}>{formatDate(source.accessedOn, locale)}</time>
          </p>
          {source.note ? <p className="mt-2 text-[0.9em] text-ink-2">{source.note[locale]}</p> : null}
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex min-h-11 items-center gap-2 rounded-lg text-[0.9em] font-medium text-accent"
          >
            {ui.sources.open} <IconExternal size={16} />
          </a>
        </li>
      ))}
    </ul>
  );
}
