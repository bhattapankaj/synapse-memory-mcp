/**
 * Synapse MCP server over stdio.
 *
 * This is the entry point local MCP clients (Cursor, Claude Desktop) spawn as a
 * child process. It speaks JSON-RPC over stdin/stdout, so nothing else may be
 * written to stdout.
 *
 * Run:  npm run mcp:stdio
 * Or:   npx tsx /absolute/path/to/mcp/stdio.ts
 */
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createSynapseServer } from "../lib/mcp/server";
import { warmEmbedder } from "../lib/memory/embeddings";

async function main() {
  const server = createSynapseServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // Pre-warm the on-device model in the background (logs go to stderr).
  warmEmbedder().catch((err) => {
    process.stderr.write(`[synapse] warm-up failed: ${String(err)}\n`);
  });
  process.stderr.write("[synapse] MCP stdio server ready\n");
}

main().catch((err) => {
  process.stderr.write(`[synapse] fatal: ${String(err)}\n`);
  process.exit(1);
});
