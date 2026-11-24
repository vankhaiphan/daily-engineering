import { describe, expect, it } from "vitest";
import { isLocale, negotiateLocale, switchLocaleInPath } from "@/lib/i18n/config";
import { UI } from "@/lib/i18n/ui";

describe("negotiateLocale", () => {
  it.each([
    [null, "en"],
    ["", "en"],
    ["vi-VN,vi;q=0.9,en;q=0.8", "vi"],
    ["fr-FR,fr;q=0.9", "fr"],
    ["de-DE,fr;q=0.5,en;q=0.7", "en"],
    ["ja,zh;q=0.8", "en"],
    ["en;q=0,vi;q=0.2", "vi"],
  ])("%s → %s", (header, expected) => {
    expect(negotiateLocale(header)).toBe(expected);
  });
});

describe("switchLocaleInPath", () => {
  it("replaces the locale segment and keeps the rest", () => {
    expect(switchLocaleInPath("/en/lessons/x/explore", "vi")).toBe("/vi/lessons/x/explore");
    expect(switchLocaleInPath("/fr", "en")).toBe("/en");
    expect(switchLocaleInPath("/", "fr")).toBe("/fr");
  });
  it("guards locale values", () => {
    expect(isLocale("vi")).toBe(true);
    expect(isLocale("de")).toBe(false);
    expect(isLocale(undefined)).toBe(false);
  });
});

describe("UI dictionaries", () => {
  const shape = (value: unknown): unknown =>
    value && typeof value === "object"
      ? Object.fromEntries(Object.entries(value).map(([k, v]) => [k, shape(v)]))
      : typeof value;

  it("vi and fr define exactly the same keys as en", () => {
    expect(shape(UI.vi)).toEqual(shape(UI.en));
    expect(shape(UI.fr)).toEqual(shape(UI.en));
  });

  it("are actually translated (not copies of English)", () => {
    expect(UI.vi.modes.read).not.toBe(UI.en.modes.read);
    expect(UI.fr.modes.explore).not.toBe(UI.en.modes.explore);
  });
});

describe("proxy route table", async () => {
  const { isKnownPath } = await import("@/lib/routes");

  it.each([
    ["/en", true],
    ["/vi/", true],
    ["/fr/lessons/building-effective-agents", true],
    ["/fr/lessons/building-effective-agents/listen", false],
    ["/en/lessons/building-effective-agents/explore", true],
    ["/en/lessons", false],
    ["/en/lessons/nope", false],
    ["/en/lessons/building-effective-agents/quiz", false],
    ["/en/lessons/building-effective-agents/listen/x", false],
    ["/en/about", false],
    ["/de", false],
  ])("%s → %s", (path, known) => {
    expect(isKnownPath(path)).toBe(known);
  });
});
