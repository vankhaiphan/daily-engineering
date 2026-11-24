import { formatDate } from "@/lib/format";
import type { Locale } from "@/lib/i18n/config";

/** A source's publication date, or an explicit "not stated" (dates are never guessed). */
export function SourceDate({ iso, locale, fallback }: { iso: string | null; locale: Locale; fallback: string }) {
  if (!iso) return <span>{fallback}</span>;
  return <time dateTime={iso}>{formatDate(iso, locale)}</time>;
}
