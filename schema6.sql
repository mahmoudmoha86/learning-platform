create table if not exists stages(id serial primary key, name text not null, position int default 0);
create table if not exists grades(id serial primary key, stage_id int references stages(id) on delete cascade, name text not null, position int default 0);
create table if not exists subjects(id serial primary key, name text not null, icon text, position int default 0);
alter table courses add column if not exists grade_id int references grades(id) on delete set null;
alter table courses add column if not exists subject_id int references subjects(id) on delete set null;
alter table stages enable row level security; alter table grades enable row level security; alter table subjects enable row level security;
drop policy if exists st_r on stages; create policy st_r on stages for select using (true);
drop policy if exists gr_r on grades; create policy gr_r on grades for select using (true);
drop policy if exists su_r on subjects; create policy su_r on subjects for select using (true);
drop policy if exists st_w on stages; create policy st_w on stages for all using (is_admin() or has_perm('courses')) with check (is_admin() or has_perm('courses'));
drop policy if exists gr_w on grades; create policy gr_w on grades for all using (is_admin() or has_perm('courses')) with check (is_admin() or has_perm('courses'));
drop policy if exists su_w on subjects; create policy su_w on subjects for all using (is_admin() or has_perm('courses')) with check (is_admin() or has_perm('courses'));
grant select on stages, grades, subjects to anon, authenticated; grant insert, update, delete on stages, grades, subjects to authenticated;
grant usage, select on sequence stages_id_seq, grades_id_seq, subjects_id_seq to authenticated;
create or replace function guard_course_price() returns trigger language plpgsql security definer set search_path=public as $$
begin if auth.uid() is not null and not (is_admin() or has_perm('courses')) then new.price := old.price; end if; return new; end $$;
drop trigger if exists courses_price_guard on courses; create trigger courses_price_guard before update on courses for each row execute function guard_course_price();
do $$ declare s1 int; s2 int; s3 int; begin
if not exists (select 1 from stages) then
 insert into stages(name,position) values ('المرحلة الابتدائية',1) returning id into s1;
 insert into stages(name,position) values ('المرحلة الإعدادية',2) returning id into s2;
 insert into stages(name,position) values ('المرحلة الثانوية',3) returning id into s3;
 insert into grades(stage_id,name,position) select s1,'الصف '||x.n,x.i from (values ('الأول',1),('الثاني',2),('الثالث',3),('الرابع',4),('الخامس',5),('السادس',6)) x(n,i);
 insert into grades(stage_id,name,position) select s2,'الصف '||x.n||' الإعدادي',x.i from (values ('الأول',1),('الثاني',2),('الثالث',3)) x(n,i);
 insert into grades(stage_id,name,position) select s3,'الصف '||x.n||' الثانوي',x.i from (values ('الأول',1),('الثاني',2),('الثالث',3)) x(n,i);
 insert into subjects(name,icon,position) values ('اللغة العربية','📖',1),('اللغة الإنجليزية','🔤',2),('الرياضيات','➗',3),('العلوم','🔬',4),('الدراسات الاجتماعية','🌍',5);
end if; end $$;
