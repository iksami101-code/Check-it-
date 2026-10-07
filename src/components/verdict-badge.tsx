import { cn } from "@/lib/utils";

const styles: Record<string, string> = {
  TRUE: "bg-v-true-bg text-v-true",
  FALSE: "bg-v-false-bg text-v-false",
  MISLEADING: "bg-v-mis-bg text-v-mis",
  UNVERIFIED: "bg-v-unv-bg text-v-unv",
};

export const verdictBar: Record<string, string> = {
  TRUE: "bg-v-true",
  FALSE: "bg-v-false",
  MISLEADING: "bg-v-mis",
  UNVERIFIED: "bg-v-unv",
};

export function VerdictBadge({ verdict, className }: { verdict: string; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2.5 py-1 text-xs font-bold tracking-wider",
        styles[verdict] ?? styles["UNVERIFIED"],
        className,
      )}
    >
      {verdict}
    </span>
  );
}
