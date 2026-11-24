import { Fragment } from "react";
import { parseInline } from "@/lib/inline";

/** Renders lesson inline markup (**bold**, *italic*, `code`) safely, without HTML injection. */
export function InlineText({ text }: { text: string }) {
  return (
    <>
      {parseInline(text).map((token, i) => {
        switch (token.kind) {
          case "bold":
            return <strong key={i} className="font-semibold text-ink">{token.value}</strong>;
          case "italic":
            return <em key={i}>{token.value}</em>;
          case "code":
            return (
              <code key={i} className="rounded bg-surface-2 px-1 py-0.5 font-mono text-[0.88em]">
                {token.value}
              </code>
            );
          default:
            return <Fragment key={i}>{token.value}</Fragment>;
        }
      })}
    </>
  );
}
