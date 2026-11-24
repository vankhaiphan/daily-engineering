"use client";

import { useLesson } from "./LessonContext";
import { LessonIntro } from "./LessonIntro";
import { ResumeBanner } from "./ResumeBanner";
import { SectionView } from "./SectionView";
import { useSectionTracking } from "./useSectionTracking";

export function ReadView() {
  const { body, slug } = useLesson();
  useSectionTracking(slug);
  return (
    <article className="prose-lesson" data-testid="read-view">
      <LessonIntro />
      {body.sections.map((section, i) => (
        <SectionView key={section.id} section={section} index={i} />
      ))}
      <ResumeBanner />
    </article>
  );
}
