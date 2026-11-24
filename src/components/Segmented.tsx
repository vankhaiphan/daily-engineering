"use client";

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  lang?: string;
  ariaLabel?: string;
}

/** Touch-friendly segmented control (44px targets, aria-pressed state). */
export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
  testId,
}: {
  label: string;
  value: T;
  options: SegmentedOption<T>[];
  onChange: (value: T) => void;
  testId?: string;
}) {
  return (
    <div role="group" aria-label={label} data-testid={testId} className="flex rounded-xl bg-surface-2 p-1">
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            lang={option.lang}
            aria-pressed={active}
            aria-label={option.ariaLabel}
            onClick={() => onChange(option.value)}
            className={`min-h-11 flex-1 rounded-lg px-2 text-sm font-medium transition-colors ${
              active ? "bg-surface text-ink shadow-sm" : "text-ink-2"
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
