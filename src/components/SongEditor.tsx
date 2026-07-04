"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { X, Check } from "lucide-react";
import { SongViewer } from "./SongViewer";
import { Button } from "./ui/Button";
import { diatonicChords } from "@/lib/chords/keys";
import type { NewSong } from "@/lib/data/repository";

type Initial = {
  title: string;
  artist: string;
  originalKey: string;
  tags: string[];
  body: string;
};

export function SongEditor({
  heading,
  initial,
  saving = false,
  onSave,
}: {
  heading: string;
  initial?: Initial;
  saving?: boolean;
  onSave: (values: NewSong) => Promise<void> | void;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initial?.title ?? "");
  const [artist, setArtist] = useState(initial?.artist ?? "");
  const [originalKey, setOriginalKey] = useState(initial?.originalKey ?? "");
  const [tags, setTags] = useState(initial?.tags.join(", ") ?? "");
  const [body, setBody] = useState(initial?.body ?? "");
  const [tab, setTab] = useState<"edit" | "preview">("edit");
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const canSave = title.trim().length > 0 && !saving;
  const quickChords = useMemo(
    () => diatonicChords(originalKey.trim() || "C"),
    [originalKey],
  );

  function insertChord(chord: string) {
    const el = bodyRef.current;
    const token = `[${chord}]`;
    if (!el) {
      setBody((b) => b + token);
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const next = body.slice(0, start) + token + body.slice(end);
    setBody(next);
    // Restore focus and place the caret just after the inserted chord.
    requestAnimationFrame(() => {
      el.focus();
      el.selectionStart = el.selectionEnd = start + token.length;
    });
  }

  async function handleSave() {
    if (!canSave) return;
    await onSave({
      title: title.trim(),
      artist: artist.trim(),
      originalKey: originalKey.trim(),
      tags: tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      body,
    });
  }

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-border bg-background/95 px-2 py-2 backdrop-blur">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <X className="h-5 w-5" />
          Cancel
        </Button>
        <span className="text-sm font-semibold">{heading}</span>
        <Button size="sm" onClick={handleSave} disabled={!canSave}>
          <Check className="h-5 w-5" />
          Save
        </Button>
      </header>

      <div className="space-y-3 px-4 pt-4">
        <Field label="Title" required>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Song title"
            className={inputClass}
          />
        </Field>
        <div className="flex gap-3">
          <Field label="Artist" className="flex-1">
            <input
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              placeholder="Author / band"
              className={inputClass}
            />
          </Field>
          <Field label="Key" className="w-24">
            <input
              value={originalKey}
              onChange={(e) => setOriginalKey(e.target.value)}
              placeholder="G"
              className={inputClass}
            />
          </Field>
        </div>
        <Field label="Tags">
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="hymn, christmas (comma separated)"
            className={inputClass}
          />
        </Field>
      </div>

      <div className="mt-4 flex gap-1 px-4">
        <TabButton active={tab === "edit"} onClick={() => setTab("edit")}>
          Edit
        </TabButton>
        <TabButton active={tab === "preview"} onClick={() => setTab("preview")}>
          Preview
        </TabButton>
      </div>

      {tab === "edit" ? (
        <div className="flex flex-1 flex-col px-4 pb-6">
          <p className="mb-1 text-xs text-muted">
            Chords in {originalKey.trim() || "C"}
          </p>
          <div className="my-2 flex gap-1.5 overflow-x-auto pb-1">
            {quickChords.map(({ roman, chord }) => (
              <button
                key={roman}
                type="button"
                onClick={() => insertChord(chord)}
                className="flex flex-none flex-col items-center rounded-lg bg-surface-2 px-3 py-1.5 active:bg-border"
              >
                <span className="font-mono text-sm text-chord">{chord}</span>
                <span className="text-[10px] leading-none text-muted">{roman}</span>
              </button>
            ))}
          </div>
          <textarea
            ref={bodyRef}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={"Type lyrics with chords in brackets:\n\nA[G]mazing [G7]grace how [C]sweet the [G]sound"}
            spellCheck={false}
            className="min-h-[45vh] w-full flex-1 resize-y rounded-xl border border-border bg-surface p-3 font-mono text-sm leading-relaxed outline-none placeholder:text-muted focus:border-accent"
          />
          <p className="mt-2 text-xs text-muted">
            Put chords in square brackets right before the syllable they land on.
          </p>
        </div>
      ) : (
        <div className="flex-1 px-4 pb-6">
          {body.trim() ? (
            <SongViewer body={body} className="rounded-xl border border-border bg-surface p-4" />
          ) : (
            <p className="py-10 text-center text-sm text-muted">Nothing to preview yet.</p>
          )}
        </div>
      )}
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-border bg-surface px-3 py-2.5 text-base outline-none placeholder:text-muted focus:border-accent";

function Field({
  label,
  required,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`block ${className ?? ""}`}>
      <span className="mb-1 block text-xs font-medium text-muted">
        {label}
        {required && <span className="text-danger"> *</span>}
      </span>
      {children}
    </label>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
        active ? "bg-surface-2 text-foreground" : "text-muted hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
