// LOCAL E2E PATCH — never commit. A tiny Supabase-client lookalike backed by PGlite
// with the real migrations, so student flows can be exercised in a browser offline.
import { PGlite } from "@electric-sql/pglite";
import fs from "node:fs";
import path from "node:path";

export const STUDENT_UID = "00000000-0000-0000-0000-00000000e2e1";
export const PARENT_UID = "00000000-0000-0000-0000-00000000e2e0";
export const TUTOR_UID = "00000000-0000-0000-0000-00000000e2e2";
export const E2E_USERS = {
  parent: { id: PARENT_UID, role: "parent", displayName: "Phụ huynh" },
  student: { id: STUDENT_UID, role: "student", displayName: "Nguyên" },
  tutor: { id: TUTOR_UID, role: "tutor", displayName: "Cô Trang" },
} as const;

type G = { __e2eDb?: Promise<PGlite>; __e2eLock?: Promise<unknown> };
const g = globalThis as G;

async function init() {
  const db = new PGlite();
  const dir = path.join(process.cwd(), "supabase");
  await db.exec(`
    create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
    create schema auth;
    create table auth.users (id uuid primary key default gen_random_uuid(), email text unique,
      raw_app_meta_data jsonb default '{}'::jsonb, raw_user_meta_data jsonb default '{}'::jsonb);
    create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    grant usage on schema auth to authenticated, anon, service_role; grant usage on schema public to authenticated, anon;
  `);
  for (const f of fs.readdirSync(path.join(dir, "migrations")).sort()) await db.exec(fs.readFileSync(path.join(dir, "migrations", f), "utf8"));
  await db.exec(`insert into auth.users (id, email) values ('${PARENT_UID}', 'p@e2e');`);
  await db.exec(fs.readFileSync(path.join(dir, "seed_first_parent.sql"), "utf8").replace("REPLACE_WITH_PARENT_EMAIL", "p@e2e"));
  await db.exec(`
    insert into auth.users (id, email, raw_app_meta_data, raw_user_meta_data) values
      ('${STUDENT_UID}', 's@e2e', '{"role":"student"}', '{"display_name":"Nguyên"}');
    update public.students set profile_id = '${STUDENT_UID}', consent_at = now() where full_name = 'Hạnh Nguyên';
    insert into auth.users (id, email, raw_app_meta_data, raw_user_meta_data) values
      ('${TUTOR_UID}', 't@e2e', '{"role":"tutor"}', '{"display_name":"Cô Trang"}');
    insert into public.tutor_assignments (tutor_id, student_id) select '${TUTOR_UID}', id from public.students where full_name = 'Hạnh Nguyên';
    insert into public.students (full_name, grade) values ('Đăng An', 6); -- not assigned to the tutor
  `);
  return db;
}

export function e2eDb() {
  g.__e2eDb ??= init();
  return g.__e2eDb;
}

async function locked<T>(fn: () => Promise<T>): Promise<T> {
  const prev = g.__e2eLock ?? Promise.resolve();
  let release!: () => void;
  g.__e2eLock = new Promise<void>((r) => (release = r));
  await prev.catch(() => {});
  try {
    return await fn();
  } finally {
    release();
  }
}

function norm(v: unknown, type: number): unknown {
  if (v instanceof Date) return type === 1082 ? v.toISOString().slice(0, 10) : v.toISOString();
  return v;
}

const lit = (v: unknown) => v;

