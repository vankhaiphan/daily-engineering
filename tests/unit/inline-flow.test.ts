import { describe, expect, it } from "vitest";
import type { FlowNode } from "@/content/schema";
import { computeMetrics, edgePath, visitedNodes } from "@/lib/flow";
import { parseInline, stripInline } from "@/lib/inline";

describe("inline markup", () => {
  it("parses bold, italic and code", () => {
    expect(parseInline("a **b** *c* `d` e")).toEqual([
      { kind: "text", value: "a " },
      { kind: "bold", value: "b" },
      { kind: "text", value: " " },
      { kind: "italic", value: "c" },
      { kind: "text", value: " " },
      { kind: "code", value: "d" },
      { kind: "text", value: " e" },
    ]);
  });
  it("leaves arithmetic-like asterisks alone and strips markup to plain text", () => {
    expect(stripInline("2 * 3 = 6")).toBe("2 * 3 = 6");
    expect(stripInline("**Workflow**: `llm()`")).toBe("Workflow: llm()");
  });
});

describe("flow helpers", () => {
  const steps = [
    { nodes: ["a"], edges: [], calls: 1, caption: { en: "", vi: "", fr: "" } },
    { nodes: ["b", "c"], edges: [], calls: 3, caption: { en: "", vi: "", fr: "" } },
    { nodes: ["d"], edges: [], calls: 0, caption: { en: "", vi: "", fr: "" } },
  ];

  it("counts calls (cost) and rounds (latency depth) separately", () => {
    expect(computeMetrics(steps, -1)).toEqual({ calls: 0, rounds: 0 });
    expect(computeMetrics(steps, 1)).toEqual({ calls: 4, rounds: 2 });
    expect(computeMetrics(steps, 2)).toEqual({ calls: 4, rounds: 2 });
    expect([...visitedNodes(steps, 1)]).toEqual(["a", "b", "c"]);
  });

  it("draws edges between box borders, straight or curved", () => {
    const node = (id: string, x: number, y: number): FlowNode => ({ id, kind: "llm", label: { en: id, vi: id, fr: id }, x, y, w: 100, h: 40 });
    const nodes = new Map([["a", node("a", 100, 50)], ["b", node("b", 100, 200)]]);
    expect(edgePath({ id: "e", from: "a", to: "b" }, nodes)).toBe("M100.0,73.0 L100.0,174.0");
    expect(edgePath({ id: "e", from: "a", to: "b", bend: 20 }, nodes)).toMatch(/^M[\d.,-]+ Q[\d.,-]+ [\d.,-]+$/);
    expect(edgePath({ id: "e", from: "a", to: "zzz" }, nodes)).toBe("");
  });
});

describe("formatDate", async () => {
  const { formatDate } = await import("@/lib/format");
  it("is deterministic per locale", () => {
    expect(formatDate("2024-12-19", "en")).toBe("December 19, 2024");
    expect(formatDate("2024-12-19", "vi")).toBe("ngày 19 tháng 12 năm 2024");
    expect(formatDate("2025-06-01", "fr")).toBe("1er juin 2025");
  });
});
