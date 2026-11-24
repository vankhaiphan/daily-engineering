import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { listAllLessons } from "@/content";
import { CATALOG } from "@/content/catalog";
import type { Candidate } from "@/content/pipeline";
import { checkLessonQuality } from "@/content/quality";
import {
  assertSafePushTarget,
  branchOf,
  classifyFailure,
  decideOutcome,
  findPublishingChanges,
  findRemovedLessons,
  localDate,
  planRun,
  slotIdFromBranch,
  validateScheduleConfig,
  type PendingRun,
  type RunRecord,
  type ScheduleConfig,
} from "@/content/schedule";

const read = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
const config = JSON.parse(read("content-pipeline/schedule.json")) as ScheduleConfig;
const lessons = listAllLessons();

// Wednesday 2026-11-25: 06:37 and 17:37 in Paris (UTC+1 in winter).
const WED_MORNING = new Date("2026-11-25T05:37:00Z");
const WED_EVENING = new Date("2026-11-25T16:37:00Z");

function candidate(overrides: Partial<Candidate>): Candidate {
  return {
    id: "c",
    url: "https://example.com/article",
    title: "An article",
    publisher: "Example",
    authors: [],
    publishedOn: "2026-10-01",
    discoveredOn: "2026-11-24",
    discoveredVia: "test",
    kind: "recent",
    track: "morning",
    keywords: ["unique topic alpha", "beta gamma"],
    scores: { technicalRelevance: 4, educationalDepth: 4, credibility: 4, novelty: 4, careerValue: 4, engagement: null },
    engagementNote: "n/a",
    total: 75,
    status: "shortlisted",
    decision: "test",
    ...overrides,
  };
}

const record = (overrides: Partial<RunRecord>): RunRecord => ({
  version: 1,
  slotId: "2026-11-24-morning",
  slot: "morning",
  date: "2026-11-24",
  status: "generated",
  claimedAt: "2026-11-24T05:40:00Z",
  updatedAt: "2026-11-24T06:20:00Z",
  ...overrides,
});

const plan = (o: { now?: Date; slot?: "morning" | "evening"; candidates?: Candidate[]; pending?: PendingRun[]; completed?: RunRecord[]; cfg?: Partial<ScheduleConfig> }) =>
  planRun({
    config: { ...config, ...o.cfg },
    slot: o.slot ?? "morning",
    now: o.now ?? WED_MORNING,
    lessons,
    candidates: o.candidates ?? [],
    pending: o.pending ?? [],
    completedRuns: o.completed ?? [],
  });

describe("schedule configuration", () => {
  it("is valid, uses Europe/Paris and keeps the two tracks disjoint", () => {
    expect(validateScheduleConfig(config)).toEqual([]);
    expect(config.timezone).toBe("Europe/Paris");
    expect(validateScheduleConfig({ ...config, maxPendingLessons: 0 })).toContain("maxPendingLessons must be ≥ 1");
    const overlapping = structuredClone(config);
    overlapping.slots.evening.topics.push("ai-agents");
    expect(validateScheduleConfig(overlapping).some((e) => e.includes("topics in both slots"))).toBe(true);
  });

  it("every candidate has a track", () => {
    const { candidates } = JSON.parse(read("content-pipeline/candidates.json")) as { candidates: Candidate[] };
    expect(candidates.every((c) => c.track === "morning" || c.track === "evening")).toBe(true);
  });
});

describe("Europe/Paris dates", () => {
  it.each([
    ["2026-11-25T05:37:00Z", "2026-11-25", 3, 6],
    ["2026-11-24T23:30:00Z", "2026-11-25", 3, 0], // after midnight in Paris, still the 24th in UTC
    ["2026-07-01T04:37:00Z", "2026-07-01", 3, 6], // summer time (UTC+2)
    ["2026-03-29T01:30:00Z", "2026-03-29", 7, 3], // DST switch night
  ])("%s → %s (weekday %i, hour %i)", (iso, date, weekday, hour) => {
    expect(localDate(new Date(iso), "Europe/Paris")).toEqual({ date, weekday, hour });
  });
});

