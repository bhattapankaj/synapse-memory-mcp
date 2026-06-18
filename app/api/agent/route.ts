import { NextRequest } from "next/server";
import { runAgent, type ChatMessage } from "@/lib/agent/agent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: NextRequest) {
  let body: { messages?: ChatMessage[]; apiKey?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const messages = Array.isArray(body.messages) ? body.messages : [];
  if (messages.length === 0) {
    return Response.json({ error: "messages required" }, { status: 400 });
  }
  try {
    const result = await runAgent(messages, body.apiKey);
    return Response.json(result);
  } catch (e) {
    const serverless = Boolean(
      process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME,
    );
    if (serverless) {
      return Response.json({
        reply:
          "This hosted showcase cannot run the on-device memory engine. " +
          "Run Synapse locally (npm run dev) to use the full playground, or " +
          "configure an OpenAI-compatible embedding provider for this deployment.",
        toolEvents: [],
        mode: "demo",
      });
    }
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
