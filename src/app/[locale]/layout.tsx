import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { InlineScript } from "@/components/InlineScript";
import { PrefsSync } from "@/components/PrefsSync";
import { SkipLink } from "@/components/SkipLink";
import { isLocale, LOCALE_META, LOCALES } from "@/lib/i18n/config";
import { getUI } from "@/lib/i18n/ui";
import { prefsBootScript } from "@/lib/prefs";
import "../globals.css";

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LayoutProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const ui = getUI(locale);
  return {
    title: { default: ui.appName, template: `%s · ${ui.appName}` },
    description: ui.tagline,
    appleWebApp: { capable: true, title: ui.appName, statusBarStyle: "default" },
    formatDetection: { telephone: false },
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f6f4ef" },
    { media: "(prefers-color-scheme: dark)", color: "#121212" },
  ],
};

export default async function RootLayout({ children, params }: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  return (
    <html lang={LOCALE_META[locale].htmlLang} data-theme="system" data-text-size="m" suppressHydrationWarning>
      <head>
        {/* Applies saved theme + text size before first paint (no flash). */}
        <InlineScript html={prefsBootScript} />
      </head>
      <body>
        <SkipLink label={getUI(locale).skipToContent} />
        <PrefsSync />
        {children}
      </body>
    </html>
  );
}
