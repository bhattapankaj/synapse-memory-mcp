import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="relative z-0 mx-auto mt-24 w-[min(1180px,92vw)] pb-12">
      <div className="glass flex flex-col items-center justify-between gap-6 px-6 py-8 sm:flex-row">
        <div>
          <p className="text-lg font-semibold">
            Synapse<span className="text-ink-faint">, memory for every AI</span>
          </p>
          <p className="mt-1 text-sm text-ink-soft">
            A local-first memory layer over the Model Context Protocol.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/dashboard" className="btn-ghost text-sm">
            Dashboard
          </Link>
          <Link href="/playground" className="btn-ghost text-sm">
            Playground
          </Link>
          <Link href="/connect" className="btn-primary text-sm">
            Connect a client
          </Link>
        </div>
      </div>
      <p className="mt-6 text-center text-xs text-ink-faint">
        Built for Hackverse X. Global Tech Innovation 2026. Track: LLM with MCP.
      </p>
    </footer>
  );
}
