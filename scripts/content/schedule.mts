/**
 * Scheduled lesson runs (Phase 4). Deterministic steps around the
 * lesson-generation skill; see .claude/skills/scheduled-lesson/SKILL.md.
 *
 *   npm run schedule -- doctor  --slot morning            # environment preflight
 *   npm run schedule -- plan    --slot morning [--now ISO] [--json]
 *   npm run schedule -- claim   --slot morning [--now ISO]   # lock the slot (push its branch)
 *   npm run schedule -- finish  --slot morning --slug <slug> [--blocker "<why>"]... [--e2e]
 *   npm run schedule -- block   --slot morning --blocker "<why>"   # stop gracefully, no lesson
 *   npm run schedule -- pr      --slot morning               # open (or find) the draft PR
 *   npm run schedule -- guard                               # safety checks on the current branch
 *
 * Exit codes: 0 ok, 1 failure/blocked, 2 nothing to do (no-op), 3 slot already
 * claimed (lock lost), 4 permission denied, 5 network unavailable, 6 safety violation.
 *
 * This script never publishes, merges, deletes branches, force-pushes, or
 * pushes anything but the run's own content/<date>-<slot> branch.
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { CatalogEntry } from "@/content/catalog";
import type { CoverageEntry } from "@/content/pipeline";
import { checkLessonQuality } from "@/content/quality";
import {
  assertSafePushTarget,
  classifyFailure,
  decideOutcome,
  findForbiddenPaths,
  findPublishingChanges,
  findRemovedLessons,
  localDate,
  planRun,
  runRecordPath,
  slotIdFromBranch,
  SLOTS,
  validateScheduleConfig,
  type FailureKind,
  type PendingRun,
  type Plan,
  type RunRecord,
  type ScheduleConfig,
  type Slot,
} from "@/content/schedule";
import { arg, flag, loadLessons, PATHS, readCandidates, readCatalog, readJson, ROOT, writeCandidates, writeJson } from "./lib.mts";

const CONFIG_PATH = join(ROOT, "content-pipeline/schedule.json");
/** Checks that must pass for a run to count as "generated". */
export const REQUIRED_CHECKS = ["lint", "typecheck", "unit tests", "content:validate", "build"] as const;
const EXIT = { lock: 3, permission: 4, network: 5, safety: 6 } as const;

/* ---------------------------------------------------------------- */
/* helpers                                                            */
/* ---------------------------------------------------------------- */

interface RunResult {
  ok: boolean;
  output: string;
}

function run(cmd: string, args: string[], env: Record<string, string> = {}): RunResult {
  const r = spawnSync(cmd, args, { cwd: ROOT, encoding: "utf8", env: { ...process.env, ...env }, maxBuffer: 64 * 1024 * 1024 });
  return { ok: r.status === 0, output: `${r.stdout ?? ""}${r.stderr ?? ""}${r.error ? String(r.error) : ""}` };
}

function git(...args: string[]): string {
  const r = run("git", args);
  if (!r.ok) throw new GitError(`git ${args.join(" ")}`, r.output);
  return r.output.trim();
}

class GitError extends Error {
  constructor(
    readonly command: string,
    readonly output: string,
  ) {
    super(`${command} failed: ${output.trim().split("\n").slice(-3).join(" | ")}`);
  }
  get kind(): FailureKind {
    return classifyFailure(this.output);
  }
}

function stop(kind: FailureKind | "safety" | "usage", message: string): never {
  console.error(`✖ BLOCKED (${kind}): ${message}`);
  const code = kind === "lock" ? EXIT.lock : kind === "permission" ? EXIT.permission : kind === "network" ? EXIT.network : kind === "safety" ? EXIT.safety : 1;
  process.exit(code);
}

function guarded<T>(fn: () => T): T {
  try {
    return fn();
  } catch (error) {
    if (error instanceof GitError) stop(error.kind, error.message);
    throw error;
  }
}

