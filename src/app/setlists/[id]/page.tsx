"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import {
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  X,
  Plus,
  Play,
  Presentation,
  Trash2,
  Music,
} from "lucide-react";
import { useSetlists } from "@/lib/data/SetlistsProvider";
import { useSongs } from "@/lib/data/SongsProvider";
import { AddSongsSheet } from "@/components/AddSongsSheet";
import { TransposeSheet } from "@/components/TransposeSheet";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Button } from "@/components/ui/Button";
import type { SetlistSong } from "@/lib/types";
import { normalizeKey } from "@/lib/chords/keys";
import { exportSetlistToPptx } from "@/lib/slides/pptx";

export default function SetlistBuilderPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { getSetlist, setItems, deleteSetlist, loading } = useSetlists();
  const { getSong } = useSongs();
  const setlist = getSetlist(id);

  const [adding, setAdding] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [exporting, setExporting] = useState(false);

  if (loading) return <p className="px-4 pt-10 text-center text-muted">Loading…</p>;

  if (!setlist) {
    return (
      <div className="px-4 pt-16 text-center">
        <p className="font-medium">Setlist not found</p>
        <Link href="/setlists" className="mt-2 inline-block text-sm text-accent">
          Back to setlists
        </Link>
      </div>
    );
  }

  const items = setlist.items;

  const move = (index: number, dir: -1 | 1) => {
    const j = index + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[index], next[j]] = [next[j], next[index]];
    setItems(id, next);
  };

  const removeAt = (index: number) => setItems(id, items.filter((_, i) => i !== index));

  const addSong = (songId: string) => setItems(id, [...items, { songId }]);

  const updateItem = (index: number, patch: Partial<SetlistSong>) =>
    setItems(id, items.map((it, i) => (i === index ? { ...it, ...patch } : it)));

  async function handleExport() {
    if (exporting) return;
    const songs = items
      .map((it) => getSong(it.songId))
      .filter((s): s is NonNullable<typeof s> => Boolean(s));
    if (songs.length === 0) return;
    setExporting(true);
    try {
      await exportSetlistToPptx(setlist!.name, songs);
    } catch (err) {
      console.error("Setlist export failed", err);
      alert("Sorry — couldn't create the slides. Please try again.");
    } finally {
      setExporting(false);
    }
  }

  const editingItem = editingIndex !== null ? items[editingIndex] : null;
  const editingSong = editingItem ? getSong(editingItem.songId) : null;
  const editingOriginal = editingSong ? normalizeKey(editingSong.originalKey || "C") : "C";

  return (
    <div>
      <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur">
        <div className="flex items-center gap-1 px-2 py-2">
          <Link
            href="/setlists"
            aria-label="Back"
            className="flex h-10 w-10 items-center justify-center rounded-lg text-muted hover:text-foreground"
          >
            <ChevronLeft className="h-6 w-6" />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-semibold leading-tight">{setlist.name}</h1>
            <p className="truncate text-xs text-muted">
              {items.length} song{items.length === 1 ? "" : "s"}
            </p>
          </div>
          <button
            onClick={handleExport}
            disabled={exporting || items.length === 0}
            aria-label="Export setlist slides"
            className="flex h-10 w-10 items-center justify-center rounded-lg text-muted hover:text-foreground disabled:opacity-40"
          >
            <Presentation className={exporting ? "h-5 w-5 animate-pulse" : "h-5 w-5"} />
          </button>
          <button
            onClick={() => setConfirming(true)}
            aria-label="Delete setlist"
            className="flex h-10 w-10 items-center justify-center rounded-lg text-muted hover:text-danger"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
      </header>

      <div className="px-4 py-4">
        {items.length > 0 && (
          <Link href={`/setlists/${id}/play`} className="mb-4 block">
            <Button className="w-full">
              <Play className="h-5 w-5" />
              Play set
            </Button>
          </Link>
        )}

        {items.length === 0 ? (
          <div className="mt-12 text-center">
            <Music className="mx-auto h-10 w-10 text-muted" />
            <p className="mt-3 font-medium">No songs in this set</p>
            <p className="mt-1 text-sm text-muted">Add songs from your library below.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {items.map((item, index) => {
              const song = getSong(item.songId);
              const displayKey = item.keyOverride || (song ? song.originalKey : "");
              return (
                <li
                  key={`${item.songId}-${index}`}
                  className="flex items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2.5"
                >
                  <span className="w-5 flex-none text-center text-sm font-semibold text-muted">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">
                      {song ? song.title : "Missing song"}
                    </div>
                    <div className="truncate text-sm text-muted">
                      {song ? song.artist || "Unknown" : "This song was deleted"}
                    </div>
                  </div>

                  {song && (
                    <button
                      onClick={() => setEditingIndex(index)}
                      className="flex-none rounded-md bg-surface-2 px-2 py-1 text-xs font-semibold active:bg-border"
                    >
                      {displayKey || "Key"}
                      {item.capo ? ` · capo ${item.capo}` : ""}
                    </button>
                  )}

                  <div className="flex flex-none flex-col">
                    <button
                      onClick={() => move(index, -1)}
                      disabled={index === 0}
                      aria-label="Move up"
                      className="text-muted disabled:opacity-30"
                    >
                      <ChevronUp className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => move(index, 1)}
                      disabled={index === items.length - 1}
                      aria-label="Move down"
                      className="text-muted disabled:opacity-30"
                    >
                      <ChevronDown className="h-5 w-5" />
                    </button>
                  </div>

                  <button
                    onClick={() => removeAt(index)}
                    aria-label="Remove from set"
                    className="flex-none text-muted hover:text-danger"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        <button
          onClick={() => setAdding(true)}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border py-3 text-sm font-medium text-muted hover:text-foreground"
        >
          <Plus className="h-5 w-5" />
          Add songs
        </button>
      </div>

      <AddSongsSheet
        open={adding}
        existingIds={items.map((it) => it.songId)}
        onAdd={addSong}
        onClose={() => setAdding(false)}
      />

      {editingItem && editingSong && (
        <TransposeSheet
          open
          originalKey={editingOriginal}
          targetKey={editingItem.keyOverride || editingOriginal}
          capo={editingItem.capo ?? 0}
          onChangeKey={(k) => updateItem(editingIndex!, { keyOverride: k })}
          onChangeCapo={(c) => updateItem(editingIndex!, { capo: c })}
          onReset={() => updateItem(editingIndex!, { keyOverride: undefined, capo: 0 })}
          onClose={() => setEditingIndex(null)}
        />
      )}

      <ConfirmDialog
        open={confirming}
        title="Delete setlist?"
        message={`"${setlist.name}" will be removed. Your songs stay in the library.`}
        onCancel={() => setConfirming(false)}
        onConfirm={async () => {
          await deleteSetlist(id);
          router.replace("/setlists");
        }}
      />
    </div>
  );
}
