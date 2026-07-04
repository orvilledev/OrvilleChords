/** One song within a setlist, with its performance key/capo for this service. */
export type SetlistSong = {
  songId: string;
  /** Performance key for this set; falls back to the song's original key when unset. */
  keyOverride?: string;
  capo?: number;
};

/** An ordered set of songs for a service. The set owns the performance key, not the song. */
export type Setlist = {
  id: string;
  name: string;
  /** Service date as ISO "YYYY-MM-DD". */
  serviceDate?: string;
  items: SetlistSong[];
  createdAt: number;
  updatedAt: number;
};

/** A worship song stored in ChordPro format. */
export type Song = {
  id: string;
  title: string;
  artist: string;
  /** Original key as written, e.g. "G", "Bb", "F#m". */
  originalKey: string;
  tags: string[];
  /** Song body in ChordPro: chords inline with lyrics, e.g. "[G]Amazing [G7]grace". */
  body: string;
  createdAt: number;
  updatedAt: number;
};