function loadConfig(): ScheduleConfig {
  const config = readJson<ScheduleConfig>(CONFIG_PATH);
  const errors = validateScheduleConfig(config);
  if (errors.length) stop("usage", `invalid content-pipeline/schedule.json: ${errors.join("; ")}`);
  return config;
}

function slotArg(): Slot {
  const slot = arg("slot");
  if (!SLOTS.includes(slot as Slot)) stop("usage", "--slot must be morning or evening");
  return slot as Slot;
}

function nowArg(): Date {
  const raw = arg("now");
  const now = raw ? new Date(raw) : new Date();
  if (Number.isNaN(now.getTime())) stop("usage", `invalid --now ${raw}`);
  return now;
}

const baseRef = (c: ScheduleConfig) => `${c.remote}/${c.baseBranch}`;

function showFile(ref: string, path: string): string | undefined {
  const r = run("git", ["show", `${ref}:${path}`]);
  return r.ok ? r.output : undefined;
}

/** owner/repo from the remote URL (works with https, ssh and proxy URLs ending in owner/repo). */
function repoSlug(config: ScheduleConfig): string | undefined {
  const url = run("git", ["remote", "get-url", config.remote]).output.trim();
  const m = url.match(/[/:]([^/:]+)\/([^/]+?)(?:\.git)?\/?$/);
  return m ? `${m[1]}/${m[2]}` : undefined;
}

function compareUrl(config: ScheduleConfig, branch: string): string {
  const slug = repoSlug(config);
  return slug ? `https://github.com/${slug}/compare/${config.baseBranch}...${branch}?expand=1` : `(compare ${config.baseBranch}...${branch} on GitHub)`;
}

/** Unmerged lesson branches on the remote, with their run records and added lessons. */
function readPending(config: ScheduleConfig): PendingRun[] {
  const base = baseRef(config);
  const refs = git("for-each-ref", "--format=%(refname:short)", `refs/remotes/${config.remote}/${config.branchPrefix}`)
    .split("\n")
    .filter(Boolean);
  const baseCatalog = JSON.parse(showFile(base, "src/content/catalog.json") ?? "[]") as CatalogEntry[];
  const pending: PendingRun[] = [];
  for (const ref of refs) {
    if (run("git", ["merge-base", "--is-ancestor", ref, base]).ok) continue; // merged
    const branch = ref.slice(config.remote.length + 1);
    const slotId = slotIdFromBranch(config, branch);
    const recordRaw = slotId ? showFile(ref, runRecordPath(slotId)) : undefined;
    const catalog = JSON.parse(showFile(ref, "src/content/catalog.json") ?? "[]") as CatalogEntry[];
    const coverage = JSON.parse(showFile(ref, "content-pipeline/coverage.json") ?? '{"lessons":[]}') as { lessons: CoverageEntry[] };
    const added = new Set(catalog.filter((c) => !baseCatalog.some((b) => b.slug === c.slug)).map((c) => c.slug));
    pending.push({
      branch,
      record: recordRaw ? (JSON.parse(recordRaw) as RunRecord) : undefined,
      lessons: coverage.lessons
        .filter((l) => added.has(l.slug))
        .map((l) => ({ slug: l.slug, title: l.title, keywords: l.keywords, sources: l.sources })),
    });
  }
  return pending;
}

function readCompletedRuns(config: ScheduleConfig): RunRecord[] {
  const r = run("git", ["ls-tree", "--name-only", `${baseRef(config)}`, "content-pipeline/runs/"]);
  if (!r.ok) return [];
  return r.output
    .split("\n")
    .filter((p) => p.endsWith(".json"))
    .map((p) => JSON.parse(showFile(baseRef(config), p) ?? "null") as RunRecord | null)
    .filter((x): x is RunRecord => x !== null);
}

