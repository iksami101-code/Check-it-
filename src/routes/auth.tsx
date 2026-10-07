import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Check It AI" },
      { name: "description", content: "Sign in to keep a personal history of your fact checks." },
      { property: "og:title", content: "Sign in — Check It AI" },
      { property: "og:description", content: "Keep your own fact-check history." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate({ to: "/history", replace: true });
  }, [user, navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "up") {
        const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } });
        if (error) throw error;
        setSent(true);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    const res = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (res.error) toast.error("Google sign-in failed. Please try again.");
  }

  return (
    <div className="fade-up mx-auto max-w-sm pt-12">
      <h1 className="text-3xl font-semibold">{mode === "in" ? "Welcome back" : "Create an account"}</h1>
      <p className="mt-2 text-sm text-muted-foreground">Keep a personal history of everything you check.</p>

      {sent ? (
        <div className="mt-8 rounded-2xl border bg-card p-6">
          <p className="font-semibold">Check your email</p>
          <p className="mt-1 text-sm text-muted-foreground">We sent a confirmation link to {email}.</p>
        </div>
      ) : (
        <>
          <button onClick={google} className="mt-8 w-full rounded-xl border bg-card py-3 font-semibold transition-colors hover:bg-accent">
            Continue with Google
          </button>
          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
          </div>
          <form onSubmit={submit} className="space-y-3">
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              autoComplete="email"
              className="w-full rounded-xl border bg-card px-4 py-3 outline-none ring-ring focus:ring-2"
            />
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              autoComplete={mode === "in" ? "current-password" : "new-password"}
              className="w-full rounded-xl border bg-card px-4 py-3 outline-none ring-ring focus:ring-2"
            />
            <button
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 font-semibold text-primary-foreground disabled:opacity-60"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === "in" ? "Sign in" : "Sign up"}
            </button>
          </form>
          <button onClick={() => setMode(mode === "in" ? "up" : "in")} className="mt-4 w-full text-sm text-muted-foreground">
            {mode === "in" ? "New here? Create an account" : "Already have an account? Sign in"}
          </button>
        </>
      )}
    </div>
  );
}
