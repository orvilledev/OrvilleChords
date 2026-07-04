"use client";

import { useState } from "react";
import { Music } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { Button } from "./ui/Button";

export function SignIn() {
  const { signInWithEmail } = useAuth();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;
    setBusy(true);
    setError("");
    try {
      await signInWithEmail(trimmed);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-[85vh] flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
          <Music className="h-7 w-7" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">OrvilleChords</h1>

        {sent ? (
          <div className="mt-6 rounded-xl border border-border bg-surface p-5 text-left">
            <p className="font-medium">Check your email</p>
            <p className="mt-1 text-sm text-muted">
              We sent a sign-in link to <span className="text-foreground">{email}</span>. Open it
              on this device to continue.
            </p>
            <button onClick={() => setSent(false)} className="mt-4 text-sm font-medium text-accent">
              Use a different email
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-6 text-left">
            <p className="mb-4 text-center text-sm text-muted">
              Sign in with your email to reach the shared song library.
            </p>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@church.org"
              autoComplete="email"
              className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-base outline-none focus:border-accent"
            />
            {error && <p className="mt-2 text-sm text-danger">{error}</p>}
            <Button type="submit" className="mt-3 w-full" disabled={busy}>
              {busy ? "Sending…" : "Send magic link"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