async function makePlan(config: ScheduleConfig, slot: Slot, now: Date): Promise<Plan> {
  guarded(() => git("fetch", "--prune", config.remote));
  return planRun({
    config,
    slot,
    now,
    lessons: await loadLessons(),
    candidates: readCandidates().candidates,
    pending: guarded(() => readPending(config)),
    completedRuns: readCompletedRuns(config),
  });
}

function printPlan(plan: Plan) {
  console.log(`Slot ${plan.slotId} → ${plan.action.toUpperCase()}  (branch ${plan.branch})`);
  for (const r of plan.reasons) console.log(`  · ${r}`);
  if (plan.candidate) console.log(`  candidate ${plan.candidate.id}: ${plan.candidate.title}\n  ${plan.candidate.url}`);
  console.log(`  pending lesson branches: ${plan.pendingCount}`);
  for (const s of plan.stale) console.log(`  ⚠ stale: ${s}`);
  for (const e of plan.excluded) console.log(`  excluded ${e.id}: ${e.reason}`);
}

function currentBranch(): string {
  return git("rev-parse", "--abbrev-ref", "HEAD");
}

function recordFile(slotId: string) {
  return join(ROOT, runRecordPath(slotId));
}

function readRecord(slotId: string): RunRecord {
  const path = recordFile(slotId);
  if (!existsSync(path)) stop("usage", `no run record ${runRecordPath(slotId)}: claim the slot first`);
  return readJson<RunRecord>(path);
}

function writeRecord(record: RunRecord) {
  mkdirSync(join(ROOT, "content-pipeline/runs"), { recursive: true });
  writeJson(recordFile(record.slotId), record);
}

function push(config: ScheduleConfig, branch: string) {
  assertSafePushTarget(config, branch);
  // Never --force: a rejected push means another run owns this slot.
  guarded(() => git("push", config.remote, `${branch}:refs/heads/${branch}`));
}

/** Safety: the branch must not publish, unpublish or remove any lesson. */
function guardChanges(config: ScheduleConfig): string[] {
  const base = JSON.parse(showFile(baseRef(config), "src/content/catalog.json") ?? "[]") as CatalogEntry[];
  const head = readCatalog();
  // Everything this branch changes vs the base (committed, staged and unstaged).
  const changed = [
    ...run("git", ["diff", "--name-only", baseRef(config)]).output.split("\n"),
    ...run("git", ["ls-files", "--others", "--exclude-standard"]).output.split("\n"),
  ].filter(Boolean);
  const lessonDirs = [...new Set(changed.filter((p) => p.startsWith("src/content/lessons/")).map((p) => p.split("/")[3]))];
  // A lesson folder is "new" when it doesn't exist on the base branch.
  const newSlugs = lessonDirs.filter((slug) => slug && showFile(baseRef(config), `src/content/lessons/${slug}/index.ts`) === undefined);
  const problems = [
    ...findPublishingChanges(base, head).map((s) => `would publish ${s} (only a human runs content:publish)`),
    ...findRemovedLessons(base, head).map((s) => `would remove or unpublish existing lesson ${s}`),
    ...findForbiddenPaths([...new Set(changed)], newSlugs).map((p) => `scheduled runs may not change ${p}`),
  ];
  const branch = currentBranch();
  try {
    assertSafePushTarget(config, branch);
  } catch (error) {
    problems.push((error as Error).message);
  }
  return problems;
}

/* ---------------------------------------------------------------- */
/* commands                                                           */
/* ---------------------------------------------------------------- */

