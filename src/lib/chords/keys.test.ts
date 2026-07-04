import { describe, it, expect } from "vitest";
import {
  keyToPitch,
  isMinorKey,
  accidentalForKey,
  semitoneDelta,
  transposeKeyName,
  normalizeKey,
  keyList,
} from "./keys";

describe("keyToPitch", () => {
  it("parses naturals, sharps and flats", () => {
    expect(keyToPitch("C")).toBe(0);
    expect(keyToPitch("G")).toBe(7);
    expect(keyToPitch("Bb")).toBe(10);
    expect(keyToPitch("F#")).toBe(6);
    expect(keyToPitch("B")).toBe(11);
  });

  it("ignores minor suffix for pitch", () => {
    expect(keyToPitch("Am")).toBe(9);
    expect(keyToPitch("F#m")).toBe(6);
  });

  it("returns null for garbage", () => {
    expect(keyToPitch("")).toBeNull();
    expect(keyToPitch("H")).toBeNull();
  });
});

describe("isMinorKey", () => {
  it("detects minor but not maj7-style names", () => {
    expect(isMinorKey("Am")).toBe(true);
    expect(isMinorKey("Ebm")).toBe(true);
    expect(isMinorKey("C")).toBe(false);
    expect(isMinorKey("Cmaj7")).toBe(false);
  });
});

describe("accidentalForKey", () => {
  it("uses flats for flat keys and F major", () => {
    for (const k of ["F", "Bb", "Eb", "Ab", "Db"]) {
      expect(accidentalForKey(k)).toBe("b");
    }
  });

  it("uses sharps for sharp keys", () => {
    for (const k of ["C", "G", "D", "A", "E", "B", "F#"]) {
      expect(accidentalForKey(k)).toBe("#");
    }
  });

  it("handles natural minor keys", () => {
    expect(accidentalForKey("Dm")).toBe("b");
    expect(accidentalForKey("Gm")).toBe("b");
    expect(accidentalForKey("Em")).toBe("#");
    expect(accidentalForKey("Am")).toBe("#");
  });
});

describe("semitoneDelta", () => {
  it("computes normalized distance", () => {
    expect(semitoneDelta("G", "A")).toBe(2);
    expect(semitoneDelta("C", "Eb")).toBe(3);
    expect(semitoneDelta("G", "F")).toBe(10);
    expect(semitoneDelta("D", "D")).toBe(0);
  });
});

describe("transposeKeyName", () => {
  it("spells according to the accidental preference", () => {
    expect(transposeKeyName("G", 2, "#")).toBe("A");
    expect(transposeKeyName("C", 3, "b")).toBe("Eb");
    expect(transposeKeyName("C", 1, "b")).toBe("Db");
    expect(transposeKeyName("C", 1, "#")).toBe("C#");
    expect(transposeKeyName("A", -2, "#")).toBe("G");
  });

  it("preserves the minor suffix", () => {
    expect(transposeKeyName("Am", 2, "#")).toBe("Bm");
  });
});

describe("normalizeKey / keyList", () => {
  it("re-spells to canonical picker names", () => {
    expect(normalizeKey("C#")).toBe("Db");
    expect(normalizeKey("G")).toBe("G");
    expect(normalizeKey("Am")).toBe("Am");
  });

  it("returns 12 tonics matching the mode", () => {
    expect(keyList(false)).toHaveLength(12);
    expect(keyList(false)).toContain("Bb");
    expect(keyList(true)).toContain("F#m");
  });
});
