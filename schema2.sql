-- Part 2: content management, reviews, quizzes, storage. Run after schema.sql
alter table profiles add column if not exists phone text;
alter table profiles add column if not exists title text;
alter table categories add column if not exists description text;
alter table courses add column if not exists instructor_name text;
alter table courses add column if not exists duration text;
alter table courses add column if not exists outcomes text;
alter table courses add column if not exists featured boolean default false;
alter table courses add column if not exists emoji text;
alter table courses add column if not exists color text;

create table if not exists site_settings(key text primary key, value jsonb not null default '{}'::jsonb);
create table if not exists faqs(id serial primary key, q text not null, a text, position int default 0);
create table if not exists testimonials(id serial primary key, name text not null, role text, text text, avatar_url text, position int default 0);
create table if not exists partners(id serial primary key, name text not null, logo_url text, position int default 0);
create table if not exists messages(id serial primary key, name text, email text, subject text, body text, is_read boolean default false, created_at timestamptz default now());
create table if not exists reviews(course_id uuid references courses(id) on delete cascade, student_id uuid references profiles(id) on delete cascade,
  rating int check (rating between 1 and 5), comment text, created_at timestamptz default now(), primary key(course_id, student_id));
create table if not exists quiz_questions(id uuid primary key default gen_random_uuid(), course_id uuid references courses(id) on delete cascade,
  question text not null, options jsonb not null default '[]'::jsonb, answer int not null default 0, position int default 0);
create table if not exists quiz_attempts(id uuid primary key default gen_random_uuid(), student_id uuid references profiles(id) on delete cascade,
  course_id uuid references courses(id) on delete cascade, score int, total int, created_at timestamptz default now());

alter table site_settings enable row level security; alter table faqs enable row level security; alter table testimonials enable row level security;
alter table partners enable row level security; alter table messages enable row level security; alter table reviews enable row level security;
alter table quiz_questions enable row level security; alter table quiz_attempts enable row level security;

do $$ declare r record; begin
 for r in select policyname, tablename from pg_policies where schemaname='public'
   and tablename in ('site_settings','faqs','testimonials','partners','messages','reviews','quiz_questions','quiz_attempts') loop
  execute format('drop policy %I on public.%I', r.policyname, r.tablename); end loop; end $$;

create policy ss_read on site_settings for select using (true);
create policy ss_all on site_settings for all using (is_admin()) with check (is_admin());
create policy fq_read on faqs for select using (true);
create policy fq_all on faqs for all using (is_admin()) with check (is_admin());
create policy ts_read on testimonials for select using (true);
create policy ts_all on testimonials for all using (is_admin()) with check (is_admin());
create policy pt_read on partners for select using (true);
create policy pt_all on partners for all using (is_admin()) with check (is_admin());
create policy ms_ins on messages for insert with check (true);
create policy ms_read on messages for select using (is_admin());
create policy ms_upd on messages for update using (is_admin());
create policy ms_del on messages for delete using (is_admin());
create policy rv_read on reviews for select using (true);
create policy rv_ins on reviews for insert with check (student_id=auth.uid() and exists(select 1 from enrollments e where e.course_id=reviews.course_id and e.student_id=auth.uid()));
create policy rv_upd on reviews for update using (student_id=auth.uid());
create policy rv_del on reviews for delete using (student_id=auth.uid() or is_admin());
create policy qq_read on quiz_questions for select using (exists(select 1 from courses c where c.id=course_id and (c.status='published' or c.teacher_id=auth.uid() or is_admin())));
create policy qq_all on quiz_questions for all using (exists(select 1 from courses c where c.id=course_id and (c.teacher_id=auth.uid() or is_admin())))
  with check (exists(select 1 from courses c where c.id=course_id and (c.teacher_id=auth.uid() or is_admin())));
create policy qa_read on quiz_attempts for select using (student_id=auth.uid() or is_admin());
create policy qa_ins on quiz_attempts for insert with check (student_id=auth.uid());

-- storage bucket for images
insert into storage.buckets(id,name,public) values('media','media',true) on conflict (id) do update set public=true;
drop policy if exists media_read on storage.objects; drop policy if exists media_ins on storage.objects;
drop policy if exists media_upd on storage.objects; drop policy if exists media_del on storage.objects;
create policy media_read on storage.objects for select using (bucket_id='media');
create policy media_ins on storage.objects for insert to authenticated with check (bucket_id='media');
create policy media_upd on storage.objects for update to authenticated using (bucket_id='media' and (owner=auth.uid() or is_admin()));
create policy media_del on storage.objects for delete to authenticated using (bucket_id='media' and (owner=auth.uid() or is_admin()));

