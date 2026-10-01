-- 0002: fix two production issues found during the P0 acceptance test.
--  1) Supabase no longer auto-grants new public tables to service_role, so every
--     server-side (admin client) call failed with "permission denied".
--  2) GoTrue may insert the auth user first and set app_metadata afterwards, so the
--     AFTER INSERT trigger saw role = NULL and skipped creating the profile.
--     The trigger now also fires when raw_app_meta_data is updated.
-- Idempotent: safe to run more than once.

-- (1) Server-only role gets full access (clients keep SELECT-only via RLS + grants from 0001).
grant usage on schema public to service_role;
grant select, insert, update, delete
  on public.profiles, public.students, public.parent_students,
     public.tutor_assignments, public.heartbeat
  to service_role;

-- (2) Robust profile-creation trigger.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
declare r text := new.raw_app_meta_data ->> 'role';
begin
  if r is null then return new; end if;
  insert into public.profiles (id, role, display_name)
  values (new.id, r::public.app_role,
    coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert or update of raw_app_meta_data on auth.users
  for each row execute function public.handle_new_user();

-- (3) Backfill: users created before this fix that have a role but no profile.
insert into public.profiles (id, role, display_name)
select u.id, (u.raw_app_meta_data ->> 'role')::public.app_role,
       coalesce(nullif(u.raw_user_meta_data ->> 'display_name', ''), split_part(u.email, '@', 1))
from auth.users u
where u.raw_app_meta_data ->> 'role' is not null
  and not exists (select 1 from public.profiles p where p.id = u.id)
on conflict (id) do nothing;
