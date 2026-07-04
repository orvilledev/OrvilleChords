"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { X, ChevronLeft, ChevronRight, Minus, Plus, Play, Pause } from "lucide-react";
import { useSetlists } from "@/lib/data/SetlistsProvider";
import { useSongs } from "@/lib/data/SongsProvider";
import { SongViewer } from "@/components/SongViewer";
import { renderInKey } from "@/lib/chords/chordpro";
import { normalizeKey } from "@/lib/chords/keys";

const FONT_KEY = "oc-stage-font";
const MIN = 1.0;
const MAX = 2.6;
const STEP = 0.15;
const SPEED_STEPS = [0, 1, 2, 4]; // px per tick; index 0 = off

export default function PlaySetlistPage() {
  const { id } = useParams<{ id: string }>();
  const { getSetlist, loading } = useSetlists();
  const { getSong } = useSongs();
  const setlist = getSetlist(id);

  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [scale, setScale] = useState(1.5);
  const [speed, setSpeed] = useState(0); // index into SPEED_STEPS

  const slides = useMemo(() => {
    if (!setlist) return [];
    return setlist.items
      .map((item) => {
        const song = getSong(item.songId);
        if (!song) return null;
        const target = item.keyOverride || normalizeKey(song.originalKey || "C");
        const parsed = renderInKey(song.body, song.originalKey || target, target, item.capo || 0);
        return { title: song.title, artist: song.artist, key: target, capo: item.capo || 0, parsed };
      })
      .filter((s): s is NonNullable<typeof s> => s !== null);
  }, [setlist, getSong]);

  useEffect(() => {
    const saved = Number(localStorage.getItem(FONT_KEY));
    if (saved >= MIN && saved <= MAX) setScale(saved);
  }, []);

  // Keep the screen awake while performing.
  useEffect(() => {
    let lock: WakeLockSentinel | null = null;
    const request = async () => {
      try {
        lock = (await navigator.wakeLock?.request("screen")) ?? null;
      } catch {
        /* unsupported or denied */
      }
    };
    request();
    const onVisible = () => {
      if (document.visibilityState === "visible") request();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      lock?.release().catch(() => {});
    };
  }, []);

  // Auto-scroll the active song's lyrics.
  useEffect(() => {
    const step = SPEED_STEPS[speed];
    if (step === 0) return;
    const timer = setInterval(() => {
      const panel = trackRef.current?.children[active] as HTMLElement | undefined;
      if (!panel) return;
      if (panel.scrollTop + panel.clientHeight < panel.scrollHeight - 1) {
        panel.scrollTop += step;
      }
    }, 30);
    return () => clearInterval(timer);
  }, [speed, active]);

  function changeScale(delta: number) {
    setScale((prev) => {
      const next = Math.min(MAX, Math.max(MIN, Math.round((prev + delta) * 100) / 100));
      localStorage.setItem(FONT_KEY, String(next));
      return next;
    });
  }

  function goTo(index: number) {
    const track = trackRef.current;
    if (!track) return;
    const clamped = Math.min(slides.length - 1, Math.max(0, index));
    track.scrollTo({ left: clamped * track.clientWidth, behavior: "smooth" });
  }

  function onScroll() {
    const track = trackRef.current;
    if (!track || track.clientWidth === 0) return;
    const index = Math.round(track.scrollLeft / track.clientWidth);
    if (index !== active) setActive(index);
  }

  if (loading) return <p className="px-4 pt-10 text-center text-muted">Loading…</p>;

  if (!setlist || slides.length === 0) {
    return (
      <div className="px-4 pt-16 text-center">
        <p className="font-medium">Nothing to play</p>
        <Link href={`/setlists/${id}`} className="mt-2 inline-block text-sm text-accent">
          Back to setlist
        </Link>
      </div>
    );
  }

  const current = slides[active];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black text-white">
      <header className="flex items-center gap-2 border-b border-white/10 px-2 py-2">
        <Link
          href={`/setlists/${id}`}
          aria-label="Exit performance"
          className="flex h-10 w-10 items-center justify-center rounded-lg text-white/70 hover:text-white"
        >
          <X className="h-6 w-6" />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="truncate font-semibold leading-tight">{current.title}</div>
          <div className="truncate text-xs text-white/50">
            Song {active + 1} of {slides.length}
            {current.artist ? ` · ${current.artist}` : ""}
          </div>
        </div>
        <span className="flex-none rounded-md bg-white/10 px-2 py-1 text-xs font-semibold">
          {current.key}
          {current.capo ? ` · capo ${current.capo}` : ""}
        </span>
      </header>

      <div
        ref={trackRef}
        onScroll={onScroll}
        className="flex flex-1 snap-x snap-mandatory overflow-x-auto overflow-y-hidden"
        style={{ scrollbarWidth: "none" }}
      >
        {slides.map((slide, i) => (
          <section
            key={i}
            className="h-full w-full flex-none snap-center overflow-y-auto px-5 py-6"
          >
            <SongViewer parsed={slide.parsed} scale={scale} className="pb-24" />
          </section>
        ))}
      </div>

      <footer className="flex items-center justify-between gap-2 border-t border-white/10 px-3 py-2">
        <button
          onClick={() => goTo(active - 1)}
          disabled={active === 0}
          aria-label="Previous song"
          className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 disabled:opacity-30"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-1">
          <button
            onClick={() => changeScale(-STEP)}
            disabled={scale <= MIN}
            aria-label="Smaller text"
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 disabled:opacity-30"
          >
            <Minus className="h-4 w-4" />
          </button>
          <button
            onClick={() => changeScale(STEP)}
            disabled={scale >= MAX}
            aria-label="Larger text"
            className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 disabled:opacity-30"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        <button
          onClick={() => setSpeed((s) => (s + 1) % SPEED_STEPS.length)}
          aria-label="Auto-scroll speed"
          className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium ${
            speed > 0 ? "bg-accent text-accent-foreground" : "bg-white/10 text-white"
          }`}
        >
          {speed > 0 ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          {speed === 0 ? "Scroll" : `${speed}×`}
        </button>

        <button
          onClick={() => goTo(active + 1)}
          disabled={active === slides.length - 1}
          aria-label="Next song"
          className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 disabled:opacity-30"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </footer>
    </div>
  );
}
