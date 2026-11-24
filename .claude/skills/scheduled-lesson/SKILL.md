---
name: scheduled-lesson
description: Run one unattended Daily Engineering lesson slot (morning "AI Discovery" or evening "Engineering Mastery") from a Claude Code cloud scheduled task - plan, claim the slot, discover if needed, generate one draft VI/EN/FR lesson with the lesson-generation skill, verify, push its own branch, open a draft PR, and report. Use when a scheduled task or the user says "run the morning/evening lesson slot".
---

# Scheduled lesson run

One run handles exactly one **slot**: the Europe/Paris date plus `morning` or `evening`, configured in `content-pipeline/schedule.json`. The deterministic steps live in `npm run schedule -- <command>`; your job is the research and writing in between, and an honest final report.

## Hard rules (a run that breaks one has failed, whatever else it did)
- Never run `content:publish`, never set a lesson to `published`, never fill `reviewedBy`. Every lesson you create is a **draft**.
- Never merge, never push to `main`, never force-push, never delete branches. Push only through `npm run schedule -- claim|finish|block`, which push this slot's `content/<date>-<slot>` branch and nothing else.
- Never edit existing lessons, other slots' run records, or learner-facing app code. If the app itself needs a fix, stop and report it.
- Never fabricate sources, dates, authors, quotes, scores or engagement. Unverifiable means `needs-review` or a blocker.
- Never claim success unless `finish` printed `RESULT GENERATED` and `pr` printed a URL. Report exactly what the commands printed.
- One slot, one branch, one PR. If the slot is already claimed, stop: that is a successful no-op.
- If a tool asks for permission you don't have, or the network blocks a source, don't work around it: stop with a blocker.

## Steps

1. **Start clean from the latest main.**
   `git fetch origin && git switch main && git status --porcelain` must be empty and `git rev-parse HEAD` must equal `git rev-parse origin/main` (a fresh clone already is). Run `npm ci` only if `node_modules` is missing.

2. **Preflight.** `npm run schedule -- doctor --slot <slot>`. Any `FAIL` → stop and report it (category network / permission / runtime). `WARN` lines are informational (e.g. no GitHub REST access means you'll report a compare URL instead of a PR).

3. **Plan.** `npm run schedule -- plan --slot <slot>`. Read the action:
   - `NOOP` → report the reasons (weekend, slot already claimed or merged, review backlog) and stop. Mention any `stale` claims.
   - `DISCOVER` → follow `.claude/skills/lesson-discovery`, limited to this slot's `seeds` and `topics` in `schedule.json`. Every candidate you add must have `track: "<slot>"` and 3–6 `keywords`. Run `npm run content:candidates -- --rescore`, then plan again. Still `DISCOVER` → stop and report "no eligible topic" (with what you evaluated).
   - `GENERATE` → note the candidate id, title, URL and the slot `date`.

4. **Claim the slot.** `npm run schedule -- claim --slot <slot>`. This creates and pushes `content/<date>-<slot>` with a run record (and any discovery output). Exit code 2 (nothing to claim) or 3 (another run owns the slot) → report a no-op and stop. Exit 4/5 = permission/network → report the blocker and stop.

5. **Generate the lesson** with `.claude/skills/lesson-generation`, steps 2–6, for the planned candidate only:
   - Scaffold with `npm run content:new -- <slug> --candidate <candidate-id> --date <slot date>`.
   - Verify every taught claim with verbatim evidence; anything unconfirmed → `needs-review` with a note.
   - Visuals only where they teach something (flow / sequence / chart); compute chart data from formulas or seeded simulations.
   - VI, EN, FR complete; ≥ 3 quiz questions; interview summary; sources with real dates.
   - Iterate with `npm run content:validate -- <slug>` until there are no `error` lines.

   If the source can't be loaded, or not enough can be verified to teach the topic honestly, stop generating and run:
   `npm run schedule -- block --slot <slot> --blocker "<what failed and what a human should check>"`, then go to step 7.

6. **Finish.** `npm run schedule -- finish --slot <slot> --slug <slug>`.
   It runs the guard (nothing published or removed), lint, typecheck, unit tests, content validation and the production build; records the results; and pushes. `RESULT GENERATED` = all passed. `RESULT BLOCKED` = something failed. The lesson is then kept as files, unregistered from the app, and the failures are listed. Don't retry `finish` endlessly: fix a clear, local mistake in **your lesson** at most twice, otherwise accept the blocked result.

7. **Open the draft PR.** `npm run schedule -- pr --slot <slot>`. It opens a **draft** PR via the GitHub REST API (or finds the existing one). If it prints a compare URL instead, report that URL.

8. **Report** (final message, exactly these fields):
   ```
   Slot: <date> <morning|evening> (<label>)
   Result: GENERATED | BLOCKED | NO-OP
   Topic: <title> (<candidate id>)
   Sources: <title, publisher, date, URL> (one per line)
   Lesson: <slug> · words EN/VI/FR · visuals
   Checks: <each check ✅/❌ as printed by finish>
   Review flags: <list or none>
   Blockers: <list or none>
   PR: <URL> (or compare URL / none)
   ```
