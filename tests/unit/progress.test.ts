import { describe, expect, it } from "vitest";
import {
  completion,
  EMPTY_STATE,
  isBookmarked,
  markSectionRead,
  parseLearnerState,
  recordQuizAnswer,
  resetQuiz,
  setLastSection,
  toggleBookmark,
} from "@/lib/progress";
import { DEFAULT_PREFS, parsePrefs, prefsBootScript } from "@/lib/prefs";

describe("progress reducers", () => {
  it("marks sections read once and reports completion", () => {
    let s = markSectionRead(EMPTY_STATE, "l", "a", 1);
    s = markSectionRead(s, "l", "a", 2);
    s = markSectionRead(s, "l", "b", 3);
    expect(s.lessons.l.readSections).toEqual(["a", "b"]);
    expect(completion(s.lessons.l, ["a", "b", "c", "d"])).toBe(0.5);
  });

  it("returns the same reference when nothing changes (no needless writes)", () => {
    const s = setLastSection(EMPTY_STATE, "l", "a", 1);
    expect(setLastSection(s, "l", "a", 2)).toBe(s);
    expect(recordQuizAnswer(recordQuizAnswer(s, "l", "q", "b"), "l", "q", "b")).toEqual(recordQuizAnswer(s, "l", "q", "b"));
  });

  it("records and resets quiz answers", () => {
    let s = recordQuizAnswer(EMPTY_STATE, "l", "q1", "b", 1);
    s = recordQuizAnswer(s, "l", "q1", "c", 2);
    expect(s.lessons.l.quizAnswers).toEqual({ q1: "c" });
    expect(resetQuiz(s, "l").lessons.l.quizAnswers).toEqual({});
  });

  it("toggles bookmarks", () => {
    const on = toggleBookmark(EMPTY_STATE, "l", "a", 1);
    expect(isBookmarked(on, "l", "a")).toBe(true);
    expect(isBookmarked(toggleBookmark(on, "l", "a"), "l", "a")).toBe(false);
  });

  it("never mutates the frozen empty state", () => {
    markSectionRead(EMPTY_STATE, "l", "a");
    toggleBookmark(EMPTY_STATE, "l", "a");
    expect(EMPTY_STATE.lessons).toEqual({});
    expect(EMPTY_STATE.bookmarks).toEqual([]);
  });
});

describe("storage parsing is defensive", () => {
  it.each([null, "", "not json", "{}", '{"version":2}', '{"version":1,"lessons":5,"bookmarks":[]}'])("%s → empty", (raw) => {
    expect(parseLearnerState(raw)).toEqual(EMPTY_STATE);
  });

  it("round-trips valid state and drops malformed entries", () => {
    const s = toggleBookmark(markSectionRead(EMPTY_STATE, "l", "a", 5), "l", "a", 6);
    const raw = JSON.stringify({ ...s, bookmarks: [...s.bookmarks, { nope: true }] });
    expect(parseLearnerState(raw)).toEqual(s);
  });

  it("parses prefs with fallbacks", () => {
    expect(parsePrefs(null)).toEqual(DEFAULT_PREFS);
    expect(parsePrefs('{"theme":"dark","textSize":"xl","speechRate":9}')).toEqual({ ...DEFAULT_PREFS, theme: "dark", textSize: "xl" });
  });

  it("boot script is valid standalone JavaScript", () => {
    expect(() => new Function(prefsBootScript)).not.toThrow();
  });
});
