import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookmarksList } from "@/components/home/BookmarksList";
import { LessonLibrary } from "@/components/home/LessonLibrary";
import { LessonProgressLink } from "@/components/home/LessonProgressLink";
import { IconBook, IconCompass } from "@/components/icons";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { SettingsButton } from "@/components/SettingsButton";
import { listLessons } from "@/content";
import { SourceDate } from "@/components/SourceDate";
import { isLocale } from "@/lib/i18n/config";
import { getUI } from "@/lib/i18n/ui";
import { readingMinutes } from "@/lib/reading-time";

export async function generateMetadata({ params }: PageProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  return isLocale(locale) ? { title: { absolute: getUI(locale).appName } } : {};
}

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const ui = getUI(locale);
  const lessons = listLessons();
  const today = lessons[0];
  const body = today.content[locale];
  const base = `/${locale}/lessons/${today.slug}`;
  const primary = today.sources.find((s) => s.role === "primary");

  return (
    <>
      <header className="pt-safe mx-auto flex max-w-2xl items-center justify-between px-4 pt-3">
        <p className="font-serif text-lg font-semibold">{ui.appName}</p>
        <SettingsButton locale={locale} />
      </header>

      <main id="main" className="pb-safe mx-auto max-w-2xl space-y-8 px-4 pb-12 pt-4">
        <div className="space-y-4">
          <p className="text-ink-2">{ui.tagline}</p>
          <LanguageSwitcher locale={locale} />
        </div>

        <section aria-labelledby="today-title" className="rounded-3xl border border-line bg-surface p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">
            {ui.home.todayLesson} · {ui.home.minutes(readingMinutes(body))}
          </p>
          {today.status === "draft" ? (
            <p className="mt-2 inline-block rounded-full bg-bad-soft px-2 py-0.5 text-xs font-semibold text-bad" data-testid="draft-badge">
              {ui.home.draft}
            </p>
          ) : null}
          <h1 id="today-title" className="mt-2 font-serif text-2xl font-semibold leading-tight">
            {body.title}
          </h1>
          <p className="mt-2 text-ink-2">{body.hook}</p>
          {primary ? (
            <p className="mt-3 text-sm text-ink-3">
              {ui.home.basedOn} <span lang="en">{primary.title}</span> · {primary.publisher} ·{" "}
              <SourceDate iso={primary.publishedOn} locale={locale} fallback={ui.sources.noDate} />
            </p>
          ) : null}
          <LessonProgressLink
            locale={locale}
            slug={today.slug}
            sections={body.sections.map((s) => ({ id: s.id, title: s.title }))}
          />
        </section>

        <section className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-2xl bg-surface-2 p-4">
            <h2 className="font-semibold"><span aria-hidden="true">☀️ </span>{ui.home.morningTitle}</h2>
            <p className="mt-1 text-sm text-ink-2">{ui.home.morningBody}</p>
            <div className="mt-3 flex">
              <Link href={base} className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-surface text-sm font-medium">
                <IconBook size={18} /> {ui.modes.read}
              </Link>
            </div>
          </div>
          <div className="rounded-2xl bg-surface-2 p-4">
            <h2 className="font-semibold"><span aria-hidden="true">🌙 </span>{ui.home.eveningTitle}</h2>
            <p className="mt-1 text-sm text-ink-2">{ui.home.eveningBody}</p>
            <div className="mt-3 flex">
              <Link href={`${base}/explore`} className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-surface text-sm font-medium">
                <IconCompass size={18} /> {ui.modes.explore}
              </Link>
            </div>
          </div>
        </section>

        <LessonLibrary
          locale={locale}
          lessons={lessons.map((l) => ({
            slug: l.slug,
            title: l.content[locale].title,
            minutes: readingMinutes(l.content[locale]),
            level: l.level,
            draft: l.status === "draft",
            sectionIds: l.content[locale].sections.map((s) => s.id),
          }))}
        />

        <BookmarksList
          locale={locale}
          lessons={lessons.map((l) => ({
            slug: l.slug,
            title: l.content[locale].title,
            sections: l.content[locale].sections.map((s) => ({ id: s.id, title: s.title })),
          }))}
        />

        <p className="text-center text-xs text-ink-3">{ui.home.privacy}</p>
      </main>
    </>
  );
}
