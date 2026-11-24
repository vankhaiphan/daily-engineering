import type { Locale } from "@/lib/i18n/config";

const MONTHS: Record<Exclude<Locale, "vi">, string[]> = {
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  fr: ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"],
};

/**
 * Format an ISO calendar date without Intl: Node's ICU and Safari's ICU
 * disagree on some locales (e.g. Vietnamese adds "ngày" in Safari only),
 * which would cause a hydration mismatch.
 */
export function formatDate(iso: string, locale: Locale): string {
  const [y, m, d] = iso.split("-").map(Number);
  switch (locale) {
    case "vi":
      return `ngày ${d} tháng ${m} năm ${y}`;
    case "fr":
      return `${d === 1 ? "1er" : d} ${MONTHS.fr[m - 1]} ${y}`;
    default:
      return `${MONTHS.en[m - 1]} ${d}, ${y}`;
  }
}

/**
 * Percent for teaching contexts: never rounds a non-certain probability up to
 * "100%" (or a non-zero one down to "0%"), which would overstate certainty.
 */
export function formatPercent(fraction: number): string {
  const v = fraction * 100;
  if (fraction >= 1) return "100%";
  if (fraction <= 0) return "0%";
  if (v >= 99.95) return ">99.9%";
  if (v >= 99.5) return `${v.toFixed(1)}%`;
  if (v < 0.05) return "<0.1%";
  if (v < 10) return `${v.toFixed(1)}%`;
  return `${Math.round(v)}%`;
}
