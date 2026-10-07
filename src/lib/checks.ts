export type Verdict = "TRUE" | "FALSE" | "MISLEADING" | "UNVERIFIED";
export const VERDICTS: Verdict[] = ["TRUE", "FALSE", "MISLEADING", "UNVERIFIED"];

export type CheckRow = {
  id: string;
  user_id: string | null;
  kind: string;
  claim: string;
  verdict: string;
  summary: string;
  explanation: string;
  sources: unknown;
  created_at: string;
};

export function parseSources(s: unknown): { title: string; url: string }[] {
  if (!Array.isArray(s)) return [];
  return s
    .filter((x): x is { title: string; url: string } => !!x && typeof x === "object" && typeof (x as { url?: unknown }).url === "string")
    .filter((x) => /^https?:\/\//.test(x.url));
}
