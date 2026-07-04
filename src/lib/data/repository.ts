import type { Song, Setlist } from "@/lib/types";

export type NewSong = Omit<Song, "id" | "createdAt" | "updatedAt">;
export type SongUpdate = Partial<NewSong>;

export type NewSetlist = Omit<Setlist, "id" | "createdAt" | "updatedAt">;
export type SetlistUpdate = Partial<NewSetlist>;

export interface SetlistRepository {
  getAll(): Promise<Setlist[]>;
  get(id: string): Promise<Setlist | undefined>;
  create(input: NewSetlist): Promise<Setlist>;
  update(id: string, patch: SetlistUpdate): Promise<Setlist>;
  remove(id: string): Promise<void>;
}

/**
 * Storage-agnostic access to songs. Phase 1 backs this with IndexedDB in the
 * browser; Phase 4 swaps in Supabase without changing any UI that consumes it.
 */
export interface SongRepository {
  getAll(): Promise<Song[]>;
  get(id: string): Promise<Song | undefined>;
  create(input: NewSong): Promise<Song>;
  update(id: string, patch: SongUpdate): Promise<Song>;
  remove(id: string): Promise<void>;
}
