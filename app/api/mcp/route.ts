import { NextRequest } from "next/server";
import { toolSpecByName, toolSpecs } from "@/lib/mcp/tools";
import { getStore } from "@/lib/memory/store";
import { SYNAPSE_SERVER_INFO } from "@/lib/mcp/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const PROTOCOL_VERSION = "2025-06-18";

type JsonRpcId = string | number | null;

interface JsonRpcRequest {
  jsonrpc: "2.0";
  id?: JsonRpcId;
  method: string;
  params?: Record<string, unknown>;
}

function result(id: JsonRpcId, value: unknown) {
  return { jsonrpc: "2.0" as const, id, result: value };
}

function error(id: JsonRpcId, code: number, message: string) {
  return { jsonrpc: "2.0" as const, id, error: { code, message } };
}

async function dispatch(req: JsonRpcRequest) {
  const id = req.id ?? null;
  const params = req.params ?? {};

  switch (req.method) {
    case "initialize":
      return result(id, {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: { tools: {}, resources: {}, prompts: {} },
        serverInfo: SYNAPSE_SERVER_INFO,
        instructions:
          "Synapse persistent memory. Use recall before answering, remember to store new context.",
      });

    case "ping":
      return result(id, {});

    case "tools/list":
      return result(id, {
        tools: toolSpecs.map((t) => ({
          name: t.name,
          title: t.title,
          description: t.description,
          inputSchema: t.jsonSchema,
        })),
      });

    case "tools/call": {
      const name = params.name as string;
      const spec = toolSpecByName.get(name);
      if (!spec) return error(id, -32602, `Unknown tool: ${name}`);
      const parsed = spec.schema.safeParse(params.arguments ?? {});
      if (!parsed.success) {
        return error(id, -32602, `Invalid arguments: ${parsed.error.message}`);
      }
      try {
        const out = await spec.handler(parsed.data as Record<string, unknown>);
        return result(id, {
          content: [{ type: "text", text: out.text }],
          structuredContent: out.data,
        });
      } catch (e) {
        return result(id, {
          content: [{ type: "text", text: `Error: ${String(e)}` }],
          isError: true,
        });
      }
    }

    case "resources/list":
      return result(id, {
        resources: [
          {
            uri: "memory://recent",
            name: "recent-memories",
            title: "Recent memories",
            description: "The 25 most recent memories stored in Synapse.",
            mimeType: "text/plain",
          },
        ],
      });

    case "resources/read": {
      const uri = params.uri as string;
      if (uri !== "memory://recent") {
        return error(id, -32602, `Unknown resource: ${uri}`);
      }
      const records = getStore().list(25, 0);
      const text = records.length
        ? records
            .map((r) => `${r.content}  <id:${r.id}>`)
            .join("\n")
        : "No memories stored yet.";
      return result(id, {
        contents: [{ uri, mimeType: "text/plain", text }],
      });
    }

    case "prompts/list":
      return result(id, {
        prompts: [
          {
            name: "recall-context",
            title: "Recall context",
            description:
              "Inject relevant Synapse memories for a query before answering.",
            arguments: [
              { name: "query", description: "The task to recall context for.", required: true },
            ],
          },
        ],
      });

    case "prompts/get": {
      const args = (params.arguments ?? {}) as { query?: string };
      const query = args.query ?? "";
      const hits = await getStore().search(query, 8);
      const memo = hits.length
        ? hits.map((h, i) => `${i + 1}. ${h.content}`).join("\n")
        : "(no relevant memories found)";
      return result(id, {
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: `Here is relevant memory:\n${memo}\n\nNow respond to: ${query}`,
            },
          },
        ],
      });
    }

    default:
      // Notifications (no id) are acknowledged silently.
      if (req.id === undefined) return null;
      return error(id, -32601, `Method not found: ${req.method}`);
  }
}

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json(error(null, -32700, "Parse error"), { status: 400 });
  }

  const isBatch = Array.isArray(body);
  const requests = (isBatch ? body : [body]) as JsonRpcRequest[];

  const responses = [];
  for (const req of requests) {
    if (!req || req.jsonrpc !== "2.0" || typeof req.method !== "string") {
      responses.push(error(req?.id ?? null, -32600, "Invalid Request"));
      continue;
    }
    const res = await dispatch(req);
    if (res !== null) responses.push(res);
  }

  if (responses.length === 0) {
    return new Response(null, { status: 202 });
  }
  return Response.json(isBatch ? responses : responses[0]);
}

export async function GET() {
  return Response.json({
    name: SYNAPSE_SERVER_INFO.name,
    version: SYNAPSE_SERVER_INFO.version,
    transport: "streamable-http (json mode)",
    protocolVersion: PROTOCOL_VERSION,
    endpoint: "/api/mcp",
    methods: [
      "initialize",
      "tools/list",
      "tools/call",
      "resources/list",
      "resources/read",
      "prompts/list",
      "prompts/get",
      "ping",
    ],
  });
}
