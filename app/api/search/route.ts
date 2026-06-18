import { NextRequest } from "next/server";
import { getStore } from "@/lib/memory/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";
  const limit = Number(searchParams.get("limit") ?? 8);
  if (!q.trim()) return Response.json({ hits: [] });
  try {
    const hits = await getStore().search(q, limit);
    return Response.json({ hits });
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
