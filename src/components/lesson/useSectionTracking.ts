"use client";

import { useEffect } from "react";
import { learnerStore } from "@/hooks/stores";
import { visibleElements } from "@/lib/dom";
import { markSectionRead, setLastSection } from "@/lib/progress";

/** A section counts as read once its end rises above this fraction of the viewport. */
const READ_LINE = 0.85;
/** The section crossing this line is the resume point. */
const POSITION_LINE = 0.35;

/**
 * Scroll-based progress, checked once per animation frame while scrolling.
 *
 * Why not IntersectionObserver on a 1px end marker? It only reports changes
 * in intersection state, so a marker skipped in a single frame (fast iOS
 * momentum scroll, or a jump to #section) is never reported. Here, any end
 * marker within one screen above the read line counts, which survives fast
 * flicks but doesn't mark sections that were jumped over from far away.
 */
export function useSectionTracking(slug: string) {
  useEffect(() => {
    let frame = 0;

    const check = () => {
      frame = 0;
      const vh = window.innerHeight;
      for (const end of visibleElements<HTMLElement>("[data-section-end]")) {
        const top = end.getBoundingClientRect().top;
        const id = end.dataset.sectionEnd;
        if (id && top < vh * READ_LINE && top > -vh) learnerStore.set((s) => markSectionRead(s, slug, id));
      }
      let current: string | undefined;
      for (const section of visibleElements<HTMLElement>("[data-section-id]")) {
        if (section.getBoundingClientRect().top <= vh * POSITION_LINE) current = section.dataset.sectionId;
      }
      if (current) learnerStore.set((s) => setLastSection(s, slug, current));
    };

    const schedule = () => {
      if (!frame) frame = window.requestAnimationFrame(check);
    };

    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
    };
  }, [slug]);
}
