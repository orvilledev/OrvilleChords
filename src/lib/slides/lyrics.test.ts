import { describe, it, expect } from "vitest";
import { extractStanzas, splitIntoSlides, bodyToSlides } from "./lyrics";

const AMAZING = `{title: Amazing Grace}
{key: G}

{start_of_verse: label="Verse 1"}
A[G]mazing [G7]grace, how [C]sweet the [G]sound
That [G]saved a wretch like [D]me
{end_of_verse}

{start_of_verse: label="Verse 2"}
'Twas [G]grace that taught my [D]heart to fear
{end_of_verse}`;

describe("extractStanzas", () => {
  it("strips chords and directives, leaving clean lyrics", () => {
    const stanzas = extractStanzas(AMAZING);
    expect(stanzas[0]).toEqual([
      "Amazing grace, how sweet the sound",
      "That saved a wretch like me",
    ]);
    // No chord tokens or brackets survive.
    const all = stanzas.flat().join(" ");
    expect(all).not.toMatch(/[[\]]/);
    expect(all).not.toMatch(/\bG7?\b|\bC\b|\bD\b/);
  });

  it("groups lines into stanzas by section", () => {
    const stanzas = extractStanzas(AMAZING);
    expect(stanzas).toHaveLength(2);
    expect(stanzas[1]).toEqual(["'Twas grace that taught my heart to fear"]);
  });

  it("splits stanzas on blank lines when there are no sections", () => {
    const body = "[C]Line one\nline two\n\n[G]line three";
    expect(extractStanzas(body)).toEqual([["Line one", "line two"], ["line three"]]);
  });

  it("drops comments", () => {
    const body = "{comment: play softly}\n[C]Real lyric";
    expect(extractStanzas(body)).toEqual([["Real lyric"]]);
  });
});

describe("splitIntoSlides", () => {
  it("keeps stanzas on separate slides", () => {
    const slides = splitIntoSlides([["a", "b"], ["c"]], 6);
    expect(slides).toEqual([["a", "b"], ["c"]]);
  });

  it("splits a long stanza across slides at the line limit", () => {
    const stanza = ["1", "2", "3", "4", "5"];
    expect(splitIntoSlides([stanza], 2)).toEqual([["1", "2"], ["3", "4"], ["5"]]);
  });

  it("guards against a zero limit", () => {
    expect(splitIntoSlides([["a", "b"]], 0)).toEqual([["a"], ["b"]]);
  });
});

describe("bodyToSlides", () => {
  it("produces projection-ready slides end to end", () => {
    const slides = bodyToSlides(AMAZING, 6);
    expect(slides).toHaveLength(2);
    expect(slides[0][0]).toBe("Amazing grace, how sweet the sound");
  });
});
