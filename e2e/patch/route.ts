// LOCAL E2E PATCH — never commit.
import { e2eDb } from "@/lib/e2e-fake";
export async function POST(req: Request) {
  const { sql } = await req.json();
  const db = await e2eDb();
  await db.exec("reset role");
  try {
    if (sql.trim().replace(/;\s*$/, "").includes(";")) { await db.exec(sql); return Response.json([]); }
    return Response.json((await db.query(sql)).rows);
  } catch (e) { return Response.json({ error: String(e) }, { status: 500 }); }
}
