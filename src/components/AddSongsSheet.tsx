"use client";

import { useMemo, useState } from "react";
import { Search, Check, Plus } from "lucide-react";
import { useSongs } from "@/lib/data/SongsProvider";
import { cn } from "@/lib/utils";

export function AddSongsSheet({
  open,
  existingIds,
  onAdd,
  onClose,
}: {
  open: boolean;
  existingIds: string[];
  onAdd: (songId: string) => void;
  onClose: () => void;
}) {
  const { songs } = useSongs();
  const [query, setQuery] = useState("");
  const present = new Set(existingIds);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return songs;
    return songs.filter(
      (s) => s.title.toLowerCase().includes(q) || s.artist.toLowerCase().includes(q),
    );
  }, [songs, query]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60" onClick={onClose}>
      <div
        className="flex max-h-[80vh] w-full max-w-2xl flex-col rounded-t-2xl border-t border-border bg-surface pb-6 safe-bottom"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mt-3 mb-2 h-1 w-10 rounded-full bg-border" />
        <div className="flex items-center justify-between px-4 pb-2">
          <h2 className="text-base font-semibold">Add songs</h2>
          <button onClick={onClose} className="text-sm font-medium text-accent">
            Done
          </button>
        </div>

        <div className="relative px-4 pb-3">
          <Search className="pointer-events-none absolute left-7 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search songs"
            className="w-full rounded-xl border border-border bg-surface-2 py-2.5 pl-11 pr-4 text-base outline-none placeholder:text-muted focus:border-accent"
          />
        </div>

        <ul className="flex-1 space-y-1 overflow-y-auto px-4">
          {filtered.map((song) => {
            const added = present.has(song.id);
            return (
              <li key={song.id}>
                <button
                  onClick={() => !added && onAdd(song.id)}
                  disabled={added}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                    added ? "opacity-60" : "hover:bg-surface-2 active:bg-surface-2",
                  )}
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{song.title}</div>
                    <div className="truncate text-sm text-muted">{song.artist || "Unknown"}</div>
                  </div>
                  {song.originalKey && (
                    <span className="rounded-md bg-surface-2 px-2 py-0.5 text-xs text-muted">
                      {song.originalKey}
                    </span>
                  )}
                  {added ? (
                    <Check className="h-5 w-5 flex-none text-accent" />
                  ) : (
                    <Plus className="h-5 w-5 flex-none text-muted" />
                  )}
                </button>
              </li>
            );
          })}
          {filtered.length === 0 && (
            <li className="py-8 text-center text-sm text-muted">No songs found.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
