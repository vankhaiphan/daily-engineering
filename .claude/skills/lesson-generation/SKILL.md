---
name: lesson-generation
description: Generate a complete, verified, trilingual (VI/EN/FR) Daily Engineering lesson from a selected candidate or a specific source URL, with interactive visualizations, quiz and claim review, then validate it and prepare a reviewable git change. Use when asked to generate, write, create or regenerate a lesson, or to turn an article URL into a lesson.
---

# Lesson generation

Produces a **draft** lesson under `src/content/lessons/<slug>/` that passes `npm run content:validate`, plus a human review report. Never publishes, merges or deploys.

Read before writing: `references/authoring.md` (structure, pedagogy, translation), `references/visualizations.md` (which visual, how to spec it), `references/verification.md` (claims and flags). The existing lessons are the reference implementations: `building-effective-agents` (flow), `agent-evals` (flow + chart), `timeouts-retries-backoff` (sequence + charts).

## Inputs
- A candidate id from `content-pipeline/candidates.json` (status `selected` or `shortlisted`), or
- A source URL from the user. Then first add it as a candidate (see the `lesson-discovery` skill, steps 3–5), with `discoveredVia: "user request"`.

## Steps

1. **Check for duplicates.** `npm run content:dedupe -- --url <url> --keywords "<k1>, <k2>, …"`. If it reports a duplicate, stop and tell the user. If the URL was rejected before, read that reason and tell the user before continuing.

2. **Research and verify.** Open the source with WebFetch. Ask for: title, authors exactly as credited, publication date (or "not shown"), full outline, and **short verbatim quotes** for every fact you plan to teach. Open supporting sources only when they add something the primary lacks. Record each fact as a claim (see `references/verification.md`). Anything you can't quote → `needs-review`. Never fill gaps from memory.

3. **Plan before writing.** In a short note (in the chat, not a file): the learner's "aha", 8–12 sections, which 1–3 visuals and why (see the decision table in `references/visualizations.md`), 3–4 quiz questions with misconceptions they target, and the interview pitch.

4. **Scaffold.** `npm run content:new -- <slug> --candidate <candidate-id>`. This registers a draft, updates the catalog and registry, and marks the candidate `selected`.

5. **Write the lesson files** (replace every TODO):
   - `sources.ts`: verified metadata; `publishedOn: null` when not shown (primary sources must have a date).
   - `review.ts`: every factual claim with ≤ 300-char verbatim evidence; `derived` for your own math; `needs-review` with a note for anything unconfirmed.
   - `visuals.ts`: specs only (data, no JSX). Compute chart values from formulas or a seeded simulation in the same file, and export the helpers so unit tests can check them.
   - `code.ts` (if any): code identical across languages; comments localized via `codeFor(locale)`.
   - `en.ts` first, then `vi.ts` and `fr.ts` with the **same section ids, block order and quiz answer keys**. Translate naturally (see `references/authoring.md`); quotes stay verbatim English with a `translation`.
   - `index.ts`: topics, ≥ 4 keywords, `status: "draft"`, provenance.

6. **Validate until clean.** `npm run content:validate -- <slug>`. Fix every `error`. `review` lines are expected for a draft (the draft status itself, and any `needs-review` claim). Read `warn` lines and fix what is reasonable.

7. **Check it renders on a phone.** The e2e overflow (320 px) and console-error tests cover every lesson in `src/content/catalog.json` automatically (`tests/e2e/helpers.ts`). Then run `npm run lint && npm run typecheck && npm test && npm run test:e2e`. If you added computed visual data, add a unit test that checks it against the formula (see `tests/unit/pipeline.test.ts`).

8. **Write the review report.** `npm run content:report -- <slug>` → `content-pipeline/reviews/<slug>.md`.

9. **Prepare the git change.** On a `content/<slug>` branch (or the branch the user named), commit only the lesson folder, catalog/registry/coverage, candidates, review report, and the test path list. Don't touch app code in a content change unless a renderer bug blocks the lesson (then make it a separate commit and say so). Don't push, merge or deploy unless the user asks. Summarize for the user: source, selection reason, visuals, word counts, and **every review flag** they must resolve.

## Regenerating or rejecting
- To redo a lesson in place: keep the slug, fix the files, re-run steps 6–9.
- To reject a draft: `npm run content:reject -- <slug> --reason "<why>"`. It removes the files and records the reason on the candidate so it isn't picked again by accident.

## Not your job here
Publishing (a human runs `npm run content:publish -- <slug> --reviewer "<name>"` after review), scheduling, deployment.
