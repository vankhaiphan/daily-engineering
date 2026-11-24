/**
 * Phase 4: scheduled lesson runs (pure logic, no I/O).
 *
 * One run = one daily slot (Europe/Paris date + "morning" | "evening").
 * - The slot's branch name is the lock: `content/<date>-<slot>`. It is created
 *   with a plain (non-force) push, so a concurrent or retried run cannot claim
 *   the same slot twice.
 * - Each run commits a run record (`content-pipeline/runs/<slotId>.json`) on its
 *   branch. Later runs read pending records with plain git to avoid duplicating
 *   topics that are still waiting for review.
 * - Scheduled runs only ever create drafts. Publishing stays a human action.
 *
 * `scripts/content/schedule.mts` does the git/file I/O around these functions.
 */
import type { CatalogEntry } from "./catalog";
import type { Candidate } from "./pipeline";
import { findDuplicates, normalizeUrl, QUALITY_RULES, similarity, type QualityReport } from "./quality";
import type { Lesson, Topic } from "./schema";

export type Slot = "morning" | "evening";
export const SLOTS: readonly Slot[] = ["morning", "evening"];

export interface SlotConfig {
  label: string;
  /** Local (Europe/Paris) time the schedule is meant to fire; documentation only. */
  localTime: string;
  focus: string;
  topics: Topic[];
  /** Names of entries in content-pipeline/sources.json used for discovery. */
  seeds: string[];
}

export interface ScheduleConfig {
  version: 1;
  timezone: string;
  remote: string;
  baseBranch: string;
  branchPrefix: string;
  weekdaysOnly: boolean;
  /** No new run starts while this many lesson branches are waiting for review. */
  maxPendingLessons: number;
  /** A claimed run older than this without finishing is reported as stale. */
  staleClaimHours: number;
  slots: Record<Slot, SlotConfig>;
}

export type RunStatus = "claimed" | "generated" | "blocked";

export interface RunRecord {
  version: 1;
  slotId: string;
  slot: Slot;
  date: string;
  status: RunStatus;
  claimedAt: string;
  updatedAt: string;
  candidateId?: string;
  url?: string;
  title?: string;
  slug?: string;
  keywords?: string[];
  /** Results of the checks `finish` actually ran. */
  checks?: { name: string; ok: boolean; detail?: string }[];
  reviewFlags?: string[];
  blockers?: string[];
  prUrl?: string;
}

/** A lesson branch on the remote that has not been merged into the base branch. */
export interface PendingRun {
  branch: string;
  /** Present on scheduled-run branches. */
  record?: RunRecord;
  /** Lessons the branch adds (from its coverage.json), for branches made by hand too. */
  lessons?: { slug: string; title: string; keywords: string[]; sources: string[] }[];
}

/* ---------------------------------------------------------------- */
/* Dates and names                                                    */
/* ---------------------------------------------------------------- */

export interface LocalDate {
  date: string;
  weekday: number;
  hour: number;
}

/** Calendar date, ISO weekday (1 = Monday … 7 = Sunday) and hour in `timeZone`. */
export function localDate(now: Date, timeZone: string): LocalDate {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      weekday: "short",
      hour: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(now)
      .map((p) => [p.type, p.value]),
  );
  const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    weekday: weekdays.indexOf(parts.weekday) + 1,
    hour: Number(parts.hour),
  };
}

export const slotIdOf = (date: string, slot: Slot) => `${date}-${slot}`;
export const branchOf = (config: ScheduleConfig, slotId: string) => `${config.branchPrefix}${slotId}`;
export const runRecordPath = (slotId: string) => `content-pipeline/runs/${slotId}.json`;

const SLOT_BRANCH = /^(\d{4}-\d{2}-\d{2})-(morning|evening)$/;

/** Slot id encoded in a lesson branch name, or undefined for other branches. */
export function slotIdFromBranch(config: ScheduleConfig, branch: string): string | undefined {
  if (!branch.startsWith(config.branchPrefix)) return undefined;
  const rest = branch.slice(config.branchPrefix.length);
  return SLOT_BRANCH.test(rest) ? rest : undefined;
}

/** Scheduled runs may only ever push their own slot branch. */
export function assertSafePushTarget(config: ScheduleConfig, branch: string): void {
  if (branch === config.baseBranch || branch === "main" || branch === "master") {
    throw new Error(`refusing to push to ${branch}: scheduled runs never push the base branch`);
  }
  if (!slotIdFromBranch(config, branch)) {
    throw new Error(`refusing to push ${branch}: only ${config.branchPrefix}<YYYY-MM-DD>-<morning|evening> branches are allowed`);
  }
}

/* ---------------------------------------------------------------- */
/* Planning                                                           */
/* ---------------------------------------------------------------- */

export type PlanAction = "generate" | "discover" | "noop";

