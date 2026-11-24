# Content pipeline

How Daily Engineering lessons are discovered, generated, verified, reviewed and published.

**Design.** Claude Code does the research and writing by following two project skills (`.claude/skills/lesson-discovery`, `.claude/skills/lesson-generation`). Everything else is deterministic Node scripts (`scripts/content/*.mts`) and unit tests. No paid LLM API is called at runtime or in scripts, so the same workflow can later run as a Claude Code cloud scheduled task (Phase 4) without new infrastructure.

```
discover ─► candidates.json ─► generate (draft) ─► validate ─► review report ─► human review ─► publish ─► PR / merge / deploy
              ▲   dedupe            content:new      content:validate   content:report   REVIEW.md    content:publish
              └── coverage.json (what's already covered)
```

## Files
| Path | What it holds |
|---|---|
| `content-pipeline/sources.json` | Discovery seeds and what worked last time (redirects, missing dates…) |
| `content-pipeline/candidates.json` | Every evaluated article: real metadata, 1–5 scores, computed total, status, written decision |
| `content-pipeline/coverage.json` | Generated: covered lessons, keywords and normalized source URLs (duplicate detection) |
| `content-pipeline/reviews/<slug>.md` | Generated review report: claims with evidence, flags, errors, warnings |
| `content-pipeline/template/` | Scaffold copied by `content:new` (fails validation until filled) |
| `content-pipeline/REVIEW.md` | The human technical-review checklist |
| `src/content/catalog.json` | Slug, status (draft/published), date. Source of truth for routing |
| `src/content/lessons/registry.ts` | Generated from the catalog |
| `src/content/lessons/<slug>/` | The lesson: `en/vi/fr.ts`, `visuals.ts`, `sources.ts`, `review.ts`, `code.ts`, `index.ts` |

## Draft vs published
Drafts are visible in `npm run dev` and on Vercel **preview** deployments (so a reviewer can read them on a phone from the PR), never on production. Force with `SHOW_DRAFT_LESSONS=true|false`. Publishing is a code change (`status: "published"`) that goes through a normal PR.

## How to…

### Discover topics
In Claude Code: *"Discover new lesson candidates"* (uses the `lesson-discovery` skill). Then:
```bash
npm run content:candidates            # ranked list + validation
```

### Generate a lesson manually (from the best candidate)
In Claude Code: *"Generate a lesson from candidate `<id>`"* (uses the `lesson-generation` skill). It scaffolds with `content:new`, researches, writes all three languages and visuals, validates, writes the review report, and commits on a branch without pushing.

### Generate from a specific source URL
In Claude Code: *"Generate a Daily Engineering lesson from <URL>"*. The skill first runs:
```bash
npm run content:dedupe -- --url <URL> --keywords "k1, k2, k3"
```
records the article as a candidate, then continues as above.

### Validate a lesson
```bash
npm run content:validate                      # every lesson + candidates file
npm run content:validate -- <slug>            # one lesson
npm run content:validate -- <slug> --publish  # also fails on review flags
npm run content:report -- <slug>              # refresh the review report
```
Gates: required sections and order, ≥ 1 visualization, ≥ 3 quiz questions with feedback, interview depth, English ≥ 1,200 words, translation completeness (same structure, answer keys and quotes; length ratio), sources (https, real dates, primary has a date), internal references (quotes → sources, claims → sources, blocks → visuals, visual specs), quote and evidence length limits, ≥ 5 checked claims, duplicate and near-duplicate detection, catalog consistency. Unit tests run the same gates on every lesson (`npm test`).

### Reject or regenerate an unsatisfactory lesson
```bash
npm run content:reject -- <slug> --reason "explains X incorrectly; source too shallow"
```
Removes the draft and records the reason on the candidate (so it isn't picked again by accident). To regenerate instead, ask Claude Code to *"regenerate `<slug>`"* with what to change; it edits in place and re-runs validation.

### Review and publish approved content
1. Open the PR's Vercel preview on your phone; read the lesson in VI, EN and FR; play every visualization.
2. Work through `content-pipeline/REVIEW.md` and the lesson's `reviews/<slug>.md`. Resolve every ⚠️ claim (verify it and mark `verified` with a quote, or rewrite/remove the sentence).
3. Merge the lesson PR while it is still a **draft** (hidden in production).
4. Publish in your own terminal (human-only: it asks you to retype the slug and refuses in agent or cloud sessions):
   ```bash
   git switch main && git pull --ff-only && git switch -c publish/<slug>
   npm run content:publish -- <slug> --reviewer "<your name>"
   npm run check
   ```
   Commit, push, open and merge that PR. Production shows the lesson after the deploy.

## Scheduled runs (Phase 4)
Two weekday cloud scheduled tasks (morning AI Discovery, evening Engineering Mastery) run this pipeline unattended and open one draft PR per slot. Setup, smoke test, activation and runbook: [`SCHEDULING.md`](SCHEDULING.md).
