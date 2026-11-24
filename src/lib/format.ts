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
