"use client";

import { useState } from "react";
import { Music } from "lucide-react";
import { useAuth } from "@/lib/auth/AuthProvider";
import { Button } from "./ui/Button";

type Mode = "signin" | "signup" | "forgot";

const inputClass =
  "w-full rounded-xl border border-border bg-surface px-4 py-3 text-base outline-none focus:border-accent";

export function SignIn() {
  const { signIn, signUp, sendPasswordReset } = useAuth();
  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  function switchMode(next: Mode) {
    setMode(next);
    setError("");
    setSent(false);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (mode === "forgot") {
        await sendPasswordReset(email.trim());
        setSent(true);
      } else if (mode === "signup") {
        if (password.length < 6) throw new Error("Password must be at least 6 characters.");
        await signUp(email.trim(), password, name.trim() || undefined);
      } else {
        await signIn(email.trim(), password);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  const isSignup = mode === "signup";
  const isForgot = mode === "forgot";

  const subtitle = isForgot
    ? "We'll email you a link to set a new password."
    : isSignup
      ? "Create an account to join the shared library."
      : "Sign in to the shared song library.";

  return (
    <div className="flex min-h-[85vh] flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
            <Music className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">OrvilleChords</h1>
          <p className="mt-2 text-sm text-muted">{subtitle}</p>
        </div>

        {isForgot && sent ? (
          <div className="mt-6 rounded-xl border border-border bg-surface p-5 text-left">
            <p className="font-medium">Check your email</p>
            <p className="mt-1 text-sm text-muted">
              If an account exists for <span className="text-foreground">{email}</span>, a reset
              link is on its way. Open it on this device.
            </p>
            <button
              onClick={() => switchMode("signin")}
              className="mt-4 text-sm font-medium text-accent"
            >
              Back to sign in
            </button>
          </div>
        ) : (
          <>
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
              {!isForgot && (
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  autoComplete={isSignup ? "new-password" : "current-password"}
                  className={inputClass}
                />
              )}
              {error && <p className="text-sm text-danger">{error}</p>}
              <Button type="submit" className="w-full" disabled={busy}>
                {busy
                  ? "Please wait…"
                  : isForgot
                    ? "Send reset link"
                    : isSignup
                      ? "Create account"
                      : "Sign in"}
              </Button>
            </form>

            <div className="mt-4 space-y-1 text-center text-sm text-muted">
              {mode === "signin" && (
                <p>
                  <button
                    type="button"
                    onClick={() => switchMode("forgot")}
                    className="font-medium text-accent"
                  >
                    Forgot password?
                  </button>
                </p>
              )}
              <p>
                {isForgot ? (
                  <button
                    type="button"
                    onClick={() => switchMode("signin")}
                    className="font-medium text-accent"
                  >
                    Back to sign in
                  </button>
                ) : (
                  <>
                    {isSignup ? "Already have an account? " : "New here? "}
                    <button
                      type="button"
                      onClick={() => switchMode(isSignup ? "signin" : "signup")}
                      className="font-medium text-accent"
                    >
                      {isSignup ? "Sign in" : "Create an account"}
                    </button>
                  </>
                )}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
