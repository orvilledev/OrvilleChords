"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronLeft, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { Button } from "@/components/ui/Button";

const inputClass =
  "w-full rounded-xl border border-border bg-surface px-4 py-3 text-base outline-none focus:border-accent";

export default function AccountPage() {
  const { user, updatePassword, signOut } = useAuth();
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  if (!user) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);
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
      setPassword("");
      setConfirm("");
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't update your password.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <header className="sticky top-0 z-20 flex items-center gap-1 border-b border-border bg-background/95 px-2 py-2 backdrop-blur">
        <Link
          href="/"
          aria-label="Back"
          className="flex h-10 w-10 items-center justify-center rounded-lg text-muted hover:text-foreground"
        >
          <ChevronLeft className="h-6 w-6" />
        </Link>
        <h1 className="text-lg font-semibold">Account</h1>
      </header>

      <div className="px-4 py-5">
        <div className="rounded-xl border border-border bg-surface p-4">
          <p className="text-xs font-medium text-muted">Signed in as</p>
          <p className="mt-0.5 font-medium">{user.email}</p>
        </div>

        <h2 className="mb-3 mt-6 text-sm font-semibold text-muted">Change password</h2>
        <form onSubmit={submit} className="space-y-3">
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
          {success && <p className="text-sm text-accent">Password updated.</p>}
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Saving…" : "Update password"}
          </Button>
        </form>

        <button
          onClick={async () => {
            await signOut();
            router.replace("/");
          }}
          className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl border border-border py-3 text-sm font-medium text-danger active:bg-surface-2"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </div>
    </div>
  );
}
