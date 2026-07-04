import type pptxgen from "pptxgenjs";
import type { Song } from "../types";
import { bodyToSlides } from "./lyrics";

export type SlideOptions = {
  /** Max lyric lines per slide before splitting (default 6). */
  maxLinesPerSlide?: number;
  /** Body font size in points (default 40). */
  fontSize?: number;
  /** Include a per-song title slide (default true). */
  titleSlide?: boolean;
  /** Optional footer line on every slide, e.g. a copyright / CCLI number. */
  footer?: string;
};

type Pptx = pptxgen;
type Slide = ReturnType<Pptx["addSlide"]>;

const BLACK = "000000";
const WHITE = "FFFFFF";

async function newPptx(title: string): Promise<Pptx> {
  const mod = await import("pptxgenjs");
  const PptxGen = ((mod as { default?: typeof pptxgen }).default ?? mod) as typeof pptxgen;
  const pptx = new PptxGen();
  pptx.layout = "LAYOUT_WIDE"; // 13.33 × 7.5 in, 16:9
  pptx.title = title;
  return pptx;
}

function addFooter(slide: Slide, footer?: string) {
  if (!footer) return;
  slide.addText(footer, {
    x: 0,
    y: 7.0,
    w: "100%",
    h: 0.4,
    align: "center",
    color: "888888",
    fontSize: 11,
  });
}

/** Add a song's slides (optional title slide + lyric slides) to an existing deck. */
function addSongSlides(pptx: Pptx, song: Song, options: SlideOptions = {}) {
  const { maxLinesPerSlide = 6, fontSize = 40, titleSlide = true, footer } = options;

  if (titleSlide) {
    const slide = pptx.addSlide();
    slide.background = { color: BLACK };
    slide.addText(
      [
        {
          text: song.title,
          options: { fontSize: 48, bold: true, color: WHITE, breakLine: true },
        },
        ...(song.artist
          ? [{ text: song.artist, options: { fontSize: 24, color: "BBBBBB" } }]
          : []),
      ],
      { x: 0.5, y: 0, w: 12.33, h: 7.5, align: "center", valign: "middle" },
    );
    addFooter(slide, footer);
  }

  for (const lines of bodyToSlides(song.body, maxLinesPerSlide)) {
    const slide = pptx.addSlide();
    slide.background = { color: BLACK };
    slide.addText(lines.join("\n"), {
      x: 0.5,
      y: 0.4,
      w: 12.33,
      h: 6.7,
      align: "center",
      valign: "middle",
      color: WHITE,
      fontSize,
      bold: true,
      fontFace: "Arial",
      lineSpacingMultiple: 1.2,
    });
    addFooter(slide, footer);
  }
}

/**
 * Build a projection deck (lyrics only) for a song: 16:9, black background,
 * large centered white text. Returns the pptxgenjs instance.
 */
export async function buildDeck(song: Song, options: SlideOptions = {}): Promise<Pptx> {
  const pptx = await newPptx(song.title);
  addSongSlides(pptx, song, options);
  return pptx;
}

/** Build one deck for a whole setlist: a cover slide, then each song in order. */
export async function buildSetlistDeck(
  name: string,
  songs: Song[],
  options: SlideOptions = {},
): Promise<Pptx> {
  const pptx = await newPptx(name);

  const cover = pptx.addSlide();
  cover.background = { color: BLACK };
  cover.addText(name || "Setlist", {
    x: 0.5,
    y: 0,
    w: 12.33,
    h: 7.5,
    align: "center",
    valign: "middle",
    color: WHITE,
    fontSize: 54,
    bold: true,
  });
  addFooter(cover, options.footer);

  for (const song of songs) addSongSlides(pptx, song, options);
  return pptx;
}

/** Build and download the deck as `<Song Title>.pptx` (browser). */
export async function exportSongToPptx(song: Song, options?: SlideOptions): Promise<void> {
  const pptx = await buildDeck(song, options);
  await pptx.writeFile({ fileName: `${safeFileName(song.title)}.pptx` });
}

/** Build and download the whole setlist as one `<Setlist Name>.pptx` (browser). */
export async function exportSetlistToPptx(
  name: string,
  songs: Song[],
  options?: SlideOptions,
): Promise<void> {
  const pptx = await buildSetlistDeck(name, songs, options);
  await pptx.writeFile({ fileName: `${safeFileName(name || "setlist")}.pptx` });
}

function safeFileName(title: string): string {
  return (title || "song").replace(/[^\w\d-]+/g, "_").replace(/^_+|_+$/g, "") || "song";
}
