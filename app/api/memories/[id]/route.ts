import { NextRequest } from "next/server";
import { getStore } from "@/lib/memory/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const store = getStore();
  const memory = store.get(id);
  if (!memory) return Response.json({ error: "Not found" }, { status: 404 });
  const related = await store.related(id, 6);
  return Response.json({ memory, related });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const ok = getStore().delete(id);
  if (!ok) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ deleted: true });
}
