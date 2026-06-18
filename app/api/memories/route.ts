import { NextRequest } from "next/server";
import { getStore } from "@/lib/memory/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const limit = Number(searchParams.get("limit") ?? 100);
  const offset = Number(searchParams.get("offset") ?? 0);
  const store = getStore();
  return Response.json({
    memories: store.list(limit, offset),
    total: store.count(),
  });
}

export async function POST(request: NextRequest) {
  let body: { content?: string; tags?: string[]; source?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!body.content || !body.content.trim()) {
    return Response.json({ error: "content is required" }, { status: 400 });
  }
  try {
    const record = await getStore().add({
      content: body.content,
      tags: body.tags,
      source: body.source || "dashboard",
    });
    return Response.json({ memory: record }, { status: 201 });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
