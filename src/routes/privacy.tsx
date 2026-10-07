import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Check It AI" },
      { name: "description", content: "How Check It AI handles the claims you check and your account data." },
      { property: "og:title", content: "Privacy Policy — Check It AI" },
      { property: "og:description", content: "What we store and why." },
    ],
  }),
  component: () => (
    <div className="fade-up mx-auto max-w-2xl space-y-4 pt-10 leading-relaxed text-foreground/85">
      <h1 className="text-4xl font-semibold text-foreground">Privacy Policy</h1>
      <p>Claims you submit, and the AI's verdict, are saved in a public archive so others can learn from them. Please don't include personal information.</p>
      <p>If you sign in, we store your email address to link checks to your account. Uploaded images are sent to our AI provider for analysis and are not stored.</p>
      <p>We don't sell your data. Contact us to delete your account.</p>
    </div>
  ),
});
