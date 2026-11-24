import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LessonHeader } from "@/components/lesson/LessonHeader";
import { LessonProvider } from "@/components/lesson/LessonContext";
import { ModeTabs } from "@/components/lesson/ModeTabs";
import { getLesson, listLessons } from "@/content";
import { isLocale } from "@/lib/i18n/config";

export function generateStaticParams() {
  return listLessons().map((lesson) => ({ slug: lesson.slug }));
}

export async function generateMetadata({ params }: LayoutProps<"/[locale]/lessons/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params;
  const lesson = getLesson(slug);
  if (!isLocale(locale) || !lesson) return {};
  const body = lesson.content[locale];
  return { title: body.title, description: body.subtitle };
}

export default async function LessonLayout({ children, params }: LayoutProps<"/[locale]/lessons/[slug]">) {
  const { locale, slug } = await params;
  const lesson = getLesson(slug);
  if (!isLocale(locale) || !lesson) notFound();

  return (
    <LessonProvider
      locale={locale}
      lesson={{
        slug: lesson.slug,
        level: lesson.level,
        sources: lesson.sources,
        interactives: lesson.interactives,
        body: lesson.content[locale],
      }}
    >
      <LessonHeader />
      <main id="main" className="mx-auto max-w-2xl px-4" style={{ paddingBottom: "calc(var(--tabs-h) + env(safe-area-inset-bottom) + 6rem)" }}>
        {children}
      </main>
      <ModeTabs />
    </LessonProvider>
  );
}
