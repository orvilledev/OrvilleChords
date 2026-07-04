"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Setlist, SetlistSong } from "@/lib/types";
import { supabaseSetlistRepository as repo } from "@/lib/supabase/setlists";
import type { NewSetlist, SetlistUpdate } from "./repository";

type SetlistsContextValue = {
  setlists: Setlist[];
  loading: boolean;
  getSetlist: (id: string) => Setlist | undefined;
  createSetlist: (input: NewSetlist) => Promise<Setlist>;
  updateSetlist: (id: string, patch: SetlistUpdate) => Promise<Setlist>;
  deleteSetlist: (id: string) => Promise<void>;
  setItems: (id: string, items: SetlistSong[]) => Promise<void>;
};

const SetlistsContext = createContext<SetlistsContextValue | null>(null);

export function SetlistsProvider({ children }: { children: React.ReactNode }) {
  const [setlists, setSetlists] = useState<Setlist[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setSetlists(await repo.getAll());
  }, []);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const all = await repo.getAll();
        if (active) setSetlists(all);
      } catch (err) {
        console.error("Failed to load setlists from Supabase", err);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const createSetlist = useCallback(
    async (input: NewSetlist) => {
      const setlist = await repo.create(input);
      await refresh();
      return setlist;
    },
    [refresh],
  );

  const updateSetlist = useCallback(
    async (id: string, patch: SetlistUpdate) => {
      const setlist = await repo.update(id, patch);
      await refresh();
      return setlist;
    },
    [refresh],
  );

  const deleteSetlist = useCallback(
    async (id: string) => {
      await repo.remove(id);
      await refresh();
    },
    [refresh],
  );

  const setItems = useCallback(
    async (id: string, items: SetlistSong[]) => {
      await repo.update(id, { items });
      await refresh();
    },
    [refresh],
  );

  const getSetlist = useCallback(
    (id: string) => setlists.find((s) => s.id === id),
    [setlists],
  );

  const value = useMemo(
    () => ({
      setlists,
      loading,
      getSetlist,
      createSetlist,
      updateSetlist,
      deleteSetlist,
      setItems,
    }),
    [setlists, loading, getSetlist, createSetlist, updateSetlist, deleteSetlist, setItems],
  );

  return <SetlistsContext.Provider value={value}>{children}</SetlistsContext.Provider>;
}

export function useSetlists() {
  const ctx = useContext(SetlistsContext);
  if (!ctx) throw new Error("useSetlists must be used within a SetlistsProvider");
  return ctx;
}
