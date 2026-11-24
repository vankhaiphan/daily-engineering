"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

/**
 * Shared step engine for every visualization: play/pause, previous/next,
 * reset. `min` is -1 for "ready" states (flow, sequence) or 0 when the first
 * frame is meaningful on its own (charts).
 */
export function useStepper(length: number, { stepMs = 2600, min = -1 }: { stepMs?: number; min?: -1 | 0 } = {}) {
  const [index, setIndex] = useState<number>(min);
  const [playing, setPlaying] = useState(false);
  const atEnd = index >= length - 1;

  useEffect(() => {
    if (!playing || atEnd) return;
    const timer = window.setTimeout(
      () => {
        setIndex(index + 1);
        if (index + 1 >= length - 1) setPlaying(false);
      },
      index < 0 ? 300 : stepMs,
    );
    return () => window.clearTimeout(timer);
  }, [playing, index, atEnd, length, stepMs]);

  return {
    index,
    playing,
    atEnd,
    atStart: index <= min,
    goTo: (i: number) => {
      setPlaying(false);
      setIndex(Math.max(min, Math.min(length - 1, i)));
    },
    next: () => {
      setPlaying(false);
      setIndex((i) => Math.min(length - 1, i + 1));
    },
    prev: () => {
      setPlaying(false);
      setIndex((i) => Math.max(min, i - 1));
    },
    reset: () => {
      setPlaying(false);
      setIndex(min);
    },
    toggle: () => {
      if (playing) return setPlaying(false);
      if (atEnd) setIndex(min);
      setPlaying(true);
    },
  };
}

export type Stepper = ReturnType<typeof useStepper>;

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

function subscribeReducedMotion(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

export function usePrefersReducedMotion(): boolean {
  return useSyncExternalStore(subscribeReducedMotion, () => window.matchMedia(REDUCED_MOTION).matches, () => false);
}
