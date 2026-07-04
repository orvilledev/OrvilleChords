/**
 * Screenshot → ChordPro import.
 *
 * Chord charts in screenshots put chords on their own line above the lyrics.
 * Instead of trusting raw OCR text (which loses column alignment), we use each
 * OCR word's bounding box to compute exactly which character of the lyric line
 * every chord sits above, then emit ChordPro with the chord inserted there.
 */

export type OcrWord = { text: string; x0: number; x1: number; y0: number; y1: number };
export type OcrLine = { words: OcrWord[]; y0: number; y1: number };

export type ImportedChart = { body: string; keyGuess: string };

/* ---------------------------------- tokens --------------------------------- */

// Root + a limited run of quality/extension characters + optional slash bass.
// The suffix alternation only admits chord vocabulary (m, maj, dim, sus, digits…),
// so ordinary words ("And", "Be", "Do") fail even though they start with A–G.
const CHORD_RE =
  /^[A-G](?:#|b)?(?:maj|min|dim|aug|sus|add|m|M|\+|°|ø|-|\d|#|b){0,6}(?:\/[A-G](?:#|b)?)?$/;

// Section number may be misread by OCR: l/I for 1, O for 0.
const HEADER_RE =
  /^(verse|chorus|pre[\s-]?chorus|bridge|intro|outro|tag|interlude|instrumental|refrain|ending|vamp|turnaround)\s*([\dlIO]+)?\s*:?$/i;

/**
 * Strip surrounding pipes/brackets/punctuation OCR tends to attach to chords,
 * and undo common misreads: lowercase roots ("c" for C, "em" for Em) and
 * doubled letters ("Cc" for C — but never "Bb", which is a real flat).
 */
function cleanChordToken(raw: string): string {
  let t = raw.replace(/^[|([{]+/, "").replace(/[|)\]},.;:]+$/, "");
  if (/^[a-g]/.test(t)) t = t[0].toUpperCase() + t.slice(1);
  if (/^[A-G][ac-g]$/.test(t) && t[0] === t[1].toUpperCase()) t = t[0];
  return t;
}

export function isChordToken(raw: string): boolean {
  const t = cleanChordToken(raw);
  if (!t) return false;
  if (/^N\.?C\.?$/i.test(t)) return true;
  return CHORD_RE.test(t);
}

function isChordLine(line: OcrLine): boolean {
  return line.words.length > 0 && line.words.every((w) => isChordToken(w.text));
}

function headerMatch(line: OcrLine): { name: string; num?: string } | null {
  const text = line.words.map((w) => w.text).join(" ").trim();
  const m = HEADER_RE.exec(text);
  if (!m) return null;
  const num = m[2]?.replace(/[lI]/g, "1").replace(/O/g, "0");
  return { name: m[1].toLowerCase().replace(/[\s-]/g, ""), num };
}

/* --------------------------------- sections -------------------------------- */

type Section = { type: "verse" | "chorus" | "bridge"; label?: string };

function sectionFor(name: string, num?: string): Section {
  const pretty = (base: string) => (num ? `${base} ${num}` : base);
  switch (name) {
    case "chorus":
      return { type: "chorus", label: num ? pretty("Chorus") : undefined };
    case "bridge":
      return { type: "bridge", label: num ? pretty("Bridge") : undefined };
    case "verse":
      return { type: "verse", label: num ? pretty("Verse") : undefined };
    case "prechorus":
      return { type: "verse", label: pretty("Prechorus") };
    default:
      return {
        type: "verse",
        label: pretty(name.charAt(0).toUpperCase() + name.slice(1)),
      };
  }
}

/* ---------------------------------- merging -------------------------------- */

/**
 * Insert each chord into the lyric text at the character its bounding box
 * starts above. Character offsets inside a word are interpolated from that
 * word's own box width (robust even if the global font metrics drift).
 */
function mergeChordAndLyric(chordWords: OcrWord[], lyricWords: OcrWord[]): string {
  let text = "";
  const starts: number[] = [];
  for (const w of lyricWords) {
    if (text) text += " ";
    starts.push(text.length);
    text += w.text;
  }

  type Insert = { index: number; chord: string };
  const inserts: Insert[] = [];
  const tail: string[] = [];

  for (const c of chordWords) {
    const chord = cleanChordToken(c.text);
    const anchor = c.x0;
    let placed = false;

    for (let i = 0; i < lyricWords.length; i++) {
      const w = lyricWords[i];
      const charW = (w.x1 - w.x0) / Math.max(1, w.text.length);
      if (anchor <= w.x0 + charW * 0.5) {
        inserts.push({ index: starts[i], chord });
        placed = true;
        break;
      }
      if (anchor < w.x1) {
        const off = Math.min(Math.round((anchor - w.x0) / charW), w.text.length);
        inserts.push({ index: starts[i] + off, chord });
        placed = true;
        break;
      }
    }
    if (!placed) tail.push(chord);
  }

  // Insert right-to-left so earlier indices stay valid; equal indices keep
  // their left-to-right order because later (rightmost) chords go in first.
  inserts.sort((a, b) => a.index - b.index);
  for (let i = inserts.length - 1; i >= 0; i--) {
    const { index, chord } = inserts[i];
    text = `${text.slice(0, index)}[${chord}]${text.slice(index)}`;
  }
  for (const chord of tail) text += ` [${chord}]`;
  return text;
}

function chordOnlyLine(chordWords: OcrWord[]): string {
  return chordWords.map((w) => `[${cleanChordToken(w.text)}]`).join(" ");
}

/* --------------------------------- assembly -------------------------------- */

type Row =
  | { kind: "header"; section: Section }
  | { kind: "text"; text: string }
  | { kind: "blank" };

function linesToRows(lines: OcrLine[]): Row[] {
  const sorted = [...lines]
    .filter((l) => l.words.length > 0)
    .sort((a, b) => a.y0 - b.y0);

  const heights = sorted.map((l) => l.y1 - l.y0).sort((a, b) => a - b);
  const lineHeight = heights[Math.floor(heights.length / 2)] ?? 16;
  const gaps = sorted
    .slice(1)
    .map((l, i) => l.y0 - sorted[i].y1)
    .filter((g) => g > 0)
    .sort((a, b) => a - b);
  // Paragraph break: clearly larger than both the glyph height and typical
  // spacing (the median gap only means "typical" once there are enough lines).
  const medianGap = gaps.length >= 4 ? gaps[Math.floor(gaps.length / 2)] : 0;
  const blankThreshold = Math.max(lineHeight * 1.4, medianGap * 1.9);

  const rows: Row[] = [];
  let pendingChords: OcrWord[] | null = null;

  const flushPendingChords = () => {
    if (pendingChords) {
      rows.push({ kind: "text", text: chordOnlyLine(pendingChords) });
      pendingChords = null;
    }
  };

  for (let i = 0; i < sorted.length; i++) {
    const line = sorted[i];

    if (i > 0) {
      const gap = line.y0 - sorted[i - 1].y1;
      if (gap > blankThreshold) {
        flushPendingChords();
        rows.push({ kind: "blank" });
      }
    }

    const header = headerMatch(line);
    if (header) {
      flushPendingChords();
      rows.push({ kind: "header", section: sectionFor(header.name, header.num) });
      continue;
    }

    if (isChordLine(line)) {
      flushPendingChords();
      pendingChords = [...line.words].sort((a, b) => a.x0 - b.x0);
      continue;
    }

    // Lyric line: attach the chord line above it, if any.
    const lyricWords = [...line.words].sort((a, b) => a.x0 - b.x0);
    if (pendingChords) {
      rows.push({ kind: "text", text: mergeChordAndLyric(pendingChords, lyricWords) });
      pendingChords = null;
    } else {
      rows.push({ kind: "text", text: lyricWords.map((w) => w.text).join(" ") });
    }
  }
  flushPendingChords();
  return rows;
}

const PITCH: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const KEY_NAMES = ["C", "Db", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"];

function pitchClass(root: string): number {
  let pc = PITCH[root[0]];
  if (root[1] === "#") pc += 1;
  if (root[1] === "b") pc -= 1;
  return ((pc % 12) + 12) % 12;
}

/**
 * Score each major key by how well its diatonic chords (I ii iii IV V vi)
 * explain the chords in the song. Frequency alone fails in keys like F, where
 * the V (C) can appear as often as the tonic — but only F explains F/Bb/C/Dm.
 */
function guessKey(body: string): string {
  const chords = [...body.matchAll(/\[([A-G][#b]?)(m(?!aj))?/g)].map((m) => ({
    pc: pitchClass(m[1]),
    minor: m[2] !== undefined,
    name: m[1],
  }));
  if (chords.length === 0) return "";

  const counts = new Map<string, number>();
  for (const c of chords) {
    const id = `${c.pc}:${c.minor ? "m" : ""}`;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }

  let bestKey = 0;
  let bestScore = -1;
  for (let key = 0; key < 12; key++) {
    // [interval from tonic, minor?, weight]
    const degrees: [number, boolean, number][] = [
      [0, false, 3], // I
      [5, false, 2], // IV
      [7, false, 2], // V
      [9, true, 1.5], // vi
      [2, true, 1], // ii
      [4, true, 1], // iii
    ];
    let score = 0;
    for (const [interval, minor, weight] of degrees) {
      const id = `${(key + interval) % 12}:${minor ? "m" : ""}`;
      score += (counts.get(id) ?? 0) * weight;
    }
    const first = chords[0];
    const last = chords[chords.length - 1];
    if (!first.minor && first.pc === key) score += 3;
    if (!last.minor && last.pc === key) score += 2;
    if (score > bestScore) {
      bestScore = score;
      bestKey = key;
    }
  }

  // Prefer the spelling the chart itself uses for the tonic (e.g. F# vs Gb).
  const asWritten = chords.find((c) => c.pc === bestKey && !c.minor);
  return asWritten?.name ?? KEY_NAMES[bestKey];
}

/**
 * Convert OCR line groups (one array per uploaded screenshot, in order) into a
 * ChordPro body with section directives, plus a guessed key.
 */
export function ocrLinesToChordPro(pages: OcrLine[][]): ImportedChart {
  const rows: Row[] = [];
  for (const page of pages) {
    if (rows.length > 0) rows.push({ kind: "blank" });
    rows.push(...linesToRows(page));
  }

  const out: string[] = [];
  let open: Section | null = null;

  const close = () => {
    if (open) {
      out.push(`{end_of_${open.type}}`);
      open = null;
    }
  };

  let blankPending = false;
  for (const row of rows) {
    if (row.kind === "blank") {
      blankPending = true;
      continue;
    }
    if (row.kind === "header") {
      close();
      if (out.length > 0) out.push("");
      const { type, label } = row.section;
      out.push(label ? `{start_of_${type}: label="${label}"}` : `{start_of_${type}}`);
      open = row.section;
      blankPending = false;
      continue;
    }
    if (blankPending && out.length > 0) out.push("");
    blankPending = false;
    out.push(row.text);
  }
  close();

  const body = out.join("\n").trim();
  return { body, keyGuess: guessKey(body) };
}

/* ------------------------------- browser OCR ------------------------------- */

export type OcrProgress = { fileIndex: number; fileCount: number; progress: number };

/** Upscale small screenshots so Tesseract has enough pixels per glyph. */
async function toCanvas(file: File): Promise<HTMLCanvasElement> {
  const bitmap = await createImageBitmap(await blobFromFile(file));
  const scale = Math.max(1, Math.min(3, 1600 / bitmap.width));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas;
}

async function blobFromFile(file: File): Promise<Blob> {
  return file;
}

type TesseractBlocks = {
  blocks:
    | {
        paragraphs: {
          lines: { bbox: { y0: number; y1: number }; words: { text: string; bbox: { x0: number; x1: number; y0: number; y1: number } }[] }[];
        }[];
      }[]
    | null;
};

export function pageToOcrLines(data: TesseractBlocks): OcrLine[] {
  const lines: OcrLine[] = [];
  for (const block of data.blocks ?? []) {
    for (const para of block.paragraphs) {
      for (const line of para.lines) {
        const words = line.words
          .map((w) => ({ text: w.text.trim(), ...w.bbox }))
          .filter((w) => w.text.length > 0);
        if (words.length > 0) lines.push({ words, y0: line.bbox.y0, y1: line.bbox.y1 });
      }
    }
  }
  return lines;
}

/** OCR each screenshot (in order) into positioned lines. Browser-only. */
export async function recognizeChartImages(
  files: File[],
  onProgress?: (p: OcrProgress) => void,
): Promise<OcrLine[][]> {
  const { createWorker, PSM } = await import("tesseract.js");
  let fileIndex = 0;

  const worker = await createWorker("eng", 1, {
    logger: (m) => {
      if (m.status === "recognizing text") {
        onProgress?.({ fileIndex, fileCount: files.length, progress: m.progress });
      }
    },
  });

  try {
    await worker.setParameters({
      tessedit_pageseg_mode: PSM.SINGLE_BLOCK,
      preserve_interword_spaces: "1",
    });

    const pages: OcrLine[][] = [];
    for (fileIndex = 0; fileIndex < files.length; fileIndex++) {
      const canvas = await toCanvas(files[fileIndex]);
      const { data } = await worker.recognize(canvas, {}, { blocks: true, text: true });
      pages.push(pageToOcrLines(data as unknown as TesseractBlocks));
    }
    return pages;
  } finally {
    await worker.terminate();
  }
}
