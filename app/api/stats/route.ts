import { getStore } from "@/lib/memory/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return Response.json(getStore().stats());
  } catch (e) {
    return Response.json({ error: String(e) }, { status: 500 });
  }
}