describe("morning/evening topic selection", () => {
  const morningA = candidate({ id: "m-a", total: 80 });
  const morningB = candidate({ id: "m-b", total: 90, url: "https://example.com/b", keywords: ["delta epsilon"] });
  const evening = candidate({ id: "e-a", track: "evening", total: 99, url: "https://example.com/e", keywords: ["zeta eta"] });

  it("picks the best candidate of the slot's own track", () => {
    expect(plan({ candidates: [morningA, morningB, evening] }).candidate?.id).toBe("m-b");
    expect(plan({ slot: "evening", now: WED_EVENING, candidates: [morningA, morningB, evening] }).candidate?.id).toBe("e-a");
  });

  it("is deterministic: ties break on date, then id", () => {
    const x = candidate({ id: "x", total: 80, publishedOn: "2026-01-01", url: "https://e.com/x", keywords: ["x1"] });
    const y = candidate({ id: "y", total: 80, publishedOn: "2026-06-01", url: "https://e.com/y", keywords: ["y1"] });
    expect(plan({ candidates: [x, y] }).candidate?.id).toBe("y");
    expect(plan({ candidates: [y, x] }).candidate?.id).toBe("y");
  });

  it("skips undated, non-shortlisted and already-published topics", () => {
    const p = plan({
      candidates: [
        candidate({ id: "undated", publishedOn: null }),
        candidate({ id: "rejected", status: "rejected" }),
        candidate({ id: "dup", url: "https://www.anthropic.com/research/demystifying-evals-for-ai-agents" }),
      ],
    });
    expect(p.action).toBe("discover");
    expect(p.excluded.map((e) => e.id).sort()).toEqual(["dup", "rejected", "undated"]);
    expect(p.excluded.find((e) => e.id === "dup")?.reason).toContain("agent-evals");
  });

  it("asks for discovery when the track has nothing eligible", () => {
    const p = plan({ slot: "evening", now: WED_EVENING, candidates: [morningA] });
    expect(p.action).toBe("discover");
    expect(p.reasons[0]).toContain("Engineering Mastery");
  });
});

describe("duplicate detection across pending PRs", () => {
  const c = candidate({ id: "topic", url: "https://example.com/context", title: "Context engineering for agents", keywords: ["context engineering", "agent memory", "compaction"] });

  it.each<[string, PendingRun]>([
    ["same candidate", { branch: "content/2026-11-24-morning", record: record({ candidateId: "topic" }) }],
    ["same source URL", { branch: "content/2026-11-24-morning", record: record({ url: "https://example.com/context/?utm=x" }) }],
    ["overlapping keywords", { branch: "content/2026-11-24-morning", record: record({ keywords: ["context engineering", "agent memory", "compaction"] }) }],
    ["a hand-made branch adding the same lesson", { branch: "content/context-lesson", lessons: [{ slug: "context", title: "Context engineering for agents", keywords: ["x"], sources: [] }] }],
  ])("rejects a topic pending as %s", (_label, pending) => {
    const p = plan({ candidates: [c], pending: [pending] });
    expect(p.action).toBe("discover");
    expect(p.excluded[0].reason).toMatch(/pending|progress/);
  });
});

