import { getEmbedder } from "@/lib/memory/embeddings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const embedder = getEmbedder();
  return Response.json({
    liveAgent: Boolean(process.env.OPENAI_API_KEY),
    chatModel: process.env.OPENAI_CHAT_MODEL || "gpt-4o-mini",
    embedding: {
      provider: embedder.provider,
      model: embedder.model,
      dim: embedder.dim,
    },
  });
}
