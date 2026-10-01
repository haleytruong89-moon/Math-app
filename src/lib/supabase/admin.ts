import "server-only";
import { createClient } from "@supabase/supabase-js";
import { publicEnv } from "@/lib/env";

/**
 * Service-role client: BYPASSES RLS. Server-only.
 * Only call after the Data Access Layer has verified the caller's role
 * (see requireRole in src/lib/dal.ts).
 */
export function createAdminClient() {
  const { url } = publicEnv();
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!secret) throw new Error("Missing SUPABASE_SECRET_KEY");
  return createClient(url, secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
