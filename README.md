# Synapse - Universal AI Memory over MCP

> A local-first memory layer that gives any AI client persistent, semantic, cross-tool recall, exposed over the Model Context Protocol.

Built for **Hackverse X - Global Tech Innovation 2026**. Track: **LLM with MCP**.

---

## The problem

Every large language model is brilliant but amnesiac. Each conversation starts from zero, context is trapped inside a single tool, and users repeat their preferences, stack, and decisions over and over. The intelligence is there; the continuity is not.

## The solution

**Synapse** is a memory server speaking the [Model Context Protocol](https://modelcontextprotocol.io). Any MCP-compatible client (Cursor, Claude Desktop, or your own agent) can call Synapse to **remember** durable facts and **recall** them semantically in any future session, across any tool.

- **Open protocol** - memory is portable across every MCP client, not locked to one vendor.
- **Local-first and private** - runs on your machine with an embedded vector database; memories never have to leave your device.
- **Zero-key by default** - on-device embeddings (all-MiniLM-L6-v2) mean semantic recall works with no API key, no signup, and no cloud cost.

## What is in the box

| Piece | What it does |
| --- | --- |
| **MCP server** | Six tools (`remember`, `recall`, `list_memories`, `forget`, `get_related`, `build_context`), a `memory://recent` resource, and a `recall-context` prompt - over **stdio** and **Streamable HTTP**. |
| **Memory core** | `sqlite-vec` vector store + pluggable embeddings (on-device Transformers.js, optional OpenAI). |
| **Web app** | A beautiful, animated Next.js site: marketing landing, a memory **dashboard** (timeline, semantic search, live knowledge graph), and an agent **playground** that proves cross-session recall in the browser. |

## Architecture

```
MCP clients (Cursor, Claude, in-app agent)
        |  stdio / Streamable HTTP
        v
  MCP server  ──────────────► shared tool specs (lib/mcp/tools.ts)
        |                              |
        v                              v
  embeddings (local / OpenAI)   memory store (sqlite-vec)
```

The same tool definitions power the stdio server, the HTTP route, and the in-app agent, so behaviour is identical everywhere.

## Quick start

Requirements: Node.js 20+ (developed on Node 23).

```bash
npm install
npm run dev
```

Open http://localhost:3000.

- **/** - landing page
- **/dashboard** - browse, search, add, and visualize memories
- **/playground** - chat with an agent that remembers (no key needed)
- **/connect** - copy-paste config to connect Cursor / Claude Desktop

> On first use Synapse downloads a ~90MB on-device embedding model and caches it. After that, semantic memory runs fully offline.

## Connect a real MCP client

### Cursor / Claude Desktop (stdio)

Add to your client's MCP config (for Cursor, `.cursor/mcp.json`). Replace the path with this repo's absolute path:

```json
{
  "mcpServers": {
    "synapse": {
      "command": "npx",
      "args": ["-y", "tsx", "/absolute/path/to/Hackathon/mcp/stdio.ts"]
    }
  }
}
```

The exact snippet (with the correct absolute path filled in) is shown on the **/connect** page.

### HTTP (Streamable HTTP, JSON mode)

Start the app and point an HTTP-capable MCP client at `http://localhost:3000/api/mcp`. Quick smoke test:

```bash
curl -s -X POST http://localhost:3000/api/mcp \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

## Optional configuration

Copy `.env.example` to `.env.local`. Everything works with no env vars set.

| Variable | Purpose |
| --- | --- |
| `SYNAPSE_EMBEDDINGS` | `local` (default) or `openai`. |
| `OPENAI_API_KEY` | Enables a live LLM agent in the Playground and optional cloud embeddings. |
| `OPENAI_BASE_URL` / `OPENAI_CHAT_MODEL` / `OPENAI_EMBED_MODEL` | OpenAI-compatible endpoint settings. |
| `SYNAPSE_DB_PATH` | Where the SQLite memory database lives (default `./data/synapse.db`). |

## MCP tools

| Tool | Description |
| --- | --- |
| `remember` | Store a memory durably (`content`, optional `tags`, `source`). |
| `recall` | Semantic search over memories (`query`, optional `limit`). |
| `list_memories` | List the most recent memories. |
| `forget` | Delete a memory by `id`. |
| `get_related` | Find memories semantically related to an `id` (powers the graph). |
| `build_context` | Synthesize a ready-to-inject context block for a query. |

## Tech stack

Next.js (App Router) · React · TypeScript · Tailwind CSS · Framer Motion · `@modelcontextprotocol/sdk` · `better-sqlite3` + `sqlite-vec` · `@huggingface/transformers`.

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the web app. |
| `npm run build` / `npm start` | Production build and serve. |
| `npm run mcp:stdio` | Run the MCP server over stdio. |
| `npm run smoke` | Verify the memory core (sqlite-vec + embeddings). |

## Project layout

```
app/            Next.js routes (pages + API)
components/      UI components (nav, hero, graph, icons)
lib/memory/      vector store + embeddings
lib/mcp/         MCP server + shared tool specs
lib/agent/       in-app agent (live + demo mode)
mcp/stdio.ts     stdio entry point for local MCP clients
docs/            pitch, demo script, devpost copy
```

## License

MIT.
