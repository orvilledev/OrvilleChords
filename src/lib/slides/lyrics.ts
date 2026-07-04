import { renderChordPro } from "../chords/chordpro";

/** A stanza is a group of consecutive lyric lines (a verse, chorus, etc.). */
export type Stanza = string[];

/** One projection slide: up to a few lyric lines. */
export type Slide = string[];

/**
 * Extract plain lyrics from a ChordPro body, grouped into stanzas.
 * Strips all chord tokens, directives, and comments; section markers and blank
 * lines become stanza boundaries.
 */
export function extractStanzas(body: string): Stanza[] {
  const parsed = renderChordPro(body);
  const stanzas: Stanza[] = [];
  let current: Stanza = [];

  const flush = () => {
    if (current.length > 0) {
      stanzas.push(current);
      current = [];
    }
  };

  for (const line of parsed.lines) {
    switch (line.kind) {
      case "section":
      case "empty":
        flush();
        break;
      case "comment":
        break; // performance notes never go on projection slides
      case "lyrics": {
        const text = line.words
          .map((word) => word.map((seg) => seg.lyrics).join(""))
          .join("")
          .replace(/\s+/g, " ")
          .trim();
        if (text) current.push(text);
        break;
      }
    }
  }
  flush();
  return stanzas;
}

/**
 * Split stanzas into slides of at most `maxLines` lines each. Stanzas never
 * share a slide; a long stanza is split across consecutive slides.
 */
export function splitIntoSlides(stanzas: Stanza[], maxLines = 6): Slide[] {
  const limit = Math.max(1, maxLines);
  const slides: Slide[] = [];
  for (const stanza of stanzas) {
    for (let i = 0; i < stanza.length; i += limit) {
      slides.push(stanza.slice(i, i + limit));
    }
  }
  return slides;
}

/** Convenience: ChordPro body straight to projection slides. */
export function bodyToSlides(body: string, maxLines = 6): Slide[] {
  return splitIntoSlides(extractStanzas(body), maxLines);
}
