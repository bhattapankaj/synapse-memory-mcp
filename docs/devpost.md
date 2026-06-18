# Devpost submission copy - Synapse

Paste these fields directly into the Devpost submission form.

---

## Project name

Synapse - Universal AI Memory over MCP

## Elevator pitch (one line)

A local-first memory layer that gives any AI client persistent, semantic, cross-tool recall, exposed over the Model Context Protocol.

## Track

LLM with MCP

---

## Inspiration

Every AI assistant we use is brilliant but forgetful. Cursor forgets what we told it yesterday. Claude starts every chat from a blank slate. ChatGPT's memory does not follow us into other tools. We kept repeating the same context - our stack, our preferences, our decisions - to every model, every day. The intelligence had arrived; the continuity had not. We wanted memory that belongs to the user and follows them across every tool, built on an open standard instead of a walled garden.

## What it does

Synapse is a memory server that speaks the Model Context Protocol. Any MCP-compatible client can call it to store durable facts and recall them semantically later, in any future session and any tool. It exposes six tools - `remember`, `recall`, `list_memories`, `forget`, `get_related`, and `build_context` - plus an MCP resource and prompt.

It ships with a polished web app:
- a **dashboard** to browse, search, add, and visualize memories as a live semantic knowledge graph;
- a **playground** where an agent transparently calls the memory tools and proves cross-session recall right in the browser;
- a **connect** page with copy-paste config for Cursor and Claude Desktop.

It is local-first and private: memories live in an embedded vector database on your machine, and semantic search runs on-device with no API key required.

## How we built it

- **MCP server** with the official `@modelcontextprotocol/sdk`, served over both stdio (for local clients like Cursor) and Streamable HTTP (JSON mode) from a single Next.js deployable.
- **Memory core** using `better-sqlite3` + `sqlite-vec` for an embedded cosine-distance vector store.
- **On-device embeddings** via Transformers.js (all-MiniLM-L6-v2, 384-dim), with an optional OpenAI provider.
- A single set of **shared tool specifications** drives the stdio server, the HTTP route, and the in-app agent, guaranteeing identical behaviour everywhere.
- **Frontend** in Next.js (App Router), TypeScript, Tailwind CSS, and Framer Motion, with a custom canvas neural-network hero and a force-directed knowledge graph.

## Challenges we ran into

- Bridging MCP's Node-oriented Streamable HTTP transport into Next.js's web-standard route handlers; we centralized the tool logic and implemented a clean JSON-RPC endpoint that mirrors the SDK server.
- Making `sqlite-vec` accept vectors correctly (its virtual-table primary key must be bound as a BigInt).
- Keeping the entire experience functional with zero API keys, so judges can try it instantly - solved with on-device embeddings and a deterministic demo-mode agent.

## Accomplishments we are proud of

- A genuine MCP server, not a wrapper - it works with real clients today.
- Fully usable offline and key-free, while remaining extensible to cloud models.
- An end-to-end demo that runs entirely in the browser, plus a one-line config to connect your own Cursor.

## What we learned

How to design a clean, portable tool surface for MCP, how to run quality semantic search locally with no external services, and how much friction disappears when memory is an open protocol rather than a per-vendor feature.

## What is next for Synapse

Memory namespaces and sharing, automatic summarization and decay, richer graph analytics, encrypted sync between a user's own devices, and first-class adapters for more MCP clients.

## Try it

```bash
npm install
npm run dev
# open http://localhost:3000
```

No API key required.

## Built with

next.js, react, typescript, tailwindcss, framer-motion, model-context-protocol, sqlite-vec, better-sqlite3, transformers.js
