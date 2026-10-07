import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";

const inputSchema = z.object({
  kind: z.enum(["text", "link", "image"]),
  text: z.string().max(12000).optional(),
  url: z.string().max(2000).optional(),
  image: z.string().max(7_000_000).optional(),
});

export type CheckInput = z.infer<typeof inputSchema>;

export type CheckResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

async function fetchPageText(rawUrl: string): Promise<string> {
  const url = new URL(rawUrl);
  if (url.protocol !== "http:" && url.protocol !== "https:") throw new Error("Only http(s) links are supported.");
  const res = await fetch(url.toString(), {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; CheckItAI/1.0)", Accept: "text/html,*/*" },
    redirect: "follow",
  });
  if (!res.ok) throw new Error(`Couldn't open that page (status ${res.status}).`);
  const html = (await res.text()).slice(0, 400_000);
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1]?.trim() ?? "";
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 14000);
  return `Page title: ${title}\nPage text: ${text}`;
}

export const runCheck = createServerFn({ method: "POST" })
  .inputValidator((input: CheckInput) => inputSchema.parse(input))
  .handler(async ({ data }): Promise<CheckResult> => {
    const { streamText, Output } = await import("ai");
    const { createAiModel, reasoningOptions, aiErrorMessage } = await import("@/lib/ai/provider.server");
    const { createClient } = await import("@supabase/supabase-js");

    // Optional signed-in user (bearer attached automatically when a session exists).
    // Uses the publishable key + the user's own token, so RLS applies (no service key needed).
    const auth = getRequest().headers.get("authorization");
    const token = auth?.startsWith("Bearer ") ? auth.slice(7) : null;
    const sbUrl = process.env["SUPABASE_URL"] || process.env["VITE_SUPABASE_URL"];
    const sbKey = process.env["SUPABASE_PUBLISHABLE_KEY"] || process.env["VITE_SUPABASE_PUBLISHABLE_KEY"];
    if (!sbUrl || !sbKey) return { ok: false, error: "Server is missing database settings." };
    const supabaseAdmin = createClient(sbUrl, sbKey, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: {
        fetch: (input, init) => {
          const h = new Headers(init?.headers);
          h.set("apikey", sbKey);
          if (token) h.set("Authorization", `Bearer ${token}`);
          else if (sbKey.startsWith("sb_")) h.delete("Authorization");
          return fetch(input, { ...init, headers: h });
        },
      },
    });
    let userId: string | null = null;
    if (token) {
      const { data: u } = await supabaseAdmin.auth.getUser(token);
      userId = u.user?.id ?? null;
    }

    let claimLabel = "";
    const content: Array<{ type: "text"; text: string } | { type: "image"; image: string }> = [];
    try {
      if (data.kind === "text") {
        const t = data.text?.trim();
        if (!t || t.length < 3) return { ok: false, error: "Please enter a claim to check." };
        claimLabel = t;
        content.push({ type: "text", text: `Claim to fact-check:\n${t}` });
      } else if (data.kind === "link") {
        const u = data.url?.trim();
        if (!u) return { ok: false, error: "Please paste a link." };
        claimLabel = u;
        let page = "";
        try {
          page = await fetchPageText(u);
        } catch (e) {
          page = `(The page could not be fetched: ${(e as Error).message}. Judge from the URL and your knowledge.)`;
        }
        content.push({ type: "text", text: `Fact-check the main claims of this web page.\nURL: ${u}\n${page}` });
      } else {
        const img = data.image;
        if (!img || !img.startsWith("data:image/")) return { ok: false, error: "Please upload an image." };
        const note = data.text?.trim();
        claimLabel = note ? `Image: ${note}` : "Uploaded image";
        content.push({
          type: "text",
          text: `Fact-check the claims shown in this image. Also note signs of manipulation or missing context.${note ? `\nUser note: ${note}` : ""}`,
        });
        content.push({ type: "image", image: img });
      }
    } catch {
      return { ok: false, error: "Couldn't read your input." };
    }

    const schema = z.object({
      title: z.string().describe("Short neutral restatement of the claim, max 90 characters"),
      verdict: z.enum(["TRUE", "FALSE", "MISLEADING", "UNVERIFIED"]),
      summary: z.string().describe("2-3 sentence plain-language conclusion"),
      explanation: z.string().describe("Detailed reasoning with evidence, 2-5 short paragraphs"),
      sources: z
        .array(z.object({ title: z.string(), url: z.string() }))
        .describe("Up to 5 reputable sources with real, well-known URLs"),
    });

    try {
      const { model } = createAiModel();
      const result = streamText({
        model,
        system:
          "You are Check It AI, a careful, neutral fact-checker. Evaluate claims using established evidence and reputable sources (scientific bodies, official statistics, major news agencies, encyclopedias). Use UNVERIFIED when evidence is insufficient or the event is too recent to confirm. Use MISLEADING when partly true but missing context. Only cite URLs you are confident exist; prefer homepages or well-known pages. Write in the same language as the claim.",
        messages: [{ role: "user", content }],
        output: Output.object({ schema }),
        providerOptions: reasoningOptions,
      });
      const out = await result.output;
      const { data: row, error } = await supabaseAdmin
        .from("checks")
        .insert({
          user_id: userId,
          kind: data.kind,
          claim: data.kind === "text" ? claimLabel : out.title || claimLabel,
          verdict: out.verdict,
          summary: out.summary,
          explanation: out.explanation,
          sources: out.sources.slice(0, 6),
        })
        .select("id")
        .single();
      if (error || !row) {
        console.error(error);
        return { ok: false, error: "The check finished but couldn't be saved. Please try again." };
      }
      return { ok: true, id: row.id };
    } catch (e) {
      console.error("check failed", e);
      return { ok: false, error: aiErrorMessage(e).message };
    }
  });
