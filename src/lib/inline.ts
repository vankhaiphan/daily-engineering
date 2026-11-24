/** Tiny inline markup used in lesson text: **bold**, *italic*, `code`. */
export type InlineToken =
  | { kind: "text"; value: string }
  | { kind: "bold"; value: string }
  | { kind: "italic"; value: string }
  | { kind: "code"; value: string };

const PATTERN = /(\*\*[^*]+\*\*|`[^`]+`|\*[^*\s][^*]*\*)/g;

export function parseInline(text: string): InlineToken[] {
  const tokens: InlineToken[] = [];
  let last = 0;
  for (const match of text.matchAll(PATTERN)) {
    const index = match.index ?? 0;
    if (index > last) tokens.push({ kind: "text", value: text.slice(last, index) });
    const raw = match[0];
    if (raw.startsWith("**")) tokens.push({ kind: "bold", value: raw.slice(2, -2) });
    else if (raw.startsWith("`")) tokens.push({ kind: "code", value: raw.slice(1, -1) });
    else tokens.push({ kind: "italic", value: raw.slice(1, -1) });
    last = index + raw.length;
  }
  if (last < text.length) tokens.push({ kind: "text", value: text.slice(last) });
  return tokens;
}

/** Plain text for search and word counts. */
export function stripInline(text: string): string {
  return parseInline(text)
    .map((t) => t.value)
    .join("");
}