grant select on all tables in schema public to anon, authenticated;
grant insert, update, delete on all tables in schema public to authenticated;
grant insert on messages to anon;
grant usage, select on all sequences in schema public to anon, authenticated;

-- default settings (only if empty)
insert into site_settings(key,value) values ('site', $j${
 "name":"منصة تعلّم","tagline":"تعلّم في أي وقت ومن أي مكان","logo_url":"","primary":"#1b5fd1","accent":"#f5b800",
 "announcement":"🎉 التسجيل مجاني لكل الكورسات، ابدأ رحلتك اليوم",
 "hero_title":"ارتقِ بمهاراتك وابنِ مستقبلك","hero_subtitle":"كورسات تعليمية في تطوير المهارات وريادة الأعمال والتعليم المدرسي، من مدرسين متخصصين وبشكل مجاني.","hero_image":"","hero_cta":"تصفّح الكورسات",
 "about_title":"عن المنصة","about_text":"منصة تعلّم هي منصة تعليمية إلكترونية تهدف إلى إتاحة تعليم عالي الجودة للجميع. نقدّم دورات في تطوير المهارات الشخصية والمهنية، ودعم رواد الأعمال، والتعليم المدرسي، بإشراف مدرسين متخصصين.","about_image":"",
 "vision":"أن نكون الوجهة الأولى للتعلم الذاتي في العالم العربي.","mission":"إتاحة محتوى تعليمي مميز ومجاني يساعد كل متعلم على تحقيق هدفه.",
 "tracks":[{"emoji":"🚀","title":"الارتقاء بالمهارات","desc":"دورات وبرامج لتطوير المهارات الشخصية والمهنية"},{"emoji":"💼","title":"ريادة الأعمال","desc":"دورات وبرامج لتطوير مهارات ريادة الأعمال وبناء المشروعات"},{"emoji":"🎓","title":"التعليم المدرسي","desc":"شرح مبسّط للمناهج الدراسية لمراحل مختلفة"}],
 "features":[{"emoji":"🎥","title":"دروس فيديو مرنة","desc":"شاهد في أي وقت وبالسرعة التي تناسبك"},{"emoji":"📝","title":"اختبارات تقييم","desc":"قيّم مستواك بعد كل كورس"},{"emoji":"🏅","title":"شهادات إتمام","desc":"احصل على شهادة عند إكمال الكورس"},{"emoji":"👩‍🏫","title":"مدرسون متخصصون","desc":"محتوى من خبراء في مجالاتهم"}],
 "contact":{"email":"","phone":"","whatsapp":"","address":"","hours":"من السبت إلى الخميس، 9 ص - 5 م"},
 "social":{"facebook":"","youtube":"","instagram":"","twitter":"","linkedin":""},
 "footer_text":"© جميع الحقوق محفوظة",
 "terms":"باستخدامك للمنصة فإنك توافق على الشروط التالية: استخدام المحتوى للأغراض التعليمية الشخصية فقط، وعدم إعادة نشره دون إذن، والحفاظ على سرية بيانات حسابك، واحترام المدرسين والمتعلمين الآخرين. تحتفظ إدارة المنصة بحق تعديل الشروط في أي وقت.",
 "privacy":"نحن نحترم خصوصيتك. نجمع فقط البيانات اللازمة لتشغيل حسابك (الاسم والبريد الإلكتروني وتقدمك في الكورسات). لا نبيع بياناتك لأي طرف. يمكنك طلب حذف حسابك في أي وقت عبر صفحة اتصل بنا."
}$j$::jsonb) on conflict (key) do nothing;

insert into faqs(q,a,position) select * from (values
 ('هل الكورسات مجانية؟','نعم، التسجيل في الكورسات مجاني بالكامل.',1),
 ('كيف أسجّل في كورس؟','أنشئ حسابًا جديدًا ثم افتح صفحة الكورس واضغط زر التسجيل.',2),
 ('هل أحصل على شهادة؟','نعم، تحصل على شهادة إتمام عند إكمال جميع دروس الكورس.',3),
 ('كيف أصبح مدرّسًا على المنصة؟','أنشئ حسابًا بنوع "مدرس"، ثم أضف كورسك وأرسله للمراجعة، وبعد موافقة الإدارة يتم نشره.',4),
 ('نسيت كلمة المرور، ماذا أفعل؟','تواصل معنا عبر صفحة اتصل بنا وسنساعدك في استعادة حسابك.',5)
) v(q,a,position) where not exists (select 1 from faqs);

