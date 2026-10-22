import { cronAuthorized } from "@/lib/cron";
import { createAdminClient } from "@/lib/supabase/admin";

// D19 keep-alive: Supabase free projects pause after 7 days without activity.
// Vercel Cron calls this daily (see vercel.json) with "Authorization: Bearer $CRON_SECRET".

export async function GET(request: Request) {
  if (!cronAuthorized(request)) {
    return Response.json({ ok: false }, { status: 401 });
  }

  const now = new Date().toISOString();
  const { error } = await createAdminClient()
    .from("heartbeat")
    .upsert({ id: 1, last_ping_at: now });

  if (error) {
    console.error("heartbeat upsert failed", error.message);
    return Response.json({ ok: false }, { status: 500 });
  }
  return Response.json({ ok: true, at: now });
}
