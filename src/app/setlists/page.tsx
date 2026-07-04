"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus, ListMusic, Calendar } from "lucide-react";
import { useSetlists } from "@/lib/data/SetlistsProvider";
import { Button } from "@/components/ui/Button";

export default function SetlistsPage() {
  const { setlists, loading, createSetlist } = useSetlists();
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [date, setDate] = useState("");

  async function handleCreate() {
    const trimmed = name.trim();
    if (!trimmed) return;
    const setlist = await createSetlist({
      name: trimmed,
      serviceDate: date || undefined,
      items: [],
    });
    setCreating(false);
    setName("");
    setDate("");
    router.push(`/setlists/${setlist.id}`);
  }

  return (
    <div className="px-4 pt-6">
      <header className="mb-4">
        <h1 className="text-2xl font-bold tracking-tight">Setlists</h1>
        <p className="text-sm text-muted">
          {setlists.length} set{setlists.length === 1 ? "" : "s"}
        </p>
      </header>

      {loading ? (
        <ul className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <li key={i} className="h-16 animate-pulse rounded-xl border border-border bg-surface" />
          ))}
        </ul>
      ) : setlists.length === 0 ? (
        <div className="mt-16 text-center">
          <ListMusic className="mx-auto h-10 w-10 text-muted" />
          <p className="mt-3 font-medium">No setlists yet</p>
          <p className="mt-1 text-sm text-muted">Tap + to plan a service.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {setlists.map((set) => (
            <li key={set.id}>
              <Link
                href={`/setlists/${set.id}`}
                className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 transition-colors active:bg-surface-2"
              >
                <div className="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-surface-2 text-accent">
                  <ListMusic className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">{set.name}</div>
                  <div className="flex items-center gap-2 text-sm text-muted">
                    {set.serviceDate && (
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(set.serviceDate)}
                      </span>
                    )}
                    <span>
                      {set.items.length} song{set.items.length === 1 ? "" : "s"}
                    </span>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <button
        onClick={() => setCreating(true)}
        aria-label="New setlist"
        className="fixed bottom-24 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-lg transition active:scale-95"
      >
        <Plus className="h-7 w-7" />
      </button>

      {creating && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center"
          onClick={() => setCreating(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-border bg-surface p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold">New setlist</h2>
            <label className="mt-4 block">
              <span className="mb-1 block text-xs font-medium text-muted">Name</span>
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Sunday Morning"
                className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2.5 text-base outline-none focus:border-accent"
              />
            </label>
            <label className="mt-3 block">
              <span className="mb-1 block text-xs font-medium text-muted">Service date</span>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface-2 px-3 py-2.5 text-base outline-none focus:border-accent"
              />
            </label>
            <div className="mt-5 flex gap-2">
              <Button variant="secondary" className="flex-1" onClick={() => setCreating(false)}>
                Cancel
              </Button>
              <Button className="flex-1" onClick={handleCreate} disabled={!name.trim()}>
                Create
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}
