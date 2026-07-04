"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Search, Plus, Music, LogOut } from "lucide-react";
import { useSongs } from "@/lib/data/SongsProvider";
import { useAuth } from "@/lib/auth/AuthProvider";

export default function LibraryPage() {
  const { songs, loading } = useSongs();
  const { user, signOut } = useAuth();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return songs;
    return songs.filter(
      (s) =>
        s.title.toLowerCase().includes(q) ||
        s.artist.toLowerCase().includes(q) ||
        s.tags.some((t) => t.toLowerCase().includes(q)),
    );
  }, [songs, query]);

  return (
    <div className="px-4 pt-6">
      <header className="mb-4 flex items-start justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">ChordRealm</h1>
          <p className="text-sm text-muted">
            {songs.length} song{songs.length === 1 ? "" : "s"} in your library
          </p>
        </div>
        {user && (
          <button
            onClick={() => signOut()}
            title={`Sign out (${user.email})`}
            aria-label="Sign out"
            className="flex h-10 w-10 flex-none items-center justify-center rounded-lg text-muted hover:text-foreground"
          >
            <LogOut className="h-5 w-5" />
          </button>
        )}
      </header>

      <div className="relative mb-4">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search songs, artists, tags"
          className="w-full rounded-xl border border-border bg-surface py-3 pl-11 pr-4 text-base outline-none placeholder:text-muted focus:border-accent"
        />
      </div>

      {loading ? (
        <SkeletonList />
      ) : filtered.length === 0 ? (
        <EmptyState searching={query.trim().length > 0} />
      ) : (
        <ul className="space-y-2">
          {filtered.map((song) => (
            <li key={song.id}>
              <Link
                href={`/songs/${song.id}`}
                className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 transition-colors active:bg-surface-2"
              >
                <div className="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-surface-2 text-accent">
                  <Music className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{song.title}</div>
                  <div className="truncate text-sm text-muted">{song.artist || "Unknown"}</div>
                </div>
                {song.originalKey && (
                  <span className="flex-none rounded-md bg-surface-2 px-2 py-1 text-xs font-semibold text-muted">
                    {song.originalKey}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Link
        href="/songs/new"
        aria-label="Add song"
        className="fixed bottom-24 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-lg transition active:scale-95"
      >
        <Plus className="h-7 w-7" />
      </Link>
    </div>
  );
}

function SkeletonList() {
  return (
    <ul className="space-y-2">
      {Array.from({ length: 5 }).map((_, i) => (
        <li key={i} className="h-16 animate-pulse rounded-xl border border-border bg-surface" />
      ))}
    </ul>
  );
}

function EmptyState({ searching }: { searching: boolean }) {
  return (
    <div className="mt-16 text-center">
      <Music className="mx-auto h-10 w-10 text-muted" />
      <p className="mt-3 font-medium">{searching ? "No matches" : "No songs yet"}</p>
      <p className="mt-1 text-sm text-muted">
        {searching ? "Try a different search." : "Tap + to add your first song."}
      </p>
    </div>
  );
}
