import "server-only";
import { timingSafeEqual } from "node:crypto";

/** Vercel Cron sends "Authorization: Bearer $CRON_SECRET". No secret set → nothing is authorized. */
export function cronAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET;
  const header = request.headers.get("authorization") ?? "";
  if (!secret) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const got = Buffer.from(header);
  return got.length === expected.length && timingSafeEqual(got, expected);
}
