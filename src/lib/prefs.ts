/**
 * Display preferences. Stored in localStorage and applied to <html> by an
 * inline script before first paint (see `prefsBootScript`), so there is no
 * theme/text-size flash and pages stay statically prerendered.
 */
export const PREFS_KEY = "de:v1:prefs";

export const THEMES = ["system", "light", "dark"] as const;
export type ThemePref = (typeof THEMES)[number];

export const TEXT_SIZES = ["s", "m", "l", "xl"] as const;
export type TextSize = (typeof TEXT_SIZES)[number];

export interface Prefs {
  theme: ThemePref;
  textSize: TextSize;
}

export const DEFAULT_PREFS: Prefs = Object.freeze({
  theme: "system",
  textSize: "m",
}) as Prefs;

export function parsePrefs(raw: string | null): Prefs {
  if (!raw) return DEFAULT_PREFS;
  try {
    const data = JSON.parse(raw) as Partial<Prefs>;
    return {
      theme: THEMES.includes(data.theme as ThemePref) ? (data.theme as ThemePref) : DEFAULT_PREFS.theme,
      textSize: TEXT_SIZES.includes(data.textSize as TextSize) ? (data.textSize as TextSize) : DEFAULT_PREFS.textSize,
    };
  } catch {
    return DEFAULT_PREFS;
  }
}

/** Mirror prefs onto <html> attributes (theme, text size). */
export function applyPrefsToDocument(prefs: Prefs, root: HTMLElement = document.documentElement) {
  root.dataset.theme = prefs.theme;
  root.dataset.textSize = prefs.textSize;
}

/** Runs synchronously in <head> before paint. Must stay dependency-free ES5. */
export const prefsBootScript = `(function(){try{var d=document.documentElement,p=JSON.parse(localStorage.getItem(${JSON.stringify(
  PREFS_KEY,
)})||"{}");if(p.theme==="light"||p.theme==="dark")d.setAttribute("data-theme",p.theme);if(["s","m","l","xl"].indexOf(p.textSize)>-1)d.setAttribute("data-text-size",p.textSize)}catch(e){}})()`;
