import Link from "next/link";
import { NeuralHero } from "@/components/neural-hero";
import { Reveal } from "@/components/ui/reveal";
import { Counter } from "@/components/ui/counter";
import { SiteFooter } from "@/components/site-footer";
import {
  IconStore,
  IconSearch,
  IconList,
  IconTrash,
  IconGraph,
  IconContext,
  IconShield,
  IconBolt,
  IconLink,
  IconArrow,
  IconPlug,
} from "@/components/ui/icons";

const tools = [
  { name: "remember", icon: IconStore, desc: "Durably store any fact, preference, or decision." },
  { name: "recall", icon: IconSearch, desc: "Semantic search across everything the AI has learned." },
  { name: "build_context", icon: IconContext, desc: "Synthesize a ready-to-inject context block." },
  { name: "get_related", icon: IconGraph, desc: "Traverse the semantic graph around a memory." },
  { name: "list_memories", icon: IconList, desc: "Browse the most recent memories, newest first." },
  { name: "forget", icon: IconTrash, desc: "Permanently delete a memory by id." },
];

const steps = [
  {
    n: "01",
    title: "Connect any MCP client",
    body: "Point Cursor, Claude Desktop, or your own agent at Synapse over stdio or HTTP. No SDK lock-in.",
    icon: IconPlug,
  },
  {
    n: "02",
    title: "It remembers as you work",
    body: "Synapse stores facts, preferences, and decisions as on-device vector embeddings, kept private.",
    icon: IconStore,
  },
  {
    n: "03",
    title: "It recalls across sessions",
    body: "Every future conversation starts with relevant memory recalled semantically, in any tool.",
    icon: IconSearch,
  },
];

const differentiators = [
  { icon: IconLink, title: "Open protocol", body: "Built on MCP, so memory is portable across every compatible client, not locked to one vendor." },
  { icon: IconShield, title: "Local-first & private", body: "Runs on your machine with an embedded vector store. Your memories never have to leave your device." },
  { icon: IconBolt, title: "Zero-key by default", body: "On-device embeddings mean semantic recall works with no API key, no signup, no cloud cost." },
];

