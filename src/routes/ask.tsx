import { createFileRoute } from "@tanstack/react-router";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { ArrowUp, Mic, Square, Trash2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/ask")({
  head: () => ({
    meta: [
      { title: "Ask AI — Check It AI" },
      { name: "description", content: "Go deeper than a headline. Ask for an explanation, a second perspective, or the evidence behind a claim." },
      { property: "og:title", content: "Ask AI — Check It AI" },
      { property: "og:description", content: "Ask anything and follow the evidence." },
    ],
  }),
  component: AskPage,
});

const suggestions = [
  "What are the latest developments in renewable energy?",
  "How can I spot a misleading statistic?",
  "What makes a source trustworthy?",
];

function AskPage() {
  const [input, setInput] = useState("");
  const [listening, setListening] = useState(false);
  const transport = useMemo(() => new DefaultChatTransport({ api: "/api/chat" }), []);
  const { messages, sendMessage, status, stop, setMessages, error } = useChat({
    transport,
    onError: (e) => {
      let msg = e.message;
      try {
        msg = JSON.parse(e.message).error ?? msg;
      } catch {
        /* plain text */
      }
      toast.error(msg || "Something went wrong.");
    },
  });
  const bottomRef = useRef<HTMLDivElement>(null);
  const busy = status === "submitted" || status === "streaming";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, status]);

  function send(text: string) {
    const t = text.trim();
    if (!t || busy) return;
    sendMessage({ text: t });
    setInput("");
  }

  function voice() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const W = window as any;
    const SR = W.SpeechRecognition || W.webkitSpeechRecognition;
    if (!SR) { toast.error("Voice input is not supported in this browser."); return; }
    const rec = new SR();
    rec.lang = navigator.language || "en-US";
    rec.interimResults = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    rec.onresult = (e: any) => setInput((p) => (p ? p + " " : "") + e.results[0][0].transcript);
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    setListening(true);
    rec.start();
  }

  return (
    <div className="fade-up mx-auto max-w-2xl pt-8">
      {messages.length === 0 ? (
        <div className="text-center">
          <h1 className="text-4xl font-semibold leading-tight">Ask, and follow the evidence.</h1>
          <p className="mx-auto mt-4 max-w-md text-muted-foreground">
            Go deeper than a headline. Ask for an explanation, a second perspective, or the evidence behind a claim.
          </p>
          <div className="mt-8 space-y-2 text-left">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="flex w-full items-center justify-between gap-3 rounded-xl border bg-card p-4 text-left transition-colors hover:border-ring"
              >
                {s} <ArrowUp className="h-4 w-4 shrink-0" />
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-end">
            <button
              onClick={() => {
                stop();
                setMessages([]);
              }}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <Trash2 className="h-3.5 w-3.5" /> New chat
            </button>
          </div>
          {messages.map((m) => (
            <div key={m.id} className={cn("flex", m.role === "user" && "justify-end")}>
              <div
                className={cn(
                  "max-w-[88%] whitespace-pre-wrap break-words leading-relaxed",
                  m.role === "user" ? "rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-primary-foreground" : "text-foreground",
                )}
              >
                {m.parts.map((p, i) => (p.type === "text" ? <span key={i}>{p.text.replace(/\*\*/g, "")}</span> : null))}
              </div>
            </div>
          ))}
          {status === "submitted" && (
            <div className="flex gap-1.5 py-2">
              {[0, 1, 2].map((i) => (
                <span key={i} className="h-2 w-2 animate-bounce rounded-full bg-leaf" style={{ animationDelay: `${i * 0.15}s` }} />
              ))}
            </div>
          )}
          {error && status === "error" && <p className="text-sm text-destructive">The reply couldn't be completed. Try sending again.</p>}
        </div>
      )}
      <div ref={bottomRef} className="h-4" />

      <div className="sticky bottom-24 mt-6 md:bottom-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="rounded-2xl border bg-card p-3 shadow-lg"
        >
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value.slice(0, 4000))}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            rows={2}
            placeholder="Ask anything. Follow the evidence."
            className="w-full resize-none bg-transparent px-1 text-lg outline-none placeholder:text-muted-foreground/70"
          />
          <div className="mt-1 flex items-center justify-between gap-2">
            <span className="text-[11px] text-muted-foreground">AI can make mistakes. Check the sources.</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={voice}
                className={cn("grid h-10 w-10 place-items-center rounded-xl", listening && "bg-accent text-leaf")}
                aria-label="Voice input"
              >
                <Mic className="h-5 w-5" />
              </button>
              {busy ? (
                <button type="button" onClick={stop} className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground" aria-label="Stop">
                  <Square className="h-4 w-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!input.trim()}
                  className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground transition-opacity disabled:opacity-40"
                  aria-label="Send"
                >
                  <ArrowUp className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
