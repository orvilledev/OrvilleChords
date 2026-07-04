"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, Pencil, Trash2, Minus, Plus, ArrowUpDown, Presentation } from "lucide-react";
import { useSongs } from "@/lib/data/SongsProvider";
import { SongViewer } from "@/components/SongViewer";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { TransposeSheet } from "@/components/TransposeSheet";
import { renderInKey } from "@/lib/chords/chordpro";
import { normalizeKey, keyToPitch, accidentalForKey, transposeKeyName } from "@/lib/chords/keys";
import { exportSongToPptx } from "@/lib/slides/pptx";

const FONT_KEY = "oc-font-scale";
const MIN = 0.85;
const MAX = 1.8;
const STEP = 0.1;

export default function SongPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { getSong, deleteSong, loading } = useSongs();
  const song = getSong(id);

  const [scale, setScale] = useState(1);
  const [confirming, setConfirming] = useState(false);
  const [targetKey, setTargetKey] = useState("");
  const [capo, setCapo] = useState(0);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const saved = Number(localStorage.getItem(FONT_KEY));
    if (saved >= MIN && saved <= MAX) setScale(saved);
  }, []);

  // Load the remembered key/capo for this song, or default to its original key.
  useEffect(() => {
    if (!song) return;
    const fallback = normalizeKey(song.originalKey || "C");
    try {
      const raw = localStorage.getItem(`oc-song-${song.id}`);
      if (raw) {
        const parsed = JSON.parse(raw) as { key?: string; capo?: number };
        setTargetKey(parsed.key || fallback);
        setCapo(parsed.capo ?? 0);
        return;
      }
    } catch {
      /* ignore corrupt state */
    }
    setTargetKey(fallback);
    setCapo(0);
  }, [song?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const parsed = useMemo(() => {
    if (!song || !targetKey) return undefined;
    return renderInKey(song.body, song.originalKey || targetKey, targetKey, capo);
  }, [song?.body, song?.originalKey, targetKey, capo]);

  function persist(key: string, nextCapo: number) {
    if (song) localStorage.setItem(`oc-song-${song.id}`, JSON.stringify({ key, capo: nextCapo }));
  }

  async function handleExport() {
    if (!song || exporting) return;
    setExporting(true);
    try {
      await exportSongToPptx(song);
    } catch (err) {
      console.error("Slide export failed", err);
      alert("Sorry — couldn't create the slides. Please try again.");
    } finally {
      setExporting(false);
    }
  }

  function changeScale(delta: number) {
    setScale((prev) => {
      const next = Math.min(MAX, Math.max(MIN, Math.round((prev + delta) * 100) / 100));
      localStorage.setItem(FONT_KEY, String(next));
      return next;
    });
  }

  if (loading) {
    return <p className="px-4 pt-10 text-center text-muted">Loading…</p>;
  }

  if (!song) {
    return (
      <div className="px-4 pt-16 text-center">
        <p className="font-medium">Song not found</p>
        <Link href="/" className="mt-2 inline-block text-sm text-accent">
          Back to library
        </Link>
      </div>
    );
  }

  const originalKey = normalizeKey(song.originalKey || "C");
  const transposed = keyToPitch(targetKey) !== keyToPitch(originalKey);
  const shapeKey =
    capo > 0 ? transposeKeyName(targetKey, -capo, accidentalForKey(targetKey)) : targetKey;

  return (
    <div>
      <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur">
        <div className="flex items-center gap-1 px-2 py-2">
          <Link
            href="/"
            aria-label="Back"
            className="flex h-10 w-10 items-center justify-center rounded-lg text-muted hover:text-foreground"
          >
            <ChevronLeft className="h-6 w-6" />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-semibold leading-tight">{song.title}</h1>
            {song.artist && <p className="truncate text-xs text-muted">{song.artist}</p>}
          </div>
          <button
            onClick={handleExport}
            disabled={exporting}
            aria-label="Export lyrics slides"
            className="flex h-10 w-10 items-center justify-center rounded-lg text-muted hover:text-foreground disabled:opacity-50"
          >
            <Presentation className={exporting ? "h-5 w-5 animate-pulse" : "h-5 w-5"} />
          </button>
          <Link
            href={`/songs/${song.id}/edit`}
            aria-label="Edit"
            className="flex h-10 w-10 items-center justify-center rounded-lg text-muted hover:text-foreground"
          >
            <Pencil className="h-5 w-5" />
          </Link>
          <button
            onClick={() => setConfirming(true)}
            aria-label="Delete"
            className="flex h-10 w-10 items-center justify-center rounded-lg text-muted hover:text-danger"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>

        <div className="flex items-center justify-between gap-2 px-3 pb-2">
          <button
            onClick={() => setSheetOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-surface-2 px-3 py-1.5 text-sm active:bg-border"
          >
            <ArrowUpDown className="h-4 w-4 text-accent" />
            <span className="font-semibold">{targetKey || originalKey}</span>
            {transposed && <span className="text-xs text-muted">from {originalKey}</span>}
            {capo > 0 && (
              <span className="rounded bg-accent/20 px-1.5 py-0.5 text-xs font-medium text-accent">
                capo {capo}
              </span>
            )}
          </button>

          <div className="flex items-center gap-1">
            <button
              onClick={() => changeScale(-STEP)}
              aria-label="Smaller text"
              disabled={scale <= MIN}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-2 disabled:opacity-40"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-6 text-center text-xs tabular-nums text-muted">
              {Math.round(scale * 100)}
            </span>
            <button
              onClick={() => changeScale(STEP)}
              aria-label="Larger text"
              disabled={scale >= MAX}
              className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-2 disabled:opacity-40"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        {capo > 0 && (
          <div className="border-t border-border/60 bg-surface/60 px-3 py-1.5 text-xs text-muted">
            Capo {capo} — play {shapeKey} shapes, sounds in {targetKey}
          </div>
        )}
      </header>

      <div className="px-4 py-5">
        <SongViewer parsed={parsed} body={song.body} scale={scale} />
      </div>

      <TransposeSheet
        open={sheetOpen}
        originalKey={originalKey}
        targetKey={targetKey || originalKey}
        capo={capo}
        onChangeKey={(k) => {
          setTargetKey(k);
          persist(k, capo);
        }}
        onChangeCapo={(c) => {
          setCapo(c);
          persist(targetKey || originalKey, c);
        }}
        onReset={() => {
          setTargetKey(originalKey);
          setCapo(0);
          persist(originalKey, 0);
        }}
        onClose={() => setSheetOpen(false)}
      />

      <ConfirmDialog
        open={confirming}
        title="Delete song?"
        message={`"${song.title}" will be permanently removed from this device.`}
        onCancel={() => setConfirming(false)}
        onConfirm={async () => {
          await deleteSong(song.id);
          router.replace("/");
        }}
      />
    </div>
  );
}
