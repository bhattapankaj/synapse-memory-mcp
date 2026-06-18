"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SiteFooter } from "@/components/site-footer";
import { ShowcaseNotice } from "@/components/ui/showcase-notice";
import {
  IconStore,
  IconSearch,
  IconContext,
  IconList,
  IconTrash,
  IconGraph,
  IconArrow,
  IconSpark,
} from "@/components/ui/icons";

interface ToolEvent {
  name: string;
  args: Record<string, unknown>;
  result: string;
}
interface Msg {
  role: "user" | "assistant";
  content: string;
  toolEvents?: ToolEvent[];
}

const toolIcon: Record<string, typeof IconStore> = {
  remember: IconStore,
  recall: IconSearch,
  build_context: IconContext,
  list_memories: IconList,
  forget: IconTrash,
  get_related: IconGraph,
};

const suggestions = [
  "I prefer a clean light UI and the Poppins font",
  "Remember that my main project is called Synapse",
  "What UI preferences do I have?",
  "What do you know about my projects?",
];

export default function PlaygroundPage() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<"live" | "demo">("demo");
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((c) => setMode(c.liveAgent ? "live" : "demo"))
      .catch(() => {});
    const saved = localStorage.getItem("synapse_api_key");
    if (saved) setApiKey(saved);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, busy]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || busy) return;
    const next: Msg[] = [...messages, { role: "user", content: trimmed }];
    setMessages(next);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: next.map((m) => ({ role: m.role, content: m.content })),
          apiKey: apiKey || undefined,
        }),
      });
      const data = await res.json();
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: data.reply ?? data.error ?? "Something went wrong.",
          toolEvents: data.toolEvents ?? [],
        },
      ]);
      if (data.mode) setMode(data.mode);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Network error. Is the server running?" },
      ]);
    } finally {
      setBusy(false);
    }
  }

  function saveKey(v: string) {
    setApiKey(v);
    if (v) localStorage.setItem("synapse_api_key", v);
    else localStorage.removeItem("synapse_api_key");
  }

  return (
    <>
      <section className="mx-auto w-[min(1080px,92vw)] pt-12">
        <div className="flex flex-col gap-2">
          <span className="text-sm font-semibold uppercase tracking-[0.2em] text-ink-faint">
            Playground
          </span>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-4xl font-bold">Watch it remember</h1>
            <span
              className={`chip ${
                mode === "live"
                  ? "border-teal-grade/50 text-teal-grade"
                  : "border-violet-grade/50 text-violet-grade"
              }`}
            >
              {mode === "live" ? "Live model" : "Demo mode"}
            </span>
          </div>
          <p className="max-w-2xl text-ink-soft">
            Tell the agent something about yourself, then ask about it, even
            after a refresh. Every tool call it makes against Synapse is shown
            inline. Memories persist in the shared store and appear on the{" "}
            <a href="/dashboard" className="text-cyan-grade underline-offset-4 hover:underline">
              dashboard
            </a>
            .
          </p>
        </div>

        <ShowcaseNotice />

        <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_300px]">
          {/* Chat */}
          <div className="glass flex h-[560px] flex-col p-5">
            <div
              ref={scrollRef}
              className="scrollbar-thin flex-1 space-y-5 overflow-y-auto pr-2"
            >
              {messages.length === 0 && (
                <div className="grid h-full place-items-center text-center">
                  <div>
                    <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-indigo-grade to-cyan-grade text-white">
                      <IconSpark className="h-6 w-6" />
                    </span>
                    <p className="mt-4 text-ink-soft">
                      Start by teaching me a fact about you.
                    </p>
                  </div>
                </div>
              )}

              <AnimatePresence initial={false}>
                {messages.map((m, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={m.role === "user" ? "flex justify-end" : ""}
                  >
                    <div className={m.role === "user" ? "max-w-[80%]" : "w-full"}>
                      {m.toolEvents && m.toolEvents.length > 0 && (
                        <div className="mb-2 flex flex-wrap gap-2">
                          {m.toolEvents.map((t, j) => {
                            const Icon = toolIcon[t.name] ?? IconSpark;
                            return (
                              <span
                                key={j}
                                className="chip border-cyan-grade/40 text-cyan-grade"
                                title={t.result}
                              >
                                <Icon className="h-3.5 w-3.5" />
                                {t.name}
                              </span>
                            );
                          })}
                        </div>
                      )}
                      <div
                        className={
                          m.role === "user"
                            ? "rounded-2xl rounded-br-md bg-gradient-to-br from-indigo-grade to-violet-grade px-4 py-3 text-sm text-white"
                            : "rounded-2xl rounded-bl-md border border-black/10 bg-black/[0.025] px-4 py-3 text-sm leading-relaxed text-ink"
                        }
                      >
                        <p className="whitespace-pre-wrap">{m.content}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>

              {busy && (
                <div className="flex items-center gap-2 text-sm text-ink-soft">
                  <Dots /> thinking and recalling...
                </div>
              )}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              className="mt-4 flex items-center gap-2"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Tell me something, or ask what I know..."
                className="flex-1 rounded-full border border-black/10 bg-white/70 px-5 py-3 text-sm text-ink outline-none transition-colors placeholder:text-ink-faint focus:border-violet-grade/60"
              />
              <button
                type="submit"
                disabled={busy || !input.trim()}
                className="btn-primary px-4 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Send"
              >
                <IconArrow className="h-5 w-5" />
              </button>
            </form>
          </div>

          {/* Side panel */}
          <div className="flex flex-col gap-6">
            <div className="glass p-5">
              <h3 className="text-sm font-semibold">Try these</h3>
              <div className="mt-3 flex flex-col gap-2">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    disabled={busy}
                    className="rounded-xl border border-black/10 bg-black/[0.025] px-3 py-2 text-left text-xs text-ink-soft transition-colors hover:border-cyan-grade/40 hover:text-ink disabled:opacity-50"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="glass p-5">
              <h3 className="text-sm font-semibold">Live model (optional)</h3>
              <p className="mt-2 text-xs text-ink-soft">
                Demo mode needs no key. Paste an OpenAI-compatible key to let a
                real LLM decide when to call the memory tools.
              </p>
              <div className="mt-3 flex items-center gap-2">
                <input
                  type={showKey ? "text" : "password"}
                  value={apiKey}
                  onChange={(e) => saveKey(e.target.value)}
                  placeholder="sk-..."
                  className="flex-1 rounded-xl border border-black/10 bg-white/70 px-3 py-2 text-xs text-ink outline-none focus:border-violet-grade/60"
                />
                <button
                  onClick={() => setShowKey((v) => !v)}
                  className="btn-ghost px-3 py-2 text-xs"
                  type="button"
                >
                  {showKey ? "Hide" : "Show"}
                </button>
              </div>
              <p className="mt-2 text-[0.65rem] text-ink-faint">
                Stored only in your browser and sent directly to your endpoint.
              </p>
            </div>

            {messages.length > 0 && (
              <button
                onClick={() => setMessages([])}
                className="btn-ghost text-xs"
              >
                Clear conversation (memories persist)
              </button>
            )}
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}

function Dots() {
  return (
    <span className="inline-flex gap-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-cyan-grade"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </span>
  );
}
