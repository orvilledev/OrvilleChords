import { describe, expect, it } from "vitest";
import { isChordToken, ocrLinesToChordPro, type OcrLine, type OcrWord } from "./screenshot";

/** Build an OCR line from [text, startColumn] pairs on a 10px/char monospace grid. */
function line(y: number, ...tokens: [string, number][]): OcrLine {
  const words: OcrWord[] = tokens.map(([text, col]) => ({
    text,
    x0: col * 10,
    x1: (col + text.length) * 10,
    y0: y,
    y1: y + 16,
  }));
  return { words, y0: y, y1: y + 16 };
}

describe("isChordToken", () => {
  it("accepts real chords", () => {
    for (const c of ["G", "C#m", "F#m7", "Bb", "Dsus4", "Gmaj7", "D/F#", "Am7", "N.C."]) {
      expect(isChordToken(c), c).toBe(true);
    }
  });

  it("rejects ordinary words that start with A-G", () => {
    for (const w of ["And", "Be", "Do", "Great", "Father", "All", "Come"]) {
      expect(isChordToken(w), w).toBe(false);
    }
  });

  it("cleans OCR punctuation", () => {
    expect(isChordToken("G,")).toBe(true);
    expect(isChordToken("|D")).toBe(true);
  });
});

describe("ocrLinesToChordPro", () => {
  it("places chords at the column they sit above", () => {
    //      D         G  A     D
    // There is a longing only You can fill
    const { body } = ocrLinesToChordPro([
      [
        line(0, ["D", 0], ["G", 19], ["A", 24], ["D", 33]),
        line(20, ["There", 0], ["is", 6], ["a", 9], ["longing", 11], ["only", 19], ["You", 24], ["can", 28], ["fill", 32]),
      ],
    ]);
    expect(body).toContain("[D]There is a longing [G]only [A]You can f[D]ill");
  });

  it("keeps chords mid-word", () => {
    //    G
    // Amazing grace
    const { body } = ocrLinesToChordPro([
      [line(0, ["G", 2]), line(20, ["Amazing", 0], ["grace", 8])],
    ]);
    expect(body).toContain("Am[G]azing grace");
  });

  it("emits section directives from headers", () => {
    const { body } = ocrLinesToChordPro([
      [
        line(0, ["Verse1", 0]),
        line(20, ["G", 0]),
        line(40, ["God", 0], ["is", 4], ["able", 7]),
        line(80, ["Chorus", 0]),
        line(100, ["C", 0]),
        line(120, ["Lifted", 0], ["up", 7]),
      ],
    ]);
    expect(body).toBe(
      [
        '{start_of_verse: label="Verse 1"}',
        "[G]God is able",
        "{end_of_verse}",
        "",
        "{start_of_chorus}",
        "[C]Lifted up",
        "{end_of_chorus}",
      ].join("\n"),
    );
  });

  it("renders trailing chord lines as chord-only lines", () => {
    const { body } = ocrLinesToChordPro([
      [
        line(0, ["Bridge", 0]),
        line(20, ["C", 0], ["D", 4], ["G", 8], ["Em", 12]),
      ],
    ]);
    expect(body).toContain("[C] [D] [G] [Em]");
  });

  it("appends chords past the end of the lyric", () => {
    //       E        A
    // The one thing
    const { body } = ocrLinesToChordPro([
      [line(0, ["E", 4], ["A", 15]), line(20, ["The", 0], ["one", 4], ["thing", 8])],
    ]);
    expect(body).toContain("The [E]one thing [A]");
  });

  it("separates paragraphs on large vertical gaps", () => {
    const { body } = ocrLinesToChordPro([
      [line(0, ["Hello", 0]), line(60, ["World", 0])],
    ]);
    expect(body).toBe("Hello\n\nWorld");
  });

  it("joins multiple screenshots in order", () => {
    const { body } = ocrLinesToChordPro([
      [line(0, ["Verse1", 0]), line(20, ["First", 0], ["page", 6])],
      [line(0, ["Chorus", 0]), line(20, ["Second", 0], ["page", 7])],
    ]);
    expect(body.indexOf("First page")).toBeLessThan(body.indexOf("Second page"));
    expect(body).toContain("{start_of_chorus}");
  });

  it("guesses the key from chord frequency and endpoints", () => {
    const { keyGuess } = ocrLinesToChordPro([
      [
        line(0, ["G", 0], ["D", 4], ["Em", 8], ["C", 12]),
        line(20, ["la", 0], ["la", 3], ["la", 6], ["la", 9]),
        line(40, ["G", 0]),
        line(60, ["la", 0]),
      ],
    ]);
    expect(keyGuess).toBe("G");
  });
});
