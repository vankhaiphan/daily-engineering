"use client";

import { IconPause, IconPlay, IconRestart, IconStepBack, IconStepForward } from "@/components/icons";
import type { StepOutcome } from "@/content/schema";
import { useLesson } from "@/components/lesson/LessonContext";
import type { Stepper } from "./useStepper";

/** Restart · Previous · Play/Pause · Next, with 48–56 px touch targets. */
export function StepControls({ stepper, testIdPrefix }: { stepper: Stepper; testIdPrefix: string }) {
  const t = useLesson().ui.explorer;
  const small = "grid size-12 place-items-center rounded-full text-ink-2 active:bg-surface-2 disabled:opacity-35";
  return (
    <div className="mt-3 flex items-center justify-center gap-2">
      <button type="button" onClick={stepper.reset} disabled={stepper.atStart} aria-label={t.restart} className={small} data-testid={`${testIdPrefix}-reset`}>
        <IconRestart />
      </button>
      <button type="button" onClick={stepper.prev} disabled={stepper.atStart} aria-label={t.prev} className={small} data-testid={`${testIdPrefix}-prev`}>
        <IconStepBack />
      </button>
      <button
        type="button"
        onClick={stepper.toggle}
        aria-label={stepper.playing ? t.pause : t.play}
        data-testid={`${testIdPrefix}-play`}
        className="grid size-14 place-items-center rounded-full bg-accent text-accent-ink shadow-sm active:opacity-80"
      >
        {stepper.playing ? <IconPause /> : <IconPlay />}
      </button>
      <button type="button" onClick={stepper.next} disabled={stepper.atEnd} aria-label={t.next} className={small} data-testid={`${testIdPrefix}-next`}>
        <IconStepForward />
      </button>
    </div>
  );
}

/** Scrollable pill row (primary choice) or wrapping cards (secondary choice). */
export function ChoiceChips({
  label,
  options,
  value,
  onChange,
  testIdPrefix,
  variant = "pill",
}: {
  label: string;
  options: { id: string; label: string }[];
  value: string;
  onChange: (id: string) => void;
  testIdPrefix: string;
  variant?: "pill" | "card";
}) {
  if (options.length < 2 && variant === "card") return null;
  return (
    <>
      <p className="mt-4 text-[0.75rem] font-semibold uppercase tracking-wide text-ink-3 first:mt-0">{label}</p>
      <div
        role="group"
        aria-label={label}
        className={variant === "pill" ? "no-scrollbar -mx-4 mt-2 flex gap-2 overflow-x-auto px-4 pb-1" : "mt-2 flex flex-wrap gap-2"}
      >
        {options.map((o) => {
          const active = o.id === value;
          return (
            <button
              key={o.id}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(o.id)}
              data-testid={`${testIdPrefix}-${o.id}`}
              className={
                variant === "pill"
                  ? `min-h-11 shrink-0 rounded-full border px-4 text-sm font-medium ${active ? "border-accent bg-accent text-accent-ink" : "border-line text-ink-2"}`
                  : `min-h-11 rounded-xl border px-3 text-left text-sm ${active ? "border-ink bg-surface-2 font-medium text-ink" : "border-line text-ink-2"}`
              }
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </>
  );
}

/** Live caption: step counter, outcome badge, explanation. */
export function StepCaption({
  stepLabel,
  outcome,
  text,
  placeholder,
  testId,
  stepTestId,
}: {
  stepLabel?: string;
  outcome?: StepOutcome;
  text?: string;
  placeholder: string;
  testId: string;
  stepTestId: string;
}) {
  const t = useLesson().ui.explorer;
  return (
    <div className="mt-3 min-h-[5.5rem] rounded-xl border border-line px-3 py-2" aria-live="polite" data-testid={testId}>
      {text ? (
        <>
          <p className="flex items-center justify-between text-xs text-ink-3">
            <span data-testid={stepTestId}>{stepLabel}</span>
            {outcome ? (
              <span className={`rounded-full px-2 py-0.5 font-semibold ${outcome === "success" ? "bg-ok-soft text-ok" : "bg-bad-soft text-bad"}`}>
                {t.outcome[outcome]}
              </span>
            ) : null}
          </p>
          <p className="mt-1 text-[0.95rem] leading-snug">{text}</p>
        </>
      ) : (
        <p className="text-[0.95rem] text-ink-2">{placeholder}</p>
      )}
    </div>
  );
}

export const VISUAL_FRAME =
  "not-prose -mx-4 border-y border-line bg-surface px-4 py-4 sm:mx-0 sm:rounded-2xl sm:border";