async function cmdDoctor() {
  const config = loadConfig();
  const results: { level: "OK" | "WARN" | "FAIL"; area: string; message: string }[] = [];
  const add = (level: "OK" | "WARN" | "FAIL", area: string, message: string) => results.push({ level, area, message });

  const major = Number(process.versions.node.split(".")[0]);
  add(major >= 22 ? "OK" : "FAIL", "runtime", `Node ${process.versions.node} (need ≥ 22)`);
  add(existsSync(join(ROOT, "node_modules/next")) ? "OK" : "FAIL", "deps", "node_modules installed (run npm ci)");
  for (const skill of ["lesson-discovery", "lesson-generation", "scheduled-lesson"]) {
    add(existsSync(join(ROOT, `.claude/skills/${skill}/SKILL.md`)) ? "OK" : "FAIL", "skills", `.claude/skills/${skill}`);
  }
  const remote = run("git", ["ls-remote", "--heads", config.remote, config.baseBranch]);
  add(remote.ok ? "OK" : "FAIL", remote.ok ? "git" : classifyFailure(remote.output), `read ${config.remote}/${config.baseBranch}${remote.ok ? "" : `: ${remote.output.trim().split("\n").pop()}`}`);
  const gh = run("gh", ["api", `repos/${repoSlug(config) ?? "unknown/unknown"}`, "--jq", ".permissions.push"]);
  add(gh.ok ? "OK" : "WARN", "github-api", gh.ok ? `gh REST access (push permission: ${gh.output.trim()})` : "gh REST API unavailable: the run will report a compare URL instead of opening the PR");
  const sources = readJson<{ seeds: { name: string; url: string }[] }>(join(ROOT, "content-pipeline/sources.json")).seeds;
  const slot = arg("slot") as Slot | undefined;
  const wanted = slot && SLOTS.includes(slot) ? config.slots[slot].seeds : SLOTS.flatMap((s) => config.slots[s].seeds);
  for (const seed of sources.filter((s) => wanted.includes(s.name))) {
    try {
      const res = await fetch(seed.url, { method: "GET", redirect: "manual", signal: AbortSignal.timeout(10_000) });
      add(res.status < 500 ? "OK" : "WARN", "network", `${seed.name}: HTTP ${res.status}`);
    } catch (error) {
      add("WARN", "network", `${seed.name} unreachable from this machine (${(error as Error).message}); add its domain to the cloud environment allowlist`);
    }
  }
  const webkit = run("npx", ["playwright", "--version"]);
  add(webkit.ok ? "OK" : "WARN", "e2e", webkit.ok ? "Playwright available (browsers may still need installing)" : "Playwright unavailable: e2e is optional for scheduled runs");

  for (const r of results) console.log(`${r.level.padEnd(4)} ${r.area.padEnd(10)} ${r.message}`);
  const failed = results.filter((r) => r.level === "FAIL");
  if (failed.length) stop(failed.some((f) => f.area === "network") ? "network" : failed.some((f) => f.area === "permission") ? "permission" : "usage", `${failed.length} preflight check(s) failed`);
  console.log("✔ preflight passed");
}

async function cmdPlan() {
  const config = loadConfig();
  const plan = await makePlan(config, slotArg(), nowArg());
  if (flag("json")) console.log(JSON.stringify(plan, null, 2));
  else printPlan(plan);
}

async function cmdClaim() {
  const config = loadConfig();
  const slot = slotArg();
  const now = nowArg();
  // Only discovery output may be uncommitted; it is committed with the claim.
  const DISCOVERY_FILES = ["content-pipeline/candidates.json", "content-pipeline/sources.json"];
  const dirty = run("git", ["status", "--porcelain"]).output.split("\n").filter(Boolean).map((l) => l.slice(3));
  const unexpected = dirty.filter((f) => !DISCOVERY_FILES.includes(f));
  if (unexpected.length) stop("usage", `working tree has changes other than discovery output: ${unexpected.join(", ")}`);
  const plan = await makePlan(config, slot, now);
  printPlan(plan);
  if (plan.action !== "generate" || !plan.candidate) {
    console.log(`NO-OP nothing to claim: plan says ${plan.action} (${plan.reasons.join("; ")})`);
    process.exit(2);
  }
  const head = git("rev-parse", "HEAD");
  if (head !== git("rev-parse", baseRef(config))) stop("usage", `start from the latest ${baseRef(config)} (HEAD is ${head.slice(0, 7)})`);
  if (dirty.length) {
    const r = run("npm", ["run", "-s", "content:candidates"]);
    if (!r.ok) stop("usage", `discovery output is invalid: ${r.output.trim().split("\n").slice(-3).join(" | ")}`);
  }

  guarded(() => git("switch", "-c", plan.branch, baseRef(config)));
  guarded(() => git("branch", "--unset-upstream"));
  const c = plan.candidate;
  writeRecord({
    version: 1,
    slotId: plan.slotId,
    slot,
    date: plan.date,
    status: "claimed",
    claimedAt: now.toISOString(),
    updatedAt: now.toISOString(),
    candidateId: c.id,
    url: c.url,
    title: c.title,
    keywords: c.keywords,
  });
  guarded(() => git("add", runRecordPath(plan.slotId), ...dirty));
  guarded(() => git("commit", "-q", "-m", `chore(schedule): claim ${plan.slotId} for ${c.id}`));
  push(config, plan.branch);
  console.log(`✔ CLAIMED ${plan.slotId} on ${plan.branch} → candidate ${c.id}`);
}

