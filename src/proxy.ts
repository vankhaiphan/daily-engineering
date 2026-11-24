import { NextResponse, type NextRequest } from "next/server";
import { DEFAULT_LOCALE, isLocale, LOCALE_COOKIE, negotiateLocale } from "@/lib/i18n/config";
import { getUI } from "@/lib/i18n/ui";
import { isKnownPath } from "@/lib/routes";

function notFoundResponse(pathname: string): Response {
  const segment = pathname.split("/")[1];
  const locale = isLocale(segment) ? segment : DEFAULT_LOCALE;
  const ui = getUI(locale);
  const html = `<!doctype html><html lang="${locale}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex"><title>${ui.notFound.title}</title><style>body{font-family:-apple-system,system-ui,sans-serif;background:#f6f4ef;color:#1d1c1a;display:grid;place-items:center;min-height:100dvh;margin:0;padding:1rem;text-align:center}@media(prefers-color-scheme:dark){body{background:#121212;color:#ecebe6}}a{color:#e06a2c;display:inline-block;padding:.75rem;font-weight:600}</style></head><body><main><h1>${ui.notFound.title}</h1><a href="/${locale}">${ui.notFound.back}</a></main></body></html>`;
  return new Response(html, { status: 404, headers: { "content-type": "text/html; charset=utf-8" } });
}

/**
 * Every page lives under /{locale}.
 * - No locale prefix → redirect to the last-used language (cookie), else
 *   Accept-Language, else English.
 * - Locale prefix but unknown route → real 404.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (isLocale(pathname.split("/")[1])) {
    return isKnownPath(pathname) ? NextResponse.next() : notFoundResponse(pathname);
  }

  const saved = request.cookies.get(LOCALE_COOKIE)?.value;
  const locale = isLocale(saved) ? saved : negotiateLocale(request.headers.get("accept-language"));
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
  return NextResponse.redirect(url);
}

export const config = {
  // Skip Next internals and files with an extension (favicon, images…).
  matcher: ["/((?!_next/|.*\\..*).*)"],
};
