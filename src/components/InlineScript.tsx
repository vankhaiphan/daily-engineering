"use client";

/**
 * Inline script that runs once, during HTML parsing, before first paint.
 *
 * Server render: `text/javascript`, so the browser executes it while parsing.
 * Client render (e.g. the root layout re-rendering after a language switch):
 * `text/plain`, so React doesn't render an executable <script> (which it
 * warns about and would never run anyway). `suppressHydrationWarning` covers
 * the type difference. On the client, `PrefsSync` keeps the attributes applied.
 * Pattern from Next.js docs: guides/preventing-flash-before-hydration.
 */
export function InlineScript({ html }: { html: string }) {
  return (
    <script
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
