import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, FileText, Image as ImageIcon, Link2, RefreshCw, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { VERDICTS, type CheckRow } from "@/lib/checks";
import { VerdictBadge } from "@/components/verdict-badge";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/history")({
  head: () => ({
    meta: [
      { title: "History — Check It AI" },
      { name: "description", content: "Your fact checks and the public archive, searchable and filterable by verdict." },
      { property: "og:title", content: "History — Check It AI" },
      { property: "og:description", content: "A little more clarity, one check at a time." },
    ],
  }),
  component: HistoryPage,
});

function useDebounced<T>(v: T, ms = 300) {
  const [d, setD] = useState(v);
  useEffect(() => {
    const t = setTimeout(() => setD(v), ms);
    return () => clearTimeout(t);
  }, [v, ms]);
  return d;
}

function HistoryPage() {
  const { user, loading: authLoading } = useAuth();
  const [tab, setTab] = useState<"mine" | "public">("mine");
  const [q, setQ] = useState("");
  const [verdict, setVerdict] = useState("ALL");
  const dq = useDebounced(q.trim());

  const mine = tab === "mine";
  const query = useQuery({
    queryKey: [mine ? "my-checks" : "public-checks", user?.id ?? null, dq, verdict],
    enabled: !mine || !!user,
    queryFn: async () => {
      let req = supabase.from("checks").select("*").order("created_at", { ascending: false }).limit(60);
      if (mine) req = req.eq("user_id", user!.id);
      if (verdict !== "ALL") req = req.eq("verdict", verdict);
      if (dq) req = req.ilike("claim", `%${dq.replace(/[%_,()]/g, " ")}%`);
      const { data, error } = await req;
      if (error) throw error;
      return data as CheckRow[];
    },
  });

  return (
    <div className="fade-up pt-8">
      <h1 className="text-4xl font-semibold leading-tight md:text-5xl">
        A little more clarity,
        <br />
        one check at a time.
      </h1>
      <button
        onClick={() => query.refetch()}
        className="mt-6 flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"
      >
        <RefreshCw className={cn("h-4 w-4", query.isFetching && "animate-spin")} /> Refresh
      </button>

      <div className="mt-6 flex gap-1">
        {(["mine", "public"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn("rounded-lg px-3 py-2 text-sm text-muted-foreground", tab === t && "bg-accent font-semibold text-accent-foreground")}
          >
            {t === "mine" ? "My checks" : "Public archive"}
          </button>
        ))}
      </div>

      <div className="mt-4 flex gap-2">
        <label className="flex flex-1 items-center gap-2 rounded-xl border bg-card px-3">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search claims…"
            className="w-full bg-transparent py-3 outline-none"
          />
        </label>
        <select
          value={verdict}
          onChange={(e) => setVerdict(e.target.value)}
          className="rounded-xl border bg-card px-3 text-sm"
        >
          <option value="ALL">ALL</option>
          {VERDICTS.map((v) => (
            <option key={v}>{v}</option>
          ))}
        </select>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {mine && !authLoading && !user ? (
          <div className="rounded-2xl border bg-card p-6 md:col-span-2">
            <p className="font-semibold">Sign in to keep your own history.</p>
            <p className="mt-1 text-sm text-muted-foreground">Checks you run while signed in appear here.</p>
            <Link to="/auth" className="mt-4 inline-block rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground">
              Sign in
            </Link>
          </div>
        ) : query.isLoading || (mine && authLoading) ? (
          [0, 1].map((i) => (
            <div key={i} className="space-y-3 rounded-2xl border bg-card p-6">
              {[90, 75, 50].map((w) => (
                <div key={w} className="h-4 animate-pulse rounded bg-accent" style={{ width: `${w}%` }} />
              ))}
            </div>
          ))
        ) : query.error ? (
          <p className="text-sm text-destructive">Couldn't load checks. Try refresh.</p>
        ) : query.data?.length === 0 ? (
          <p className="text-muted-foreground md:col-span-2">No checks found.</p>
        ) : (
          query.data?.map((c) => <CheckCard key={c.id} c={c} />)
        )}
      </div>
    </div>
  );
}

function CheckCard({ c }: { c: CheckRow }) {
  const Icon = c.kind === "link" ? Link2 : c.kind === "image" ? ImageIcon : FileText;
  return (
    <Link to="/check/$id" params={{ id: c.id }} className="block rounded-2xl border bg-card p-5 transition-all hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center justify-between">
        <VerdictBadge verdict={c.verdict} />
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Icon className="h-3.5 w-3.5" /> {new Date(c.created_at).toLocaleDateString()}
        </span>
      </div>
      <h3 className="mt-4 line-clamp-2 break-words text-lg font-semibold">{c.claim}</h3>
      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">{c.summary}</p>
      <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-leaf">
        View evidence <ArrowRight className="h-4 w-4" />
      </span>
    </Link>
  );
}
