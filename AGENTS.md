<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Agent skills

### Issue tracker

Issues are tracked in GitHub Issues for vankhaiphan/daily-engineering, using the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Uses the five default labels: needs-triage, needs-info, ready-for-agent, ready-for-human, wontfix. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `GLOSSARY.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.

## Lesson content

Scheduled (unattended) runs follow `.claude/skills/scheduled-lesson` and `content-pipeline/SCHEDULING.md`: one draft lesson per Europe/Paris weekday slot, on its own `content/<date>-<slot>` branch, never published or merged by a run.

Lessons are data in `src/content/lessons/<slug>/`, registered through `src/content/catalog.json`. To discover topics or generate, regenerate, validate or publish lessons, follow `.claude/skills/lesson-discovery` and `.claude/skills/lesson-generation` and the handbook `content-pipeline/README.md`. Never mark a claim `verified` without a verbatim quote seen in the current session; never publish (`content:publish`) without a human reviewer.
