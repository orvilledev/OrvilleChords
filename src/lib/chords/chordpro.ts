import ChordSheetJS, { Song as CsSong, Line, Tag } from "chordsheetjs";
import { accidentalForKey, semitoneDelta, transposeKeyName, type Accidental } from "./keys";

/** A single chord positioned above a fragment of lyric. */
export type Segment = { chords: string; lyrics: string };

/** A whole word: one or more segments that must stay together when wrapping. */
export type LyricWord = Segment[];

export type RenderLine =
  | { kind: "section"; label: string }
  | { kind: "comment"; text: string }
  | { kind: "lyrics"; words: LyricWord[]; hasChords: boolean }
  | { kind: "empty" };

export type ParsedSong = {
  title: string;
  artist: string;
  key: string | null;
  lines: RenderLine[];
};

const SECTION_LABELS: Record<string, string> = {
  chorus: "Chorus",
  verse: "Verse",
  bridge: "Bridge",
  tab: "Tab",
  grid: "Grid",
   pre_chorus: "Pre-Chorus",
};

function normalizeArtist(artist: string | string[] | null): string {
  if (!artist) return "";
  return Array.isArray(artist) ? artist.join(", ") : artist;
}

function sectionLabel(tag: Tag, line: Line): string {
  const label = (tag.label || "").trim();
  if (label) return label;
  const type = (line.type || "").toLowerCase();
  return SECTION_LABELS[type] || "Section";
}

/**
 * Split a flat list of chord/lyric segments into words that wrap as a unit.
 * A segment's lyric may hold several words (one chord over a long phrase), so we
 * split on whitespace and keep each chord glued above its first syllable.
 */
function toWords(segments: Segment[]): LyricWord[] {
  const words: LyricWord[] = [];
  let current: LyricWord = [];

  const closeWord = () => {
    if (current.length > 0) {
      words.push(current);
      current = [];
    }
  };

  for (const seg of segments) {
    const chords = seg.chords ?? "";
    const lyrics = seg.lyrics ?? "";

    if (lyrics === "") {
      // Chord with no lyric (e.g. an instrumental change): keep it with the next word.
      current.push({ chords, lyrics: "" });
      continue;
    }

    // Tokenize into runs of whitespace and runs of non-whitespace, preserving both.
    const tokens = lyrics.match(/\s+|\S+/g) ?? [];
    let chordUsed = false;

    for (const token of tokens) {
      if (/^\s+$/.test(token)) {
        if (current.length === 0) {
          current.push({ chords: chordUsed ? "" : chords, lyrics: token });
          chordUsed = true;
        } else {
          const last = current[current.length - 1];
          current[current.length - 1] = { ...last, lyrics: last.lyrics + token };
        }
        closeWord();
      } else {
        current.push({ chords: chordUsed ? "" : chords, lyrics: token });
        chordUsed = true;
      }
    }
  }

  closeWord();
  return words;
}

function convertLine(line: Line): RenderLine[] {
  const out: RenderLine[] = [];
  const segments: Segment[] = [];
  let hasChords = false;

  for (const item of line.items) {
    if (item instanceof ChordSheetJS.ChordLyricsPair) {
      const chords = item.chords ?? "";
      const lyrics = item.lyrics ?? "";
      if (chords === "" && lyrics === "") continue;
      if (chords !== "") hasChords = true;
      segments.push({ chords, lyrics });
    } else if (item instanceof ChordSheetJS.Tag) {
      const tag = item as Tag;
      if (tag.isComment?.()) {
        const text = (tag.value || tag.label || "").trim();
        if (text) out.push({ kind: "comment", text });
      } else if (tag.isSectionStart?.()) {
        out.push({ kind: "section", label: sectionLabel(tag, line) });
      }
      // Section ends, metadata tags (title/artist/key), etc. are ignored for rendering.
    }
  }

  if (segments.length > 0) {
    out.push({ kind: "lyrics", words: toWords(segments), hasChords });
  } else if (out.length === 0) {
    out.push({ kind: "empty" });
  }

  return out;
}

/** Parse ChordPro text into a Song object (chordsheetjs). Falls back to a plain-text parse. */
function parseToSong(text: string): CsSong {
  try {
    return new ChordSheetJS.ChordProParser().parse(text);
  } catch {
    return new ChordSheetJS.ChordsOverWordsParser().parse(text);
  }
}

function songToParsed(song: CsSong): ParsedSong {
  const lines: RenderLine[] = [];
  for (const line of song.lines) {
    lines.push(...convertLine(line));
  }
  return {
    title: song.title ?? "",
    artist: normalizeArtist(song.artist ?? null),
    key: song.key ?? null,
    lines,
  };
}

/**
 * Parse ChordPro into a render-ready structure.
 * @param semitones optional transpose (positive = up), applied before rendering.
 * @param accidental force chord spelling to sharps ("#") or flats ("b").
 */
export function renderChordPro(
  text: string,
  semitones = 0,
  accidental: Accidental | null = null,
): ParsedSong {
  let song = parseToSong(text);
  if (semitones !== 0) {
    song = song.transpose(semitones, accidental ? { accidental } : undefined);
  }
  return songToParsed(song);
}

/**
 * Render a song transposed from its original key to a target key, optionally with a capo.
 * A capo lowers the played shapes: capo N in the sounding key shows the chord shapes N
 * semitones below the sounding key, so we simply render in that lower "shape key".
 *
 * Uses chordsheetjs's key-aware `changeKey`, which spells chords in the destination key's
 * context (e.g. B♭ not A♯ in flat keys), avoiding blunt sharp/flat forcing.
 */
export function renderInKey(
  text: string,
  originalKey: string,
  targetKey: string,
  capo = 0,
): ParsedSong {
  const accidental = accidentalForKey(targetKey);
  const shapeKey = capo > 0 ? transposeKeyName(targetKey, -capo, accidental) : targetKey;

  const song = parseToSong(text);
  const source = originalKey || song.key || targetKey;

  try {
    return songToParsed(song.setKey(source).changeKey(shapeKey));
  } catch {
    // Fallback: raw semitone transpose spelled for the shape key.
    const delta = semitoneDelta(source, shapeKey);
    return renderChordPro(text, delta, accidentalForKey(shapeKey));
  }
}
