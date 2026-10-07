import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { RefreshCw } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { VERDICTS } from "@/lib/checks";
import { VerdictBadge, verdictBar } from "@/components/verdict-badge";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/insights")({
  head: () => ({
    meta: [
      { title: "Insights — Check It AI" },
      { name: "description", content: "Signals, not noise: real activity and verdict trends from the Check It archive." },
      { property: "og:title", content: "Insights — Check It AI" },
      { property: "og:description", content: "Verdict breakdown and daily checks from the public archive." },
    ],
  }),
  component: InsightsPage,
});

function InsightsPage() {
  const [days, setDays] = useState(7);
  const q = useQuery({
    queryKey: ["insights", days],
    queryFn: async () => {
      const since = new Date(Date.now() - days * 86400000);
      since.setUTCHours(0, 0, 0, 0);
      const { data, error } = await supabase
        .from("checks")
        .select("verdict, created_at")
        .gte("created_at", since.toISOString())
        .order("created_at", { ascending: true })
        .limit(5000);
      if (error) throw error;
      return data;
    },
  });

  const rows = q.data ?? [];
  const counts = Object.fromEntries(VERDICTS.map((v) => [v, rows.filter((r) => r.verdict === v).length]));
  const total = rows.length;
  const perDay: { d: string; n: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000).toISOString().slice(0, 10);
    perDay.push({ d, n: rows.filter((r) => r.created_at.slice(0, 10) === d).length });
  }
  const maxDay = Math.max(1, ...perDay.map((p) => p.n));

  return (
    <div className="fade-up pt-8">
      <p className="text-[11px] font-bold tracking-[0.14em]">THE BIGGER PICTURE</p>
      <h1 className="mt-3 text-4xl font-semibold md:text-5xl">Signals, not noise.</h1>
      <p className="mt-3 text-muted-foreground">Real activity from the Check It archive.</p>

      <div className="mt-6 flex items-center gap-1">
        {[7, 30, 90].map((d) => (
          <button
            key={d}
            onClick={() => setDays(d)}
            className={cn("rounded-lg px-3 py-2 text-sm text-muted-foreground", days === d && "bg-accent font-semibold text-accent-foreground")}
          >
            {d} days
          </button>
        ))}
        <button onClick={() => q.refetch()} className="ml-auto grid h-9 w-9 place-items-center rounded-lg border" aria-label="Refresh">
          <RefreshCw className={cn("h-4 w-4", q.isFetching && "animate-spin")} />
        </button>
      </div>

      {q.isLoading ? (
        <div className="mt-6 space-y-3 rounded-2xl border bg-card p-6">
          {[90, 75, 50].map((w) => (
            <div key={w} className="h-4 animate-pulse rounded bg-accent" style={{ width: `${w}%` }} />
          ))}
        </div>
      ) : q.error ? (
        <p className="mt-6 text-sm text-destructive">Couldn't load insights.</p>
      ) : (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border bg-card p-6 md:col-span-2">
            <p className="text-sm text-muted-foreground">Total checks</p>
            <p className="font-display text-5xl font-semibold">{total}</p>
          </div>
          <div className="rounded-2xl border bg-card p-6">
            <h2 className="text-2xl font-semibold">Verdict breakdown</h2>
            <div className="mt-5 space-y-5">
              {VERDICTS.map((v) => (
                <div key={v}>
                  <div className="flex items-center justify-between">
                    <VerdictBadge verdict={v} />
                    <span className="font-semibold">{counts[v]}</span>
                  </div>
                  <div className="mt-2 h-1.5 rounded-full bg-muted">
                    <div
                      className={cn("h-full rounded-full transition-all duration-700", verdictBar[v])}
                      style={{ width: `${total ? ((counts[v] ?? 0) / total) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border bg-card p-6">
            <h2 className="text-2xl font-semibold">Checking in, day by day</h2>
            <p className="mt-1 text-sm text-muted-foreground">Checks per day · UTC</p>
            <div className="mt-6 flex h-40 items-end gap-[3px]">
              {perDay.map((p) => (
                <div key={p.d} className="group relative flex h-full flex-1 items-end" title={`${p.d}: ${p.n}`}>
                  <div
                    className="w-full rounded-t bg-leaf/70 transition-all duration-700 group-hover:bg-leaf"
                    style={{ height: `${(p.n / maxDay) * 100}%`, minHeight: p.n ? 4 : 1 }}
                  />
                </div>
              ))}
            </div>
            <div className="mt-2 flex justify-between text-[10px] text-muted-foreground">
              <span>{perDay[0]?.d}</span>
              <span>{perDay[perDay.length - 1]?.d}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
