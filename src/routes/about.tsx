import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Check It AI" },
      { name: "description", content: "Check It AI helps people pause, look at the evidence and make informed calls." },
      { property: "og:title", content: "About — Check It AI" },
      { property: "og:description", content: "Why Check It AI exists and how it works." },
    ],
  }),
  component: () => (
    <div className="fade-up mx-auto max-w-2xl space-y-4 pt-10 leading-relaxed text-foreground/85">
      <h1 className="text-4xl font-semibold text-foreground">About Check It AI</h1>
      <p>Check It AI is a free tool that helps you pause before sharing. Paste a claim, a link or an image and get a clear verdict — true, false, misleading or unverified — with an explanation and sources to explore.</p>
      <p>AI is a starting point, not the final word. Every result encourages you to open the sources and make your own informed call.</p>
    </div>
  ),
});
