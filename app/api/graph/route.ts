import { getStore } from "@/lib/memory/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET() {
  try {
    const graph = await getStore().graph(60, 0.28);
    return Response.json(graph);
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