export default function Home() {
  return (
    <>
      <section className="relative mx-auto w-[min(1180px,92vw)] pt-16 sm:pt-24">
        <div className="absolute inset-0 -z-10 overflow-hidden rounded-[2.5rem]">
          <NeuralHero className="h-full w-full opacity-70" />
        </div>

        <Reveal>
          <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
            <span className="chip ring-gradient">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-grade" />
              Model Context Protocol · Memory layer
            </span>
            <h1 className="mt-6 text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-7xl">
              Give every AI a<br />
              <span className="gradient-text">lasting memory</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-ink-soft">
              Synapse is a local-first memory layer exposed over MCP. Any AI
              client gains persistent, semantic, cross-tool recall, so it
              never forgets what matters to you.
            </p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <Link href="/playground" className="btn-primary">
                Try the live playground
                <IconArrow className="h-4 w-4" />
              </Link>
              <Link href="/connect" className="btn-ghost">
                Connect your client
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-2 text-xs">
              <span className="chip">Local-first</span>
              <span className="chip">No API key required</span>
              <span className="chip">On-device embeddings</span>
              <span className="chip">MCP-native</span>
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.15}>
          <div className="mx-auto mt-16 grid max-w-3xl grid-cols-3 gap-4">
            <Stat value={<Counter to={6} />} label="MCP tools" />
            <Stat value={<><Counter to={384} /></>} label="Vector dimensions" />
            <Stat value={<Counter to={100} suffix="%" />} label="Runs on-device" />
          </div>
        </Reveal>
      </section>

      {/* Problem */}
      <section className="mx-auto mt-28 w-[min(1180px,92vw)]">
        <Reveal>
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ink-faint">
                The problem
              </p>
              <h2 className="mt-3 text-4xl font-bold leading-tight">
                Today&apos;s AI is{" "}
                <span className="gradient-text">brilliant but amnesiac</span>
              </h2>
              <p className="mt-5 text-ink-soft">
                Every chat starts from zero. Context is trapped inside one tool.
                You repeat your preferences, your stack, your decisions, over
                and over. The intelligence is there; the continuity is not.
              </p>
            </div>
            <div className="grid gap-4">
              {[
                "\"As I mentioned before...\", but it never saw before.",
                "Switching from one assistant to another resets everything.",
                "Personal context lives in your head, not your tools.",
              ].map((line, i) => (
                <div key={i} className="glass glass-hover px-5 py-4 text-ink-soft">
                  {line}
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </section>

      {/* How it works */}
      <section className="mx-auto mt-28 w-[min(1180px,92vw)]">
        <Reveal>
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ink-faint">
              How it works
            </p>
            <h2 className="mt-3 text-4xl font-bold">Three moves to total recall</h2>
          </div>
        </Reveal>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {steps.map((s, i) => (
            <Reveal key={s.n} delay={i * 0.12}>
              <div className="glass glass-hover h-full p-7">
                <div className="flex items-center justify-between">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-indigo-grade to-cyan-grade text-white">
                    <s.icon className="h-5 w-5" />
                  </span>
                  <span className="text-3xl font-extrabold text-ink-faint/50">
                    {s.n}
                  </span>
                </div>
                <h3 className="mt-6 text-xl font-semibold">{s.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                  {s.body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* MCP tools */}
      <section className="mx-auto mt-28 w-[min(1180px,92vw)]">
        <Reveal>
          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ink-faint">
                The MCP surface
              </p>
              <h2 className="mt-3 text-4xl font-bold">
                Six tools your AI can call
              </h2>
            </div>
            <Link href="/connect" className="btn-ghost text-sm">
              See the schema
              <IconArrow className="h-4 w-4" />
            </Link>
          </div>
        </Reveal>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {tools.map((t, i) => (
            <Reveal key={t.name} delay={i * 0.08}>
              <div className="glass glass-hover group h-full p-6">
                <span className="grid h-11 w-11 place-items-center rounded-xl border border-black/10 bg-cyan-grade/10 text-cyan-grade transition-colors group-hover:text-fuchsia-grade">
                  <t.icon className="h-5 w-5" />
                </span>
                <p className="mt-5 font-mono text-sm text-ink">
                  {t.name}
                  <span className="text-ink-faint">()</span>
                </p>
                <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                  {t.desc}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Differentiators */}
      <section className="mx-auto mt-28 w-[min(1180px,92vw)]">
        <Reveal>
          <div className="text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-ink-faint">
              Why Synapse
            </p>
            <h2 className="mt-3 text-4xl font-bold">
              Memory that <span className="gradient-text">belongs to you</span>
            </h2>
          </div>
        </Reveal>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {differentiators.map((d, i) => (
            <Reveal key={d.title} delay={i * 0.12}>
              <div className="glass glass-hover h-full p-7">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-cyan-grade/10 text-cyan-grade">
                  <d.icon className="h-5 w-5" />
                </span>
                <h3 className="mt-6 text-xl font-semibold">{d.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                  {d.body}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto mt-28 w-[min(1180px,92vw)]">
        <Reveal>
          <div className="glass relative overflow-hidden p-10 text-center sm:p-16">
            <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-indigo-grade/30 blur-3xl" />
            <div className="absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-cyan-grade/30 blur-3xl" />
            <h2 className="relative text-4xl font-bold sm:text-5xl">
              See it remember, live
            </h2>
            <p className="relative mx-auto mt-4 max-w-xl text-ink-soft">
              Teach the playground something about yourself, refresh, and watch
              it recall, with no setup, no key, all in your browser.
            </p>
            <div className="relative mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/playground" className="btn-primary">
                Open the playground
                <IconArrow className="h-4 w-4" />
              </Link>
              <Link href="/dashboard" className="btn-ghost">
                Explore the dashboard
              </Link>
            </div>
          </div>
        </Reveal>
      </section>

      <SiteFooter />
    </>
  );
}

function Stat({ value, label }: { value: React.ReactNode; label: string }) {
  return (
    <div className="glass px-3 py-5 text-center">
      <div className="text-3xl font-extrabold gradient-text">{value}</div>
      <div className="mt-1 text-xs text-ink-soft">{label}</div>
    </div>
  );
}
