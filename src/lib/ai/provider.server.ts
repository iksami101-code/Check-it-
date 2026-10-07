import { createOpenAI } from "@ai-sdk/openai";
import { createLovableAiGatewayRunIdFetch } from "./run-id.server";

/**
 * AI configuration. On Lovable hosting LOVABLE_API_KEY is provided automatically.
 * On self-hosting (e.g. Cloudflare) set AI_API_KEY, and optionally AI_BASE_URL / AI_MODEL
 * to point at any OpenAI-compatible Responses API (e.g. https://api.openai.com/v1 + gpt-5).
 */
export function getAiConfig() {
  const apiKey = process.env["AI_API_KEY"] || process.env["LOVABLE_API_KEY"];
  if (!apiKey) throw new AiConfigError("AI is not configured. Set AI_API_KEY or LOVABLE_API_KEY.");
  const baseURL = process.env["AI_BASE_URL"] || "https://ai.gateway.lovable.dev/v1";
  const model = process.env["AI_MODEL"] || "openai/gpt-6-astra";
  return { apiKey, baseURL, model };
}

export class AiConfigError extends Error {}

export function createAiModel(initialRunId?: string) {
  const config = getAiConfig();
  const runIdFetch = createLovableAiGatewayRunIdFetch(initialRunId);
  const provider = createOpenAI({
    baseURL: `${config.baseURL.replace(/\/+$/, "").replace(/\/v1$/, "")}/v1`,
    apiKey: config.apiKey,
    headers: { "Lovable-API-Key": config.apiKey, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: runIdFetch.fetch,
  });
  return { model: provider.responses(config.model), runIdFetch };
}

export const reasoningOptions = {
  openai: {
    forceReasoning: true,
    reasoningEffort: "low",
    reasoningSummary: "auto",
    store: false,
    include: ["reasoning.encrypted_content"],
  },
} as const;

export function aiErrorMessage(error: unknown): { status: number; message: string } {
  const e = error as { statusCode?: number; status?: number; message?: string; responseBody?: string };
  const status = e?.statusCode ?? e?.status ?? 500;
  if (error instanceof AiConfigError) return { status: 500, message: error.message };
  if (status === 429) return { status, message: "Too many requests right now. Please wait a moment and try again." };
  if (status === 402) return { status, message: "AI credits have run out. Please add credits to continue." };
  if (status === 403) return { status, message: "AI access is currently blocked for this workspace." };
  return { status: status >= 400 && status < 600 ? status : 500, message: "The AI couldn't complete this request. Please try again." };
}
