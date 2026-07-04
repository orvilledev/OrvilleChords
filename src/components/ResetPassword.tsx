"use client";

import { useState } from "react";
import { Music } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { Button } from "./ui/Button";

const inputClass =
  "w-full rounded-xl border border-border bg-surface px-4 py-3 text-base outline-none focus:border-accent";

export function ResetPassword() {
  const { updatePassword, signOut } = useAuth();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setBusy(true);
    try {
      await updatePassword(password);
      // On success `recovery` clears and the app opens — the user is signed in.
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't update your password.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-[85vh] flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
            <Music className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Set a new password</h1>
          <p className="mt-2 text-sm text-muted">Choose a new password for your account.</p>
        </div>

        <form onSubmit={submit} className="mt-6 space-y-3">
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="New password"
            autoComplete="new-password"
            className={inputClass}
          />
          <input
            type="password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="Confirm new password"
            autoComplete="new-password"
            className={inputClass}
          />
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Saving…" : "Save password"}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-muted">
          <button type="button" onClick={() => signOut()} className="font-medium text-accent">
            Cancel
          </button>
        </p>
      </div>
    </div>
  );
}
