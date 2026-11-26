create table if not exists profiles(
  id uuid primary key references auth.users on delete cascade,
  full_name text, role text not null default 'student' check (role in ('student','teacher','admin')),
  bio text, avatar_url text, created_at timestamptz default now());
create table if not exists categories(id serial primary key, name text not null, icon text);
create table if not exists courses(
  id uuid primary key default gen_random_uuid(), title text not null, description text,
  category_id int references categories(id), teacher_id uuid references profiles(id) on delete cascade,
  cover_url text, level text default 'مبتدئ', status text not null default 'draft' check (status in ('draft','pending','published')),
  created_at timestamptz default now());
create table if not exists lessons(
  id uuid primary key default gen_random_uuid(), course_id uuid references courses(id) on delete cascade,
  title text not null, video_url text, content text, position int default 0, created_at timestamptz default now());
create table if not exists enrollments(
  student_id uuid references profiles(id) on delete cascade, course_id uuid references courses(id) on delete cascade,
  created_at timestamptz default now(), primary key(student_id, course_id));
create table if not exists lesson_progress(
  student_id uuid references profiles(id) on delete cascade, lesson_id uuid references lessons(id) on delete cascade,
  done boolean default true, primary key(student_id, lesson_id));

create or replace function is_admin() returns boolean language sql security definer stable set search_path = public as
$$ select exists(select 1 from profiles where id=auth.uid() and role='admin') $$;
create or replace function is_teacher() returns boolean language sql security definer stable set search_path = public as
$$ select exists(select 1 from profiles where id=auth.uid() and role in ('teacher','admin')) $$;

create or replace function handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles(id, full_name, role) values (new.id, coalesce(new.raw_user_meta_data->>'full_name',''),
    case when new.raw_user_meta_data->>'role'='teacher' then 'teacher' else 'student' end);
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function handle_new_user();

alter table profiles enable row level security; alter table categories enable row level security;
alter table courses enable row level security; alter table lessons enable row level security;
alter table enrollments enable row level security; alter table lesson_progress enable row level security;

do $$ declare r record; begin
 for r in select policyname, tablename from pg_policies where schemaname='public' loop
  execute format('drop policy %I on public.%I', r.policyname, r.tablename); end loop; end $$;

create policy p_read on profiles for select using (true);
create policy p_upd on profiles for update using (id=auth.uid() or is_admin())
  with check (is_admin() or (id=auth.uid() and role=(select role from profiles where id=auth.uid())));
create policy c_read on categories for select using (true);
create policy c_all on categories for all using (is_admin()) with check (is_admin());

create policy co_read on courses for select using (status='published' or teacher_id=auth.uid() or is_admin());
create policy co_ins on courses for insert with check (is_teacher() and (teacher_id=auth.uid() or is_admin()));
create policy co_upd on courses for update using (teacher_id=auth.uid() or is_admin())
  with check (is_admin() or (teacher_id=auth.uid() and status in ('draft','pending')));
create policy co_del on courses for delete using (teacher_id=auth.uid() or is_admin());

create policy l_read on lessons for select using (exists(select 1 from courses c where c.id=course_id
  and (c.status='published' or c.teacher_id=auth.uid() or is_admin())));
create policy l_all on lessons for all using (exists(select 1 from courses c where c.id=course_id and (c.teacher_id=auth.uid() or is_admin())))
  with check (exists(select 1 from courses c where c.id=course_id and (c.teacher_id=auth.uid() or is_admin())));

create policy e_read on enrollments for select using (student_id=auth.uid() or is_admin()
  or exists(select 1 from courses c where c.id=course_id and c.teacher_id=auth.uid()));
create policy e_ins on enrollments for insert with check (student_id=auth.uid());
create policy e_del on enrollments for delete using (student_id=auth.uid() or is_admin());

create policy lp_read on lesson_progress for select using (student_id=auth.uid() or is_admin());
create policy lp_ins on lesson_progress for insert with check (student_id=auth.uid());
create policy lp_del on lesson_progress for delete using (student_id=auth.uid());

insert into categories(name, icon) select * from (values ('تطوير المهارات','🚀'),('ريادة الأعمال','💼'),('التعليم المدرسي','🎓'),('اللغات','🌍'),('التصميم','🎨'),('البرمجة','💻')) v(name,icon) where not exists (select 1 from categories);
-- بعد التسجيل، اجعل حسابك أدمن:  update profiles set role='admin' where id=(select id from auth.users where email='EMAIL');

grant usage on schema public to anon, authenticated;
grant select on all tables in schema public to anon, authenticated;
grant insert, update, delete on all tables in schema public to authenticated;
grant usage, select on all sequences in schema public to authenticated;
grant execute on all functions in schema public to anon, authenticated;
alter default privileges in schema public grant select on tables to anon, authenticated;
alter default privileges in schema public grant insert, update, delete on tables to authenticated;