export interface Plan {
  slot: Slot;
  slotId: string;
  date: string;
  branch: string;
  action: PlanAction;
  reasons: string[];
  candidate?: Candidate;
  /** Every track candidate that was not chosen, with why. */
  excluded: { id: string; reason: string }[];
  pendingCount: number;
  stale: string[];
}

export interface PlanInput {
  config: ScheduleConfig;
  slot: Slot;
  now: Date;
  lessons: readonly Lesson[];
  candidates: readonly Candidate[];
  pending: readonly PendingRun[];
  /** Run records already merged into the base branch. */
  completedRuns: readonly RunRecord[];
}

/** Is a candidate the same topic as a run that is still waiting for review? */
export function pendingConflict(candidate: Candidate, pending: readonly PendingRun[]): string | undefined {
  const url = normalizeUrl(candidate.url);
  for (const run of pending) {
    const r = run.record;
    if (!r) continue;
    if (r.candidateId === candidate.id) return `already in progress on ${run.branch}`;
    if (r.url && normalizeUrl(r.url) === url) return `same source as pending ${run.branch}`;
    if (r.keywords?.length && candidate.keywords?.length) {
      const score = similarity(candidate.keywords, r.keywords);
      if (score >= QUALITY_RULES.duplicateSimilarity) return `keyword overlap ${score.toFixed(2)} with pending ${run.branch}`;
    }
    if (r.title && similarity([candidate.title], [r.title]) >= 0.6) return `title overlap with pending ${run.branch}`;
  }
  for (const run of pending) {
    for (const lesson of run.lessons ?? []) {
      if (lesson.sources.includes(url)) return `source already used by pending lesson ${lesson.slug} (${run.branch})`;
      if (candidate.keywords?.length) {
        const score = similarity(candidate.keywords, lesson.keywords);
        if (score >= QUALITY_RULES.duplicateSimilarity) return `keyword overlap ${score.toFixed(2)} with pending lesson ${lesson.slug}`;
      }
      if (similarity([candidate.title], [lesson.title]) >= 0.6) return `title overlap with pending lesson ${lesson.slug}`;
    }
  }
  return undefined;
}

export function planRun(input: PlanInput): Plan {
  const { config, slot, now, lessons, candidates, pending, completedRuns } = input;
  const { date, weekday } = localDate(now, config.timezone);
  const slotId = slotIdOf(date, slot);
  const branch = branchOf(config, slotId);
  const base = { slot, slotId, date, branch, excluded: [] as Plan["excluded"], pendingCount: pending.length, stale: [] as string[] };

  for (const run of pending) {
    if (run.record?.status === "claimed") {
      const ageHours = (now.getTime() - Date.parse(run.record.claimedAt)) / 3_600_000;
      if (ageHours >= config.staleClaimHours) base.stale.push(`${run.branch} claimed ${ageHours.toFixed(1)} h ago and never finished`);
    }
  }

  const noop = (...reasons: string[]): Plan => ({ ...base, action: "noop", reasons });

  if (config.weekdaysOnly && weekday >= 6) return noop(`${date} is a weekend in ${config.timezone}`);
  if (completedRuns.some((r) => r.slotId === slotId)) return noop(`slot ${slotId} already has a merged run`);
  const sameSlot = pending.find((p) => p.branch === branch);
  if (sameSlot) return noop(`slot ${slotId} already claimed by ${branch} (${sameSlot.record?.status ?? "no run record"})`);
  if (pending.length >= config.maxPendingLessons) {
    return noop(`review queue has ${pending.length} pending lesson branch(es), limit is ${config.maxPendingLessons}`);
  }

  const excluded: Plan["excluded"] = [];
  const eligible = candidates.filter((c) => {
    if (c.track !== slot) return false;
    const reject = (reason: string) => (excluded.push({ id: c.id, reason }), false);
    if (c.status !== "shortlisted") return reject(`status ${c.status}`);
    if (c.publishedOn === null) return reject("no publication date (needed for a primary source)");
    const dup = findDuplicates({ url: c.url, title: c.title, keywords: c.keywords }, lessons).find((m) => m.severity === "duplicate");
    if (dup) return reject(`duplicate of ${dup.slug}: ${dup.reason}`);
    const conflict = pendingConflict(c, pending);
    if (conflict) return reject(conflict);
    return true;
  });

  eligible.sort(
    (a, b) => b.total - a.total || (b.publishedOn ?? "").localeCompare(a.publishedOn ?? "") || a.id.localeCompare(b.id),
  );
  const candidate = eligible[0];
  if (!candidate) {
    return {
      ...base,
      excluded,
      action: "discover",
      reasons: [`no eligible ${slot} candidate: run discovery for "${config.slots[slot].label}", then plan again`],
    };
  }
  return { ...base, excluded, action: "generate", candidate, reasons: [`best eligible ${slot} candidate (score ${candidate.total})`] };
}

