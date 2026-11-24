"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconBook, IconCompass } from "@/components/icons";
import { useLesson } from "./LessonContext";

export type Mode = "read" | "explore";

export function modeFromPath(pathname: string, basePath: string): Mode {
  if (pathname.startsWith(`${basePath}/explore`)) return "explore";
  return "read";
}

export function ModeTabs() {
  const { ui, basePath } = useLesson();
  const pathname = usePathname();
  const mode = modeFromPath(pathname, basePath);
  const tabs: { mode: Mode; href: string; label: string; Icon: typeof IconBook }[] = [
    { mode: "read", href: basePath, label: ui.modes.read, Icon: IconBook },
    { mode: "explore", href: `${basePath}/explore`, label: ui.modes.explore, Icon: IconCompass },
  ];

  return (
    <div className="fixed inset-x-0 bottom-0 z-30">
      <nav aria-label={ui.modes.nav} className="pb-safe border-t border-line bg-bg">
        <ul className="mx-auto grid h-[var(--tabs-h)] max-w-2xl grid-cols-2">
          {tabs.map(({ mode: m, href, label, Icon }) => {
            const active = m === mode;
            return (
              <li key={m}>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  data-testid={`mode-${m}`}
                  className={`flex h-full flex-col items-center justify-center gap-0.5 text-[0.7rem] font-medium ${
                    active ? "text-accent" : "text-ink-3"
                  }`}
                >
                  <Icon size={22} />
                  {label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
