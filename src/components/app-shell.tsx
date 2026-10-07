import { Link, useRouterState } from "@tanstack/react-router";
import { ArrowUpRight, BarChart3, Check, History, LogOut, MessageCircle, ScanLine } from "lucide-react";
import type { ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { cn } from "@/lib/utils";

const tabs = [
  { to: "/", label: "Fact checker", icon: ScanLine },
  { to: "/ask", label: "Ask AI", icon: MessageCircle },
  { to: "/history", label: "History", icon: History },
  { to: "/insights", label: "Insights", icon: BarChart3 },
] as const;

export function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5" aria-label="Check It AI home">
      <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand text-brand-foreground">
        <Check className="h-5 w-5" strokeWidth={3} />
      </span>
      <span className="font-display text-2xl font-semibold tracking-tight">Check It</span>
      <span className="rounded bg-accent px-1.5 py-0.5 text-xs font-semibold text-accent-foreground">AI</span>
    </Link>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { user, signOut } = useAuth();

  return (
    <div className="min-h-dvh pb-24 md:pb-0">
      <header className="glass sticky top-0 z-40 border-b">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <Logo />
          <nav className="hidden items-center gap-1 md:flex">
            {tabs.map((t) => (
              <Link
                key={t.to}
                to={t.to}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground",
                  path === t.to && "bg-accent text-accent-foreground",
                )}
              >
                {t.label}
              </Link>
            ))}
          </nav>
          {user ? (
            <button
              onClick={() => signOut()}
              className="flex items-center gap-2 text-sm font-semibold"
              title={user.email ?? ""}
            >
              <span className="hidden max-w-[140px] truncate text-muted-foreground sm:inline">{user.email}</span>
              <span className="grid h-8 w-8 place-items-center rounded-full border">
                <LogOut className="h-4 w-4" />
              </span>
            </button>
          ) : (
            <Link to="/auth" className="flex items-center gap-3 text-sm font-semibold">
              Sign in
              <span className="grid h-8 w-8 place-items-center rounded-full border">
                <ArrowUpRight className="h-4 w-4" />
              </span>
            </Link>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4">{children}</main>

      <footer className="mx-auto mt-16 flex max-w-5xl items-center justify-between border-t px-4 py-6 text-xs text-muted-foreground">
        <span className="font-display text-sm font-semibold text-foreground">Check It AI</span>
        <div className="flex gap-4">
          <Link to="/about" className="hover:text-foreground">About</Link>
          <Link to="/privacy" className="hover:text-foreground">Privacy Policy</Link>
          <Link to="/ask" className="hover:text-foreground">Ask AI →</Link>
        </div>
      </footer>

      <nav className="glass fixed inset-x-0 bottom-0 z-40 border-t md:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div className="mx-auto grid max-w-md grid-cols-4 gap-1 px-3 py-2">
          {tabs.map((t) => {
            const active = path === t.to;
            return (
              <Link
                key={t.to}
                to={t.to}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-xl py-1.5 text-[11px] text-muted-foreground transition-colors",
                  active && "bg-accent font-medium text-accent-foreground",
                )}
              >
                <t.icon className="h-5 w-5" strokeWidth={1.75} />
                {t.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
