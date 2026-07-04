"use client";

import { Minus, Plus } from "lucide-react";
import {
  keyList,
  keyToPitch,
  isMinorKey,
  accidentalForKey,
  transposeKeyName,
} from "@/lib/chords/keys";
import { cn } from "@/lib/utils";

const MAX_CAPO = 9;

export function TransposeSheet({
  open,
  originalKey,
  targetKey,
  capo,
  onChangeKey,
  onChangeCapo,
  onReset,
  onClose,
}: {
  open: boolean;
  originalKey: string;
  targetKey: string;
  capo: number;
  onChangeKey: (key: string) => void;
  onChangeCapo: (capo: number) => void;
  onReset: () => void;
  onClose: () => void;
}) {
  if (!open) return null;

  const keys = keyList(isMinorKey(originalKey));
  const targetPitch = keyToPitch(targetKey);
  const originalPitch = keyToPitch(originalKey);
  const shapeKey =
    capo > 0 ? transposeKeyName(targetKey, -capo, accidentalForKey(targetKey)) : targetKey;
  const changed = targetPitch !== originalPitch || capo > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-t-2xl border-t border-border bg-surface p-4 pb-8 safe-bottom"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border" />

        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-base font-semibold">Key</h2>
          {changed && (
            <button onClick={onReset} className="text-sm font-medium text-accent">
              Reset to {originalKey}
            </button>
          )}
        </div>

        <div className="grid grid-cols-4 gap-2">
          {keys.map((k) => {
            const active = keyToPitch(k) === targetPitch;
            const isOriginal = keyToPitch(k) === originalPitch;
            return (
              <button
                key={k}
                onClick={() => onChangeKey(k)}
                className={cn(
                  "relative h-12 rounded-xl text-base font-semibold transition-colors",
                  active
                    ? "bg-accent text-accent-foreground"
                    : "bg-surface-2 text-foreground hover:bg-border",
                )}
              >
                {k}
                {isOriginal && (
                  <span
                    className={cn(
                      "absolute right-1.5 top-1 text-[9px] font-bold uppercase",
                      active ? "text-accent-foreground/70" : "text-muted",
                    )}
                  >
                    orig
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold">Capo</h3>
            <p className="text-sm text-muted">
              {capo === 0 ? "No capo" : `Fret ${capo} · play ${shapeKey} shapes`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onChangeCapo(Math.max(0, capo - 1))}
              disabled={capo <= 0}
              aria-label="Lower capo"
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-2 disabled:opacity-40"
            >
              <Minus className="h-5 w-5" />
            </button>
            <span className="w-6 text-center text-lg font-semibold tabular-nums">{capo}</span>
            <button
              onClick={() => onChangeCapo(Math.min(MAX_CAPO, capo + 1))}
              disabled={capo >= MAX_CAPO}
              aria-label="Raise capo"
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-2 disabled:opacity-40"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
