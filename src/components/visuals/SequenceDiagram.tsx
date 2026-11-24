"use client";

import { useId, useState } from "react";
import type { MessageStyle, SequenceSpec } from "@/content/schema";
import { useLesson } from "@/components/lesson/LessonContext";
import { KIND_COLOR, labelFontSize } from "./FlowExplorer";
import { ChoiceChips, StepCaption, StepControls, VISUAL_FRAME } from "./StepControls";
import { usePrefersReducedMotion, useStepper } from "./useStepper";

const WIDTH = 340;
const HEADER_H = 34;
const TOP = 62;
const ROW = 46;

const STYLE_COLOR: Record<MessageStyle, string> = {
  request: "var(--ink-2)",
  response: "var(--k-tool)",
  error: "var(--bad)",
  timeout: "var(--bad)",
  note: "var(--ink-3)",
};

/**
 * Request/response timelines: participants as lifelines, one message per
 * step. Messages appear as you step, so you can predict what happens next
 * (retries, timeouts, duplicate side effects, idempotency).
 */
export function SequenceDiagram({ spec }: { spec: SequenceSpec }) {
  const { locale, ui } = useLesson();
  const t = ui.explorer;
  const uid = useId().replace(/:/g, "");
  const reducedMotion = usePrefersReducedMotion();
  const [scenarioId, setScenarioId] = useState(spec.scenarios[0].id);
  const scenario = spec.scenarios.find((s) => s.id === scenarioId) ?? spec.scenarios[0];
  const stepper = useStepper(scenario.steps.length);
  const current = stepper.index >= 0 ? scenario.steps[stepper.index] : undefined;

  const columns = spec.participants.length;
  const colW = (WIDTH - 16) / columns;
  const xOf = (id: string) => 8 + colW * (spec.participants.findIndex((p) => p.id === id) + 0.5);
  const height = TOP + scenario.steps.length * ROW + 12;

  return (
    <div className={VISUAL_FRAME} data-testid="sequence-diagram">
      <ChoiceChips
        label={t.scenario}
        options={spec.scenarios.map((s) => ({ id: s.id, label: s.label[locale] }))}
        value={scenario.id}
        onChange={(id) => {
          setScenarioId(id);
          stepper.reset();
        }}
        testIdPrefix="seq-scenario"
        variant="card"
      />
      <p className="mt-3 text-sm text-ink-2">{scenario.summary[locale]}</p>

      <svg
        viewBox={`0 0 ${WIDTH} ${height}`}
        className="mx-auto mt-3 block w-full max-w-[26rem]"
        role="img"
        aria-label={t.sequenceLabel(scenario.label[locale])}
        data-testid="sequence-svg"
      >
        <defs>
          {(Object.keys(STYLE_COLOR) as MessageStyle[]).map((style) => (
            <marker key={style} id={`${uid}-${style}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0,0 L10,5 L0,10 z" style={{ fill: STYLE_COLOR[style] }} />
            </marker>
          ))}
          <marker id={`${uid}-active`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" style={{ fill: "var(--accent)" }} />
          </marker>
        </defs>

        {spec.participants.map((p) => {
          const x = xOf(p.id);
          const w = Math.min(colW - 8, 104);
          const label = p.label[locale];
          return (
            <g key={p.id}>
              <line x1={x} x2={x} y1={HEADER_H + 8} y2={height - 4} strokeDasharray="3 5" style={{ stroke: "var(--line)", strokeWidth: 1.5 }} />
              <rect x={x - w / 2} y={6} width={w} height={HEADER_H} rx={9} style={{ fill: "var(--surface)", stroke: KIND_COLOR[p.kind], strokeWidth: 1.6 }} />
              <text x={x} y={6 + HEADER_H / 2} textAnchor="middle" dominantBaseline="central" fontSize={labelFontSize(label, w)} fontWeight={600} style={{ fill: "var(--ink)" }}>
                {label}
              </text>
            </g>
          );
        })}

        {scenario.steps.map((step, i) => {
          if (i > stepper.index) return null;
          const y = TOP + i * ROW + 18;
          const active = i === stepper.index;
          const color = active ? "var(--accent)" : STYLE_COLOR[step.style];
          const label = step.label[locale];
          const x1 = xOf(step.from);
          const x2 = xOf(step.to);
          if (step.style === "note") {
            const w = Math.min(colW * 1.7, 200);
            const cx = Math.max(8 + w / 2, Math.min(WIDTH - 8 - w / 2, x1));
            return (
              <g key={i} data-step={i} data-active={active || undefined}>
                <rect x={cx - w / 2} y={y - 13} width={w} height={26} rx={7} style={{ fill: active ? "var(--accent-soft)" : "var(--surface-2)", stroke: color, strokeWidth: active ? 1.8 : 1 }} />
                <text x={cx} y={y} textAnchor="middle" dominantBaseline="central" fontSize={labelFontSize(label, w)} style={{ fill: "var(--ink)" }}>
                  {label}
                </text>
              </g>
            );
          }
          // Timeouts stop short: the reply never arrives in time.
          const end = step.style === "timeout" ? x1 + (x2 - x1) * 0.62 : x2 - Math.sign(x2 - x1) * 3;
          return (
            <g key={i} data-step={i} data-active={active || undefined}>
              <text x={(x1 + x2) / 2} y={y - 8} textAnchor="middle" fontSize={labelFontSize(label, Math.abs(x2 - x1) + 30)} fontWeight={active ? 700 : 500} style={{ fill: active ? "var(--ink)" : "var(--ink-2)" }}>
                {label}
              </text>
              <line
                x1={x1}
                x2={end}
                y1={y}
                y2={y}
                className={active && !reducedMotion ? "flow-edge-active" : undefined}
                strokeDasharray={step.style === "response" || step.style === "timeout" ? "6 4" : undefined}
                markerEnd={step.style === "timeout" ? undefined : `url(#${uid}-${active ? "active" : step.style})`}
                style={{ stroke: color, strokeWidth: active ? 2.5 : 1.6 }}
              />
              {step.style === "timeout" || step.style === "error" ? (
                <text x={step.style === "timeout" ? end + 8 * Math.sign(x2 - x1) : x2 - 12 * Math.sign(x2 - x1)} y={y + 1} textAnchor="middle" dominantBaseline="central" fontSize={14} fontWeight={700} style={{ fill: "var(--bad)" }}>
                  ✕
                </text>
              ) : null}
            </g>
          );
        })}
      </svg>

      <StepCaption
        testId="seq-caption"
        stepTestId="seq-step"
        stepLabel={current ? t.step(stepper.index + 1, scenario.steps.length) : undefined}
        outcome={current?.outcome}
        text={current?.caption[locale]}
        placeholder={t.ready}
      />
      <StepControls stepper={stepper} testIdPrefix="seq" />
    </div>
  );
}
