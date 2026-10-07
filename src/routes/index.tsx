import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowRight, ArrowUpRight, FileText, ImageIcon, Link2, Loader2, Search, ShieldCheck, Upload, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { runCheck } from "@/lib/checks.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Check It AI — Pause the scroll. Check the facts." },
      { name: "description", content: "Fact-check claims, links and images with AI and explore the evidence behind every verdict." },
      { property: "og:title", content: "Check It AI — AI fact checker" },
      { property: "og:description", content: "Drop in a claim, link or image and get a clear verdict with sources." },
    ],
  }),
  component: Home,
});

type Kind = "text" | "link" | "image";
const MAX = 12000;

async function compressImage(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = rej;
      i.src = url;
    });
    const scale = Math.min(1, 1600 / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    canvas.getContext("2d")!.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.85);
  } finally {
    URL.revokeObjectURL(url);
  }
}

function Home() {
  const [kind, setKind] = useState<Kind>("text");
  const [text, setText] = useState("");
  const [url, setUrl] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const check = useServerFn(runCheck);
  const navigate = useNavigate();

  const canSubmit =
    !loading &&
    ((kind === "text" && text.trim().length >= 3) ||
      (kind === "link" && /^https?:\/\/\S+\.\S+/.test(url.trim())) ||
      (kind === "image" && !!image));

  async function onFile(f?: File) {
    if (!f) return;
    if (!f.type.startsWith("image/")) { toast.error("Please choose an image file."); return; }
    if (f.size > 15 * 1024 * 1024) { toast.error("Image is too large (max 15 MB)."); return; }
    try {
      setImage(await compressImage(f));
    } catch {
      toast.error("Couldn't read that image.");
    }
  }

  async function submit() {
    if (!canSubmit) return;
    setLoading(true);
    try {
      const res = await check({
        data: { kind, text: kind === "link" ? undefined : text, url: kind === "link" ? url.trim() : undefined, image: kind === "image" ? image! : undefined },
      });
      if (res.ok) {
        navigate({ to: "/check/$id", params: { id: res.id } });
      } else {
        toast.error(res.error);
      }
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const tabs: { k: Kind; label: string; icon: typeof FileText }[] = [
    { k: "text", label: "Text claim", icon: FileText },
    { k: "link", label: "Website link", icon: Link2 },
    { k: "image", label: "Image", icon: ImageIcon },
  ];

  return (
    <div className="fade-up">
      <section className="grid gap-10 pt-8 md:grid-cols-2 md:items-start md:pt-16">
        <div>
          <p className="flex items-center gap-2 text-[11px] font-bold tracking-[0.14em] text-foreground/80">
            <span className="h-2 w-2 rounded-full bg-leaf" /> CLARITY IN A WORLD OF NOISE
          </p>
          <h1 className="mt-5 text-5xl font-semibold leading-[1.02] md:text-6xl">
            Pause the scroll.
            <br />
            <span className="text-leaf">Check the facts.</span>
          </h1>
          <p className="mt-6 max-w-md leading-relaxed text-muted-foreground">
            A bold claim. A viral post. An image that feels off. Get a clearer picture, with evidence you can explore.
          </p>
        </div>

        <div>
          <div className="rounded-2xl border bg-card p-4 shadow-sm md:p-5">
            <h2 className="text-2xl font-semibold">Let’s look into it.</h2>
            <div className="mt-4 flex flex-wrap gap-1 border-b pb-4">
              {tabs.map((t) => (
                <button
                  key={t.k}
                  onClick={() => setKind(t.k)}
                  className={cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors",
                    kind === t.k && "bg-accent font-semibold text-accent-foreground",
                  )}
                >
                  <t.icon className="h-4 w-4" /> {t.label}
                </button>
              ))}
            </div>

            <div className="mt-4">
              {kind === "link" ? (
                <input
                  type="url"
                  inputMode="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submit()}
                  placeholder="https://example.com/article"
                  className="w-full rounded-xl bg-muted px-4 py-4 text-base outline-none ring-ring placeholder:text-muted-foreground/70 focus:ring-2"
                />
              ) : kind === "image" ? (
                <div className="space-y-3">
                  {image ? (
                    <div className="relative overflow-hidden rounded-xl border bg-muted">
                      <img src={image} alt="Selected" className="mx-auto max-h-72 object-contain" />
                      <button
                        onClick={() => setImage(null)}
                        className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-card shadow"
                        aria-label="Remove image"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => fileRef.current?.click()}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        onFile(e.dataTransfer.files[0]);
                      }}
                      className="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed bg-muted px-4 py-10 text-sm text-muted-foreground transition-colors hover:border-ring"
                    >
                      <Upload className="h-6 w-6" />
                      Tap to upload a screenshot or photo
                    </button>
                  )}
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
                  <input
                    value={text}
                    onChange={(e) => setText(e.target.value.slice(0, 500))}
                    placeholder="Optional: what does the image claim?"
                    className="w-full rounded-xl bg-muted px-4 py-3 text-sm outline-none ring-ring focus:ring-2"
                  />
                </div>
              ) : (
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value.slice(0, MAX))}
                  placeholder="Paste a claim, headline, or something you’ve heard…"
                  rows={5}
                  className="w-full resize-y rounded-xl bg-muted px-4 py-3 text-lg outline-none ring-ring placeholder:text-muted-foreground/70 focus:ring-2"
                />
              )}
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <span className="text-xs text-muted-foreground">
                {kind === "text" ? `${text.length.toLocaleString()} / ${MAX.toLocaleString()}` : ""}
              </span>
              <button
                onClick={submit}
                disabled={!canSubmit}
                className="flex items-center gap-2 rounded-xl bg-primary px-5 py-3 font-semibold text-primary-foreground transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-45"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Checking…
                  </>
                ) : (
                  <>
                    Check this {kind === "link" ? "link" : kind === "image" ? "image" : "claim"} <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
            {loading && (
              <p className="mt-3 text-xs text-muted-foreground">Weighing the evidence — this usually takes 10–30 seconds.</p>
            )}
          </div>
          <p className="mt-3 flex gap-2 px-1 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4 shrink-0" /> Checks are saved in the public archive. Leave personal details out.
          </p>
        </div>
      </section>

      <section className="mt-16 grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl bg-accent/60 p-6">
          <h2 className="text-3xl font-semibold leading-tight">Don’t just take our word for it.</h2>
          <p className="mt-3 text-muted-foreground">
            Every check is a starting point. Follow the sources and see how the evidence adds up.
          </p>
          <ol className="mt-6 space-y-5">
            {[
              ["Share what you found", "Drop in a claim, link, or image."],
              ["Look beyond the headline", "AI examines the evidence."],
              ["Make an informed call", "Read the context. Open the sources."],
            ].map(([t, d], i) => (
              <li key={t} className="flex gap-3">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full border text-[10px] text-muted-foreground">
                  0{i + 1}
                </span>
                <div>
                  <p className="font-semibold">{t}</p>
                  <p className="text-sm text-muted-foreground">{d}</p>
                </div>
              </li>
            ))}
          </ol>
          <Link to="/ask" className="mt-6 flex items-center justify-between border-t pt-4 text-sm font-semibold">
            Have a bigger question? Ask AI <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="flex items-start gap-3 self-end rounded-2xl border p-6 text-sm text-muted-foreground">
          <Search className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            <span className="font-semibold text-foreground">Evidence, with room for nuance.</span> Results distinguish true,
            false, misleading, and unverified claims. AI can make mistakes; strong sources matter.
          </p>
        </div>
      </section>
    </div>
  );
}
