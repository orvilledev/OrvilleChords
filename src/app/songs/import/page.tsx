"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { X, ImagePlus, ScanText, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SongEditor } from "@/components/SongEditor";
import { useSongs } from "@/lib/data/SongsProvider";
import {
  ocrLinesToChordPro,
  recognizeChartImages,
  type OcrProgress,
} from "@/lib/import/screenshot";

type Picked = { file: File; url: string };

export default function ImportSongPage() {
  const router = useRouter();
  const { createSong } = useSongs();

  const [stage, setStage] = useState<"pick" | "reading" | "review">("pick");
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [picked, setPicked] = useState<Picked[]>([]);
  const [progress, setProgress] = useState<OcrProgress | null>(null);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ body: string; keyGuess: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Object URLs live for the lifetime of the page; release them on unmount.
  const pickedRef = useRef(picked);
  pickedRef.current = picked;
  useEffect(
    () => () => pickedRef.current.forEach((p) => URL.revokeObjectURL(p.url)),
    [],
  );

  function addFiles(files: File[]) {
    const next = files
      .filter((f) => f.type.startsWith("image/"))
      .map((file) => ({ file, url: URL.createObjectURL(file) }));
    if (next.length > 0) setPicked((prev) => [...prev, ...next]);
    if (inputRef.current) inputRef.current.value = "";
  }

  // Let users paste screenshots straight from the clipboard (Ctrl/Cmd+V).
  const stageRef = useRef(stage);
  stageRef.current = stage;
  useEffect(() => {
    function onPaste(e: ClipboardEvent) {
      if (stageRef.current !== "pick") return;
      const files = Array.from(e.clipboardData?.items ?? [])
        .filter((item) => item.kind === "file" && item.type.startsWith("image/"))
        .map((item) => item.getAsFile())
        .filter((f): f is File => f !== null);
      if (files.length > 0) {
        e.preventDefault();
        addFiles(files);
      }
    }
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, []);

  function removeFile(index: number) {
    setPicked((prev) => {
      URL.revokeObjectURL(prev[index].url);
      return prev.filter((_, i) => i !== index);
    });
  }

  async function runImport() {
    setError("");
    setStage("reading");
    setProgress({ fileIndex: 0, fileCount: picked.length, progress: 0 });
    try {
      const pages = await recognizeChartImages(
        picked.map((p) => p.file),
        setProgress,
      );
      const chart = ocrLinesToChordPro(pages);
      if (!chart.body.trim()) {
        setError("Couldn't read any text from the screenshots. Try clearer images.");
        setStage("pick");
        return;
      }
      setResult(chart);
      setStage("review");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't read the screenshots.");
      setStage("pick");
    }
  }

  if (stage === "review" && result) {
    return (
      <SongEditor
        heading="Review Import"
        saving={saving}
        initial={{
          title,
          artist,
          originalKey: result.keyGuess,
          tags: ["worship"],
          body: result.body,
        }}
        onSave={async (values) => {
          setSaving(true);
          try {
            const song = await createSong(values);
            router.replace(`/songs/${song.id}`);
          } catch (err) {
            setSaving(false);
            setError(err instanceof Error ? err.message : "Couldn't save the song.");
          }
        }}
      />
    );
  }

  const reading = stage === "reading";
  const pct = progress
    ? Math.round(((progress.fileIndex + progress.progress) / progress.fileCount) * 100)
    : 0;

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-background/95 px-2 py-2 backdrop-blur">
        <Button variant="ghost" size="sm" onClick={() => router.back()} disabled={reading}>
          <X className="h-5 w-5" />
          Cancel
        </Button>
        <span className="text-sm font-semibold">Import Screenshot</span>
        <span className="w-20" />
      </header>

      <div className="space-y-3 px-4 pt-4">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted">
            Title <span className="text-danger">*</span>
          </span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Song title"
            disabled={reading}
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-muted">Artist</span>
          <input
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
            placeholder="Author / band"
            disabled={reading}
            className={inputClass}
          />
        </label>
      </div>

      <div className="px-4 pt-4">
        <span className="mb-1 block text-xs font-medium text-muted">
          Chord chart screenshots <span className="text-danger">*</span>
        </span>
        <p className="mb-2 text-xs text-muted">
          Upload or paste (Ctrl+V) screenshots with chords written above the lyrics.
          If the song spans several screenshots, add them in order.
        </p>

        {picked.length > 0 && (
          <ul className="mb-3 grid grid-cols-3 gap-2">
            {picked.map((p, i) => (
              <li key={p.url} className="relative overflow-hidden rounded-xl border border-border bg-surface">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt={`Screenshot ${i + 1}`} className="h-28 w-full object-cover object-top" />
                <span className="absolute left-1.5 top-1.5 rounded-md bg-background/85 px-1.5 py-0.5 text-xs font-semibold">
                  {i + 1}
                </span>
                {!reading && (
                  <button
                    type="button"
                    aria-label={`Remove screenshot ${i + 1}`}
                    onClick={() => removeFile(i)}
                    className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-md bg-background/85 text-danger"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => addFiles(Array.from(e.target.files ?? []))}
        />
        {!reading && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-surface py-6 text-sm font-medium text-muted active:bg-surface-2"
          >
            <ImagePlus className="h-5 w-5" />
            {picked.length === 0 ? "Add or paste screenshots" : "Add more screenshots"}
          </button>
        )}
      </div>

      {error && <p className="px-4 pt-3 text-sm text-danger">{error}</p>}

      <div className="mt-auto px-4 pb-8 pt-6">
        {reading ? (
          <div>
            <div className="mb-2 flex justify-between text-sm text-muted">
              <span>
                Reading screenshot {(progress?.fileIndex ?? 0) + 1} of {progress?.fileCount ?? 1}…
              </span>
              <span>{pct}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-surface-2">
              <div
                className="h-full rounded-full bg-accent transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
            <p className="mt-3 text-center text-xs text-muted">
              You&apos;ll review and can fix anything before it&apos;s saved.
            </p>
          </div>
        ) : (
          <Button
            className="w-full"
            disabled={picked.length === 0 || title.trim().length === 0}
            onClick={runImport}
          >
            <ScanText className="h-5 w-5" />
            Read screenshots
          </Button>
        )}
      </div>
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-base outline-none placeholder:text-muted focus:border-accent disabled:opacity-60";
