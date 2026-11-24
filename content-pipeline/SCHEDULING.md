# Scheduled lessons (Phase 4)

Two weekday Claude Code **cloud scheduled tasks** run the existing lesson engine unattended and each opens one **draft** PR. A human still reviews, publishes (`content:publish`) and merges. Runs never publish, merge, push `main`, force-push or delete branches.

| Slot | Track | Topics (`schedule.json`) | Suggested time (Europe/Paris) |
|---|---|---|---|
| `morning` | AI Discovery | Claude Code, Codex, AI agents, multi-agent, AI SDLC, MCP, agent evals | 06:37, Mon–Fri |
| `evening` | Engineering Mastery | System design, distributed systems, AWS, backend, algorithms, reliability, interview prep | 17:37, Mon–Fri |

Prompts to paste into the tasks: [`scheduled/morning.md`](scheduled/morning.md), [`scheduled/evening.md`](scheduled/evening.md). Both delegate to the project skill [`.claude/skills/scheduled-lesson`](../.claude/skills/scheduled-lesson/SKILL.md).

## How a run stays safe and idempotent
- **One branch per slot** (`content/<YYYY-MM-DD>-<morning|evening>`, Europe/Paris date). `claim` creates it with a plain push; a concurrent or retried run gets "rejected" and stops (exit 3). The same rule gives at most one PR per slot.
- **Pending topics are visible to the next run.** Each slot branch carries `content-pipeline/runs/<slot>.json` (topic, URL, keywords, status). `plan` reads every unmerged `content/*` branch with plain git, including hand-made ones (through their `coverage.json`), and skips topics already pending.
- **Backlog limit.** No new run starts while `maxPendingLessons` (default 4) lesson branches await review. Set it in `schedule.json`.
- **Drafts only, enforced in layers:**
  1. **GitHub ruleset on `main`** (required, see setup): PRs only, your code-owner approval required on every PR (so no bot PR, under any branch name, can be merged without you), no force-push or deletion, and the `content-safety` check required.
  2. **`content-safety` CI check** (`.github/workflows/content-safety.yml`, rules in `scripts/ci/content-safety.mjs`) on **every** PR, whatever its branch name:
     - `catalog.json` is strictly valid, and `registry.ts` must equal the generator's output (no hand-written code there).
     - No lesson is removed or unpublished, and files of existing lessons can't change.
     - Publishing is only allowed in a `publish/<slug>` PR that publishes exactly that lesson and touches only its `index.ts`/`review.ts` and the pipeline records.
     - New lesson files must be flat `.ts` files importing only `@/content/schema`, `@/lib/i18n/config`, `@/lib/format` or sibling files, with no dynamic code, IO or globals.
     - PRs from `content/<date>-<slot>` branches may only add a new lesson folder and pipeline records.

     It runs via `pull_request_target`, i.e. **from `main`'s copy** of the workflow and script; it reads the PR only as git data (renames off, so moved files show both paths). A PR can't weaken the check that judges it. Publish status shown by the app comes only from `catalog.json`, so a lesson module can't publish itself.
  3. **`content:publish` is human-only:** it requires an interactive terminal and asks you to retype the slug (agent tool calls aren't terminals), and it refuses when `DAILY_ENGINEERING_SCHEDULED` or `CLAUDE_CODE_REMOTE` is set.
  4. **Local guard:** `finish`/`block` refuse to commit the same violations as the CI check, and push only the slot branch, never with force.
  5. Best effort only: `.claude/settings.json` denies common forms of publish, force-push, pushes to `main`, branch deletion and PR merge. Prefix rules can be sidestepped, so they are a convenience, not a boundary.
- **Honest outcomes.** `finish` runs lint, typecheck, unit tests, content validation and the production build itself and records the results. `GENERATED` only if all pass. Otherwise `BLOCKED`: the lesson stays as files in the PR for review, unregistered so the app still builds. Review flags (`needs-review` claims) don't block the PR; they block `content:publish`.
- **Graceful no-ops.** Weekends, a claimed or merged slot, a full review queue, no eligible topic after discovery: the run reports and stops without pushing anything.

## Commands
```bash
npm run schedule -- doctor  --slot morning          # preflight: Node, deps, skills, git, GitHub REST, source reachability
npm run schedule -- plan    --slot morning [--now 2026-11-25T05:37:00Z] [--json]
npm run schedule -- claim   --slot morning          # lock the slot (push content/<date>-morning)
npm run schedule -- finish  --slot morning --slug <slug> [--e2e]
npm run schedule -- block   --slot morning --blocker "<why>"
npm run schedule -- pr      --slot morning          # draft PR via GitHub REST (gh api), else compare URL
npm run schedule -- guard                            # safety check on the current branch
```
Exit codes: `0` ok · `1` failed or blocked · `2` nothing to do (no-op) · `3` slot owned by another run · `4` permission denied · `5` network unavailable · `6` safety violation.

## One-time setup

### 1. GitHub
1. Install the **Claude GitHub App** on `vankhaiphan/daily-engineering` (or connect with `/web-setup`). Cloud runs reach GitHub only through Anthropic's GitHub proxy; no token lives in the repo or the VM.
2. **Protect `main`** with a ruleset (Settings → Rules → Rulesets), **required before activating the schedules**: target `main`; require a pull request before merging with **1 approval** and **Require review from Code Owners** (`.github/CODEOWNERS` names you for every path, so a bot can never supply the approval, whatever branch name it uses); require the status check **`scheduled-run-safety`** (from the `content-safety` workflow; it appears after its first run); block force pushes; restrict deletions. Add yourself (repository admin) to the bypass list so you can still merge your own PRs. The GitHub proxy doesn't restrict which branch a run can push. This ruleset is what actually enforces "never push to main" and "never merge"; the scripts and settings are extra layers.
3. PRs are created with the REST API (`gh api repos/{owner}/{repo}/pulls`) because the proxy rejects GraphQL (`gh pr create`). If that still fails, the run reports the compare URL and you open the PR by hand.

### 2. Cloud environment (claude.ai/code → environment settings)
- **Network access:** `Limited` with **Allow package managers** checked (npm registry), plus these **Allowed domains** for research (WebFetch obeys the environment policy):
  ```
  anthropic.com
  www.anthropic.com
  claude.dev
  aws.amazon.com
  builder.aws.com
  docs.aws.amazon.com
  developers.openai.com
  ```
  Add a domain here before adding a new discovery seed to `sources.json`. (`Full` access also works but is broader than needed.)
- **Setup script:** not required. Node 22 is preinstalled, and the skill runs `npm ci` from `package-lock.json` when `node_modules` is missing. Optional, to cache dependencies, if your environment runs it from the repo checkout: `npm ci || true`.
- **Environment variables:** set `DAILY_ENGINEERING_SCHEDULED=1` (a marker, not a secret). It makes `content:publish` refuse to run in this environment. No secrets are needed: the app calls no LLM API at runtime, and neither do the content scripts.
- **E2E:** Playwright browsers aren't on the default allowlist, so scheduled runs skip e2e (recorded as not run). Run `npm run test:e2e` locally or rely on the PR preview.

### 3. The two tasks (create them, but leave them **paused** until the smoke test passes)
At claude.ai/code/routines (or `/schedule` in the CLI), for each slot:
- Repository: `vankhaiphan/daily-engineering` (default branch `main`).
- Environment: the one configured above.
- Prompt: the full contents of `scheduled/morning.md` or `scheduled/evening.md`.
- Schedule (cron; bare cron is UTC, so set the zone explicitly and avoid :00):
  - morning: `CRON_TZ=Europe/Paris 37 6 * * 1-5`
  - evening: `CRON_TZ=Europe/Paris 37 17 * * 1-5`

  The planner also checks the Europe/Paris weekday, so a mis-set timezone can't produce weekend lessons.

## Smoke test (do this before activating)
1. **Locally, read-only:** `npm run schedule -- doctor` and `npm run schedule -- plan --slot morning` / `--slot evening`. Expect `GENERATE` (or `DISCOVER` when the track has no candidate yet).
2. **One cloud run:** on the paused morning task, press **Run now**. Watch the run's session:
   - `doctor` passes (or only `WARN`s); if a source domain is unreachable, fix the allowlist and rerun.
   - A branch `content/<today>-morning` appears on GitHub, with a run record in its first commit.
   - The run ends with the report block: `Result: GENERATED` (or `BLOCKED` with reasons) and a **draft** PR URL.
3. **Idempotency:** press **Run now** again. The run must report `NO-OP … already claimed` and push nothing.
4. **Safety:** `main` is unchanged (`git log origin/main -1`); the PR is a draft; `catalog.json` in the PR shows the lesson as `draft`.
5. Repeat 2–4 with the evening task.
6. **Clean up the test runs** if you don't want those lessons: close the PRs and delete the branches (see below).

## Activate / pause
- Activate: toggle each task **on** in its detail page (claude.ai/code/routines). `/schedule list` shows tasks from the CLI.
- Pause: toggle **off**; paused tasks don't run until turned back on. Nothing in the repo needs changing.
- Temporarily stop new PRs without pausing: lower `maxPendingLessons` in `schedule.json` (merge to `main`); runs then no-op while the queue is full.
- History: each task's **History** list; every run opens as a full session transcript. "Succeeded" only means the session ended without an error, so read the report block.

## Runbook

| Symptom | Cause | Recovery |
|---|---|---|
| `BLOCKED (network)`, `doctor` WARN for a seed, WebFetch says the domain is blocked | Domain not in the environment allowlist | Add it under Allowed domains, save (applies next run), delete the slot branch if one was claimed, Run now |
| `BLOCKED (permission)`, exit 4, push 403 | GitHub App not installed or lacks access; ruleset blocks `content/*` pushes | Reinstall or grant the app; allow `content/*` in rulesets (keep `main` protected) |
| Run reports `already claimed` but no PR exists | An earlier run claimed the slot and stopped (usage limit, crash, permission prompt) | `plan` lists it as `stale`. Inspect the branch; to retry, delete it (`git push origin --delete content/<date>-<slot>`, done by you; runs can't delete branches), then Run now |
| `RESULT BLOCKED` with a PR titled `[BLOCKED]` | Quality gate or a required check failed, or the source couldn't be verified | Read the run record / PR body. Fix on the branch and run `npm run schedule -- finish …` again, or reject: close the PR, delete the branch, optionally mark the candidate `rejected` with the reason |
| `pr` printed a compare URL instead of a PR | GitHub REST unavailable in that run | Open the compare URL and create the PR as **draft** |
| `NO-OP review queue has N pending` | Backlog limit reached | Review or close pending lesson PRs (and delete their branches) |
| Merge conflict in `catalog.json`, `registry.ts`, `coverage.json` or `candidates.json` after merging another lesson PR | Each lesson PR registers itself in the same files | On the lesson branch: `git fetch && git rebase origin/main`, resolve keeping **both** catalog entries, then `npm run content:registry`, `npm run content:validate`, commit, push |
| Runs stop happening, "GitHub connection lost" | Connection lost; runs are skipped and the task turns off after 72 h | Reconnect GitHub, turn the task back on |
| Usage limit reached | Subscription window exhausted | Runs are rejected until the window resets; nothing to clean up unless a run had already claimed (see stale) |
| Lesson in wrong track or a duplicate slipped through | Candidate `track`/`keywords` wrong | Reject the PR; fix the candidate's `track`/`keywords` in `candidates.json` on `main` |

### Reviewing and publishing a scheduled lesson
Bot PRs only ever add drafts; publishing is a separate, human-only change.
1. Read the lesson on the PR's Vercel preview and work through `REVIEW.md` and `content-pipeline/reviews/<slug>.md`.
2. Approve and **merge the draft PR**. The lesson is on `main` but hidden in production (drafts are visible only in dev and previews).
3. On your machine, in a terminal:
   ```bash
   git switch main && git pull --ff-only
   git switch -c publish/<slug>
   npm run content:publish -- <slug> --reviewer "<name>"   # asks you to retype the slug
   npm run check
   git commit -am "content: publish <slug>" && git push -u origin publish/<slug>
   ```
4. Open and merge that PR. Production shows the lesson after the deploy. (`content-safety` accepts a `publish/<slug>` PR only if it publishes exactly that lesson and touches nothing else.)

### Residual risk (read before activating)
Lesson files are TypeScript, so a new lesson's code runs at build time, including Vercel **preview** builds of bot PRs before anyone reviews them. The import allowlist and forbidden-code rules are defense in depth, not a sandbox. Keep the Vercel project free of secrets (it needs none), and treat the required human approval, which includes skimming the lesson diff, as the real control. The structural fix, storing lesson content as JSON data instead of code, is a possible future change, not part of Phase 4.
