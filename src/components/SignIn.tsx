"use client";

import { useState } from "react";
import { Music } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { Button } from "./ui/Button";

const inputClass =
  "w-full rounded-xl border border-border bg-surface px-4 py-3 text-base outline-none focus:border-accent";

export function SignIn() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const isSignup = mode === "signup";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setBusy(true);
    try {
      if (isSignup) await signUp(email.trim(), password, name.trim() || undefined);
      else await signIn(email.trim(), password);
      // Success flips the auth gate automatically via onAuthStateChange.
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
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
          <h1 className="text-2xl font-bold tracking-tight">OrvilleChords</h1>
          <p className="mt-2 text-sm text-muted">
            {isSignup
              ? "Create an account to join the shared library."
              : "Sign in to the shared song library."}
          </p>
        </div>

        <form onSubmit={submit} className="mt-6 space-y-3">
          {isSignup && (
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name (optional)"
              autoComplete="name"
              className={inputClass}
            />
          )}
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@church.org"
            autoComplete="email"
            className={inputClass}
          />
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoComplete={isSignup ? "new-password" : "current-password"}
            className={inputClass}
          />
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Please wait…" : isSignup ? "Create account" : "Sign in"}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm text-muted">
          {isSignup ? "Already have an account? " : "New here? "}
          <button
            type="button"
            onClick={() => {
              setMode(isSignup ? "signin" : "signup");
              setError("");
            }}
            className="font-medium text-accent"
          >
            {isSignup ? "Sign in" : "Create an account"}
          </button>
        </p>
      </div>
    </div>
  );
}
