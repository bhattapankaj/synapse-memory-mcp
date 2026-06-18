"use client";

import { useEffect, useState } from "react";
import { CopyButton } from "@/components/ui/copy-button";
import { IconBolt } from "@/components/ui/icons";

const RUN_COMMAND =
  "git clone https://github.com/bhattapankaj/synapse-memory-mcp.git && cd synapse-memory-mcp && npm install && npm run dev";

/**
 * Shown only on the hosted showcase (serverless), where the on-device
 * embedding engine cannot run. Explains how to get the full interactive
 * experience locally instead of surfacing raw runtime errors.
 */
export function ShowcaseNotice() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/config")
      .then((r) => r.json())
      .then((c) => {
        if (!cancelled) setShow(c.memoryReady === false);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (!show) return null;

  return (
    <div className="glass ring-gradient mt-6 overflow-hidden p-6">
      <div className="flex items-start gap-4">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-indigo-grade to-coral-grade text-white">
          <IconBolt className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h3 className="text-base font-semibold">Showcase mode</h3>
          <p className="mt-1 text-sm leading-relaxed text-ink-soft">
            You are viewing the hosted showcase. Synapse runs its memory engine
            with private, on-device embeddings, which live outside a serverless
            host. To try the full interactive playground, dashboard, and connect
            your own AI client over MCP, run it locally in one command:
          </p>
          <div className="mt-4 flex items-center gap-2">
            <code className="scrollbar-thin block w-full overflow-x-auto rounded-xl border border-black/10 bg-ink/[0.04] px-3 py-2 font-mono text-xs text-ink-soft">
              {RUN_COMMAND}
            </code>
            <CopyButton value={RUN_COMMAND} />
          </div>
          <p className="mt-3 text-xs text-ink-faint">
            Then open http://localhost:3000. Everything below is fully functional
            there, with persistent memory and live MCP tool calls.
          </p>
        </div>
      </div>
    </div>
  );
}
