-- =====================================================================
-- Run ONCE, after creating the first parent login in the Supabase
-- dashboard (Authentication → Users → Add user → "Create new user",
-- tick "Auto confirm user").
--
-- Replace the email below with that parent's email, then run in the
-- SQL Editor. It promotes the user to parent and creates Nguyên's
-- student record linked to that parent.
-- =====================================================================
do $$
declare
  parent_email text := 'REPLACE_WITH_PARENT_EMAIL';
  uid uuid;
  sid uuid;
begin
  select id into uid from auth.users where email = parent_email;
  if uid is null then
    raise exception 'No auth user with email %', parent_email;
  end if;

  update auth.users
     set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"parent"}'
   where id = uid;

  insert into public.profiles (id, role, display_name)
  values (uid, 'parent', 'Phụ huynh')
  on conflict (id) do update set role = 'parent', is_active = true;

  insert into public.students (full_name, grade)
  values ('Hạnh Nguyên', 9)
  returning id into sid;

  insert into public.parent_students (parent_id, student_id) values (uid, sid);
end $$;
