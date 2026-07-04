import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type { Song, Setlist } from "@/lib/types";
import type {
  NewSong,
  SongRepository,
  SongUpdate,
  NewSetlist,
  SetlistRepository,
  SetlistUpdate,
} from "./repository";

const DB_NAME = "orvillechords";
const STORE = "songs";
const SETLISTS = "setlists";
const VERSION = 2;

interface OrvilleDB extends DBSchema {
  songs: {
    key: string;
    value: Song;
    indexes: { updatedAt: number };
  };
  setlists: {
    key: string;
    value: Setlist;
  };
}

let dbPromise: Promise<IDBPDatabase<OrvilleDB>> | null = null;

export function getDb() {
  if (!dbPromise) {
    dbPromise = openDB<OrvilleDB>(DB_NAME, VERSION, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          const store = db.createObjectStore(STORE, { keyPath: "id" });
          store.createIndex("updatedAt", "updatedAt");
        }
        if (oldVersion < 2) {
          db.createObjectStore(SETLISTS, { keyPath: "id" });
        }
      },
    });
  }
  return dbPromise;
}

const byTitle = (a: Song, b: Song) =>
  a.title.localeCompare(b.title, undefined, { sensitivity: "base" });

export const indexedDbRepository: SongRepository = {
  async getAll() {
    const db = await getDb();
    const all = await db.getAll(STORE);
    return all.sort(byTitle);
  },

  async get(id) {
    const db = await getDb();
    return db.get(STORE, id);
  },

  async create(input: NewSong) {
    const db = await getDb();
    const now = Date.now();
    const song: Song = { ...input, id: crypto.randomUUID(), createdAt: now, updatedAt: now };
    await db.put(STORE, song);
    return song;
  },

  async update(id, patch: SongUpdate) {
    const db = await getDb();
    const existing = await db.get(STORE, id);
    if (!existing) throw new Error(`Song ${id} not found`);
    const updated: Song = { ...existing, ...patch, id, updatedAt: Date.now() };
    await db.put(STORE, updated);
    return updated;
  },

  async remove(id) {
    const db = await getDb();
    await db.delete(STORE, id);
  },
};

const bySetlistDate = (a: Setlist, b: Setlist) => {
  // Most recent / upcoming service dates first; undated fall back to creation time.
  const av = a.serviceDate ?? "";
  const bv = b.serviceDate ?? "";
  if (av !== bv) return bv.localeCompare(av);
  return b.createdAt - a.createdAt;
};

export const setlistDbRepository: SetlistRepository = {
  async getAll() {
    const db = await getDb();
    const all = await db.getAll(SETLISTS);
    return all.sort(bySetlistDate);
  },

  async get(id) {
    const db = await getDb();
    return db.get(SETLISTS, id);
  },

  async create(input: NewSetlist) {
    const db = await getDb();
    const now = Date.now();
    const setlist: Setlist = {
      ...input,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    await db.put(SETLISTS, setlist);
    return setlist;
  },

  async update(id, patch: SetlistUpdate) {
    const db = await getDb();
    const existing = await db.get(SETLISTS, id);
    if (!existing) throw new Error(`Setlist ${id} not found`);
    const updated: Setlist = { ...existing, ...patch, id, updatedAt: Date.now() };
    await db.put(SETLISTS, updated);
    return updated;
  },

  async remove(id) {
    const db = await getDb();
    await db.delete(SETLISTS, id);
  },
};
