import { z } from "zod";
import { getStore } from "../memory/store";
import type { MemoryHit, MemoryRecord } from "../memory/types";

export interface ToolResult {
  text: string;
  data?: Record<string, unknown>;
}

export interface ToolSpec {
  name: string;
  title: string;
  description: string;
  rawShape: z.ZodRawShape;
  schema: z.ZodObject<z.ZodRawShape>;
  jsonSchema: JsonSchema;
  handler: (args: Record<string, unknown>) => Promise<ToolResult>;
}

interface JsonSchema {
  type: "object";
  properties: Record<string, unknown>;
  required: string[];
  additionalProperties: false;
}

function formatHit(hit: MemoryHit): string {
  const pct = Math.round(hit.score * 100);
  const tags = hit.tags.length ? ` [${hit.tags.join(", ")}]` : "";
  return `(${pct}% match) ${hit.content}${tags}  <id:${hit.id}>`;
}

function formatRecord(r: MemoryRecord): string {
  const tags = r.tags.length ? ` [${r.tags.join(", ")}]` : "";
  const when = new Date(r.createdAt).toISOString();
  return `${r.content}${tags}  (source: ${r.source}, ${when})  <id:${r.id}>`;
}

/* ----------------- Minimal Zod -> JSON Schema converter ---------------- */
/* Supports exactly the field shapes used by Synapse tools. */

function fieldToJson(schema: z.ZodTypeAny): { node: Record<string, unknown>; required: boolean } {
  let required = true;
  let current = schema;

  if (current instanceof z.ZodOptional) {
    required = false;
    current = current.unwrap();
  }

  const description = current._def.description as string | undefined;
  let node: Record<string, unknown> = {};

  if (current instanceof z.ZodString) {
    node = { type: "string" };
  } else if (current instanceof z.ZodNumber) {
    node = { type: "integer" };
  } else if (current instanceof z.ZodArray) {
    node = { type: "array", items: { type: "string" } };
  } else {
    node = { type: "string" };
  }

  if (description) node.description = description;
  return { node, required };
}

function buildJsonSchema(rawShape: z.ZodRawShape): JsonSchema {
  const properties: Record<string, unknown> = {};
  const required: string[] = [];
  for (const [key, value] of Object.entries(rawShape)) {
    const { node, required: isReq } = fieldToJson(value as z.ZodTypeAny);
    properties[key] = node;
    if (isReq) required.push(key);
  }
  return { type: "object", properties, required, additionalProperties: false };
}

function defineTool(spec: {
  name: string;
  title: string;
  description: string;
  rawShape: z.ZodRawShape;
  handler: (args: Record<string, unknown>) => Promise<ToolResult>;
}): ToolSpec {
  return {
    ...spec,
    schema: z.object(spec.rawShape),
    jsonSchema: buildJsonSchema(spec.rawShape),
  };
}

/* ------------------------------ Tool specs ----------------------------- */

export const toolSpecs: ToolSpec[] = [
  defineTool({
    name: "remember",
    title: "Remember",
    description:
      "Store a memory durably so it can be recalled in future sessions. " +
      "Use for facts, user preferences, decisions, or important context.",
    rawShape: {
      content: z.string().min(1).describe("The information to remember."),
      tags: z
        .array(z.string())
        .optional()
        .describe("Optional labels for organizing this memory."),
      source: z
        .string()
        .optional()
        .describe("Where this memory came from, e.g. a client or topic."),
    },
    async handler(args) {
      const record = await getStore().add({
        content: args.content as string,
        tags: args.tags as string[] | undefined,
        source: args.source as string | undefined,
      });
      return {
        text: `Stored memory <id:${record.id}>.`,
        data: { id: record.id, createdAt: record.createdAt },
      };
    },
  }),

  defineTool({
    name: "recall",
    title: "Recall",
    description:
      "Semantically search stored memories and return the most relevant ones. " +
      "Call this before answering when the user relies on prior context.",
    rawShape: {
      query: z.string().min(1).describe("What to search memories for."),
      limit: z
        .number()
        .int()
        .min(1)
        .max(25)
        .optional()
        .describe("Maximum number of memories to return (default 6)."),
    },
    async handler(args) {
      const hits = await getStore().search(
        args.query as string,
        (args.limit as number) ?? 6,
      );
      return {
        text: hits.length
          ? hits.map(formatHit).join("\n")
          : "No relevant memories found.",
        data: { hits },
      };
    },
  }),

  defineTool({
    name: "list_memories",
    title: "List memories",
    description: "List the most recent memories, newest first.",
    rawShape: {
      limit: z.number().int().min(1).max(100).optional(),
      offset: z.number().int().min(0).optional(),
    },
    async handler(args) {
      const records = getStore().list(
        (args.limit as number) ?? 20,
        (args.offset as number) ?? 0,
      );
      return {
        text: records.length
          ? records.map(formatRecord).join("\n")
          : "No memories stored yet.",
        data: { memories: records },
      };
    },
  }),

  defineTool({
    name: "forget",
    title: "Forget",
    description: "Permanently delete a memory by its id.",
    rawShape: {
      id: z.string().min(1).describe("The id of the memory to delete."),
    },
    async handler(args) {
      const id = args.id as string;
      const ok = getStore().delete(id);
      return {
        text: ok ? `Deleted memory <id:${id}>.` : `No memory with id ${id}.`,
        data: { deleted: ok },
      };
    },
  }),

  defineTool({
    name: "get_related",
    title: "Get related",
    description:
      "Find memories semantically related to a given memory id. " +
      "Useful for exploring the knowledge graph around a memory.",
    rawShape: {
      id: z.string().min(1).describe("The memory id to expand from."),
      limit: z.number().int().min(1).max(25).optional(),
    },
    async handler(args) {
      const hits = await getStore().related(
        args.id as string,
        (args.limit as number) ?? 6,
      );
      return {
        text: hits.length
          ? hits.map(formatHit).join("\n")
          : "No related memories found.",
        data: { hits },
      };
    },
  }),

  defineTool({
    name: "build_context",
    title: "Build context",
    description:
      "Return a single, ready-to-inject context block summarizing the most " +
      "relevant memories for a query. Ideal for priming an answer.",
    rawShape: {
      query: z.string().min(1).describe("The current task or question."),
      limit: z.number().int().min(1).max(20).optional(),
    },
    async handler(args) {
      const hits = await getStore().search(
        args.query as string,
        (args.limit as number) ?? 8,
      );
      if (!hits.length) {
        return {
          text: "No stored memories are relevant to this query.",
          data: { hits: [] },
        };
      }
      const block = [
        "### Relevant memory (from Synapse)",
        ...hits.map((h, i) => `${i + 1}. ${h.content}`),
        "",
        "Use the above context where appropriate when responding.",
      ].join("\n");
      return { text: block, data: { hits, contextBlock: block } };
    },
  }),
];

export const toolSpecByName = new Map(toolSpecs.map((t) => [t.name, t]));
