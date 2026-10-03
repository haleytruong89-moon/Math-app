import re
def edit(p, old, new):
    s=open(p).read(); assert old in s, (p, old); open(p,'w').write(s.replace(old,new,1))
edit('src/lib/dal.ts','export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {\n',
 'export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {\n  if (process.env.E2E_ROLE) { const f = await import("@/lib/e2e-fake"); return process.env.E2E_ROLE === "student" ? { id: f.STUDENT_UID, role: "student", displayName: "Nguyên" } : { id: f.PARENT_UID, role: "parent", displayName: "Phụ huynh" }; }\n')
edit('src/lib/supabase/server.ts','export async function createClient() {\n',
 'export async function createClient() {\n  if (process.env.E2E_ROLE) { const f = await import("@/lib/e2e-fake"); return f.fakeClient(process.env.E2E_ROLE === "student" ? f.STUDENT_UID : f.PARENT_UID); }\n')
edit('src/lib/supabase/admin.ts','import { publicEnv } from "@/lib/env";','import { publicEnv } from "@/lib/env";\nimport { fakeClient } from "@/lib/e2e-fake";')
edit('src/lib/supabase/admin.ts','export function createAdminClient() {\n','export function createAdminClient() {\n  if (process.env.E2E_ROLE) return fakeClient(null) as ReturnType<typeof createClient>;\n')
s=open('next.config.ts').read()
s=re.sub(r'const nextConfig: NextConfig = \{', 'const nextConfig: NextConfig = {\n  serverExternalPackages: ["@electric-sql/pglite"],', s, count=1)
open('next.config.ts','w').write(s)
