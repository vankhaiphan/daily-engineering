"use client";

import { useEffect, useState } from "react";
import { IconX } from "@/components/icons";
import { useLearnerState } from "@/hooks/stores";
import { useLesson } from "./LessonContext";

/**
 * Offers to jump back to the last section in view. Shown only when the page
 * was opened at the top without an explicit #section, and hides once the
 * reader scrolls or chooses.
 */
export function ResumeBanner() {
  const { slug, body, ui, sectionIds } = useLesson();
  const state = useLearnerState();
  const last = state.lessons[slug]?.lastSectionId;
  const [eligible, setEligible] = useState<boolean | null>(null);

  useEffect(() => {
    const ok = !window.location.hash && window.scrollY < 200;
    // Decided once per visit, after hydration (depends on browser-only state).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEligible(ok);
    if (!ok) return;
    const onScroll = () => {
      if (window.scrollY > 600) setEligible(false);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!eligible || !last || last === sectionIds[0]) return null;
  const section = body.sections.find((s) => s.id === last);
  if (!section) return null;

  return (
    <div
      className="fixed inset-x-0 z-20 mx-auto flex max-w-md items-center gap-1 px-3"
      style={{ bottom: "calc(var(--tabs-h) + env(safe-area-inset-bottom) + 0.75rem)" }}
      data-testid="resume-banner"
    >
      <button
        type="button"
        onClick={() => {
          document.getElementById(last)?.scrollIntoView({ block: "start" });
          history.replaceState(null, "", `#${last}`);
          setEligible(false);
        }}
        className="min-h-12 flex-1 truncate rounded-full bg-ink px-4 text-left text-sm font-medium text-bg shadow-lg"
      >
        {ui.lesson.resume(section.title)}
      </button>
      <button
        type="button"
        onClick={() => setEligible(false)}
        aria-label={ui.lesson.dismiss}
        className="grid size-12 shrink-0 place-items-center rounded-full bg-surface text-ink-2 shadow-lg"
      >
        <IconX size={18} />
      </button>
    </div>
  );
}
