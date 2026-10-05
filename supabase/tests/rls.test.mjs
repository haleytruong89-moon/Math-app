// RLS regression test: runs the real migration on PGlite with a stubbed Supabase auth schema.
// Run: npm run test:db
import { PGlite } from '@electric-sql/pglite';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
const db = new PGlite();
const repo = fileURLToPath(new URL('..', import.meta.url)).replace(/[\\/]$/, ''); // also works on Windows
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
await db.exec(fs.readFileSync(`${repo}/migrations/0002_service_role_grants_and_profile_trigger.sql`, 'utf8'));
await db.exec(fs.readFileSync(`${repo}/migrations/0003_p1_learning_attempts.sql`, 'utf8'));
await db.exec(fs.readFileSync(`${repo}/migrations/0004_p1_review_queue.sql`, 'utf8'));
await db.exec(fs.readFileSync(`${repo}/migrations/0005_p1_maintenance_review.sql`, 'utf8'));
await db.exec(fs.readFileSync(`${repo}/migrations/0006_p1_teaching_sessions.sql`, 'utf8'));
await db.exec(fs.readFileSync(`${repo}/migrations/0007_p1_homework.sql`, 'utf8'));
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
// 0002: GoTrue-style creation (insert without role, then set app_metadata) still yields a profile
await db.exec(`insert into auth.users (email, raw_user_meta_data) values ('late@example.com','{"display_name":"Late"}')`);
await db.exec(`update auth.users set raw_app_meta_data='{"role":"tutor"}' where email='late@example.com'`);
check('profile created when role is set after insert', names(await db.query(`select display_name from public.profiles p join auth.users u on u.id=p.id where u.email='late@example.com'`).then(r=>r.rows)), ['Late']);
await db.exec(`update auth.users set raw_app_meta_data='{"role":"tutor"}' where email='late@example.com'`);
check('re-update does not duplicate or fail', (await db.query(`select count(*)::int c from public.profiles p join auth.users u on u.id=p.id where u.email='late@example.com'`)).rows[0].c, 1);
// 0002: service_role can write the public tables
await db.exec(`set role service_role`);
const sr = await db.query(`insert into public.students (full_name, grade) values ('SR test', 9) returning id`).then(()=>true, ()=>false);
await db.exec(`reset role`);
check('service_role can insert into students', sr, true);
// 0003: attempts / unit_progress — written by service_role, read through RLS
await db.exec(`set role service_role`);
const wrote = await db.query(`
  with s as (select id from public.students where full_name='Hạnh Nguyên')
  , p as (insert into public.unit_progress (student_id, unit_id, worked_viewed_at) select id, 'htl-1', now() from s)
  insert into public.attempts (student_id, unit_id, item_id, mode, answer, correct, error_code)
  select id, 'htl-1', 'htl-1-p1', 'practice', '10', false, 'E03' from s`).then(()=>true, e=>{console.error(e.message); return false;});
await db.exec(`reset role`);
check('service_role can write attempts + unit_progress', wrote, true);
check('student sees own attempts', (await as('nguyen@example.com','select count(*)::int c from public.attempts'))[0].c, 1);
check('student sees own unit_progress', (await as('nguyen@example.com','select count(*)::int c from public.unit_progress'))[0].c, 1);
check('other student sees no attempts', (await as('an@example.com','select count(*)::int c from public.attempts'))[0].c, 0);
check('parent sees child attempts', (await as('me@example.com','select count(*)::int c from public.attempts'))[0].c, 1);
check('locked tutor sees no attempts', (await as('trang@example.com','select count(*)::int c from public.attempts'))[0].c, 0);
check('student cannot insert attempts directly', isErr(await as('nguyen@example.com',`insert into public.attempts (student_id, unit_id, item_id, mode, answer, correct) select id, 'htl-1','x','exit','1',true from public.students`)), true);
check('student cannot fake worked_viewed_at', isErr(await as('nguyen@example.com',`update public.unit_progress set faded_done_at=now()`)), true);
check('bad error code rejected', isErr(await db.query(`insert into public.attempts (student_id, unit_id, item_id, mode, answer, correct, error_code) select id,'htl-1','x','practice','1',false,'E99' from public.students limit 1`).then(()=>'ok', e=>'ERROR '+e.message)), true);
// 0004: review_queue / review_log
await db.exec(`set role service_role`);
const rq = await db.query(`
  with s as (select id from public.students where full_name='Hạnh Nguyên')
  , q as (insert into public.review_queue (student_id, unit_id, stage, due_on) select id, 'htl-1', 1, current_date + 1 from s)
  insert into public.review_log (student_id, unit_id, run_id, stage, correct, total, passed, rating, due_on, next_due_on)
  select id, 'htl-1', gen_random_uuid(), 1, 3, 3, true, 'easy', current_date, current_date + 11 from s`).then(()=>true, e=>{console.error(e.message); return false;});
