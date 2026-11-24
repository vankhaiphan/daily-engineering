# Visualization library

Three data-driven renderers (`src/components/visuals/`). A lesson only writes **specs** (plain data, `src/content/schema.ts`); the renderer provides Play/Pause, Previous/Next, Reset, scenario selection, touch targets ≥ 44 px, reduced-motion support and screen-reader text. Reference a spec from a section with:

```ts
{ type: "interactive", widget: "flow" | "sequence" | "chart", ref: "<key in visuals.ts>" }
```

## Choose (or skip)
| The idea is about… | Use | Example in repo |
|---|---|---|
| Components and how data or control moves between them; who decides; cost per step | `flow` | `building-effective-agents` patterns, `agent-evals` pipeline |
| A lifecycle or state machine (states as nodes, transitions as edges) | `flow` | agent loop with stop condition |
| Messages over time between 2–4 parties: requests, retries, timeouts, races, idempotency | `sequence` | `timeouts-retries-backoff` retry timelines |
| A quantity that changes with a parameter, or a comparison between policies; an algorithm's step-by-step numbers | `chart` | pass@k vs pass^k, retry amplification, jitter histogram |

Don't add a visual that only restates a paragraph. Each one should let the learner **change an input and see a consequence** (scenario, variant, slider, steps). One or two per lesson is usually right; three at most.

## `flow`
- `viewBox` 340 wide (fits a phone), height to taste (≤ 440). Nodes are boxes centred at `x,y` with `w,h`; keep them inside the viewBox (validated). Labels ≤ ~28 chars; long labels auto-shrink but stay readable only to ~10 px.
- `scenarios` = first chip row (rename it with `scenarioLabel`), `variants` = second row. Each variant is a scripted trace of `steps` (active `nodes`, `edges`, `calls`, localized `caption`, final `outcome`).
- Outcomes: `success`, `stopped` (a limit fired), `rejected` (a gate stopped bad input early), `failed`.
- `metrics`: `"calls+rounds"` when LLM cost vs latency matters, `"calls"` for cost only, `"none"` otherwise.
- `hiddenNodes` fades nodes a variant doesn't use; `nodeLabels` relabels nodes per variant.

## `sequence`
- 2–4 `participants` (validated) so columns fit 320 px.
- One message per step (≤ 12 per scenario). Styles: `request`, `response` (dashed), `error` (✕ at target), `timeout` (stops short: the reply never arrives in time), `note` (on one lifeline: waits, timers; `from === to`).
- The last step needs an `outcome`. Use 2–3 scenarios that differ by one decision (no retry / blind retry / idempotent retry).

## `chart`
- `scenarios` (chips) × `frames` (slider + Play steps). Every frame has a short `label` ("k = 3"), a `caption` that states the key number in words, and up to 24 `bars`.
- Fixed `yMax` across frames, so changes are visible. `valueFormat`: `percent` (0–1), `integer`, `multiplier`.
- `xLabels: "sparse"` for histograms (first, middle and last labels are pinned).
- `method` (shown under the chart) must say where numbers come from: an exact formula, our arithmetic, or "our simulation, not a measurement" with its parameters.
- Compute values in `visuals.ts` (formula or seeded PRNG, like `mulberry32` in `timeouts-retries-backoff`), export the helpers, and add a unit test. Never type measured-looking numbers by hand.

## Phone check
Captions ≤ ~200 characters. Run `npm run test:e2e`: it fails on any horizontal overflow at 320 px.
