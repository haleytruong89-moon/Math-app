// RLS regression test: runs the real migration on PGlite with a stubbed Supabase auth schema.
// Run: npm run test:db
import { PGlite } from '@electric-sql/pglite';
import fs from 'node:fs';
const db = new PGlite();
const repo = new URL('..', import.meta.url).pathname.replace(/\/$/, '');
// --- Minimal stand-in for Supabase's auth schema and roles ---
await db.exec(`
  create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
  create schema auth;
  create table auth.users (id uuid primary key default gen_random_uuid(), email text unique,
    raw_app_meta_data jsonb default '{}'::jsonb, raw_user_meta_data jsonb default '{}'::jsonb);
  create function auth.uid() returns uuid language sql stable as
    $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  grant usage on schema auth to authenticated, anon; grant usage on schema public to authenticated, anon;
`);
await db.exec(fs.readFileSync(`${repo}/migrations/0001_p0_accounts.sql`, 'utf8'));
await db.exec(`insert into auth.users (email) values ('me@example.com');`);
await db.exec(fs.readFileSync(`${repo}/seed_first_parent.sql`, 'utf8').replace('REPLACE_WITH_PARENT_EMAIL','me@example.com'));
// Server-side account creation, as the app will do it
await db.exec(`
  insert into auth.users (email, raw_app_meta_data, raw_user_meta_data) values
   ('trang@example.com', '{"role":"tutor"}', '{"display_name":"Cô Trang"}'),
   ('old@example.com',   '{"role":"tutor"}', '{"display_name":"Thầy Cũ"}'),
   ('nguyen@example.com','{"role":"student"}','{"display_name":"Nguyên"}'),
   ('an@example.com',    '{"role":"student"}','{"display_name":"An"}'),
   ('hacker@example.com','{}', '{"display_name":"x","role":"parent"}');
  update public.students set profile_id = (select id from auth.users where email='nguyen@example.com') where full_name='Hạnh Nguyên';
  insert into public.students (full_name, grade, profile_id) values ('Đăng An', 6, (select id from auth.users where email='an@example.com'));
  insert into public.tutor_assignments (tutor_id, student_id) select u.id, s.id from auth.users u, public.students s where u.email='trang@example.com' and s.full_name='Hạnh Nguyên';
  insert into public.tutor_assignments (tutor_id, student_id, started_at, ended_at) select u.id, s.id, now()-interval '30 days', now()-interval '1 day' from auth.users u, public.students s where u.email='old@example.com' and s.full_name='Hạnh Nguyên';
`);
const uid = async e => (await db.query(`select id from auth.users where email=$1`, [e])).rows[0].id;
async function as(email, sql) {
  await db.exec('reset role');
  const id = email ? await uid(email) : '';
  await db.exec(`set role ${email ? 'authenticated' : 'anon'}; select set_config('request.jwt.claim.sub', '${id}', false);`);
  try { return (await db.query(sql)).rows; } catch (e) { return 'ERROR: ' + e.message; } finally { await db.exec('reset role'); }
}
let fail = 0;
const check = (name, got, want) => { const ok = JSON.stringify(got) === JSON.stringify(want); if (!ok) fail++; console.log(ok ? 'PASS' : 'FAIL', name, ok ? '' : `got=${JSON.stringify(got)} want=${JSON.stringify(want)}`); };
const names = r => Array.isArray(r) ? r.map(x => Object.values(x)[0]).sort() : r;
const isErr = r => typeof r === 'string' && r.startsWith('ERROR');

check('hacker self-set role in user_metadata gets no profile', names(await db.query(`select count(*)::int from public.profiles p join auth.users u on u.id=p.id where u.email='hacker@example.com'`).then(r=>r.rows)), [0]);
check('parent sees only linked student (An not linked yet)', names(await as('me@example.com','select full_name from public.students')), ['Hạnh Nguyên']);
check('parent sees all profiles', (await as('me@example.com','select count(*)::int c from public.profiles'))[0].c, 5);
check('active tutor sees only Nguyên', names(await as('trang@example.com','select full_name from public.students')), ['Hạnh Nguyên']);
check('ended tutor sees no student', names(await as('old@example.com','select full_name from public.students')), []);
check('tutor sees only own profile', names(await as('trang@example.com','select display_name from public.profiles')), ['Cô Trang']);
check('tutor sees own assignment only', (await as('trang@example.com','select count(*)::int c from public.tutor_assignments'))[0].c, 1);
check('student Nguyên sees only herself', names(await as('nguyen@example.com','select full_name from public.students')), ['Hạnh Nguyên']);
check('student An sees only himself', names(await as('an@example.com','select full_name from public.students')), ['Đăng An']);
check('anon sees nothing', isErr(await as(null,'select * from public.students')), true);
check('tutor cannot update own role', isErr(await as('trang@example.com',`update public.profiles set role='parent' where id=auth.uid()`)), true);
check('student cannot insert assignment', isErr(await as('nguyen@example.com',`insert into public.tutor_assignments (tutor_id, student_id) select auth.uid(), id from public.students`)), true);
check('parent cannot write directly either (server-only)', isErr(await as('me@example.com',`insert into public.students (full_name, grade) values ('x', 9)`)), true);
check('heartbeat hidden from clients', isErr(await as('me@example.com','select * from public.heartbeat')), true);
// lock the tutor → loses access
await db.exec(`update public.profiles set is_active=false, locked_at=now() where id=(select id from auth.users where email='trang@example.com')`);
check('locked tutor sees no student', names(await as('trang@example.com','select full_name from public.students')), []);
console.log(fail ? `\n${fail} FAILED` : '\nALL PASSED'); process.exit(fail ? 1 : 0);
