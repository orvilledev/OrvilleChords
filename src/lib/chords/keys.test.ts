import { describe, it, expect } from "vitest";
import {
  keyToPitch,
  isMinorKey,
  accidentalForKey,
  semitoneDelta,
  transposeKeyName,
  normalizeKey,
  keyList,
  diatonicChords,
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

describe("diatonicChords", () => {
  it("returns the correct triads for G major, plus the V7", () => {
    const chords = diatonicChords("G").map((c) => c.chord);
    expect(chords).toEqual(["G", "Am", "Bm", "C", "D", "Em", "F#dim", "D7"]);
  });

  it("spells with flats for a flat key", () => {
    const chords = diatonicChords("F").map((c) => c.chord);
    expect(chords).toEqual(["F", "Gm", "Am", "Bb", "C", "Dm", "Edim", "C7"]);
  });

  it("returns natural-minor triads for a minor key", () => {
    const result = diatonicChords("Am");
    expect(result.map((c) => c.chord)).toEqual(["Am", "Bdim", "C", "Dm", "Em", "F", "G", "E7"]);
    // The added dominant 7th is a borrowed major dominant, so its label stays uppercase.
    expect(result.at(-1)).toEqual({ roman: "V7", chord: "E7" });
  });

  it("labels scale degrees with roman numerals", () => {
    const romans = diatonicChords("C").map((c) => c.roman);
    expect(romans).toEqual(["I", "ii", "iii", "IV", "V", "vi", "vii°", "V7"]);
  });

  it("falls back to C major for an empty or invalid key", () => {
    expect(diatonicChords("").map((c) => c.chord)).toEqual(diatonicChords("C").map((c) => c.chord));
    expect(diatonicChords("nonsense").map((c) => c.chord)).toEqual(
      diatonicChords("C").map((c) => c.chord),
    );
  });
});
