---
name: lesson-discovery
description: Find, verify and score engineering articles as candidate Daily Engineering lessons, reject duplicates, and record decisions in content-pipeline/candidates.json. Use when asked to discover topics, find new lessons, refresh candidates, or before lesson-generation when no source URL is given.
---

# Lesson discovery

Goal: a ranked, verified shortlist of articles in `content-pipeline/candidates.json`, with a written reason for every decision. Nothing in this file may be guessed.

## Hard rules
- Record only what you saw on a page you opened in this run: title, URL, authors as credited, publication date. If a date isn't shown, use `null`; never infer one.
- Never invent popularity, votes, views or comments. `engagement` stays `null` with an `engagementNote` unless a number is shown on a page you opened.
- Don't score depth from a title alone: say "article not opened, depth provisional" in `decision`.

## Steps
1. Read `content-pipeline/sources.json` (seeds and access notes from previous runs) and `content-pipeline/coverage.json` (what is already covered).
2. Open each seed index with WebFetch. Collect real titles, URLs and dates. Update `access` notes in `sources.json` when something changed (redirects, client-side rendering, missing dates).
3. For each promising article, check duplicates before scoring:
   `npm run content:dedupe -- --url <url> --title "<title>" --keywords "k1, k2, k3"`
   A duplicate exits 1 → record it as `rejected` with the reason. Near-duplicates: decide and explain.
4. Open the top 3–5 articles. Skim structure and depth; note concrete numbers worth teaching.
5. Score 1–5 each (see rubric) and add or update entries in `candidates.json` (`total: 0`), then run:
   `npm run content:candidates -- --rescore` (computes totals and validates the file).
   For every candidate also set `track` (`"morning"` for AI engineering topics, `"evening"` for system design / backend / AWS / algorithms, see `content-pipeline/schedule.json`) and 3–6 lower-case `keywords` (used to detect duplicates against lessons and pending scheduled runs).
6. Set `status`: `selected` (will be generated now, needs `lessonSlug`), `shortlisted` (good, later), `rejected` (with reason). Aim for a mix: recent AI engineering and evergreen backend/system design.
7. Report the ranked list and your recommendation. Don't generate lessons unless asked: that is the `lesson-generation` skill.

## Scoring rubric (1–5)
| Criterion | 5 means |
|---|---|
| technicalRelevance | Directly about the target stack: AI agents, Claude Code, backend, distributed systems, AWS, system design |
| educationalDepth | Mechanisms, trade-offs, failure modes and numbers, not announcements |
| credibility | Primary engineering source (the team that built it), dated, attributed |
| novelty | No overlap with `coverage.json` (dedupe clean) |
| careerValue | Likely interview topic for backend/platform/AI engineering roles |
| engagement | Only if verifiable on a page; otherwise `null` |

Totals: weighted 0–100 (`src/content/pipeline.ts` → `scoreCandidate`). Engagement only adds a small bonus when verified.
