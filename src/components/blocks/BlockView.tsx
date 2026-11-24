"use client";

import type { Block } from "@/content/schema";
import { InlineText } from "@/components/InlineText";
import { useLesson } from "@/components/lesson/LessonContext";
import { VisualRenderer } from "@/components/visuals/VisualRenderer";
import { InterviewBlock } from "./InterviewBlock";
import { QuizBlock } from "./QuizBlock";
import { SourcesBlock } from "./SourcesBlock";

const CALLOUT_STYLES: Record<Extract<Block, { type: "callout" }>["tone"], string> = {
  insight: "border-accent bg-accent-soft",
  warning: "border-bad bg-bad-soft",
  analogy: "border-[var(--k-human)] bg-surface-2",
  example: "border-[var(--k-tool)] bg-surface-2",
};

const CALLOUT_EMOJI: Record<Extract<Block, { type: "callout" }>["tone"], string> = {
  insight: "💡",
  warning: "⚠️",
  analogy: "🍳",
  example: "🛠️",
};

export function BlockView({ block, blockKey }: { block: Block; blockKey: string }) {
  const { interactives, sources } = useLesson();
  const keyProps = { "data-block-key": blockKey }; // stable hook for tests and future deep links

  switch (block.type) {
    case "p":
      return (
        <p {...keyProps}>
          <InlineText text={block.text} />
        </p>
      );
    case "h3":
      return (
        <h3 {...keyProps} className="!mt-8 font-serif text-[1.15em] font-semibold leading-snug">
          <InlineText text={block.text} />
        </h3>
      );
    case "list": {
      const ListTag = block.ordered ? "ol" : "ul";
      return (
        <ListTag {...keyProps} className={`space-y-2 pl-5 ${block.ordered ? "list-decimal" : "list-disc"} marker:text-ink-3`}>
          {block.items.map((item, i) => (
            <li key={i} className="pl-1">
              <InlineText text={item} />
            </li>
          ))}
        </ListTag>
      );
    }
    case "callout":
      return (
        <aside {...keyProps} className={`rounded-xl border-l-4 px-4 py-3 ${CALLOUT_STYLES[block.tone]}`}>
          <p className="mb-1 text-[0.8em] font-semibold uppercase tracking-wide text-ink-2">
            <span aria-hidden="true" className="mr-1.5 not-italic">{CALLOUT_EMOJI[block.tone]}</span>
            {block.title}
          </p>
          <p>
            <InlineText text={block.text} />
          </p>
        </aside>
      );
    case "quote": {
      const source = sources.find((s) => s.id === block.sourceId);
      return (
        <figure {...keyProps} className="border-l-2 border-ink-3 pl-4">
          <blockquote lang="en" className="font-serif text-[1.05em] italic text-ink">
            “{block.text}”
          </blockquote>
          {block.translation ? <p className="mt-1 text-[0.9em] text-ink-2">{block.translation}</p> : null}
          {source ? (
            <figcaption className="mt-1 text-[0.8em] text-ink-3">
              — <a href={source.url} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2">{source.title}</a>, {source.publisher}
            </figcaption>
          ) : null}
        </figure>
      );
    }
    case "code":
      return (
        <figure {...keyProps} className="-mx-4 sm:mx-0">
          <pre
            className="overflow-x-auto px-4 py-3 font-mono text-[13px] leading-relaxed sm:rounded-xl"
            style={{ background: "var(--code-bg)", color: "var(--code-ink)" }}
            tabIndex={0}
            lang="en"
          >
            <code>{block.code}</code>
          </pre>
          {block.caption ? (
            <figcaption className="mt-2 px-4 text-[0.85em] text-ink-2 sm:px-0">
              <InlineText text={block.caption} />
            </figcaption>
          ) : null}
        </figure>
      );
    case "table":
      return (
        <figure {...keyProps}>
          {/* Phones: one card per row. Wider screens: a real table. */}
          <div className="space-y-3 sm:hidden">
            {block.rows.map((row, r) => (
              <dl key={r} className="rounded-xl border border-line bg-surface p-3 text-[0.9em]">
                <dt className="font-semibold text-ink">{row[0]}</dt>
                {row.slice(1).map((cell, c) => (
                  <div key={c} className="mt-1 grid grid-cols-[minmax(0,7.5rem)_1fr] gap-2">
                    <dt className="text-ink-3">{block.columns[c + 1]}</dt>
                    <dd className="text-ink-2">{cell}</dd>
                  </div>
                ))}
              </dl>
            ))}
          </div>
          <div className="hidden overflow-x-auto sm:block">
            <table className="w-full border-collapse text-left text-[0.85em]">
              <thead>
                <tr>
                  {block.columns.map((c) => (
                    <th key={c} scope="col" className="border-b border-line py-2 pr-3 font-semibold">{c}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rows.map((row, r) => (
                  <tr key={r}>
                    {row.map((cell, c) =>
                      c === 0 ? (
                        <th key={c} scope="row" className="border-b border-line py-2 pr-3 font-medium">{cell}</th>
                      ) : (
                        <td key={c} className="border-b border-line py-2 pr-3 text-ink-2">{cell}</td>
                      ),
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {block.caption ? <figcaption className="mt-2 text-[0.8em] text-ink-3">{block.caption}</figcaption> : null}
        </figure>
      );
    case "interactive": {
      const spec = interactives[block.ref];
      return spec ? (
        <div {...keyProps}>
          <VisualRenderer spec={spec} />
        </div>
      ) : null;
    }
    case "quiz":
      return (
        <div {...keyProps}>
          <QuizBlock questions={block.questions} />
        </div>
      );
    case "interview":
      return (
        <div {...keyProps}>
          <InterviewBlock block={block} />
        </div>
      );
    case "sources":
      return (
        <div {...keyProps}>
          <SourcesBlock />
        </div>
      );
  }
}
