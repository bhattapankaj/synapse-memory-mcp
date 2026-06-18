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
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