function runChecks(e2e: boolean): { name: string; ok: boolean; detail?: string }[] {
  const steps: [string, string[], Record<string, string>?][] = [
    ["lint", ["run", "lint"]],
    ["typecheck", ["run", "typecheck"]],
    ["unit tests", ["run", "test"]],
    ["content:validate", ["run", "content:validate"]],
    ["build", ["run", "build"], { SHOW_DRAFT_LESSONS: "true" }],
  ];
  if (e2e) steps.push(["e2e", ["run", "test:e2e"]]);
  return steps.map(([name, args, env]) => {
    const r = run("npm", args, env);
    const tail = r.output.trim().split("\n").filter(Boolean).slice(-2).join(" | ").slice(0, 300);
    console.log(`${r.ok ? "✔" : "✖"} ${name}`);
    return { name, ok: r.ok, detail: r.ok ? undefined : tail };
  });
}

async function commitAndReport(config: ScheduleConfig, record: RunRecord, message: string) {
  writeRecord(record);
  writeFileSync(join(ROOT, `content-pipeline/runs/${record.slotId}.md`), prBody(config, record));
  guarded(() => git("add", "-A"));
  const problems = guardChanges(config);
  if (problems.length) stop("safety", problems.join("; "));
  guarded(() => git("commit", "-q", "-m", message));
  push(config, record.slotId ? `${config.branchPrefix}${record.slotId}` : currentBranch());
  console.log(`\nRESULT ${record.status.toUpperCase()} ${record.slotId}`);
  console.log(`branch  ${config.branchPrefix}${record.slotId}`);
  console.log(`compare ${compareUrl(config, `${config.branchPrefix}${record.slotId}`)}`);
  for (const b of record.blockers ?? []) console.log(`blocker ${b}`);
  for (const f of record.reviewFlags ?? []) console.log(`review  ${f}`);
}

function prBody(config: ScheduleConfig, r: RunRecord): string {
  const label = config.slots[r.slot].label;
  return `## ${r.status === "generated" ? "Draft lesson" : "BLOCKED run"} · ${label} · ${r.slotId}

Scheduled run (\`${r.slot}\`, Europe/Paris ${r.date}). **Draft only: not published, not approved.**

- Candidate: \`${r.candidateId ?? "none"}\`${r.title ? ` · ${r.title}` : ""}
- Source: ${r.url ?? "n/a"}
- Lesson: ${r.slug ? `\`${r.slug}\` (review report: \`content-pipeline/reviews/${r.slug}.md\`)` : "none"}

### Checks run by the scheduler
${(r.checks ?? []).map((c) => `- ${c.ok ? "✅" : "❌"} ${c.name}${c.detail ? `: ${c.detail}` : ""}`).join("\n") || "- none (run stopped before checks)"}

### Blockers
${(r.blockers ?? []).map((b) => `- ${b}`).join("\n") || "- none"}

