"use client";

import { useId, useMemo, useState } from "react";
import type { FlowExplorerSpec, FlowNodeKind } from "@/content/schema";
import { useLesson } from "@/components/lesson/LessonContext";
import { computeMetrics, edgePath, visitedNodes } from "@/lib/flow";
import { ChoiceChips, StepCaption, StepControls, VISUAL_FRAME } from "./StepControls";
import { usePrefersReducedMotion, useStepper } from "./useStepper";

export const KIND_COLOR: Record<FlowNodeKind, string> = {
  llm: "var(--k-llm)",
  code: "var(--k-code)",
  tool: "var(--k-tool)",
  io: "var(--k-io)",
  human: "var(--k-human)",
  stop: "var(--k-stop)",
};

/** Shrink long labels to fit their box (approx. 0.55em average glyph width). */
export function labelFontSize(label: string, width: number): number {
  const fit = (width - 14) / (label.length * 0.55);
  return Math.max(9.5, Math.min(13, fit));
}

/**
 * Architecture / data-flow / state-machine diagrams: nodes + edges, with
 * scripted traces that highlight what runs at each step, plus live
 * "LLM calls" (cost) and "sequential rounds" (latency) counters.
 */
export function FlowExplorer({ spec }: { spec: FlowExplorerSpec }) {
  const { locale, ui } = useLesson();
  const t = ui.explorer;
  const uid = useId().replace(/:/g, "");
  const reducedMotion = usePrefersReducedMotion();

  const [scenarioId, setScenarioId] = useState(spec.scenarios[0].id);
  const scenario = spec.scenarios.find((s) => s.id === scenarioId) ?? spec.scenarios[0];
  const [variantId, setVariantId] = useState(scenario.variants[0].id);
  const variant = scenario.variants.find((v) => v.id === variantId) ?? scenario.variants[0];
  const steps = variant.steps;
  const stepper = useStepper(steps.length);
  const stepIndex = stepper.index;

  const step = stepIndex >= 0 ? steps[stepIndex] : undefined;
  const metrics = computeMetrics(steps, stepIndex);
  const metricMode = spec.metrics ?? "calls+rounds";
  const visited = useMemo(() => visitedNodes(steps, stepIndex), [steps, stepIndex]);
  const visitedEdges = useMemo(() => {
    const seen = new Set<string>();
    for (let i = 0; i < stepIndex; i++) steps[i].edges.forEach((e) => seen.add(e));
    return seen;
  }, [steps, stepIndex]);
  const nodeMap = useMemo(() => new Map(scenario.nodes.map((n) => [n.id, n])), [scenario]);
  const hidden = new Set(variant.hiddenNodes ?? []);
  const activeNodes = new Set(step?.nodes ?? []);
  const activeEdges = new Set(step?.edges ?? []);

  const selectScenario = (id: string) => {
    const next = spec.scenarios.find((s) => s.id === id) ?? spec.scenarios[0];
    setScenarioId(next.id);
    setVariantId(next.variants[0].id);
    stepper.reset();
  };

  const selectVariant = (id: string) => {
    setVariantId(id);
    stepper.reset();
  };

  const labelOf = (nodeId: string) => (variant.nodeLabels?.[nodeId] ?? nodeMap.get(nodeId)?.label)?.[locale] ?? nodeId;
  const kindsUsed = Array.from(new Set(scenario.nodes.filter((n) => !hidden.has(n.id)).map((n) => n.kind)));

  return (
    <div className={VISUAL_FRAME} data-testid="flow-explorer">
      <ChoiceChips
        label={spec.scenarioLabel?.[locale] ?? t.pattern}
        options={spec.scenarios.map((s) => ({ id: s.id, label: s.label[locale] }))}
        value={scenario.id}
        onChange={selectScenario}
        testIdPrefix="pattern"
      />
      <ChoiceChips
        label={t.scenario}
        options={scenario.variants.map((v) => ({ id: v.id, label: v.label[locale] }))}
        value={variant.id}
        onChange={selectVariant}
        testIdPrefix="variant"
        variant="card"
      />

      <p className="mt-3 text-sm text-ink-2">
        <span className="font-semibold text-ink">{t.whoDecides}:</span> {scenario.controlFlow[locale]}
      </p>

      {/* Diagram */}
      <svg
        viewBox={`0 0 ${spec.viewBox.width} ${spec.viewBox.height}`}
        className="mx-auto mt-3 block w-full max-w-[26rem]"
        role="img"
        aria-label={t.diagramLabel(scenario.label[locale])}
        data-testid="flow-diagram"
      >
        <defs>
          {(["active", "visited", "idle"] as const).map((state) => (
            <marker
              key={state}
              id={`${uid}-arrow-${state}`}
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path
                d="M0,0 L10,5 L0,10 z"
                style={{ fill: state === "active" ? "var(--accent)" : state === "visited" ? "var(--ink-3)" : "var(--line)" }}
              />
            </marker>
          ))}
        </defs>

        {scenario.edges.map((edge) => {
          const d = edgePath(edge, nodeMap);
          const isActive = activeEdges.has(edge.id);
          const isVisited = visitedEdges.has(edge.id);
          const isHidden = hidden.has(edge.from) || hidden.has(edge.to);
          const state = isActive ? "active" : isVisited ? "visited" : "idle";
          return (
            <g key={edge.id} opacity={isHidden ? 0.25 : 1}>
              <path
                d={d}
                fill="none"
                className={isActive ? "flow-edge-active" : undefined}
                style={{
                  stroke: isActive ? "var(--accent)" : isVisited ? "var(--ink-3)" : "var(--line)",
                  strokeWidth: isActive ? 2.5 : 1.6,
                }}
                markerEnd={`url(#${uid}-arrow-${state})`}
                data-active={isActive || undefined}
              />
              {isActive && !reducedMotion ? (
                <circle r="4" style={{ fill: "var(--accent)" }} key={`${edge.id}-${stepIndex}`}>
                  <animateMotion dur="1.1s" repeatCount="indefinite" path={d} />
                </circle>
              ) : null}
            </g>
          );
        })}

        {scenario.nodes.map((node) => {
          const color = KIND_COLOR[node.kind];
          const isActive = activeNodes.has(node.id);
          const isVisited = visited.has(node.id);
          const isHidden = hidden.has(node.id);
          const label = labelOf(node.id);
          return (
            <g
              key={node.id}
              className="flow-node"
              opacity={isHidden ? 0.28 : 1}
              data-node={node.id}
              data-active={isActive || undefined}
            >
              <rect
                x={node.x - node.w / 2}
                y={node.y - node.h / 2}
                width={node.w}
                height={node.h}
                rx={node.kind === "io" || node.kind === "human" ? node.h / 2 : 10}
                style={{
                  fill: isActive ? color : "var(--surface)",
                  stroke: isActive || isVisited ? color : "var(--line)",
                  strokeWidth: isActive ? 2.5 : 1.5,
                  strokeDasharray: isHidden ? "4 4" : undefined,
                }}
              />
              <text
                x={node.x}
                y={node.y}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={labelFontSize(label, node.w)}
                fontWeight={isActive ? 700 : 500}
                style={{ fill: isActive ? "var(--surface)" : isVisited ? "var(--ink)" : "var(--ink-2)" }}
              >
                {label}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <ul className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-ink-3" aria-hidden="true">
        {kindsUsed.map((kind) => (
          <li key={kind} className="flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-sm" style={{ background: KIND_COLOR[kind] }} />
            {t.legend[kind]}
          </li>
        ))}
      </ul>

      {/* Metrics: calls ≈ cost, rounds ≈ latency depth */}
      {metricMode !== "none" ? (
        <div className={`mt-4 grid gap-2 ${metricMode === "calls" ? "grid-cols-1" : "grid-cols-2"}`}>
          <div className="rounded-xl bg-surface-2 px-3 py-2">
            <p className="text-xs text-ink-3">{t.calls}</p>
            <p className="text-2xl font-semibold tabular-nums" data-testid="metric-calls">{metrics.calls}</p>
          </div>
          {metricMode === "calls+rounds" ? (
            <div className="rounded-xl bg-surface-2 px-3 py-2">
              <p className="text-xs text-ink-3">{t.rounds}</p>
              <p className="text-2xl font-semibold tabular-nums" data-testid="metric-rounds">{metrics.rounds}</p>
            </div>
          ) : null}
        </div>
      ) : null}

      <StepCaption
        testId="flow-caption"
        stepTestId="flow-step"
        stepLabel={step ? t.step(stepIndex + 1, steps.length) : undefined}
        outcome={step?.outcome}
        text={step?.caption[locale]}
        placeholder={t.ready}
      />
      <StepControls stepper={stepper} testIdPrefix="flow" />

      {/* Trace log */}
      {stepIndex >= 0 ? (
        <details className="mt-3 rounded-xl bg-surface-2 px-3 py-2 text-sm">
          <summary className="min-h-9 cursor-pointer py-1 font-medium">
            {t.trace} ({stepIndex + 1})
          </summary>
          <ol className="mt-1 list-decimal space-y-1 pb-1 pl-5 text-ink-2" data-testid="flow-trace">
            {steps.slice(0, stepIndex + 1).map((s, i) => (
              <li key={i}>
                {s.caption[locale]}
                {s.calls > 0 ? <span className="ml-1 text-ink-3">(+{s.calls} LLM)</span> : null}
              </li>
            ))}
          </ol>
        </details>
      ) : null}
    </div>
  );
}
