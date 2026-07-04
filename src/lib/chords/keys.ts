export type Accidental = "#" | "b";

/** Canonical major-key spelling for each pitch class 0–11 (C … B). */
export const MAJOR_BY_PITCH = [
  "C", "Db", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B",
] as const;

/** Canonical minor-key spelling for each pitch class 0–11. */
export const MINOR_BY_PITCH = [
  "Cm", "C#m", "Dm", "Ebm", "Em", "Fm", "F#m", "Gm", "G#m", "Am", "Bbm", "Bm",
] as const;

const SHARP_NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
const FLAT_NOTES = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];

const LETTER_PITCH: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };

const mod12 = (n: number) => ((n % 12) + 12) % 12;

type KeyRoot = { pitch: number; minor: boolean };

/** Parse a key or chord root, e.g. "Bb", "F#m", "G". Returns pitch class and mode. */
export function parseKeyRoot(key: string | null | undefined): KeyRoot | null {
  const match = /^\s*([A-Ga-g])([#b]?)/.exec(key ?? "");
  if (!match) return null;
  let pitch = LETTER_PITCH[match[1].toUpperCase()];
  if (match[2] === "#") pitch = mod12(pitch + 1);
  else if (match[2] === "b") pitch = mod12(pitch - 1);
  const rest = (key ?? "").slice(match[0].length);
  const minor = /^m/i.test(rest) && !/^maj/i.test(rest);
  return { pitch, minor };
}

export function keyToPitch(key: string | null | undefined): number | null {
  return parseKeyRoot(key)?.pitch ?? null;
}

export function isMinorKey(key: string | null | undefined): boolean {
  return parseKeyRoot(key)?.minor ?? false;
}

/** Whether a key is conventionally written with sharps or flats. */
export function accidentalForKey(key: string): Accidental {
  if (key.includes("b")) return "b";
  if (key.includes("#")) return "#";
  const root = key.trim().charAt(0).toUpperCase();
  const minor = isMinorKey(key);
  const flatRoots = minor ? ["C", "D", "F", "G"] : ["F"];
  return flatRoots.includes(root) ? "b" : "#";
}

/** Semitone distance from one key to another, normalized to 0–11. */
export function semitoneDelta(from: string, to: string): number {
  const a = keyToPitch(from);
  const b = keyToPitch(to);
  if (a === null || b === null) return 0;
  return mod12(b - a);
}

/** Transpose a key/chord-root name by delta semitones, spelled per the accidental. */
export function transposeKeyName(key: string, delta: number, accidental: Accidental = "#"): string {
  const root = parseKeyRoot(key);
  if (!root) return key;
  const notes = accidental === "b" ? FLAT_NOTES : SHARP_NOTES;
  return notes[mod12(root.pitch + delta)] + (root.minor ? "m" : "");
}

/** The 12 tonic buttons for the picker, matching the mode of the original key. */
export function keyList(minor: boolean): string[] {
  return [...(minor ? MINOR_BY_PITCH : MAJOR_BY_PITCH)];
}

/** Re-spell a key into its canonical picker name, preserving major/minor. */
export function normalizeKey(key: string): string {
  const root = parseKeyRoot(key);
  if (!root) return key;
  return (root.minor ? MINOR_BY_PITCH : MAJOR_BY_PITCH)[root.pitch];
}
