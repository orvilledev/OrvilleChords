"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Song } from "@/lib/types";
import { supabaseSongRepository as repo } from "@/lib/supabase/songs";
import { indexedDbRepository as localRepo } from "./indexeddb";
import type { NewSong, SongUpdate } from "./repository";

const IMPORT_FLAG = "oc-songs-imported-to-cloud";

type SongsContextValue = {
  songs: Song[];
  loading: boolean;
  getSong: (id: string) => Song | undefined;
  createSong: (input: NewSong) => Promise<Song>;
  updateSong: (id: string, patch: SongUpdate) => Promise<Song>;
  deleteSong: (id: string) => Promise<void>;
};

const SongsContext = createContext<SongsContextValue | null>(null);

export function SongsProvider({ children }: { children: React.ReactNode }) {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setSongs(await repo.getAll());
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        let all = await repo.getAll();
        // One-time migration: if the shared library is empty, lift any songs
        // that were created locally (IndexedDB) up to the cloud.
        if (all.length === 0 && !localStorage.getItem(IMPORT_FLAG)) {
          try {
            const local = await localRepo.getAll();
            for (const s of local) {
              await repo.create({
                title: s.title,
                artist: s.artist,
                originalKey: s.originalKey,
                tags: s.tags,
                body: s.body,
              });
            }
          } catch (importErr) {
            console.warn("Local song import skipped", importErr);
          }
          localStorage.setItem(IMPORT_FLAG, "1");
          all = await repo.getAll();
        }
        if (active) {
          setSongs(all);
          setLoading(false);
        }
      } catch (err) {
        console.error("Failed to load songs from Supabase", err);
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const createSong = useCallback(
    async (input: NewSong) => {
      const song = await repo.create(input);
      await refresh();
      return song;
    },
    [refresh],
  );

  const updateSong = useCallback(
    async (id: string, patch: SongUpdate) => {
      const song = await repo.update(id, patch);
      await refresh();
      return song;
    },
    [refresh],
  );

  const deleteSong = useCallback(
    async (id: string) => {
      await repo.remove(id);
      await refresh();
    },
    [refresh],
  );

  const getSong = useCallback((id: string) => songs.find((s) => s.id === id), [songs]);

  const value = useMemo(
    () => ({ songs, loading, getSong, createSong, updateSong, deleteSong }),
    [songs, loading, getSong, createSong, updateSong, deleteSong],
  );

  return <SongsContext.Provider value={value}>{children}</SongsContext.Provider>;
}

export function useSongs() {
  const ctx = useContext(SongsContext);
  if (!ctx) throw new Error("useSongs must be used within a SongsProvider");
  return ctx;
}
