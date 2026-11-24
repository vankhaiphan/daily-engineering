"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { IconX } from "./icons";

/** Bottom sheet on phones, centered dialog on wider screens. Uses native <dialog> (iOS 15.4+). */
export function Sheet({
  open,
  onClose,
  title,
  closeLabel,
  children,
  testId,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  closeLabel: string;
  children: ReactNode;
  testId?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="sheet"
      aria-label={title}
      data-testid={testId}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="pb-safe">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-line bg-surface px-4 py-3">
          <h2 className="text-base font-semibold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="-mr-2 grid size-11 place-items-center rounded-full text-ink-2 active:bg-surface-2"
            aria-label={closeLabel}
          >
            <IconX />
          </button>
        </div>
        <div className="overflow-y-auto px-4 py-4" style={{ maxHeight: "calc(85dvh - 4rem)" }}>
          {children}
        </div>
      </div>
    </dialog>
  );
}
