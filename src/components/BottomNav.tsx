"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Library, ListMusic, Plus, PencilLine, ImagePlus } from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
  {
    href: "/",
    label: "Songs",
    icon: Library,
    match: (p: string) => p === "/" || p.startsWith("/songs/"),
  },
  {
    href: "/setlists",
    label: "Sets",
    icon: ListMusic,
    match: (p: string) => p.startsWith("/setlists"),
  },
];

export function BottomNav() {
  const pathname = usePathname();
  const [addOpen, setAddOpen] = useState(false);

  // Close the sheet on any navigation (its own links, back button, deep links).
  useEffect(() => setAddOpen(false), [pathname]);

  // The stage/performance view is full-screen; no chrome.
  if (pathname.endsWith("/play")) return null;

  const addActive = pathname === "/songs/new" || pathname === "/songs/import";

  return (
    <>
      {addOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60"
          onClick={() => setAddOpen(false)}
        >
          <div
            className="w-full max-w-2xl rounded-t-2xl border-t border-border bg-surface p-4 pb-8 safe-bottom"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border" />
            <h2 className="mb-3 text-base font-semibold">Add a song</h2>
            <div className="space-y-2">
              <Link
                href="/songs/import"
                onClick={() => setAddOpen(false)}
                className="flex items-center gap-3 rounded-xl border border-border bg-surface-2 px-4 py-3.5 active:bg-border"
              >
                <ImagePlus className="h-6 w-6 flex-none text-accent" />
                <span>
                  <span className="block font-medium">Upload screenshots</span>
                  <span className="block text-sm text-muted">
                    Read chords and lyrics from chart images
                  </span>
                </span>
              </Link>
              <Link
                href="/songs/new"
                onClick={() => setAddOpen(false)}
                className="flex items-center gap-3 rounded-xl border border-border bg-surface-2 px-4 py-3.5 active:bg-border"
              >
                <PencilLine className="h-6 w-6 flex-none text-accent" />
                <span>
                  <span className="block font-medium">Type it in</span>
                  <span className="block text-sm text-muted">
                    Write lyrics with chords manually
                  </span>
                </span>
              </Link>
            </div>
          </div>
        </div>
      )}

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 backdrop-blur safe-bottom">
        <div className="mx-auto flex max-w-2xl items-stretch">
          {tabs.map(({ href, label, icon: Icon, match }) => {
            const active = match(pathname);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors",
                  active ? "text-accent" : "text-muted hover:text-foreground",
                )}
              >
                <Icon className="h-6 w-6" strokeWidth={active ? 2.4 : 2} />
                {label}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors",
              addActive ? "text-accent" : "text-muted hover:text-foreground",
            )}
          >
            <Plus className="h-6 w-6" strokeWidth={addActive ? 2.4 : 2} />
            Add
          </button>
        </div>
      </nav>
    </>
  );
}
