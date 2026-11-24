/**
 * Runtime validation for lessons. TypeScript checks shape at compile time;
 * this checks the invariants types cannot express (cross-locale parity,
 * referential integrity, real dates/URLs). Intended to gate any future
 * generated content before it is published.
 */
import { LOCALES, type Locale } from "@/lib/i18n/config";
import type { Block, FlowExplorerSpec, Lesson, Localized } from "./schema";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function isRealIsoDate(value: string): boolean {
  if (!ISO_DATE.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

function checkLocalized(value: Localized | undefined, path: string, errors: string[]) {
  if (!value) return;
  for (const locale of LOCALES) {
    if (typeof value[locale] !== "string" || value[locale].trim() === "") {
      errors.push(`${path}: missing ${locale} text`);
    }
  }
}

/** Language-neutral signature of a block, used for cross-locale parity. */
function blockSignature(block: Block): string {
  switch (block.type) {
    case "list":
      return `list(${block.ordered ? "ol" : "ul"}:${block.items.length})`;
    case "callout":
      return `callout(${block.tone})`;
    case "quote":
      return `quote(${block.sourceId}:${block.text})`;
    case "code":
      return `code(${block.language})`;
    case "table":
      return `table(${block.columns.length}x${block.rows.length})`;
    case "interactive":
      return `interactive(${block.widget}:${block.ref})`;
    case "quiz":
      return `quiz(${block.questions
        .map((q) => `${q.id}=${q.correctOptionId}[${q.options.map((o) => o.id).join(",")}]`)
        .join(";")})`;
    case "interview":
      return `interview(${block.keyPoints.length}:${block.followUps.length})`;
    default:
      return block.type;
  }
}

function blockTexts(block: Block): string[] {
  switch (block.type) {
    case "p":
    case "h3":
      return [block.text];
    case "list":
      return block.items;
    case "callout":
      return [block.title, block.text];
    case "quote":
      return [block.text];
    case "table":
      return [...block.columns, ...block.rows.flat()];
    case "quiz":
      return block.questions.flatMap((q) => [q.prompt, ...q.options.flatMap((o) => [o.text, o.feedback])]);
    case "interview":
      return [
        block.pitchTitle,
        block.pitch,
        block.keyPointsTitle,
        ...block.keyPoints,
        block.followUpsTitle,
        ...block.followUps.flatMap((f) => [f.question, f.answer]),
      ];
    default:
      return [];
  }
}

export function validateFlowExplorer(spec: FlowExplorerSpec, path: string): string[] {
  const errors: string[] = [];
  if (spec.scenarios.length === 0) errors.push(`${path}: no scenarios`);
  for (const scenario of spec.scenarios) {
    const sp = `${path}.${scenario.id}`;
    checkLocalized(scenario.label, `${sp}.label`, errors);
    checkLocalized(scenario.controlFlow, `${sp}.controlFlow`, errors);
    const nodeIds = new Set(scenario.nodes.map((n) => n.id));
    const edgeIds = new Set(scenario.edges.map((e) => e.id));
    if (nodeIds.size !== scenario.nodes.length) errors.push(`${sp}: duplicate node ids`);
    if (edgeIds.size !== scenario.edges.length) errors.push(`${sp}: duplicate edge ids`);
    for (const node of scenario.nodes) {
      checkLocalized(node.label, `${sp}.node.${node.id}`, errors);
      const inside =
        node.x - node.w / 2 >= 0 &&
        node.x + node.w / 2 <= spec.viewBox.width &&
        node.y - node.h / 2 >= 0 &&
        node.y + node.h / 2 <= spec.viewBox.height;
      if (!inside) errors.push(`${sp}.node.${node.id}: outside viewBox`);
    }
    for (const edge of scenario.edges) {
      if (!nodeIds.has(edge.from) || !nodeIds.has(edge.to)) {
        errors.push(`${sp}.edge.${edge.id}: unknown endpoint`);
      }
    }
    if (scenario.variants.length === 0) errors.push(`${sp}: no variants`);
    for (const variant of scenario.variants) {
      const vp = `${sp}.${variant.id}`;
      checkLocalized(variant.label, `${vp}.label`, errors);
      for (const [nodeId, label] of Object.entries(variant.nodeLabels ?? {})) {
        if (!nodeIds.has(nodeId)) errors.push(`${vp}.nodeLabels: unknown node ${nodeId}`);
        checkLocalized(label, `${vp}.nodeLabels.${nodeId}`, errors);
      }
      const hidden = new Set(variant.hiddenNodes ?? []);
      for (const id of hidden) if (!nodeIds.has(id)) errors.push(`${vp}.hiddenNodes: unknown node ${id}`);
      if (variant.steps.length === 0) errors.push(`${vp}: no steps`);
      variant.steps.forEach((step, i) => {
        const stp = `${vp}.step${i + 1}`;
        checkLocalized(step.caption, `${stp}.caption`, errors);
        if (!Number.isInteger(step.calls) || step.calls < 0) errors.push(`${stp}: invalid calls`);
        for (const id of step.nodes) {
          if (!nodeIds.has(id)) errors.push(`${stp}: unknown node ${id}`);
          if (hidden.has(id)) errors.push(`${stp}: uses hidden node ${id}`);
        }
        for (const id of step.edges) if (!edgeIds.has(id)) errors.push(`${stp}: unknown edge ${id}`);
      });
      const last = variant.steps.at(-1);
      if (last && !last.outcome) errors.push(`${vp}: last step needs an outcome`);
    }
  }
  return errors;
}

export function validateLesson(lesson: Lesson): string[] {
  const errors: string[] = [];
  const p = `lesson(${lesson.slug})`;

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(lesson.slug)) errors.push(`${p}: slug must be kebab-case`);
  if (!isRealIsoDate(lesson.createdOn)) errors.push(`${p}: invalid createdOn`);

  // Sources
  const sourceIds = new Set<string>();
  if (!lesson.sources.some((s) => s.role === "primary")) errors.push(`${p}: needs a primary source`);
  for (const source of lesson.sources) {
    if (sourceIds.has(source.id)) errors.push(`${p}: duplicate source ${source.id}`);
    sourceIds.add(source.id);
    try {
      if (new URL(source.url).protocol !== "https:") errors.push(`${p}: source ${source.id} must use https`);
    } catch {
      errors.push(`${p}: source ${source.id} has an invalid URL`);
    }
    if (!isRealIsoDate(source.publishedOn)) errors.push(`${p}: source ${source.id} invalid publishedOn`);
    if (!isRealIsoDate(source.accessedOn)) errors.push(`${p}: source ${source.id} invalid accessedOn`);
    if (source.publishedOn > source.accessedOn) errors.push(`${p}: source ${source.id} accessed before publication`);
    if (source.authors.length === 0) errors.push(`${p}: source ${source.id} has no authors`);
    checkLocalized(source.note, `${p}.source.${source.id}.note`, errors);
  }

  // Interactives
  for (const [ref, spec] of Object.entries(lesson.interactives)) {
    errors.push(...validateFlowExplorer(spec, `${p}.interactive.${ref}`));
  }

  // Locale bodies: presence, parity, references
  const reference = lesson.content.en;
  const referenceSkeleton = reference.sections.map(
    (s) => `${s.id}:${s.kind}:${s.blocks.map(blockSignature).join("|")}`,
  );
  const sectionIds = reference.sections.map((s) => s.id);
  if (new Set(sectionIds).size !== sectionIds.length) errors.push(`${p}: duplicate section ids`);

  for (const locale of LOCALES) {
    const body = lesson.content[locale as Locale];
    const lp = `${p}.${locale}`;
    if (!body) {
      errors.push(`${lp}: missing locale`);
      continue;
    }
    for (const field of ["title", "subtitle", "hook"] as const) {
      if (!body[field]?.trim()) errors.push(`${lp}: empty ${field}`);
    }
    const skeleton = body.sections.map(
      (s) => `${s.id}:${s.kind}:${s.blocks.map(blockSignature).join("|")}`,
    );
    if (skeleton.length !== referenceSkeleton.length) {
      errors.push(`${lp}: section count ${skeleton.length} != en ${referenceSkeleton.length}`);
    }
    skeleton.forEach((sig, i) => {
      if (sig !== referenceSkeleton[i]) {
        errors.push(`${lp}: section ${body.sections[i]?.id} structure differs from en`);
      }
    });

    for (const section of body.sections) {
      if (!section.title.trim()) errors.push(`${lp}.${section.id}: empty title`);
      if (section.blocks.length === 0) errors.push(`${lp}.${section.id}: no blocks`);
      section.blocks.forEach((block, i) => {
        const bp = `${lp}.${section.id}[${i}]`;
        for (const text of blockTexts(block)) {
          if (!text.trim()) errors.push(`${bp}: empty text`);
        }
        if (block.type === "quote") {
          if (!sourceIds.has(block.sourceId)) errors.push(`${bp}: unknown source ${block.sourceId}`);
          if (locale !== "en" && !block.translation?.trim()) errors.push(`${bp}: quote needs a translation`);
        }
        if (block.type === "interactive" && !lesson.interactives[block.ref]) {
          errors.push(`${bp}: unknown interactive ${block.ref}`);
        }
        if (block.type === "table" && block.rows.some((row) => row.length !== block.columns.length)) {
          errors.push(`${bp}: table row width mismatch`);
        }
        if (block.type === "quiz") {
          for (const q of block.questions) {
            const ids = q.options.map((o) => o.id);
            if (new Set(ids).size !== ids.length) errors.push(`${bp}.${q.id}: duplicate option ids`);
            if (!ids.includes(q.correctOptionId)) errors.push(`${bp}.${q.id}: correct option missing`);
            if (q.options.length < 2) errors.push(`${bp}.${q.id}: needs 2+ options`);
          }
        }
      });
    }
  }

  return errors;
}
