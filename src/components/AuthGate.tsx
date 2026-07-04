"use client";

import { useAuth } from "@/lib/auth/AuthProvider";
import { SignIn } from "./SignIn";
import { ResetPassword } from "./ResetPassword";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, loading, configured, recovery } = useAuth();

  if (!configured) {
    return (
      <div className="mx-auto max-w-md px-6 py-16 text-center">
        <p className="font-medium">Supabase isn&apos;t configured</p>
        <p className="mt-2 text-sm text-muted">
          Add <code className="text-foreground">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
          <code className="text-foreground">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> to{" "}
          <code className="text-foreground">.env.local</code>, then restart the dev server.
        </p>
      </div>
    );
  }

  if (loading) {
    return <div className="flex min-h-[70vh] items-center justify-center text-muted">Loading…</div>;
  }

  // A recovery link signs the user in, but force the new-password step first.
  if (recovery) return <ResetPassword />;

  if (!user) return <SignIn />;

  return <>{children}</>;
}
