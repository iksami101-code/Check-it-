import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ExternalLink, Share2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { VerdictBadge } from "@/components/verdict-badge";
import { parseSources, type CheckRow } from "@/lib/checks";

export const Route = createFileRoute("/check/$id")({
  head: () => ({
    meta: [
      { title: "Fact check result — Check It AI" },
      { name: "description", content: "See the verdict, explanation and sources for this fact check." },
      { property: "og:title", content: "Fact check result — Check It AI" },
      { property: "og:description", content: "The verdict and evidence behind a claim." },
    ],
  }),
  component: CheckPage,
});

function CheckPage() {
  const { id } = Route.useParams();
  const { data, isLoading, error } = useQuery({
    queryKey: ["check", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("checks").select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data as CheckRow | null;
    },
  });

  if (isLoading)
    return (
      <div className="mx-auto max-w-2xl animate-pulse space-y-4 pt-10">
        <div className="h-6 w-24 rounded bg-muted" />
        <div className="h-10 w-3/4 rounded bg-muted" />
        <div className="h-32 rounded-2xl bg-muted" />
      </div>
    );
  if (error || !data)
    return (
      <div className="pt-20 text-center">
        <h1 className="text-2xl font-semibold">Check not found</h1>
        <Link to="/" className="mt-4 inline-block text-leaf underline">Start a new check</Link>
      </div>
    );

  const sources = parseSources(data.sources);

  return (
    <article className="fade-up mx-auto max-w-2xl pt-8">
      <Link to="/history" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> History
      </Link>
      <div className="mt-6 flex items-center justify-between">
        <VerdictBadge verdict={data.verdict} className="text-sm" />
        <span className="text-xs text-muted-foreground">{new Date(data.created_at).toLocaleString()}</span>
      </div>
      <h1 className="mt-4 break-words text-3xl font-semibold leading-tight md:text-4xl">{data.claim}</h1>
      <p className="mt-5 rounded-2xl bg-accent/60 p-5 text-lg leading-relaxed">{data.summary}</p>

      <h2 className="mt-10 text-xl font-semibold">The evidence</h2>
      <div className="mt-3 space-y-4 whitespace-pre-line leading-relaxed text-foreground/85">{data.explanation}</div>

      {sources.length > 0 && (
        <>
          <h2 className="mt-10 text-xl font-semibold">Sources</h2>
          <ul className="mt-3 space-y-2">
            {sources.map((s) => (
              <li key={s.url}>
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between gap-3 rounded-xl border bg-card p-4 transition-colors hover:border-ring"
                >
                  <span className="min-w-0">
                    <span className="block truncate font-medium">{s.title || s.url}</span>
                    <span className="block truncate text-xs text-muted-foreground">{new URL(s.url).hostname}</span>
                  </span>
                  <ExternalLink className="h-4 w-4 shrink-0 text-muted-foreground" />
                </a>
              </li>
            ))}
          </ul>
        </>
      )}

      <div className="mt-10 flex flex-wrap gap-3">
        <button
          onClick={async () => {
            const url = window.location.href;
            try {
              if (navigator.share) await navigator.share({ title: "Check It AI", url });
              else {
                await navigator.clipboard.writeText(url);
                toast.success("Link copied");
              }
            } catch {
              /* user cancelled */
            }
          }}
          className="flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold"
        >
          <Share2 className="h-4 w-4" /> Share
        </button>
        <Link to="/" className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground">
          Check something else
        </Link>
      </div>
      <p className="mt-6 text-xs text-muted-foreground">AI can make mistakes. Always verify with the sources.</p>
    </article>
  );
}
