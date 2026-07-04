import { describe, it, expect } from "vitest";
import { renderChordPro, renderInKey, type ParsedSong } from "./chordpro";

/** Pull the chord tokens (in order) out of a rendered song. */
function chords(parsed: ParsedSong): string[] {
  const out: string[] = [];
  for (const line of parsed.lines) {
    if (line.kind !== "lyrics") continue;
    for (const word of line.words) {
      for (const seg of word) {
        if (seg.chords) out.push(seg.chords);
      }
    }
  }
  return out;
}

const line = (body: string) => chords(renderChordPro(body));

describe("parsing chords over lyrics", () => {
  it("keeps chords attached to their syllables", () => {
    const parsed = renderChordPro("A[G]mazing [C]grace");
    expect(chords(parsed)).toEqual(["G", "C"]);
  });
});

describe("basic transposition across keys", () => {
  it("transposes G major up to A", () => {
    const c = chords(renderInKey("[G]a [C]b [D]c [Em]d", "G", "A"));
    expect(c).toEqual(["A", "D", "E", "F#m"]);
  });

  it("transposes down as well as up", () => {
    const c = chords(renderInKey("[G]a [C]b [D]c", "G", "F"));
    expect(c).toEqual(["F", "Bb", "C"]);
  });
});

describe("enharmonic correctness", () => {
  it("uses flats when the target key is flat (Bb not A#)", () => {
    const c = chords(renderInKey("[C]a [F]b [G]c", "C", "Eb"));
    expect(c).toEqual(["Eb", "Ab", "Bb"]);
  });

  it("uses sharps when the target key is sharp (C# not Db)", () => {
    const c = chords(renderInKey("[C]a [G]b", "C", "D"));
    expect(c).toEqual(["D", "A"]);
  });

  it("spells F major with flats", () => {
    const c = chords(renderInKey("[C]a [D]b", "C", "F"));
    expect(c).toEqual(["F", "G"]);
  });
});

describe("complex chords", () => {
  it("transposes slash chords and keeps the bass note", () => {
    const c = chords(renderInKey("[G/B]a [C/E]b", "G", "A"));
    expect(c).toEqual(["A/C#", "D/F#"]);
  });

  it("preserves sevenths and extensions", () => {
    const c = chords(renderInKey("[Cmaj7]a [Dm7]b [G7]c", "C", "D"));
    expect(c).toEqual(["Dmaj7", "Em7", "A7"]);
  });

  it("handles altered chords", () => {
    const c = chords(renderInKey("[F#m7b5]a", "A", "B"));
    expect(c[0]).toBe("G#m7b5");
  });
});

describe("round trip", () => {
  it("returns to the original after up then down", () => {
    const body = "[G]a [C]b [D]c [Em]d [Am]e";
    const original = line(body);
    const up = renderInKey(body, "G", "C"); // +5
    const back = renderInKey(
      "[" + chords(up).join("]a [") + "]a",
      "C",
      "G",
    ); // -5
    expect(chords(back)).toEqual(original);
  });
});

describe("capo", () => {
  it("shows lower shapes: key A with capo 2 plays G shapes", () => {
    const c = chords(renderInKey("[A]a [D]b [E]c", "A", "A", 2));
    expect(c).toEqual(["G", "C", "D"]);
  });

  it("no capo leaves the sounding chords unchanged", () => {
    const c = chords(renderInKey("[A]a [D]b", "A", "A", 0));
    expect(c).toEqual(["A", "D"]);
  });
});
