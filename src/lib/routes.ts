/**
 * Lightweight route table used by `proxy.ts` to answer unknown URLs with a
 * real 404 before streaming starts (with Cache Components, a notFound() at
 * request time can only stream a 404 page under a 200 status).
 * Lesson slugs come from the lightweight catalog (no lesson content is
 * bundled into the proxy); drafts are only routable where they are visible.
 */
import { visibleSlugs } from "@/content/catalog";
import { isLocale } from "@/lib/i18n/config";

const LESSON_MODES = new Set(["explore"]);

export function isKnownPath(pathname: string): boolean {
  const parts = pathname.replace(/\/+$/, "").split("/").slice(1);
  const [locale, section, slug, mode, ...rest] = parts;
  if (!isLocale(locale)) return false;
  if (parts.length === 1) return true;
  if (section !== "lessons" || !slug || !visibleSlugs().includes(slug) || rest.length > 0) return false;
  return mode === undefined || LESSON_MODES.has(mode);
}