describe("daily-slot idempotency", () => {
  const c = candidate({ id: "fresh" });

  it("no-ops when the slot branch already exists (retry or concurrent run)", () => {
    const p = plan({ candidates: [c], pending: [{ branch: "content/2026-11-25-morning", record: record({ slotId: "2026-11-25-morning", status: "claimed" }) }] });
    expect(p).toMatchObject({ action: "noop", branch: "content/2026-11-25-morning" });
    expect(p.reasons[0]).toContain("already claimed");
  });

  it("no-ops when the slot's run was already merged", () => {
    expect(plan({ candidates: [c], completed: [record({ slotId: "2026-11-25-morning" })] }).action).toBe("noop");
  });

  it("the other slot of the same day is independent", () => {
    const p = plan({
      slot: "evening",
      now: WED_EVENING,
      candidates: [candidate({ id: "ev", track: "evening" })],
      pending: [{ branch: "content/2026-11-25-morning", record: record({ slotId: "2026-11-25-morning" }) }],
    });
    expect(p.action).toBe("generate");
  });

  it("reports stale claims", () => {
    const p = plan({ candidates: [c], pending: [{ branch: "content/2026-11-24-morning", record: record({ status: "claimed", claimedAt: "2026-11-24T05:40:00Z" }) }] });
    expect(p.stale).toHaveLength(1);
  });

  it("derives one branch per slot, and only those may be pushed", () => {
    expect(branchOf(config, "2026-11-25-morning")).toBe("content/2026-11-25-morning");
    expect(slotIdFromBranch(config, "content/2026-11-25-evening")).toBe("2026-11-25-evening");
    expect(slotIdFromBranch(config, "content/some-lesson")).toBeUndefined();
    expect(() => assertSafePushTarget(config, "content/2026-11-25-morning")).not.toThrow();
    for (const bad of ["main", "master", "content/some-lesson", "feat/x", "content/2026-11-25-night"]) {
      expect(() => assertSafePushTarget(config, bad)).toThrow();
    }
  });
});

describe("graceful no-op runs", () => {
  it.each([
    ["weekend", { now: new Date("2026-11-28T05:37:00Z") }],
    ["review backlog", { pending: Array.from({ length: config.maxPendingLessons }, (_, i) => ({ branch: `content/2026-11-1${i}-morning` })) }],
  ])("%s", (_label, o) => {
    const p = plan({ candidates: [candidate({})], ...o });
    expect(p.action).toBe("noop");
    expect(p.candidate).toBeUndefined();
  });

  it("the backlog threshold is configurable", () => {
    const pending = [{ branch: "content/2026-11-20-morning" }];
    expect(plan({ candidates: [candidate({})], pending, cfg: { maxPendingLessons: 1 } }).action).toBe("noop");
    expect(plan({ candidates: [candidate({})], pending, cfg: { maxPendingLessons: 2 } }).action).toBe("generate");
  });
});

describe("evidence and validation failures block the run", () => {
  const lesson = lessons.find((l) => l.slug === "agent-evals")!;
  const allPass = ["lint", "typecheck", "unit tests", "content:validate", "build"].map((name) => ({ name, ok: true }));
  const required = allPass.map((c) => c.name);

  it("generated only when gates and every required check pass", () => {
    const report = checkLessonQuality(lesson, { lessons, catalog: CATALOG });
    expect(decideOutcome(report, allPass, required)).toEqual({ status: "generated", blockers: [] });
  });

  it("missing evidence on a claim blocks", () => {
    const broken = structuredClone(lesson);
    broken.review.claims[0].evidence = "";
    const report = checkLessonQuality(broken, { lessons, catalog: CATALOG });
    const outcome = decideOutcome(report, allPass, required);
    expect(outcome.status).toBe("blocked");
    expect(outcome.blockers.some((b) => b.includes("evidence"))).toBe(true);
  });

  it("an invalid source blocks", () => {
    const broken = structuredClone(lesson);
    broken.sources[0].url = "http://insecure.example.com";
    const outcome = decideOutcome(checkLessonQuality(broken, { lessons, catalog: CATALOG }), allPass, required);
    expect(outcome.blockers.some((b) => b.includes("https"))).toBe(true);
  });

  it("a failed or skipped check blocks; review flags alone do not", () => {
    // A scheduled run's lesson is a draft; on a draft, a needs-review claim is a flag, not an error.
    const flagged = structuredClone(lesson);
    flagged.status = "draft";
    flagged.review.claims.push({ id: "q", claim: "x", evidence: "unconfirmed", status: "needs-review" });
    const catalog = CATALOG.map((e) => (e.slug === flagged.slug ? { ...e, status: "draft" as const } : e));
    const report = checkLessonQuality(flagged, { lessons, catalog });
    expect(report.reviewFlags.some((f) => f.includes("needs review"))).toBe(true);
    expect(decideOutcome(report, allPass, required).status).toBe("generated");
    expect(decideOutcome(report, allPass.map((c) => (c.name === "build" ? { ...c, ok: false } : c)), required).blockers).toContain("check failed: build");
    expect(decideOutcome(report, allPass.filter((c) => c.name !== "lint"), required).blockers).toContain("required check not run: lint");
    expect(decideOutcome(undefined, allPass, required).blockers).toContain("no lesson was produced");
  });
});

