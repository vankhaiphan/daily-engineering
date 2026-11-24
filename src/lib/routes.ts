/**
 * Lightweight route table used by `proxy.ts` to answer unknown URLs with a
 * real 404 before streaming starts (with Cache Components, a notFound() at
 * request time can only stream a 404 page under a 200 status).
 * Keep LESSON_SLUGS in sync with the content registry (enforced by a unit test).
 */
import { isLocale } from "@/lib/i18n/config";

export const LESSON_SLUGS: readonly string[] = ["building-effective-agents"];

const LESSON_MODES = new Set(["explore"]);

export function isKnownPath(pathname: string): boolean {
  const parts = pathname.replace(/\/+$/, "").split("/").slice(1);
  const [locale, section, slug, mode, ...rest] = parts;
  if (!isLocale(locale)) return false;
  if (parts.length === 1) return true;
  if (section !== "lessons" || !slug || !LESSON_SLUGS.includes(slug) || rest.length > 0) return false;
  return mode === undefined || LESSON_MODES.has(mode);
}