### Needs human review
${(r.reviewFlags ?? []).map((f) => `- [ ] ${f}`).join("\n") || "- [ ] full technical review (content-pipeline/REVIEW.md)"}

To approve: review on the Vercel preview and merge this PR **as a draft** (hidden in production). Then publish from your own terminal on a \`publish/<slug>\` branch: \`npm run content:publish -- ${r.slug ?? "<slug>"} --reviewer "<name>"\`, open that PR, merge.
To reject: close this PR and delete the branch (see content-pipeline/SCHEDULING.md).

🤖 Generated by a Claude Code scheduled task
`;
}

function unregister(slug: string) {
  const catalog = readCatalog().filter((e) => e.slug !== slug);
  writeJson(PATHS.catalog, catalog);
  // The candidate goes back to the pool; the pending branch still prevents duplicates.
  const candidates = readCandidates();
  for (const c of candidates.candidates) {
    if (c.lessonSlug === slug) {
      c.status = "shortlisted";
      delete c.lessonSlug;
    }
  }
  writeCandidates(candidates);
  const r = run("npm", ["run", "-s", "content:registry"]);
  if (!r.ok) stop("usage", `content:registry failed: ${r.output}`);
}

async function cmdFinish() {
  const config = loadConfig();
  const slot = slotArg();
  const branch = currentBranch();
  const slotId = slotIdFromBranch(config, branch);
  if (!slotId || !slotId.endsWith(slot)) stop("usage", `run finish on the claimed ${slot} branch (current: ${branch})`);
  const record = readRecord(slotId);
  const slug = arg("slug");
  const blockers = process.argv.flatMap((a, i, all) => (all[i - 1] === "--blocker" ? [a] : []));

  const lessons = await loadLessons();
  const lesson = slug ? lessons.find((l) => l.slug === slug) : undefined;
  if (slug && !lesson) stop("usage", `lesson ${slug} is not registered (run content:new first)`);
  if (lesson && lesson.status !== "draft") stop("safety", `${slug} is ${lesson.status}; scheduled runs only create drafts`);
  const report = lesson ? checkLessonQuality(lesson, { lessons, catalog: readCatalog() }) : undefined;

  // A lesson that fails hard gates stays in the branch as files for review,
  // but is removed from the catalog so the app and the test suite still build.
  if (lesson && report && (report.errors.length || blockers.length)) {
    unregister(lesson.slug);
    console.log(`• ${lesson.slug} unregistered (kept as files for review)`);
  }

  // Record the selection and regenerate derived files BEFORE the checks, so the
  // checks cover exactly what gets committed.
  if (lesson && report && !report.errors.length && !blockers.length) {
    const candidates = readCandidates();
    const c = candidates.candidates.find((x) => x.id === record.candidateId);
    if (c) {
      c.status = "selected";
      c.lessonSlug = lesson.slug;
      writeCandidates(candidates);
    }
    for (const args of [["run", "-s", "content:registry"], ["run", "-s", "content:report", "--", lesson.slug]]) {
      const r = run("npm", args);
      if (!r.ok) stop("usage", `npm ${args.join(" ")} failed: ${r.output.trim()}`);
    }
  }

  const checks = runChecks(flag("e2e"));
  const outcome = decideOutcome(report, checks, REQUIRED_CHECKS);
  const status = blockers.length ? "blocked" : outcome.status;
  await commitAndReport(
    config,
    {
      ...record,
      status,
      slug,
      updatedAt: new Date().toISOString(),
      checks,
      reviewFlags: report?.reviewFlags ?? [],
      blockers: [...blockers, ...outcome.blockers],
    },
    `content(schedule): ${slotId} ${slug ?? "no lesson"} (${status})`,
  );
  if (status !== "generated") process.exit(1);
}

