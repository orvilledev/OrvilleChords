import { getSupabase } from "./client";
import type { Song } from "../types";
import type { NewSong, SongRepository, SongUpdate } from "../data/repository";

type SongRow = {
  id: string;
  title: string;
  artist: string;
  original_key: string;
  tags: string[] | null;
  body: string;
  created_at: string;
  updated_at: string;
};

function fromRow(r: SongRow): Song {
  return {
    id: r.id,
    title: r.title,
    artist: r.artist ?? "",
    originalKey: r.original_key ?? "",
    tags: r.tags ?? [],
    body: r.body ?? "",
    createdAt: new Date(r.created_at).getTime(),
    updatedAt: new Date(r.updated_at).getTime(),
  };
}

/** Map a partial app-shaped patch to snake_case DB columns, omitting undefined. */
function toRow(input: Partial<NewSong>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (input.title !== undefined) row.title = input.title;
  if (input.artist !== undefined) row.artist = input.artist;
  if (input.originalKey !== undefined) row.original_key = input.originalKey;
  if (input.tags !== undefined) row.tags = input.tags;
  if (input.body !== undefined) row.body = input.body;
  return row;
}

export const supabaseSongRepository: SongRepository = {
  async getAll() {
    const { data, error } = await getSupabase()
      .from("songs")
      .select("*")
      .order("title", { ascending: true });
    if (error) throw error;
    return (data as SongRow[]).map(fromRow);
  },

  async get(id) {
    const { data, error } = await getSupabase()
      .from("songs")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data ? fromRow(data as SongRow) : undefined;
  },

  async create(input: NewSong) {
    const sb = getSupabase();
    const { data: userData } = await sb.auth.getUser();
    const { data, error } = await sb
      .from("songs")
      .insert({ ...toRow(input), created_by: userData.user?.id ?? null })
      .select()
      .single();
    if (error) throw error;
    return fromRow(data as SongRow);
  },

  async update(id, patch: SongUpdate) {
    const { data, error } = await getSupabase()
      .from("songs")
      .update(toRow(patch))
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return fromRow(data as SongRow);
  },

  async remove(id) {
    const { error } = await getSupabase().from("songs").delete().eq("id", id);
    if (error) throw error;
  },
};
