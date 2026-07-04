"use client";

import { useMemo } from "react";
import { renderChordPro, type LyricWord, type ParsedSong } from "@/lib/chords/chordpro";
import { cn } from "@/lib/utils";

/** Render a pre-parsed song, or parse `body` on the fly (used by the editor preview). */
export function SongViewer({
  parsed,
  body,
  scale = 1,
  className,
}: {
  parsed?: ParsedSong;
  body?: string;
  scale?: number;
  className?: string;
}) {
  const fallback = useMemo(() => renderChordPro(body ?? ""), [body]);
  const song = parsed ?? fallback;

  return (
    <div className={cn("font-sans", className)} style={{ fontSize: `${scale}rem` }}>
      {song.lines.map((line, i) => {
        switch (line.kind) {
          case "section":
            return (
              <div
                key={i}
                className="mt-5 mb-1.5 text-[0.7em] font-semibold uppercase tracking-widest text-accent/80"
              >
                {line.label}
              </div>
            );
          case "comment":
            return (
              <div key={i} className="my-1 text-[0.85em] italic text-muted">
                {line.text}
              </div>
            );
          case "empty":
            return <div key={i} className="h-[0.7em]" aria-hidden />;
          case "lyrics":
            return <LyricLine key={i} words={line.words} hasChords={line.hasChords} />;
        }
      })}
    </div>
  );
}

function LyricLine({ words, hasChords }: { words: LyricWord[]; hasChords: boolean }) {
  return (
    <div className="flex flex-wrap items-end">
      {words.map((word, wi) => (
        // A whole word stays on one line; wrapping happens only between words.
        <span key={wi} className="inline-flex whitespace-pre">
          {word.map((seg, si) => (
            <span key={si} className="inline-flex flex-col">
              {hasChords && (
                <span className="h-[1.15em] font-mono text-[0.72em] font-semibold leading-none text-chord">
                  {seg.chords || " "}
                </span>
              )}
              <span className="leading-snug">{seg.lyrics || " "}</span>
            </span>
          ))}
        </span>
      ))}
    </div>
  );
}