await db.exec(`reset role`);
check('service_role can write review_queue + review_log', rq, true);
check('student sees own review_queue', (await as('nguyen@example.com','select count(*)::int c from public.review_queue'))[0].c, 1);
check('other student sees no review_log', (await as('an@example.com','select count(*)::int c from public.review_log'))[0].c, 0);
check('parent sees child review_log', (await as('me@example.com','select count(*)::int c from public.review_log'))[0].c, 1);
check('student cannot move own due date', isErr(await as('nguyen@example.com',`update public.review_queue set due_on = current_date + 99`)), true);
check('queue: completed_at only at maintenance stage', await db.query(`insert into public.review_queue (student_id, unit_id, stage, due_on, completed_at) select id,'htl-2',3,current_date,now() from public.students limit 1`).then(()=>'ok', e=>'ERROR '+e.message).then(isErr), true);
check('queue: due date always set', await db.query(`insert into public.review_queue (student_id, unit_id, stage, due_on) select id,'htl-2',2,null from public.students limit 1`).then(()=>'ok', e=>'ERROR '+e.message).then(isErr), true);
check('queue: maintenance stage 4 accepted', await db.query(`insert into public.review_queue (student_id, unit_id, stage, due_on, completed_at) select id,'htl-2',4,current_date + 60,now() from public.students where full_name='Hạnh Nguyên'`).then(()=>'ok', e=>'ERROR '+e.message), 'ok');
// 0006: teaching_sessions / tutor_proposals (S3)
await db.exec(`update public.profiles set is_active=true, locked_at=null where id=(select id from auth.users where email='trang@example.com')`);
await db.exec(`set role service_role`);
const ts = await db.query(`
  with n as (select id from public.students where full_name='Hạnh Nguyên')
  , t as (select id from public.profiles where display_name='Cô Trang')
  , o as (select id from public.profiles where display_name='Thầy Cũ')
  , s1 as (insert into public.teaching_sessions (student_id, tutor_id, taught_on, note) select n.id, t.id, current_date, 'buổi 1' from n, t returning id, student_id, tutor_id)
  , s2 as (insert into public.teaching_sessions (student_id, tutor_id, taught_on) select n.id, o.id, current_date - 20 from n, o returning id, student_id, tutor_id)
  , p1 as (insert into public.tutor_proposals (session_id, student_id, tutor_id, unit_id, level, system_level, answers) select id, student_id, tutor_id, 'htl-1', 2, 1, 1 from s1)
  insert into public.tutor_proposals (session_id, student_id, tutor_id, unit_id, level, system_level, answers) select id, student_id, tutor_id, 'htl-1', 3, 0, 0 from s2`).then(()=>true, e=>{console.error(e.message); return false;});
