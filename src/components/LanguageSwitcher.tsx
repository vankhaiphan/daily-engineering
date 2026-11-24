"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LOCALE_COOKIE, LOCALE_META, LOCALES, switchLocaleInPath, type Locale } from "@/lib/i18n/config";
import { getUI } from "@/lib/i18n/ui";
import { visibleElements } from "@/lib/dom";

/** Section currently near the top of the viewport, so a language switch keeps the reader's place. */
export function currentSectionId(): string | undefined {
  const sections = visibleElements<HTMLElement>("[data-section-id]");
  const line = window.innerHeight * 0.35;
  let current: string | undefined;
  for (const section of sections) {
    if (section.getBoundingClientRect().top <= line) current = section.dataset.sectionId;
  }
  return current;
}

export function rememberLocale(locale: Locale) {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; SameSite=Lax`;
}

/**
 * Real links (not buttons): switching language is navigation, so it works even
 * before JavaScript has loaded. With JS we also remember the choice and keep
 * the reader's current section.
 */
export function LanguageSwitcher({ locale, onSwitched }: { locale: Locale; onSwitched?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const ui = getUI(locale);

  return (
    <nav aria-label={ui.language} data-testid="language-switcher" className="flex rounded-xl bg-surface-2 p-1">
      {LOCALES.map((l) => {
        const active = l === locale;
        const href = switchLocaleInPath(pathname, l);
        return (
          <Link
            key={l}
            href={href}
            replace
            lang={LOCALE_META[l].htmlLang}
            hrefLang={LOCALE_META[l].htmlLang}
            aria-label={LOCALE_META[l].name}
            aria-current={active ? "page" : undefined}
            onClick={(event) => {
              event.preventDefault();
              if (active) return;
              rememberLocale(l);
              const section = currentSectionId();
              onSwitched?.();
              router.replace(`${href}${section ? `#${section}` : ""}`);
            }}
            className={`flex min-h-11 flex-1 items-center justify-center rounded-lg px-2 text-sm font-medium transition-colors ${
              active ? "bg-surface text-ink shadow-sm" : "text-ink-2"
            }`}
          >
            {LOCALE_META[l].short}
          </Link>
        );
      })}
    </nav>
  );
}
