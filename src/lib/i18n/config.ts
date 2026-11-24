/** Supported UI + content languages. Order = display order in switchers. */
export const LOCALES = ["vi", "en", "fr"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "en";

/** Cookie read by `proxy.ts` to send `/` to the last language the reader used. */
export const LOCALE_COOKIE = "de-locale";

export const LOCALE_META: Record<
  Locale,
  { short: string; name: string; htmlLang: string }
> = {
  vi: { short: "VI", name: "Tiếng Việt", htmlLang: "vi" },
  en: { short: "EN", name: "English", htmlLang: "en" },
  fr: { short: "FR", name: "Français", htmlLang: "fr" },
};

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

/**
 * Minimal Accept-Language negotiation (no dependency): picks the first
 * supported primary language tag by quality weight.
 */
export function negotiateLocale(acceptLanguage: string | null | undefined): Locale {
  if (!acceptLanguage) return DEFAULT_LOCALE;
  const ranked = acceptLanguage
    .split(",")
    .map((part, index) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params.find((p) => p.trim().startsWith("q="));
      const quality = q ? Number.parseFloat(q.trim().slice(2)) : 1;
      return { lang: tag.trim().toLowerCase().split("-")[0], quality: Number.isNaN(quality) ? 0 : quality, index };
    })
    .filter((entry) => entry.lang && entry.quality > 0)
    .sort((a, b) => b.quality - a.quality || a.index - b.index);
  const match = ranked.find((entry) => isLocale(entry.lang))?.lang;
  return isLocale(match) ? match : DEFAULT_LOCALE;
}

/** Replace the leading locale segment of a pathname. */
export function switchLocaleInPath(pathname: string, next: Locale): string {
  const parts = pathname.split("/");
  if (isLocale(parts[1])) {
    parts[1] = next;
    return parts.join("/") || `/${next}`;
  }
  return `/${next}${pathname === "/" ? "" : pathname}`;
}