/* ---------------------------------------------------------------- */
/* Safety and outcome                                                 */
/* ---------------------------------------------------------------- */

/** Files a scheduled run may change (besides its own new lesson folder). */
export const SCHEDULED_RUN_FILES = [
  "src/content/catalog.json",
  "src/content/lessons/registry.ts",
  "content-pipeline/candidates.json",
  "content-pipeline/coverage.json",
  "content-pipeline/sources.json",
] as const;
export const SCHEDULED_RUN_DIRS = ["content-pipeline/runs/", "content-pipeline/reviews/"] as const;

/**
 * Changed paths a scheduled run is not allowed to touch: anything outside the
 * pipeline records and the folders of lessons that are new on this branch
 * (so no app code, scripts, workflows, settings or existing lessons).
 */
export function findForbiddenPaths(changed: readonly string[], newLessonSlugs: readonly string[]): string[] {
  return changed.filter(
    (path) =>
      !(SCHEDULED_RUN_FILES as readonly string[]).includes(path) &&
      !SCHEDULED_RUN_DIRS.some((dir) => path.startsWith(dir)) &&
      !newLessonSlugs.some((slug) => path.startsWith(`src/content/lessons/${slug}/`)),
  );
}

/** Lessons that a change would publish. Scheduled runs must leave this empty. */
export function findPublishingChanges(base: readonly CatalogEntry[], head: readonly CatalogEntry[]): string[] {
  return head
    .filter((h) => h.status === "published" && base.find((b) => b.slug === h.slug)?.status !== "published")
    .map((h) => h.slug);
}

/** Existing lessons a change would remove or unpublish. */
export function findRemovedLessons(base: readonly CatalogEntry[], head: readonly CatalogEntry[]): string[] {
  return base
    .filter((b) => {
      const h = head.find((x) => x.slug === b.slug);
      return !h || (b.status === "published" && h.status !== "published");
    })
    .map((b) => b.slug);
}

/**
 * Final status of a run. "generated" only when the lesson passes every gate
 * and every required check ran and passed; anything else is "blocked".
 * Review flags (needs-review claims) don't block the run: the draft is still
 * reviewable, and the publish gate keeps them from going live.
 */
export function decideOutcome(
  report: QualityReport | undefined,
  checks: { name: string; ok: boolean; detail?: string }[],
  requiredChecks: readonly string[],
): { status: "generated" | "blocked"; blockers: string[] } {
  const blockers: string[] = [];
  if (!report) blockers.push("no lesson was produced");
  else blockers.push(...report.errors.map((e) => `quality gate: ${e}`));
  for (const name of requiredChecks) {
    const check = checks.find((c) => c.name === name);
    if (!check) blockers.push(`required check not run: ${name}`);
    else if (!check.ok) blockers.push(`check failed: ${name}${check.detail ? ` (${check.detail})` : ""}`);
  }
  return { status: blockers.length ? "blocked" : "generated", blockers };
}

export type FailureKind = "network" | "permission" | "lock" | "unknown";

/** Map git/npm error output to an actionable category for the run report. */
export function classifyFailure(output: string): FailureKind {
  const o = output.toLowerCase();
  if (/(rejected|fetch first|non-fast-forward|already exists|cannot lock ref)/.test(o)) return "lock";
  if (/(permission denied|403|401|authentication failed|could not read username|protected branch|not allowed to push|forbidden)/.test(o)) {
    return "permission";
  }
  if (/(could not resolve host|enotfound|econnrefused|econnreset|etimedout|timed out|network is unreachable|getaddrinfo|unable to access|proxy)/.test(o)) {
    return "network";
  }
  return "unknown";
}

export function validateScheduleConfig(config: ScheduleConfig): string[] {
  const errors: string[] = [];
  if (config.version !== 1) errors.push("version must be 1");
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: config.timezone });
  } catch {
    errors.push(`unknown timezone ${config.timezone}`);
  }
  if (!config.branchPrefix || config.branchPrefix === `${config.baseBranch}/`) errors.push("branchPrefix is required");
  if (!Number.isInteger(config.maxPendingLessons) || config.maxPendingLessons < 1) errors.push("maxPendingLessons must be ≥ 1");
  if (!(config.staleClaimHours > 0)) errors.push("staleClaimHours must be > 0");
  for (const slot of SLOTS) {
    const s = config.slots?.[slot];
    if (!s) errors.push(`missing slot ${slot}`);
    else if (!s.topics.length || !s.seeds.length) errors.push(`slot ${slot} needs topics and seeds`);
  }
  const overlap = config.slots.morning.topics.filter((t) => config.slots.evening.topics.includes(t));
  if (overlap.length) errors.push(`topics in both slots: ${overlap.join(", ")}`);
  return errors;
}
