"use client";

import { useEffect, useId, useMemo, useState, useSyncExternalStore } from "react";
import type { FlowExplorerSpec, FlowNodeKind } from "@/content/schema";
import { IconPause, IconPlay, IconRestart, IconStepBack, IconStepForward } from "@/components/icons";
import { useLesson } from "@/components/lesson/LessonContext";
import { computeMetrics, edgePath, visitedNodes } from "@/lib/flow";

const STEP_MS = 2600;

const KIND_COLOR: Record<FlowNodeKind, string> = {
  llm: "var(--k-llm)",
  code: "var(--k-code)",
  tool: "var(--k-tool)",
  io: "var(--k-io)",
  human: "var(--k-human)",
  stop: "var(--k-stop)",
};

/** Shrink long labels to fit their box (approx. 0.55em average glyph width). */
function labelFontSize(label: string, width: number): number {
  const fit = (width - 14) / (label.length * 0.55);
  return Math.max(9.5, Math.min(13, fit));
}

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribeReducedMotion, () => window.matchMedia(REDUCED_MOTION).matches, () => false);
}

export function FlowExplorer({ spec }: { spec: FlowExplorerSpec }) {
  const { locale, ui } = useLesson();
  const t = ui.explorer;
  const uid = useId().replace(/:/g, "");
  const reducedMotion = usePrefersReducedMotion();

  const [scenarioId, setScenarioId] = useState(spec.scenarios[0].id);
  const scenario = spec.scenarios.find((s) => s.id === scenarioId) ?? spec.scenarios[0];
  const [variantId, setVariantId] = useState(scenario.variants[0].id);
  const variant = scenario.variants.find((v) => v.id === variantId) ?? scenario.variants[0];
  const [stepIndex, setStepIndex] = useState(-1);
  const [playing, setPlaying] = useState(false);

  const steps = variant.steps;
  const step = stepIndex >= 0 ? steps[stepIndex] : undefined;
  const atEnd = stepIndex >= steps.length - 1;
  const metrics = computeMetrics(steps, stepIndex);
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

  // Auto-advance while playing; stop at the last step.
  useEffect(() => {
    if (!playing || atEnd) return;
    const timer = window.setTimeout(
      () => {
        setStepIndex(stepIndex + 1);
        if (stepIndex + 1 >= steps.length - 1) setPlaying(false);
      },
      stepIndex < 0 ? 300 : STEP_MS,
    );
    return () => window.clearTimeout(timer);
  }, [playing, stepIndex, atEnd, steps.length]);

  const selectScenario = (id: string) => {
    const next = spec.scenarios.find((s) => s.id === id) ?? spec.scenarios[0];
    setScenarioId(next.id);
    setVariantId(next.variants[0].id);
    setStepIndex(-1);
    setPlaying(false);
  };

  const selectVariant = (id: string) => {
    setVariantId(id);
    setStepIndex(-1);
    setPlaying(false);
  };

  const togglePlay = () => {
    if (playing) return setPlaying(false);
    if (atEnd) setStepIndex(-1);
    setPlaying(true);
  };

  const labelOf = (nodeId: string) => (variant.nodeLabels?.[nodeId] ?? nodeMap.get(nodeId)?.label)?.[locale] ?? nodeId;
  const kindsUsed = Array.from(new Set(scenario.nodes.filter((n) => !hidden.has(n.id)).map((n) => n.kind)));

  return (
    <div className="not-prose -mx-4 border-y border-line bg-surface px-4 py-4 sm:mx-0 sm:rounded-2xl sm:border" data-testid="flow-explorer">
      {/* Pattern picker */}
      <p className="text-[0.75rem] font-semibold uppercase tracking-wide text-ink-3">{t.pattern}</p>
      <div className="no-scrollbar -mx-4 mt-2 flex gap-2 overflow-x-auto px-4 pb-1" role="group" aria-label={t.pattern}>
        {spec.scenarios.map((s) => (
          <button
            key={s.id}
            type="button"
            aria-pressed={s.id === scenario.id}
            onClick={() => selectScenario(s.id)}
            data-testid={`pattern-${s.id}`}
            className={`min-h-11 shrink-0 rounded-full border px-4 text-sm font-medium ${
              s.id === scenario.id ? "border-accent bg-accent text-accent-ink" : "border-line text-ink-2"
            }`}
          >
            {s.label[locale]}
          </button>
        ))}
      </div>

      {/* Scenario picker */}
      <p className="mt-4 text-[0.75rem] font-semibold uppercase tracking-wide text-ink-3">{t.scenario}</p>
      <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label={t.scenario}>
        {scenario.variants.map((v) => (
          <button
            key={v.id}
            type="button"
            aria-pressed={v.id === variant.id}
            onClick={() => selectVariant(v.id)}
            data-testid={`variant-${v.id}`}
            className={`min-h-11 rounded-xl border px-3 text-left text-sm ${
              v.id === variant.id ? "border-ink bg-surface-2 font-medium text-ink" : "border-line text-ink-2"
            }`}
          >
            {v.label[locale]}
          </button>
        ))}
      </div>

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

      {/* Metrics */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-surface-2 px-3 py-2">
          <p className="text-xs text-ink-3">{t.calls}</p>
          <p className="text-2xl font-semibold tabular-nums" data-testid="metric-calls">{metrics.calls}</p>
        </div>
        <div className="rounded-xl bg-surface-2 px-3 py-2">
          <p className="text-xs text-ink-3">{t.rounds}</p>
          <p className="text-2xl font-semibold tabular-nums" data-testid="metric-rounds">{metrics.rounds}</p>
        </div>
      </div>

      {/* Caption */}
      <div className="mt-3 min-h-[5.5rem] rounded-xl border border-line px-3 py-2" aria-live="polite" data-testid="flow-caption">
        {step ? (
          <>
            <p className="flex items-center justify-between text-xs text-ink-3">
              <span data-testid="flow-step">{t.step(stepIndex + 1, steps.length)}</span>
              {step.outcome ? (
                <span
                  className={`rounded-full px-2 py-0.5 font-semibold ${
                    step.outcome === "success" ? "bg-ok-soft text-ok" : "bg-bad-soft text-bad"
                  }`}
                >
                  {t.outcome[step.outcome]}
                </span>
              ) : null}
            </p>
            <p className="mt-1 text-[0.95rem] leading-snug">{step.caption[locale]}</p>
          </>
        ) : (
          <p className="text-[0.95rem] text-ink-2">{t.ready}</p>
        )}
      </div>

      {/* Controls */}
      <div className="mt-3 flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => {
            setPlaying(false);
            setStepIndex(-1);
          }}
          disabled={stepIndex < 0}
          aria-label={t.restart}
          className="grid size-12 place-items-center rounded-full text-ink-2 active:bg-surface-2 disabled:opacity-35"
        >
          <IconRestart />
        </button>
        <button
          type="button"
          onClick={() => {
            setPlaying(false);
            setStepIndex((i) => Math.max(-1, i - 1));
          }}
          disabled={stepIndex < 0}
          aria-label={t.prev}
          data-testid="flow-prev"
          className="grid size-12 place-items-center rounded-full text-ink-2 active:bg-surface-2 disabled:opacity-35"
        >
          <IconStepBack />
        </button>
        <button
          type="button"
          onClick={togglePlay}
          aria-label={playing ? t.pause : t.play}
          data-testid="flow-play"
          className="grid size-14 place-items-center rounded-full bg-accent text-accent-ink shadow-sm active:opacity-80"
        >
          {playing ? <IconPause /> : <IconPlay />}
        </button>
        <button
          type="button"
          onClick={() => {
            setPlaying(false);
            setStepIndex((i) => Math.min(steps.length - 1, i + 1));
          }}
          disabled={atEnd}
          aria-label={t.next}
          data-testid="flow-next"
          className="grid size-12 place-items-center rounded-full text-ink-2 active:bg-surface-2 disabled:opacity-35"
        >
          <IconStepForward />
        </button>
      </div>

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
