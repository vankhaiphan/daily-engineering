import type { FlowEdge, FlowNode, FlowStep } from "@/content/schema";

export interface FlowMetrics {
  /** Total LLM calls so far: a proxy for cost. */
  calls: number;
  /** Steps that made at least one LLM call: a proxy for latency depth. */
  rounds: number;
}

/** Metrics after executing steps[0..stepIndex] (stepIndex = -1 → nothing run). */
export function computeMetrics(steps: FlowStep[], stepIndex: number): FlowMetrics {
  let calls = 0;
  let rounds = 0;
  for (let i = 0; i <= stepIndex && i < steps.length; i++) {
    calls += steps[i].calls;
    if (steps[i].calls > 0) rounds += 1;
  }
  return { calls, rounds };
}

/** Nodes highlighted at least once before (and including) stepIndex. */
export function visitedNodes(steps: FlowStep[], stepIndex: number): Set<string> {
  const seen = new Set<string>();
  for (let i = 0; i <= stepIndex && i < steps.length; i++) steps[i].nodes.forEach((n) => seen.add(n));
  return seen;
}

/** Point where the ray from the node centre toward (tx, ty) exits its rectangle. */
function boxExit(node: FlowNode, tx: number, ty: number, pad = 3): { x: number; y: number } {
  const dx = tx - node.x;
  const dy = ty - node.y;
  if (dx === 0 && dy === 0) return { x: node.x, y: node.y };
  const hw = node.w / 2 + pad;
  const hh = node.h / 2 + pad;
  const scale = Math.min(dx === 0 ? Infinity : hw / Math.abs(dx), dy === 0 ? Infinity : hh / Math.abs(dy));
  return { x: node.x + dx * scale, y: node.y + dy * scale };
}

/** SVG path for an edge, straight or bent (quadratic), clipped to node boxes. */
export function edgePath(edge: FlowEdge, nodes: Map<string, FlowNode>): string {
  const from = nodes.get(edge.from);
  const to = nodes.get(edge.to);
  if (!from || !to) return "";
  const bend = edge.bend ?? 0;
  if (bend === 0) {
    const a = boxExit(from, to.x, to.y);
    const b = boxExit(to, from.x, from.y, 6);
    return `M${a.x.toFixed(1)},${a.y.toFixed(1)} L${b.x.toFixed(1)},${b.y.toFixed(1)}`;
  }
  const mx = (from.x + to.x) / 2;
  const my = (from.y + to.y) / 2;
  const len = Math.hypot(to.x - from.x, to.y - from.y) || 1;
  // Perpendicular (rotate direction 90° clockwise) scaled by bend.
  const cx = mx + (-(to.y - from.y) / len) * bend * 2;
  const cy = my + ((to.x - from.x) / len) * bend * 2;
  const a = boxExit(from, cx, cy);
  const b = boxExit(to, cx, cy, 6);
  return `M${a.x.toFixed(1)},${a.y.toFixed(1)} Q${cx.toFixed(1)},${cy.toFixed(1)} ${b.x.toFixed(1)},${b.y.toFixed(1)}`;
}
