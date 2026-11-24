"use client";

import { useLayoutEffect } from "react";
import { prefsStore } from "@/hooks/stores";
import { applyPrefsToDocument } from "@/lib/prefs";

/**
 * The inline boot script applies prefs before first paint. React may reset
 * <html> attributes on a dev Strict Mode remount, so re-apply here too.
 */
export function PrefsSync() {
  useLayoutEffect(() => {
    applyPrefsToDocument(prefsStore.get());
    return prefsStore.subscribe(() => applyPrefsToDocument(prefsStore.get()));
  }, []);
  return null;
}