class Query {
  private op: "select" | "insert" | "update" | "upsert" | "delete" = "select";
  private cols = "*";
  private returning: string | null = null;
  private where: string[] = [];
  private params: unknown[] = [];
  private orderBy = "";
  private lim = "";
  private payload: Record<string, unknown>[] = [];
  private conflict = "";
  private ignoreDup = false;
  private one: "one" | "maybe" | null = null;
  private headCount = false;
  constructor(private table: string, private uid: string | null) {}
  private p(v: unknown) { this.params.push(lit(v)); return `$${this.params.length}`; }
  select(cols = "*", o: { count?: "exact"; head?: boolean } = {}) {
    if (this.op === "select") this.cols = cols; else this.returning = cols;
    if (o.head) this.headCount = true;
    return this;
  }
  insert(rows: Record<string, unknown> | Record<string, unknown>[]) { this.op = "insert"; this.payload = Array.isArray(rows) ? rows : [rows]; return this; }
  upsert(row: Record<string, unknown>, o: { onConflict?: string; ignoreDuplicates?: boolean } = {}) {
    this.op = "upsert"; this.payload = [row]; this.conflict = o.onConflict ?? "id"; this.ignoreDup = !!o.ignoreDuplicates; return this;
  }
  update(obj: Record<string, unknown>) { this.op = "update"; this.payload = [obj]; return this; }
  delete() { this.op = "delete"; return this; }
  eq(c: string, v: unknown) { this.where.push(`${c} = ${this.p(v)}`); return this; }
  is(c: string, v: null) { this.where.push(`${c} is ${v === null ? "null" : String(v)}`); return this; }
  in(c: string, arr: unknown[]) { this.where.push(`${c} = any(${this.p(arr)})`); return this; }
  order(c: string, o: { ascending?: boolean } = {}) { this.orderBy += `${this.orderBy ? "," : " order by"} ${c} ${o.ascending === false ? "desc" : "asc"}`; return this; }
  limit(n: number) { this.lim = ` limit ${n}`; return this; }
  range(from: number, to: number) { this.lim = ` limit ${to - from + 1} offset ${from}`; return this; }
  maybeSingle() { this.one = "maybe"; return this; }
  single() { this.one = "one"; return this; }
  private sql(): string {
    const w = this.where.length ? ` where ${this.where.join(" and ")}` : "";
    const t = `public.${this.table}`;
    if (this.op === "select" && this.headCount) return `select count(*)::int as count from ${t}${w}`;
    if (this.op === "select") {
      // Like Supabase's API "Max rows" (1000 by default): a response never has more rows, whatever the limit.
      const m = this.lim.match(/limit (\d+)(.*)/);
      const lim = m ? ` limit ${Math.min(Number(m[1]), 1000)}${m[2]}` : " limit 1000";
      return `select ${this.cols} from ${t}${w}${this.orderBy}${lim}`;
    }
    const ret = this.returning ? ` returning ${this.returning}` : "";
    if (this.op === "delete") return `delete from ${t}${w}${ret}`;
    if (this.op === "update") {
      const sets = Object.entries(this.payload[0]).map(([k, v]) => `${k} = ${this.p(v)}`).join(", ");
      return `update ${t} set ${sets}${w}${ret}`;
    }
    const keys = Object.keys(this.payload[0]);
    const values = this.payload.map((r) => `(${keys.map((k) => this.p(r[k] ?? null)).join(", ")})`).join(", ");
    let s = `insert into ${t} (${keys.join(", ")}) values ${values}`;
    if (this.op === "upsert")
      s += this.ignoreDup ? ` on conflict (${this.conflict}) do nothing` : ` on conflict (${this.conflict}) do update set ${keys.map((k) => `${k} = excluded.${k}`).join(", ")}`;
    return s + ret;
  }
  async run() {
    const db = await e2eDb();
    return locked(async () => {
      const sql = this.sql();
      try {
        await db.exec("reset role");
        if (this.uid) await db.exec(`set role authenticated; select set_config('request.jwt.claim.sub', '${this.uid}', false);`);
        else await db.exec("set role service_role");
        const r = await db.query<Record<string, unknown>>(sql, this.params);
        const types = new Map(r.fields.map((f) => [f.name, f.dataTypeID]));
        const rows = r.rows.map((row) => Object.fromEntries(Object.entries(row).map(([k, v]) => [k, norm(v, types.get(k) ?? 0)])));
        if (this.headCount) return { data: null, count: rows[0]?.count ?? 0, error: null };
        if (this.one) {
          if (rows.length > 1 || (this.one === "one" && !rows.length)) return { data: null, error: { message: "not single", code: "PGRST116" } };
          return { data: rows[0] ?? null, error: null };
        }
        return { data: this.op === "select" || this.returning ? rows : null, error: null };
      } catch (e) {
        const err = e as { message: string; code?: string };
        return { data: null, error: { message: err.message, code: err.code } };
      } finally {
        await db.exec("reset role");
      }
    });
  }
  then<A, B>(ok: (v: { data: unknown; error: unknown }) => A, bad?: (e: unknown) => B) { return this.run().then(ok, bad); }
}


/** Supabase auth.admin lookalike over auth.users (the parent "Tài khoản" page). */
const authAdmin = {
  async listUsers() {
    const db = await e2eDb();
    return locked(async () => {
      await db.exec("reset role");
      const r = await db.query<{ id: string; email: string }>("select id, email from auth.users");
      return { data: { users: r.rows }, error: null };
    });
  },
  async createUser(o: { email: string; app_metadata?: object; user_metadata?: object }) {
    const db = await e2eDb();
    return locked(async () => {
      await db.exec("reset role");
      try {
        const r = await db.query<{ id: string; email: string }>(
          "insert into auth.users (email, raw_app_meta_data, raw_user_meta_data) values ($1, $2, $3) returning id, email",
          [o.email, JSON.stringify(o.app_metadata ?? {}), JSON.stringify(o.user_metadata ?? {})],
        );
        return { data: { user: r.rows[0] }, error: null };
      } catch (e) {
        const dup = String(e).includes("unique");
        return { data: { user: null }, error: { status: dup ? 422 : 500, message: dup ? "A user with this email address has already been registered" : String(e) } };
      }
    });
  },
  async deleteUser(id: string) {
    const db = await e2eDb();
    return locked(async () => {
      await db.exec("reset role");
      await db.query("delete from auth.users where id = $1", [id]);
      return { data: {}, error: null };
    });
  },
  async updateUserById() {
    return { data: {}, error: null };
  },
};

export function fakeClient(uid: string | null) {
  return { from: (t: string) => new Query(t, uid), auth: { admin: authAdmin } } as never;
}