describe("no automatic publishing or merging", () => {
  it("detects a change that would publish, unpublish or remove a lesson", () => {
    const base = [
      { slug: "a", status: "published" as const, createdOn: "2026-11-24" },
      { slug: "b", status: "draft" as const, createdOn: "2026-11-24" },
    ];
    expect(findPublishingChanges(base, [...base, { slug: "c", status: "draft", createdOn: "2026-11-25" }])).toEqual([]);
    expect(findPublishingChanges(base, [base[0], { ...base[1], status: "published" }])).toEqual(["b"]);
    expect(findPublishingChanges(base, [...base, { slug: "c", status: "published", createdOn: "2026-11-25" }])).toEqual(["c"]);
    expect(findRemovedLessons(base, [base[1]])).toEqual(["a"]);
    expect(findRemovedLessons(base, [{ ...base[0], status: "draft" }, base[1]])).toEqual(["a"]);
  });

  it("the scheduler code never publishes, merges, deletes branches or force-pushes", () => {
    const code = read("scripts/content/schedule.mts")
      .split("\n")
      .filter((line) => !line.trim().startsWith("*") && !line.trim().startsWith("//"))
      .join("\n");
    for (const forbidden of ["content:publish\"", "\"merge\"", "--force", "\"-f\", \"", "push --delete", "\"--delete\"", "gh pr merge", "/merge"]) {
      expect(code).not.toContain(forbidden);
    }
    // The only push is guarded by assertSafePushTarget.
    expect(code.match(/git\("push"/g)).toHaveLength(1);
    expect(code).toMatch(/assertSafePushTarget\(config, branch\);\s*guarded\(\(\) => git\("push"/);
  });

  it("the scheduled prompts and skill forbid publishing and merging", () => {
    const dir = new URL("../../content-pipeline/scheduled/", import.meta.url);
    const texts = [
      ...readdirSync(dir).map((f) => readFileSync(new URL(f, dir), "utf8")),
      read(".claude/skills/scheduled-lesson/SKILL.md"),
    ];
    for (const text of texts) {
      expect(text).toMatch(/never (run )?`?(npm run )?content:publish/i);
      expect(text).toMatch(/never merge/i);
    }
  });
});

describe("failure classification for run reports", () => {
  it.each([
    ["! [rejected] content/x -> content/x (fetch first)", "lock"],
    ["remote: Permission to o/r.git denied to bot. fatal: unable to access: The requested URL returned error: 403", "permission"],
    ["fatal: unable to access 'https://github.com/o/r/': Could not resolve host: github.com", "network"],
    ["npm ERR! network request to https://registry.npmjs.org failed, reason: getaddrinfo ENOTFOUND", "network"],
    ["something else", "unknown"],
  ])("%s → %s", (output, kind) => {
    expect(classifyFailure(output)).toBe(kind);
  });
});

describe("content:publish is human-only", () => {
  it.each(["DAILY_ENGINEERING_SCHEDULED", "CLAUDE_CODE_REMOTE"])("refuses when %s is set, before touching any file", async (marker) => {
    const { spawnSync } = await import("node:child_process");
    const root = new URL("../../", import.meta.url).pathname;
    const r = spawnSync("npx", ["tsx", "scripts/content/publish.mts", "agent-evals", "--reviewer", "bot"], {
      cwd: root,
      encoding: "utf8",
      env: { ...process.env, DAILY_ENGINEERING_SCHEDULED: "", CLAUDE_CODE_REMOTE: "", [marker]: marker === "CLAUDE_CODE_REMOTE" ? "true" : "1" },
    });
    expect(r.status).toBe(1);
    expect(r.stderr).toContain("human-only");
    expect(r.stderr).toContain(marker);
  }, 30_000);
});

describe("scheduled runs may only add a draft lesson (local guard + CI check)", async () => {
  const { findForbiddenPaths } = await import("@/content/schedule");
  const { check } = (await import("../../scripts/ci/content-safety.mjs")) as {
    check: (i: object) => string[];
  };
  const base = [{ slug: "a", status: "published" }];
  const ok = {
    branch: "content/2026-11-25-morning",
    baseCatalog: base,
    headCatalog: [...base, { slug: "new", status: "draft" }],
    baseLessonDirs: ["a", "registry.ts"],
    readHead: () => 'status: "draft"',
    changed: ["src/content/catalog.json", "src/content/lessons/registry.ts", "src/content/lessons/new/en.ts", "src/content/lessons/new/index.ts", "content-pipeline/runs/2026-11-25-morning.json", "content-pipeline/coverage.json"],
  };

  it("allows a new draft lesson with its pipeline records", () => {
    expect(check(ok)).toEqual([]);
    expect(findForbiddenPaths(ok.changed, ["new"])).toEqual([]);
  });

  it.each([
    ["publishing via the catalog", { headCatalog: [...base, { slug: "new", status: "published" }] }, "publishes new"],
    ["publishing via the lesson index", { readHead: () => 'status: "published"' }, 'declares status "published"'],
    ["unpublishing an existing lesson", { headCatalog: [{ slug: "a", status: "draft" }, { slug: "new", status: "draft" }] }, "unpublishes a"],
    ["editing an existing lesson", { changed: [...ok.changed, "src/content/lessons/a/en.ts"] }, "changes src/content/lessons/a/en.ts"],
    ["editing the CI workflow", { changed: [...ok.changed, ".github/workflows/content-safety.yml"] }, "changes .github/workflows"],
    ["editing scripts or settings", { changed: [...ok.changed, "scripts/content/publish.mts", ".claude/settings.json"] }, "changes scripts/content/publish.mts"],
  ])("rejects %s", (_label, override, message) => {
    const violations = check({ ...ok, ...override });
    expect(violations.join("\n")).toContain(message);
  });

  it("local guard agrees on forbidden paths", () => {
    expect(findForbiddenPaths(["src/content/lessons/a/en.ts", ".github/workflows/x.yml", "src/app/page.tsx"], ["new"])).toHaveLength(3);
  });

  it("ignores PRs that are not scheduled-run branches (e.g. a human publish PR)", () => {
    expect(check({ ...ok, branch: "publish/new", headCatalog: [...base, { slug: "new", status: "published" }] })).toEqual([]);
  });
});

describe("content:publish requires a human at an interactive terminal", () => {
  it("refuses without a TTY even when the cloud markers are cleared", async () => {
    const { spawnSync } = await import("node:child_process");
    const root = new URL("../../", import.meta.url).pathname;
    const r = spawnSync("npx", ["tsx", "scripts/content/publish.mts", "agent-evals", "--reviewer", "bot"], {
      cwd: root,
      encoding: "utf8",
      env: { ...process.env, DAILY_ENGINEERING_SCHEDULED: "", CLAUDE_CODE_REMOTE: "" },
    });
    expect(r.status).toBe(1);
    expect(r.stderr).toContain("interactive terminal");
  }, 30_000);
});
