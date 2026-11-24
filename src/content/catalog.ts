/**
 * Lightweight lesson catalog (slug, status, date). Imported by the proxy and
 * routing, so it must not pull in lesson content. Edited by the content
 * scripts (`npm run content:*`); `src/content/lessons/registry.ts` is
 * generated from it.
 */
import catalog from "./catalog.json";
import type { IsoDate, LessonStatus } from "./schema";

export interface CatalogEntry {
  slug: string;
  status: LessonStatus;
  createdOn: IsoDate;
}

export const CATALOG = catalog as CatalogEntry[];

type Env = Record<string, string | undefined>;

/**
 * Drafts are visible in development and on Vercel preview deployments (so a
 * reviewer can read a generated lesson on their phone), never in production.
 * Override with SHOW_DRAFT_LESSONS=true|false.
 */
export function draftsVisible(env: Env = process.env): boolean {
  if (env.SHOW_DRAFT_LESSONS === "true") return true;
  if (env.SHOW_DRAFT_LESSONS === "false") return false;
  if (env.VERCEL_ENV) return env.VERCEL_ENV !== "production";
  return env.NODE_ENV !== "production";
}

export function isVisible(status: LessonStatus, env: Env = process.env): boolean {
  return status === "published" || draftsVisible(env);
}

export function visibleSlugs(env: Env = process.env): string[] {
  return CATALOG.filter((entry) => isVisible(entry.status, env)).map((entry) => entry.slug);
}
