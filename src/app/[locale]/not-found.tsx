import Link from "next/link";
import { getUI } from "@/lib/i18n/ui";

// not-found cannot read params; English fallback with a link home.
export default function NotFound() {
  const ui = getUI("en");
  return (
    <main id="main" className="mx-auto max-w-md px-4 py-24 text-center">
      <h1 className="font-serif text-2xl font-semibold">{ui.notFound.title}</h1>
      <Link href="/" className="mt-6 inline-flex min-h-11 items-center font-medium text-accent">
        {ui.notFound.back}
      </Link>
    </main>
  );
}
