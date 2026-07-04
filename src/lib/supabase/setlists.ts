import { getSupabase } from "./client";
import type { Setlist, SetlistSong } from "../types";
import type { NewSetlist, SetlistRepository, SetlistUpdate } from "../data/repository";

type SetlistRow = {
  id: string;
  name: string;
  service_date: string | null;
  items: SetlistSong[] | null;
  created_at: string;
  updated_at: string;
};

function fromRow(r: SetlistRow): Setlist {
  return {
    id: r.id,
    name: r.name,
    serviceDate: r.service_date ?? undefined,
    items: r.items ?? [],
    createdAt: new Date(r.created_at).getTime(),
    updatedAt: new Date(r.updated_at).getTime(),
  };
}

function toRow(input: Partial<NewSetlist>): Record<string, unknown> {
  const row: Record<string, unknown> = {};
  if (input.name !== undefined) row.name = input.name;
  if (input.serviceDate !== undefined) row.service_date = input.serviceDate || null;
  if (input.items !== undefined) row.items = input.items;
  return row;
}

export const supabaseSetlistRepository: SetlistRepository = {
  async getAll() {
    const { data, error } = await getSupabase()
      .from("setlists")
      .select("*")
      .order("service_date", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data as SetlistRow[]).map(fromRow);
  },

  async get(id) {
    const { data, error } = await getSupabase()
      .from("setlists")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data ? fromRow(data as SetlistRow) : undefined;
  },

  async create(input: NewSetlist) {
    const sb = getSupabase();
    const { data: userData } = await sb.auth.getUser();
    const { data, error } = await sb
      .from("setlists")
      .insert({ ...toRow(input), created_by: userData.user?.id ?? null })
      .select()
      .single();
    if (error) throw error;
    return fromRow(data as SetlistRow);
  },

  async update(id, patch: SetlistUpdate) {
    const { data, error } = await getSupabase()
      .from("setlists")
      .update(toRow(patch))
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return fromRow(data as SetlistRow);
  },

  async remove(id) {
    const { error } = await getSupabase().from("setlists").delete().eq("id", id);
    if (error) throw error;
  },
};
