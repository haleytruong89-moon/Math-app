import { cronAuthorized } from "@/lib/cron";
import { createAdminClient } from "@/lib/supabase/admin";
import { buildWeeklyReport } from "@/lib/ai/reports";

// S8a: Monday 00:00 UTC = 07:00 Hà Nội (vercel.json). The previous week's report for every consented student.
export const maxDuration = 60;

export async function GET(request: Request) {
  if (!cronAuthorized(request)) return Response.json({ ok: false }, { status: 401 });
  const { data, error } = await createAdminClient().from("students").select("id, consent_at");
  if (error) {
    console.error("cron weekly", error.message);
    return Response.json({ ok: false }, { status: 500 });
  }
  let made = 0;
  let failed = 0;
  for (const s of data ?? []) {
    if (!s.consent_at) continue;
    const r = await buildWeeklyReport(s.id as string);
    if (r.ok) made++;
    else failed++;
  }
  return Response.json({ ok: failed === 0, made, failed }, { status: failed ? 500 : 200 });
}
