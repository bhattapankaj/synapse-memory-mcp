import { getEmbedder } from "@/lib/memory/embeddings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const embedder = getEmbedder();
  // On-device embeddings need a native ONNX runtime that does not run in a
  // serverless function. So on Vercel/Lambda the interactive memory engine is
  // only available when an OpenAI-compatible embedding provider is configured.
  const serverless = Boolean(
    process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME,
  );
  const memoryReady = !serverless || embedder.provider === "openai";
  return Response.json({
    liveAgent: Boolean(process.env.OPENAI_API_KEY),
    chatModel: process.env.OPENAI_CHAT_MODEL || "gpt-4o-mini",
    serverless,
    memoryReady,
    embedding: {
      provider: embedder.provider,
      model: embedder.model,
      dim: embedder.dim,
    },
  });
}