await db.exec(`reset role`);
check('service_role can write teaching_sessions + tutor_proposals', ts, true);
check('active tutor sees only own sessions (not previous tutor, D3)', names(await as('trang@example.com','select note from public.teaching_sessions')), ['buổi 1']);
check('active tutor sees only own proposals', (await as('trang@example.com','select count(*)::int c from public.tutor_proposals'))[0].c, 1);
check('ended tutor sees none of own old sessions', (await as('old@example.com','select count(*)::int c from public.teaching_sessions'))[0].c, 0);
check('parent sees all sessions of child', (await as('me@example.com','select count(*)::int c from public.teaching_sessions'))[0].c, 2);
check('parent sees all proposals of child', (await as('me@example.com','select count(*)::int c from public.tutor_proposals'))[0].c, 2);
check('student cannot read sessions', (await as('nguyen@example.com','select count(*)::int c from public.teaching_sessions'))[0].c, 0);
check('student cannot read proposals', (await as('nguyen@example.com','select count(*)::int c from public.tutor_proposals'))[0].c, 0);
check('tutor cannot insert a session directly', isErr(await as('trang@example.com',`insert into public.teaching_sessions (student_id, tutor_id, taught_on) select id, auth.uid(), current_date from public.students`)), true);
check('tutor cannot edit own proposal directly', isErr(await as('trang@example.com',`update public.tutor_proposals set level = 4`)), true);
check('proposal must match its session student/tutor', await db.query(`insert into public.tutor_proposals (session_id, student_id, tutor_id, unit_id, level, system_level, answers) select ts.id, ts.student_id, (select id from auth.users where email='old@example.com'), 'htl-2', 1, 0, 0 from public.teaching_sessions ts where ts.note='buổi 1'`).then(()=>'ok', e=>'ERROR '+e.message).then(isErr), true);
check('proposal level must be 0–4', await db.query(`insert into public.tutor_proposals (session_id, student_id, tutor_id, unit_id, level, system_level, answers) select id, student_id, tutor_id, 'htl-2', 5, 0, 0 from public.teaching_sessions where note='buổi 1'`).then(()=>'ok', e=>'ERROR '+e.message).then(isErr), true);
check('note longer than 500 rejected', await db.query(`insert into public.teaching_sessions (student_id, tutor_id, taught_on, note) select student_id, tutor_id, current_date, repeat('x', 501) from public.teaching_sessions where note='buổi 1'`).then(()=>'ok', e=>'ERROR '+e.message).then(isErr), true);
// 0007: homework (S3b part B) — written by service_role, read through RLS
await db.exec(`set role service_role`);
const hw = await db.query(`
  insert into public.homework (session_id, student_id, tutor_id, unit_id, task, links, due_on)
  select id, student_id, tutor_id, 'htl-1', case when note = 'buổi 1' then 'bài mới' else 'bài cũ' end, array['https://drive.google.com/x'], current_date + 3
  from public.teaching_sessions`).then(()=>true, e=>{console.error(e.message); return false;});
await db.exec(`reset role`);
check('service_role can write homework', hw, true);
check('student sees own homework (both tutors)', (await as('nguyen@example.com','select count(*)::int c from public.homework'))[0].c, 2);
check('other student sees none', (await as('an@example.com','select count(*)::int c from public.homework'))[0].c, 0);
check('active tutor sees only own homework', names(await as('trang@example.com','select task from public.homework')), ['bài mới']);
check('ended tutor sees no homework', (await as('old@example.com','select count(*)::int c from public.homework'))[0].c, 0);
check('parent sees all homework of child', (await as('me@example.com','select count(*)::int c from public.homework'))[0].c, 2);
check('student cannot mark done directly (server-only)', isErr(await as('nguyen@example.com',`update public.homework set done_at = now()`)), true);
check('tutor cannot insert homework directly', isErr(await as('trang@example.com',`insert into public.homework (session_id, student_id, tutor_id, task, due_on) select id, student_id, tutor_id, 'x', current_date from public.teaching_sessions`)), true);
const bad = (sql) => db.query(sql).then(()=>'ok', e=>'ERROR '+e.message).then(isErr);
const hwIns = (cols) => `insert into public.homework (session_id, student_id, tutor_id, task, links, due_on) select id, student_id, ${cols} from public.teaching_sessions where note='buổi 1'`;
check('homework must match its session tutor', await bad(hwIns(`(select id from auth.users where email='old@example.com'), 'x', '{}', current_date`)), true);
check('homework task 1–300 chars', await bad(hwIns(`tutor_id, '', '{}', current_date`)) && await bad(hwIns(`tutor_id, repeat('x', 301), '{}', current_date`)), true);
check('homework links: at most 3', await bad(hwIns(`tutor_id, 'x', array['https://a','https://b','https://c','https://d'], current_date`)), true);
check('homework links: https only', await bad(hwIns(`tutor_id, 'x', array['http://drive.google.com/x'], current_date`)) && await bad(hwIns(`tutor_id, 'x', array['javascript:alert(1)'], current_date`)), true);
check('homework links: no null elements', await bad(hwIns(`tutor_id, 'x', array[null]::text[], current_date`)), true);
check('homework_links_ok has a fixed search_path', (await db.query(`select proconfig from pg_proc where proname = 'homework_links_ok'`)).rows[0].proconfig, ['search_path=""']);
check('review note needs reviewed_at', await bad(`update public.homework set review_note = 'x' where task = 'bài mới'`), true);
await db.exec(`update public.profiles set is_active=false where id=(select id from auth.users where email='trang@example.com')`);
check('locked tutor sees no sessions', (await as('trang@example.com','select count(*)::int c from public.teaching_sessions'))[0].c, 0);
check('locked tutor sees no homework', (await as('trang@example.com','select count(*)::int c from public.homework'))[0].c, 0);
console.log(fail ? `\n${fail} FAILED` : '\nALL PASSED'); process.exit(fail ? 1 : 0);
