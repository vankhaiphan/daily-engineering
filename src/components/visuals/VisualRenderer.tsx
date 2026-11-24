"use client";

import type { VisualSpec } from "@/content/schema";
import { ChartExplorer } from "./ChartExplorer";
import { FlowExplorer } from "./FlowExplorer";
import { SequenceDiagram } from "./SequenceDiagram";

/** Single entry point: lesson blocks reference a spec; the spec's kind picks the renderer. */
export function VisualRenderer({ spec }: { spec: VisualSpec }) {
  switch (spec.kind) {
    case "flow":
      return <FlowExplorer spec={spec} />;
    case "sequence":
      return <SequenceDiagram spec={spec} />;
    case "chart":
      return <ChartExplorer spec={spec} />;
  }
}
