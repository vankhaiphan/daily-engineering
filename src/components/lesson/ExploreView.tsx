"use client";

import Link from "next/link";
import { EXPLORE_SECTION_KINDS } from "@/content/schema";
import { useLesson } from "./LessonContext";
import { LessonIntro } from "./LessonIntro";
import { SectionView } from "./SectionView";
import { useSectionTracking } from "./useSectionTracking";

export function ExploreView() {
  const { body, slug, ui, basePath } = useLesson();
  useSectionTracking(slug);
  return (
    <article className="prose-lesson" data-testid="explore-view">
      <LessonIntro compact />
      <p className="text-ink-2">{ui.lesson.exploreIntro}</p>
      {body.sections.map((section, i) =>
        EXPLORE_SECTION_KINDS.includes(section.kind) ? <SectionView key={section.id} section={section} index={i} anchor={false} /> : null,
      )}
      <p className="pt-8">
        <Link href={basePath} className="inline-flex min-h-11 items-center font-medium text-accent">
          {ui.lesson.readFull} →
        </Link>
      </p>
    </article>
  );
}
