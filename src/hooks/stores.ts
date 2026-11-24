"use client";

import { useSyncExternalStore } from "react";
import { EMPTY_STATE, parseLearnerState, type LearnerState } from "@/lib/progress";
import { applyPrefsToDocument, DEFAULT_PREFS, parsePrefs, PREFS_KEY, type Prefs } from "@/lib/prefs";
import { createPersistentStore } from "@/lib/store";

export const LEARNER_KEY = "de:v1:learner";

export const learnerStore = createPersistentStore<LearnerState>(LEARNER_KEY, EMPTY_STATE, parseLearnerState);
export const prefsStore = createPersistentStore<Prefs>(PREFS_KEY, DEFAULT_PREFS, parsePrefs);

export function useLearnerState(): LearnerState {
  return useSyncExternalStore(learnerStore.subscribe, learnerStore.get, learnerStore.getServer);
}

export function usePrefs(): Prefs {
  return useSyncExternalStore(prefsStore.subscribe, prefsStore.get, prefsStore.getServer);
}

export function updatePrefs(patch: Partial<Prefs>) {
  prefsStore.set((current) => ({ ...current, ...patch }));
  applyPrefsToDocument(prefsStore.get());
}
