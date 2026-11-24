"use client";

import { visibleElements } from "@/lib/dom";

/** Skip link that targets the visible <main> (hidden routes may also contain one). */
export function SkipLink({ label }: { label: string }) {
  return (
    <a
      href="#main"
      onClick={(event) => {
        const main = visibleElements<HTMLElement>("main")[0];
        if (!main) return;
        event.preventDefault();
        main.tabIndex = -1;
        main.focus();
      }}
      className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-surface focus:px-3 focus:py-2"
    >
      {label}
    </a>
  );
}
