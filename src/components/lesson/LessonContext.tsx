"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { Lesson, LessonBody, SourceRef, VisualSpec } from "@/content/schema";
import type { Locale } from "@/lib/i18n/config";
import { getUI, type UIStrings } from "@/lib/i18n/ui";

export interface LessonContextValue {
  locale: Locale;
  ui: UIStrings;
  slug: string;
  level: Lesson["level"];
  body: LessonBody;
  sources: SourceRef[];
  interactives: Record<string, VisualSpec>;
  sectionIds: string[];
  basePath: string;
}

const LessonContext = createContext<LessonContextValue | null>(null);

export function LessonProvider({
  locale,
  lesson,
  children,
}: {
  locale: Locale;
  lesson: Pick<Lesson, "slug" | "level" | "sources" | "interactives"> & { body: LessonBody };
  children: ReactNode;
}) {
  const value = useMemo<LessonContextValue>(
    () => ({
      locale,
      ui: getUI(locale),
      slug: lesson.slug,
      level: lesson.level,
      body: lesson.body,
      sources: lesson.sources,
      interactives: lesson.interactives,
      sectionIds: lesson.body.sections.map((s) => s.id),
      basePath: `/${locale}/lessons/${lesson.slug}`,
    }),
    [locale, lesson],
  );
  return <LessonContext.Provider value={value}>{children}</LessonContext.Provider>;
}

export function useLesson(): LessonContextValue {
  const value = useContext(LessonContext);
  if (!value) throw new Error("useLesson must be used inside <LessonProvider>");
  return value;
}
