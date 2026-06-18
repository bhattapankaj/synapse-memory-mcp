import { CopyButton } from "@/components/ui/copy-button";
import { Reveal } from "@/components/ui/reveal";
import { SiteFooter } from "@/components/site-footer";
import { IconPlug, IconLink, IconBolt } from "@/components/ui/icons";

export const dynamic = "force-dynamic";

export default function ConnectPage() {
  const repoPath = process.cwd();
  const stdioEntry = `${repoPath}/mcp/stdio.ts`;

  const stdioConfig = JSON.stringify(
    {
      mcpServers: {
        synapse: {
          command: "npx",
          args: ["-y", "tsx", stdioEntry],
        },
      },
    },
    null,
    2,
  );

  const httpConfig = JSON.stringify(
    {
      mcpServers: {
        synapse: {
          url: "http://localhost:3000/api/mcp",
        },
      },
    },
    null,
    2,
  );

  const curlExample = `curl -s -X POST http://localhost:3000/api/mcp \\
  -H 'Content-Type: application/json' \\
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call",
       "params":{"name":"remember",
                 "arguments":{"content":"I prefer dark mode"}}}'`;

  return (
    <>
      <section className="mx-auto w-[min(1080px,92vw)] pt-12">
        <Reveal>
          <span className="text-sm font-semibold uppercase tracking-[0.2em] text-ink-faint">
            Integrate
          </span>
          <h1 className="mt-2 text-4xl font-bold">Connect a client</h1>
          <p className="mt-3 max-w-2xl text-ink-soft">
            Synapse speaks the Model Context Protocol over two transports. Use
            stdio for local clients like Cursor and Claude Desktop, or HTTP for
            anything that can reach a URL.
          </p>
        </Reveal>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          <Reveal>
            <ConfigCard
              icon={<IconPlug className="h-5 w-5" />}
              eyebrow="Recommended for Cursor / Claude Desktop"
              title="Local stdio"
              body="Add this to your client's MCP config (for Cursor, .cursor/mcp.json). It spawns the Synapse server as a child process."
              code={stdioConfig}
            />
          </Reveal>
          <Reveal delay={0.1}>
            <ConfigCard
              icon={<IconLink className="h-5 w-5" />}
              eyebrow="For remote / URL-based clients"
              title="Streamable HTTP"
              body="Start the app (npm run dev) and point an HTTP-capable MCP client at the endpoint below."
              code={httpConfig}
            />
          </Reveal>
        </div>

        <Reveal>
          <div className="glass mt-6 p-6">
            <div className="flex items-center gap-2 text-sm font-semibold">
              <IconBolt className="h-5 w-5 text-cyan-grade" />
              Verify it works
            </div>
            <p className="mt-2 text-sm text-ink-soft">
              Call a tool over HTTP without any client to confirm the server is
              live:
            </p>
            <CodeBlock code={curlExample} />
          </div>
        </Reveal>

        <Reveal>
          <div className="glass mt-6 p-6">
            <h2 className="text-lg font-semibold">Available tools</h2>
            <p className="mt-1 text-sm text-ink-soft">
              The same six tools are exposed over both transports and to the
              in-app agent.
            </p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {[
                ["remember", "Store a memory durably."],
                ["recall", "Semantic search over memories."],
                ["build_context", "Synthesize an injectable context block."],
                ["get_related", "Find memories related to one id."],
                ["list_memories", "List the most recent memories."],
                ["forget", "Delete a memory by id."],
              ].map(([name, desc]) => (
                <div
                  key={name}
                  className="rounded-2xl border border-black/10 bg-black/[0.025] p-4"
                >
                  <p className="font-mono text-sm text-ink">
                    {name}
                    <span className="text-ink-faint">()</span>
                  </p>
                  <p className="mt-1 text-xs text-ink-soft">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        <Reveal>
          <div className="glass mt-6 p-6">
            <h2 className="text-lg font-semibold">First-run note</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-soft">
              On first use, Synapse downloads a small on-device embedding model
              (all-MiniLM-L6-v2, ~90MB) and caches it. After that, semantic
              memory runs fully offline with no API key. Memories are stored in
              a local SQLite database at{" "}
              <code className="rounded bg-cyan-grade/10 px-1.5 py-0.5 text-cyan-grade">
                data/synapse.db
              </code>
              .
            </p>
          </div>
        </Reveal>
      </section>

      <SiteFooter />
    </>
  );
}

function ConfigCard({
  icon,
  eyebrow,
  title,
  body,
  code,
}: {
  icon: React.ReactNode;
  eyebrow: string;
  title: string;
  body: string;
  code: string;
}) {
  return (
    <div className="glass h-full p-6">
      <div className="flex items-start justify-between">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-indigo-grade to-cyan-grade text-white">
          {icon}
        </span>
        <CopyButton value={code} />
      </div>
      <p className="mt-5 text-xs font-medium uppercase tracking-wider text-ink-faint">
        {eyebrow}
      </p>
      <h3 className="mt-1 text-xl font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-ink-soft">{body}</p>
      <CodeBlock code={code} />
    </div>
  );
}

function CodeBlock({ code }: { code: string }) {
  return (
    <pre className="scrollbar-thin mt-4 overflow-x-auto rounded-2xl border border-black/10 bg-ink/[0.04] p-4 text-xs leading-relaxed text-ink-soft">
      <code>{code}</code>
    </pre>
  );
}
