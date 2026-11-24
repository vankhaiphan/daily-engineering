"use client";

import { useState } from "react";
import { updatePrefs, usePrefs } from "@/hooks/stores";
import type { Locale } from "@/lib/i18n/config";
import { getUI } from "@/lib/i18n/ui";
import { TEXT_SIZES, THEMES } from "@/lib/prefs";
import { IconSettings } from "./icons";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { Segmented } from "./Segmented";
import { Sheet } from "./Sheet";

export function SettingsButton({ locale }: { locale: Locale }) {
  const [open, setOpen] = useState(false);
  const prefs = usePrefs();
  const ui = getUI(locale);
  const sizeIndex = TEXT_SIZES.indexOf(prefs.textSize);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="grid size-11 place-items-center rounded-full text-ink-2 active:bg-surface-2"
        aria-label={ui.settings}
        data-testid="open-settings"
      >
        <IconSettings />
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} title={ui.settings} closeLabel={ui.close} testId="settings-sheet">
        <div className="space-y-6">
          <section className="space-y-2">
            <h3 className="text-sm font-medium text-ink-2">{ui.language}</h3>
            <LanguageSwitcher locale={locale} onSwitched={() => setOpen(false)} />
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-medium text-ink-2">{ui.theme}</h3>
            <Segmented
              label={ui.theme}
              value={prefs.theme}
              testId="theme-switcher"
              options={THEMES.map((t) => ({ value: t, label: ui.themes[t] }))}
              onChange={(theme) => updatePrefs({ theme })}
            />
          </section>

          <section className="space-y-2">
            <h3 className="text-sm font-medium text-ink-2">{ui.textSize}</h3>
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="grid size-11 place-items-center rounded-xl bg-surface-2 text-sm font-semibold disabled:opacity-40"
                onClick={() => updatePrefs({ textSize: TEXT_SIZES[Math.max(0, sizeIndex - 1)] })}
                disabled={sizeIndex <= 0}
                aria-label={ui.textSmaller}
                data-testid="text-smaller"
              >
                A−
              </button>
              <output className="flex-1 text-center text-sm text-ink-2" aria-live="polite" data-testid="text-size-value">
                {ui.textSizeNames[prefs.textSize]}
              </output>
              <button
                type="button"
                className="grid size-11 place-items-center rounded-xl bg-surface-2 text-lg font-semibold disabled:opacity-40"
                onClick={() => updatePrefs({ textSize: TEXT_SIZES[Math.min(TEXT_SIZES.length - 1, sizeIndex + 1)] })}
                disabled={sizeIndex >= TEXT_SIZES.length - 1}
                aria-label={ui.textLarger}
                data-testid="text-larger"
              >
                A+
              </button>
            </div>
            <p className="prose-lesson rounded-xl border border-line p-3 text-ink-2">{ui.tagline}</p>
          </section>
        </div>
      </Sheet>
    </>
  );
}
