"use client";

import { useState } from "react";
import type { BarTone, ChartSpec } from "@/content/schema";
import { useLesson } from "@/components/lesson/LessonContext";
import { formatPercent } from "@/lib/format";
import { ChoiceChips, StepControls, VISUAL_FRAME } from "./StepControls";
import { useStepper } from "./useStepper";

const TONE: Record<BarTone, string> = {
  accent: "var(--accent)",
  muted: "var(--ink-3)",
  ok: "var(--ok)",
  bad: "var(--bad)",
};

export function formatValue(value: number, format: ChartSpec["valueFormat"]): string {
  if (format === "percent") return formatPercent(value);
  if (format === "multiplier") return `${Number.isInteger(value) ? value : value.toFixed(1)}×`;
  return String(Math.round(value));
}

/**
 * Interactive numeric comparison: pick a scenario, then scrub (slider) or
 * play through its frames. Bars keep a fixed scale so changes are visible.
 * A visually hidden table mirrors the bars for screen readers.
 */
export function ChartExplorer({ spec }: { spec: ChartSpec }) {
  const { locale, ui } = useLesson();
  const t = ui.explorer;
  const [scenarioId, setScenarioId] = useState(spec.scenarios[0].id);
  const scenario = spec.scenarios.find((s) => s.id === scenarioId) ?? spec.scenarios[0];
  const stepper = useStepper(scenario.frames.length, { min: 0, stepMs: 1400 });
  const frame = scenario.frames[Math.max(0, stepper.index)];
  const bars = frame.bars;
  const sparse = spec.xLabels === "sparse";

  return (
    <div className={VISUAL_FRAME} data-testid="chart-explorer">
      <ChoiceChips
        label={t.scenario}
        options={spec.scenarios.map((s) => ({ id: s.id, label: s.label[locale] }))}
        value={scenario.id}
        onChange={(id) => {
          setScenarioId(id);
          stepper.reset();
        }}
        testIdPrefix="chart-scenario"
        variant="card"
      />

      <div className="mt-4 flex items-baseline justify-between gap-3">
        <p className="text-lg font-semibold tabular-nums" data-testid="chart-frame">{frame.label[locale]}</p>
        <p className="text-xs text-ink-3">{spec.valueLabel[locale]}</p>
      </div>

      {/* Bars */}
      <div className="mt-2 flex h-48 items-end gap-[3px] border-b border-line" aria-hidden="true" data-testid="chart-bars">
        {bars.map((bar, i) => {
          const pct = Math.max(0, Math.min(1, bar.value / spec.yMax)) * 100;
          return (
            <div key={i} className="relative flex h-full min-w-0 flex-1 flex-col justify-end">
              {bars.length <= 8 ? (
                <span className="mb-1 text-center text-xs font-semibold tabular-nums text-ink">{formatValue(bar.value, spec.valueFormat)}</span>
              ) : null}
              <div
                className="chart-bar rounded-t-md"
                style={{ height: `${pct}%`, minHeight: bar.value > 0 ? 2 : 0, background: TONE[bar.tone ?? "accent"] }}
                data-value={bar.value}
              />
            </div>
          );
        })}
      </div>
      {sparse ? (
        // Dense histograms: first / middle / last labels, pinned so they never overflow the screen.
        <div className="relative mt-1 h-4 text-[0.7rem] leading-tight text-ink-3" aria-hidden="true">
          {[0, Math.floor((bars.length - 1) / 2), bars.length - 1].map((i, n) => (
            <span
              key={i}
              className="absolute top-0 whitespace-nowrap"
              style={
                n === 0
                  ? { left: 0 }
                  : n === 2
                    ? { right: 0 }
                    : { left: `${((i + 0.5) / bars.length) * 100}%`, transform: "translateX(-50%)" }
              }
            >
              {bars[i].label[locale]}
            </span>
          ))}
        </div>
      ) : (
        <div className="mt-1 flex gap-[3px]" aria-hidden="true">
          {bars.map((bar, i) => (
            <span key={i} className="min-w-0 flex-1 text-center text-[0.7rem] leading-tight text-ink-3">
              {bar.label[locale]}
            </span>
          ))}
        </div>
      )}

      {/* Scrubber */}
      {scenario.frames.length > 1 ? (
        <input
          type="range"
          min={0}
          max={scenario.frames.length - 1}
          step={1}
          value={Math.max(0, stepper.index)}
          onChange={(e) => stepper.goTo(Number(e.target.value))}
          aria-label={t.scrub}
          aria-valuetext={frame.label[locale]}
          className="mt-4 h-11 w-full accent-[var(--accent)]"
          data-testid="chart-slider"
        />
      ) : null}

      <div className="mt-2 min-h-[4.5rem] rounded-xl border border-line px-3 py-2" aria-live="polite" data-testid="chart-caption">
        <p className="text-[0.95rem] leading-snug">{frame.caption[locale]}</p>
      </div>

      {scenario.frames.length > 1 ? <StepControls stepper={stepper} testIdPrefix="chart" /> : null}

      {/* sr-only on a wrapper: WebKit does not clip a <table>'s caption when the table itself is sr-only. */}
      <div className="sr-only">
        <table>
          <caption>{`${scenario.label[locale]} · ${frame.label[locale]}`}</caption>
          <tbody>
            {bars.map((bar, i) => (
              <tr key={i}>
                <th scope="row">{bar.label[locale]}</th>
                <td>{formatValue(bar.value, spec.valueFormat)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-ink-3">
        <span className="font-semibold">{t.method}:</span> {spec.method[locale]}
      </p>
    </div>
  );
}
