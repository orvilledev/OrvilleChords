"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Library, ListMusic, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
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
  {
    href: "/songs/new",
    label: "Add",
    icon: Plus,
    match: (p: string) => p === "/songs/new",
  },
];

export function BottomNav() {
  const pathname = usePathname();

  // The stage/performance view is full-screen; no chrome.
  if (pathname.endsWith("/play")) return null;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 backdrop-blur safe-bottom">
      <div className="mx-auto flex max-w-2xl items-stretch">
        {items.map(({ href, label, icon: Icon, match }) => {
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
      </div>
    </nav>
  );
}
