Run the Daily Engineering **evening** lesson slot ("Engineering Mastery").

Follow the project skill `.claude/skills/scheduled-lesson/SKILL.md` exactly, with `slot = evening`.
Topics come from `content-pipeline/schedule.json` → `slots.evening` (system design, distributed systems, AWS, backend engineering, algorithms, reliability, technical interview preparation).

Non-negotiable:
- Work from the latest `main`; push only the branch that `npm run schedule -- claim` creates (`content/<date>-evening`).
- Never run `content:publish`, never mark a lesson published, never merge, never push to `main`, never force-push, never delete branches.
- Never fabricate sources, dates, quotes or scores; unverifiable claims are flagged `needs-review` or the run is blocked.
- If the slot is already claimed, the review queue is full, or it's a weekend in Europe/Paris, report the no-op and stop.
- If network access, permissions or usage limits stop you, report the exact blocker and stop. Don't work around it.

End with the report block from step 8 of the skill.