async function cmdBlock() {
  const config = loadConfig();
  const slot = slotArg();
  const branch = currentBranch();
  const slotId = slotIdFromBranch(config, branch);
  if (!slotId || !slotId.endsWith(slot)) stop("usage", `run block on the claimed ${slot} branch (current: ${branch})`);
  const blockers = process.argv.flatMap((a, i, all) => (all[i - 1] === "--blocker" ? [a] : []));
  if (!blockers.length) stop("usage", 'pass at least one --blocker "<reason>"');
  const record = readRecord(slotId);
  // Unregister anything half-made (registration files back to the claim commit,
  // which keeps any discovery output) but keep the lesson files for a human to
  // look at. Nothing is deleted.
  const reset = run("git", [
    "checkout",
    "HEAD",
    "--",
    "src/content/catalog.json",
    "src/content/lessons/registry.ts",
    "content-pipeline/coverage.json",
    "content-pipeline/candidates.json",
  ]);
  if (!reset.ok) stop(classifyFailure(reset.output), `could not reset registration files: ${reset.output.trim()}`);
  await commitAndReport(
    config,
    { ...record, status: "blocked", updatedAt: new Date().toISOString(), blockers },
    `chore(schedule): ${slotId} blocked`,
  );
  process.exit(1);
}

function cmdPr() {
  const config = loadConfig();
  const slot = slotArg();
  const branch = currentBranch();
  const slotId = slotIdFromBranch(config, branch);
  if (!slotId || !slotId.endsWith(slot)) stop("usage", `run pr on the claimed ${slot} branch (current: ${branch})`);
  const record = readRecord(slotId);
  if (record.status === "claimed") stop("usage", "finish or block the run before opening a PR");
  const repo = repoSlug(config);
  const owner = repo?.split("/")[0];
  // REST only: the cloud GitHub proxy rejects GraphQL (so no `gh pr create`).
  const existing = run("gh", ["api", `repos/${repo}/pulls?state=open&head=${owner}:${branch}`, "--jq", ".[0].html_url // empty"]);
  let url = existing.ok ? existing.output.trim() : "";
  if (!url) {
    const title = `${record.status === "blocked" ? "[BLOCKED] " : ""}Draft lesson (${config.slots[slot].label}, ${record.date}): ${record.title ?? record.slotId}`;
    const created = run("gh", [
      "api",
      `repos/${repo}/pulls`,
      "-f", `title=${title}`,
      "-f", `head=${branch}`,
      "-f", `base=${config.baseBranch}`,
      "-f", `body=${readFileSync(join(ROOT, `content-pipeline/runs/${slotId}.md`), "utf8")}`,
      "-F", "draft=true",
      "--jq", ".html_url",
    ]);
    if (!created.ok) {
      console.log(`⚠ could not open the PR via the GitHub REST API (${classifyFailure(created.output)}): ${created.output.trim().split("\n").pop()}`);
      console.log(`PR      ${compareUrl(config, branch)}  (open manually)`);
      return;
    }
    url = created.output.trim();
  }
  console.log(`PR      ${url}`);
}

function cmdGuard() {
  const config = loadConfig();
  const problems = guardChanges(config);
  for (const p of problems) console.error(`✖ ${p}`);
  if (problems.length) stop("safety", `${problems.length} safety violation(s)`);
  console.log("✔ guard passed: no publishing, no removals, safe branch");
}

const commands: Record<string, () => unknown> = {
  doctor: cmdDoctor,
  plan: cmdPlan,
  claim: cmdClaim,
  finish: cmdFinish,
  block: cmdBlock,
  pr: cmdPr,
  guard: cmdGuard,
  date: () => {
    const config = loadConfig();
    const d = localDate(nowArg(), config.timezone);
    console.log(`${d.date} weekday=${d.weekday} hour=${d.hour} (${config.timezone})`);
  },
};

const name = process.argv[2];
if (!name || !commands[name]) stop("usage", `usage: npm run schedule -- <${Object.keys(commands).join("|")}> --slot <morning|evening>`);
await commands[name]();
