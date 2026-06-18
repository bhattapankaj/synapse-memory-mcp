import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { getStore } from "../memory/store";
import type { MemoryRecord } from "../memory/types";
import { toolSpecs } from "./tools";

export const SYNAPSE_SERVER_INFO = {
  name: "synapse-memory",
  version: "0.1.0",
} as const;

const INSTRUCTIONS = `Synapse is a persistent, semantic memory layer.

Use it to give yourself long-term, cross-session memory:
- Call "remember" to durably store any fact, preference, decision, or context worth recalling later.
- Call "recall" at the start of a task to retrieve relevant past memories before answering.
- Call "build_context" to get a ready-to-inject context block for the current request.
Prefer recalling before answering when a user references prior conversations or personal context.`;

function formatRecord(r: MemoryRecord): string {
  const tags = r.tags.length ? ` [${r.tags.join(", ")}]` : "";
  const when = new Date(r.createdAt).toISOString();
  return `${r.content}${tags}  (source: ${r.source}, ${when})  <id:${r.id}>`;
}

/**
 * Builds a fresh McpServer wired to the shared memory store and tool specs.
 * A new instance is created per transport/session; all share one store.
 */
export function createSynapseServer(): McpServer {
  const server = new McpServer(SYNAPSE_SERVER_INFO, {
    instructions: INSTRUCTIONS,
    capabilities: {
      tools: {},
      resources: {},
      prompts: {},
      logging: {},
    },
  });

  const store = getStore();

  for (const spec of toolSpecs) {
    server.registerTool(
      spec.name,
      {
        title: spec.title,
        description: spec.description,
        inputSchema: spec.rawShape,
      },
      async (args: Record<string, unknown>) => {
        const result = await spec.handler(args);
        return {
          content: [{ type: "text" as const, text: result.text }],
          structuredContent: result.data,
        };
      },
    );
  }

  server.registerResource(
    "recent-memories",
    "memory://recent",
    {
      title: "Recent memories",
      description: "The 25 most recent memories stored in Synapse.",
      mimeType: "text/plain",
    },
    async (uri) => {
      const records = store.list(25, 0);
      const text = records.length
        ? records.map(formatRecord).join("\n")
        : "No memories stored yet.";
      return {
        contents: [{ uri: uri.href, mimeType: "text/plain", text }],
      };
    },
  );

  server.registerPrompt(
    "recall-context",
    {
      title: "Recall context",
      description:
        "Generate a prompt that injects relevant Synapse memories for a query.",
      argsSchema: {
        query: z.string().min(1).describe("The task to recall context for."),
      },
    },
    async ({ query }) => {
      const hits = await store.search(query, 8);
      const memo = hits.length
        ? hits.map((h, i) => `${i + 1}. ${h.content}`).join("\n")
        : "(no relevant memories found)";
      return {
        messages: [
          {
            role: "user" as const,
            content: {
              type: "text" as const,
              text:
                `Here is relevant memory about the user/task:\n${memo}\n\n` +
                `Using this context, respond to: ${query}`,
            },
          },
        ],
      };
    },
  );

  return server;
}