insert into testimonials(name,role,text,position) select * from (values
 ('أحمد محمود','طالب','المنصة سهلة وشرح الكورسات واضح، استفدت منها جدًا في تطوير مهاراتي.',1),
 ('سارة علي','رائدة أعمال','كورس ريادة الأعمال ساعدني أبدأ مشروعي بخطة واضحة.',2),
 ('محمد حسن','طالب ثانوي','الشرح مبسّط والاختبارات بعد الدروس ساعدتني أراجع كويس.',3)
) v(name,role,text,position) where not exists (select 1 from testimonials);

update categories set description = case name
  when 'تطوير المهارات' then 'مهارات شخصية ومهنية لتطوير مسارك'
  when 'ريادة الأعمال' then 'من الفكرة إلى المشروع الناجح'
  when 'التعليم المدرسي' then 'شرح المناهج الدراسية بأسلوب مبسّط'
  when 'اللغات' then 'تعلّم لغات جديدة خطوة بخطوة'
  when 'التصميم' then 'أساسيات التصميم والإبداع'
  when 'البرمجة' then 'ابدأ رحلتك في عالم البرمجة' else description end where description is null;

-- sample courses (only if no courses exist)
do $$ declare cid uuid; cat int; i int; begin
 if not exists (select 1 from courses) then
  for i in 1..6 loop
   select id into cat from categories order by id offset (i-1) limit 1;
   insert into courses(title,description,category_id,instructor_name,level,status,duration,featured,emoji,color,outcomes) values (
    (array['مهارات التواصل الفعّال','أساسيات ريادة الأعمال','الرياضيات للمرحلة الإعدادية','اللغة الإنجليزية للمبتدئين','مبادئ التصميم الجرافيكي','مقدمة في البرمجة'])[i],
    (array['تعلّم كيف تتواصل بثقة وتقنع وتنصت جيدًا في العمل والحياة.','من الفكرة إلى الخطة: كيف تبدأ مشروعك الأول خطوة بخطوة.','شرح مبسّط لأهم دروس الرياضيات مع أمثلة وتدريبات.','ابدأ من الصفر وتعلّم الأساسيات: المحادثة والمفردات والقواعد.','تعرّف على الألوان والخطوط والتكوين وأسس تصميم احترافي.','افهم أساسيات البرمجة والتفكير المنطقي وابدأ أول برنامج لك.'])[i],
    cat,'فريق المنصة',(array['مبتدئ','مبتدئ','متوسط','مبتدئ','مبتدئ','مبتدئ'])[i],'published',(array['3 ساعات','4 ساعات','6 ساعات','5 ساعات','4 ساعات','6 ساعات'])[i], i<=3,
    (array['🗣️','💡','📐','🔤','🎨','💻'])[i],(array['#1b5fd1','#d97706','#0f766e','#7c3aed','#db2777','#0ea5e9'])[i],
    E'فهم الأساسيات بشكل واضح\nتطبيق عملي على أمثلة حقيقية\nاختبار نهائي لقياس مستواك\nشهادة إتمام الكورس') returning id into cid;
   insert into lessons(course_id,title,content,position) values
    (cid,'المقدمة والأهداف','في هذا الدرس نتعرّف على أهداف الكورس وما ستتعلمه في كل جزء. (محتوى تجريبي يمكن للأدمن تعديله)',1),
    (cid,'المفاهيم الأساسية','نشرح أهم المفاهيم الأساسية بأسلوب مبسّط مع أمثلة. (محتوى تجريبي)',2),
    (cid,'التطبيق العملي','نطبّق ما تعلمناه خطوة بخطوة على مثال عملي. (محتوى تجريبي)',3),
    (cid,'الخلاصة والخطوات التالية','نراجع أهم النقاط ونتعرف على كيفية مواصلة التعلم. (محتوى تجريبي)',4);
   insert into quiz_questions(course_id,question,options,answer,position) values
    (cid,'ما الهدف الرئيسي من هذا الكورس؟','["اكتساب مهارة جديدة","تضييع الوقت","لا شيء"]',0,1),
    (cid,'ما أفضل طريقة للاستفادة من الدروس؟','["المشاهدة فقط","المشاهدة مع التطبيق","تجاهل الدروس"]',1,2);
  end loop;
 end if;
end $$;
