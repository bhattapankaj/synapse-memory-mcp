"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MemoryGraph } from "@/components/memory-graph";
import { SiteFooter } from "@/components/site-footer";
import { ShowcaseNotice } from "@/components/ui/showcase-notice";
import { IconStore, IconSearch, IconTrash } from "@/components/ui/icons";
import type { MemoryHit, MemoryRecord, MemoryStats } from "@/lib/memory/types";

export default function DashboardPage() {
  const [memories, setMemories] = useState<MemoryRecord[]>([]);
  const [stats, setStats] = useState<MemoryStats | null>(null);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<MemoryHit[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [saving, setSaving] = useState(false);
  const [graphKey, setGraphKey] = useState(0);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const [m, s] = await Promise.all([
      fetch("/api/memories").then((r) => r.json()),
      fetch("/api/stats").then((r) => r.json()),
    ]);
    setMemories(m.memories ?? []);
    setStats(s);
    setLoading(false);
    setGraphKey((k) => k + 1);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!query.trim()) {
      setHits(null);
      return;
    }
    setSearching(true);
    const t = setTimeout(async () => {
      const r = await fetch(`/api/search?q=${encodeURIComponent(query)}`).then(
        (x) => x.json(),
      );
      setHits(r.hits ?? []);
      setSearching(false);
    }, 280);
    return () => clearTimeout(t);
  }, [query]);

  async function addMemory(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setSaving(true);
    await fetch("/api/memories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        content,
        tags: tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        source: "dashboard",
      }),
    });
    setContent("");
    setTags("");
    setSaving(false);
    await refresh();
  }

  async function remove(id: string) {
    setMemories((m) => m.filter((x) => x.id !== id));
    await fetch(`/api/memories/${id}`, { method: "DELETE" });
    await refresh();
  }

  const seed = useMemo(
    () => [
      "I prefer TypeScript over JavaScript for new projects.",
      "My product launches on the last Friday of each quarter.",
      "I am vegetarian and allergic to peanuts.",
      "Our design system uses a warm violet to coral gradient palette.",
    ],
    [],
  );

  async function seedMemories() {
    setSaving(true);
    for (const content of seed) {
      await fetch("/api/memories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, source: "seed" }),
      });
    }
    setSaving(false);
    await refresh();
  }

  const list = hits
    ? hits.map((h) => ({ ...h, score: h.score }))
    : memories.map((m) => ({ ...m, score: undefined as number | undefined }));

  return (
    <>
      <section className="mx-auto w-[min(1180px,92vw)] pt-12">
        <div className="flex flex-col gap-2">
          <span className="text-sm font-semibold uppercase tracking-[0.2em] text-ink-faint">
            Console
          </span>
          <h1 className="text-4xl font-bold">Memory dashboard</h1>
          <p className="max-w-2xl text-ink-soft">
            Inspect, search, and curate everything your AI remembers. Every
            entry here is the same store your MCP clients read and write.
          </p>
        </div>

        <ShowcaseNotice />

        {/* Stats */}
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Total memories" value={stats?.total ?? 0} />
          <StatCard label="Distinct sources" value={stats?.sources.length ?? 0} />
          <StatCard
            label="Embedding"
            value={stats?.embeddingProvider ?? "local"}
            text
          />
          <StatCard label="Vector dim" value={stats?.embeddingDim ?? 384} />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          {/* Left column */}
          <div className="flex flex-col gap-6">
            <form onSubmit={addMemory} className="glass p-6">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <IconStore className="h-5 w-5 text-cyan-grade" />
                Add a memory
              </div>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="e.g. I prefer concise answers and a clean light UI."
                rows={3}
                className="mt-4 w-full resize-none rounded-2xl border border-black/10 bg-white/70 px-4 py-3 text-sm text-ink outline-none transition-colors placeholder:text-ink-faint focus:border-violet-grade/60"
              />
              <input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="tags, comma separated (optional)"
                className="mt-3 w-full rounded-2xl border border-black/10 bg-white/70 px-4 py-3 text-sm text-ink outline-none transition-colors placeholder:text-ink-faint focus:border-violet-grade/60"
              />
              <div className="mt-4 flex items-center gap-3">
                <button
                  type="submit"
                  disabled={saving || !content.trim()}
                  className="btn-primary text-sm disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Remember"}
                </button>
                {memories.length === 0 && (
                  <button
                    type="button"
                    onClick={seedMemories}
                    className="btn-ghost text-sm"
                    disabled={saving}
                  >
                    Seed sample memories
                  </button>
                )}
              </div>
            </form>

            <div className="glass p-6">
              <div className="relative">
                <IconSearch className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-faint" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Semantic search, try a question not keywords"
                  className="w-full rounded-2xl border border-black/10 bg-white/70 py-3 pl-12 pr-4 text-sm text-ink outline-none transition-colors placeholder:text-ink-faint focus:border-cyan-grade/60"
                />
              </div>

              <div className="mt-5 flex items-center justify-between text-xs text-ink-faint">
                <span>
                  {hits
                    ? `${hits.length} semantic match${hits.length === 1 ? "" : "es"}`
                    : `${memories.length} memories`}
                </span>
                {searching && <span className="text-cyan-grade">searching...</span>}
              </div>

              <div className="scrollbar-thin mt-3 max-h-[440px] space-y-3 overflow-y-auto pr-1">
                {loading && (
                  <p className="py-8 text-center text-sm text-ink-soft">
                    Loading memories...
                  </p>
                )}
                {!loading && list.length === 0 && (
                  <p className="py-8 text-center text-sm text-ink-soft">
                    {hits
                      ? "No semantic matches. Try rephrasing."
                      : "No memories yet. Add one above."}
                  </p>
                )}
                <AnimatePresence initial={false}>
                  {list.map((m) => (
                    <motion.div
                      key={m.id}
                      layout
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -16 }}
                      className="group rounded-2xl border border-black/10 bg-black/[0.025] p-4 transition-colors hover:border-violet-grade/40"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm leading-relaxed text-ink">
                          {m.content}
                        </p>
                        <button
                          onClick={() => remove(m.id)}
                          aria-label="Delete memory"
                          className="shrink-0 rounded-lg p-1.5 text-ink-faint opacity-0 transition-all hover:bg-black/[0.04] hover:text-red-500 group-hover:opacity-100"
                        >
                          <IconTrash className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className="chip">{m.source}</span>
                        {m.tags.map((t) => (
                          <span key={t} className="chip">
                            {t}
                          </span>
                        ))}
                        {typeof m.score === "number" && (
                          <span className="chip border-cyan-grade/40 text-cyan-grade">
                            {Math.round(m.score * 100)}% match
                          </span>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Right column: graph */}
          <div className="glass flex flex-col p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Knowledge graph</h2>
                <p className="text-xs text-ink-soft">
                  Nodes are memories; links connect semantically related ones.
                </p>
              </div>
              <span className="chip">live</span>
            </div>
            <div className="mt-2 flex-1">
              <MemoryGraph refreshKey={graphKey} />
            </div>
            {stats && stats.sources.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {stats.sources.slice(0, 6).map((s) => (
                  <span key={s.source} className="chip">
                    {s.source} · {s.count}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}

function StatCard({
  label,
  value,
  text = false,
}: {
  label: string;
  value: number | string;
  text?: boolean;
}) {
  return (
    <div className="glass px-5 py-4">
      <div
        className={`font-extrabold gradient-text ${
          text ? "text-2xl capitalize" : "text-3xl"
        }`}
      >
        {value}
      </div>
      <div className="mt-1 text-xs text-ink-soft">{label}</div>
    </div>
  );
}
