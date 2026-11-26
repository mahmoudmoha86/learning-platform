const sb = supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY);
const $ = s => document.querySelector(s), app = $('#app');
let me = null, cats = [];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const toast = m => { const d = document.createElement('div'); d.className = 'toast'; d.textContent = m; document.body.append(d); setTimeout(() => d.remove(), 2500); };
const roleAr = { student: 'طالب', teacher: 'مدرس', admin: 'أدمن' };
const stAr = { draft: 'مسودة', pending: 'بانتظار الموافقة', published: 'منشور' };
const emb = u => { if (!u) return ''; let m = u.match(/(?:youtu\.be\/|v=|embed\/)([\w-]{11})/); return m ? 'https://www.youtube.com/embed/' + m[1] : u; };
const catName = id => (cats.find(c => c.id == id) || {}).name || 'عام';
const catIcon = id => (cats.find(c => c.id == id) || {}).icon || '📘';

async function loadMe() {
  const { data: { session } } = await sb.auth.getSession();
  me = null;
  if (session) { const { data } = await sb.from('profiles').select('*').eq('id', session.user.id).single(); me = data; }
  const { data: c } = await sb.from('categories').select('*').order('id'); cats = c || [];
  header();
}
function header() {
  $('#hdr').innerHTML = `<a class="logo" href="#/">📚 منصة <b>تعلّم</b></a>
  <nav><a href="#/">الرئيسية</a><a href="#/courses">الكورسات</a>${me ? '<a href="#/dashboard">لوحتي</a>' : ''}${me && me.role === 'admin' ? '<a href="#/admin">الإدارة</a>' : ''}</nav>
  ${me ? `<span class="muted">${esc(me.full_name)} · ${roleAr[me.role]}</span><button class="btn o s" id="out">خروج</button>` : '<a class="btn o s" href="#/login">دخول</a><a class="btn s" href="#/register">حساب جديد</a>'}`;
  const o = $('#out'); if (o) o.onclick = async () => { await sb.auth.signOut(); location.hash = '#/'; await loadMe(); route(); };
}
function courseCard(c, extra = '') {
  return `<div class="card"><div class="cv" style="${c.cover_url ? `background-image:url('${esc(c.cover_url)}')` : ''}">${c.cover_url ? '' : catIcon(c.category_id)}</div>
  <div class="bd"><span class="tag">${esc(catName(c.category_id))}</span><h3>${esc(c.title)}</h3>
  <div class="muted">${esc(c.profiles?.full_name || '')} · ${esc(c.level)}</div>${extra}
  <div style="margin-top:auto"><a class="btn s" href="#/course/${c.id}">التفاصيل</a></div></div></div>`;
}
const needLogin = () => { if (!me) { location.hash = '#/login'; return true; } };

async function home() {
  const { data } = await sb.from('courses').select('*,profiles(full_name)').eq('status', 'published').order('created_at', { ascending: false }).limit(6);
  const { count: st } = await sb.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'student');
  const { count: te } = await sb.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'teacher');
  app.innerHTML = `<div class="hero"><h1>تعلّم مهارات جديدة في أي وقت</h1><p>كورسات من مدرسين متخصصين في تطوير المهارات وريادة الأعمال والتعليم المدرسي.</p>
  <a class="btn y" href="#/courses">تصفّح الكورسات</a> ${me ? '' : '<a class="btn o" href="#/register">ابدأ مجانًا</a>'}</div>
  <div class="stats"><div class="stat"><b>${(data || []).length}+</b>كورس</div><div class="stat"><b>${st || 0}</b>طالب</div><div class="stat"><b>${te || 0}</b>مدرس</div></div>
  <h2>التصنيفات</h2><div class="grid">${cats.map(c => `<a class="card" href="#/courses?cat=${c.id}"><div class="bd" style="text-align:center"><div style="font-size:2rem">${c.icon || '📘'}</div><b>${esc(c.name)}</b></div></a>`).join('')}</div>
  <h2>أحدث الكورسات</h2><div class="grid">${(data || []).map(c => courseCard(c)).join('') || '<p class="muted">لا توجد كورسات منشورة بعد.</p>'}</div>`;
}
async function courses(q) {
  const p = new URLSearchParams(q || ''); const cat = p.get('cat') || '', s = p.get('s') || '';
  let r = sb.from('courses').select('*,profiles(full_name)').eq('status', 'published').order('created_at', { ascending: false });
  if (cat) r = r.eq('category_id', cat); if (s) r = r.ilike('title', `%${s}%`);
  const { data } = await r;
  app.innerHTML = `<h1>الكورسات</h1><div class="box row"><input id="s" placeholder="ابحث عن كورس" value="${esc(s)}" style="flex:2;margin:0">
  <select id="cat" style="flex:1;margin:0"><option value="">كل التصنيفات</option>${cats.map(c => `<option value="${c.id}" ${c.id == cat ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select>
  <button class="btn" id="go">بحث</button></div><div class="grid">${(data || []).map(c => courseCard(c)).join('') || '<p class="muted">لا نتائج.</p>'}</div>`;
  $('#go').onclick = () => location.hash = `#/courses?cat=${$('#cat').value}&s=${encodeURIComponent($('#s').value)}`;
}
async function course(id) {
  const { data: c } = await sb.from('courses').select('*,profiles(full_name,bio)').eq('id', id).single();
  if (!c) { app.innerHTML = '<p>الكورس غير موجود.</p>'; return; }
  const { data: ls } = await sb.from('lessons').select('id,title,position').eq('course_id', id).order('position');
  let enr = false; if (me) { const { data } = await sb.from('enrollments').select('course_id').eq('student_id', me.id).eq('course_id', id); enr = !!(data && data.length); }
  app.innerHTML = `<div class="box"><span class="tag">${esc(catName(c.category_id))}</span> <span class="tag y">${esc(c.level)}</span> ${c.status !== 'published' ? `<span class="tag">${stAr[c.status]}</span>` : ''}
  <h1>${esc(c.title)}</h1><p>${esc(c.description)}</p><p class="muted">المدرس: ${esc(c.profiles?.full_name || '')}${c.profiles?.bio ? ' · ' + esc(c.profiles.bio) : ''}</p>
  ${enr ? `<a class="btn" href="#/learn/${id}">تابع التعلّم</a>` : `<button class="btn" id="en">سجّل في الكورس مجانًا</button>`}</div>
  <div class="box"><h3>محتوى الكورس (${(ls || []).length} درس)</h3>${(ls || []).map((l, i) => `<div class="ls">${i + 1}. ${esc(l.title)}</div>`).join('') || '<p class="muted">لا دروس بعد.</p>'}</div>`;
  const b = $('#en'); if (b) b.onclick = async () => {
    if (!me) { location.hash = '#/login'; return; }
    if (me.role !== 'student') { toast('التسجيل في الكورسات للطلاب فقط'); return; }
    const { error } = await sb.from('enrollments').insert({ student_id: me.id, course_id: id });
    if (error) toast('تعذّر التسجيل'); else location.hash = `#/learn/${id}`;
  };
}
async function learn(id, lid) {
  if (needLogin()) return;
  const { data: c } = await sb.from('courses').select('*').eq('id', id).single();
  const { data: ls } = await sb.from('lessons').select('*').eq('course_id', id).order('position');
  const { data: pr } = await sb.from('lesson_progress').select('lesson_id').eq('student_id', me.id);
  const done = new Set((pr || []).map(x => x.lesson_id)); const mine = (ls || []).filter(l => done.has(l.id)).length;
  const cur = (ls || []).find(l => l.id === lid) || (ls || [])[0];
  const pct = ls && ls.length ? Math.round(mine / ls.length * 100) : 0;
  app.innerHTML = `<h2>${esc(c.title)}</h2><div class="lay"><div class="box" style="padding:0"><div style="padding:12px"><div class="bar"><i style="width:${pct}%"></i></div><div class="muted">${pct}% مكتمل</div></div>
  ${(ls || []).map((l, i) => `<div class="ls ${cur && l.id === cur.id ? 'on' : ''}" data-id="${l.id}">${done.has(l.id) ? '✅' : '⭕'} ${i + 1}. ${esc(l.title)}</div>`).join('')}</div>
  <div class="box">${cur ? `<h3>${esc(cur.title)}</h3>${cur.video_url ? `<iframe class="vid" src="${esc(emb(cur.video_url))}" allowfullscreen></iframe>` : ''}<p style="white-space:pre-wrap">${esc(cur.content)}</p>
  <button class="btn ${done.has(cur.id) ? 'o' : ''}" id="dn">${done.has(cur.id) ? 'إلغاء الإكمال' : 'تم إكمال الدرس ✓'}</button>` : '<p class="muted">لا دروس بعد.</p>'}</div></div>`;
  document.querySelectorAll('.ls[data-id]').forEach(e => e.onclick = () => location.hash = `#/learn/${id}/${e.dataset.id}`);
  const d = $('#dn'); if (d) d.onclick = async () => {
    if (done.has(cur.id)) await sb.from('lesson_progress').delete().eq('student_id', me.id).eq('lesson_id', cur.id);
    else await sb.from('lesson_progress').insert({ student_id: me.id, lesson_id: cur.id });
    learn(id, cur.id);
  };
}
function authForm(reg) {
  app.innerHTML = `<div class="box narrow"><h2>${reg ? 'حساب جديد' : 'تسجيل الدخول'}</h2>
  ${reg ? `<label>الاسم</label><input id="nm"><label>نوع الحساب</label><select id="rl"><option value="student">طالب</option><option value="teacher">مدرس</option></select>` : ''}
  <label>البريد الإلكتروني</label><input id="em" type="email"><label>كلمة المرور</label><input id="pw" type="password">
  <button class="btn" id="ok" style="width:100%">${reg ? 'إنشاء الحساب' : 'دخول'}</button>
  <p class="muted">${reg ? '<a href="#/login">عندي حساب</a>' : '<a href="#/register">إنشاء حساب جديد</a>'}</p></div>`;
  $('#ok').onclick = async () => {
    const email = $('#em').value.trim(), password = $('#pw').value; let r;
    if (reg) r = await sb.auth.signUp({ email, password, options: { data: { full_name: $('#nm').value.trim(), role: $('#rl').value } } });
    else r = await sb.auth.signInWithPassword({ email, password });
    if (r.error) { toast(r.error.message); return; }
    if (!r.data.session) { toast('تحقق من بريدك لتأكيد الحساب'); return; }
    await loadMe(); location.hash = '#/dashboard';
  };
}
async function dashboard() {
  if (needLogin()) return;
  if (me.role === 'student') {
    const { data } = await sb.from('enrollments').select('course_id,courses(*,profiles(full_name))').eq('student_id', me.id);
    const { data: pr } = await sb.from('lesson_progress').select('lesson_id,lessons(course_id)').eq('student_id', me.id);
    const cnt = {}; (pr || []).forEach(p => { const k = p.lessons?.course_id; cnt[k] = (cnt[k] || 0) + 1; });
    const tots = {}; for (const e of data || []) { const { count } = await sb.from('lessons').select('*', { count: 'exact', head: true }).eq('course_id', e.course_id); tots[e.course_id] = count || 0; }
    app.innerHTML = `<h1>أهلاً ${esc(me.full_name)} 👋</h1><h3>كورساتي</h3><div class="grid">${(data || []).map(e => { const t = tots[e.course_id], p = t ? Math.round((cnt[e.course_id] || 0) / t * 100) : 0;
      return courseCard(e.courses, `<div class="bar"><i style="width:${p}%"></i></div><span class="muted">${p}%</span>`).replace('التفاصيل', 'تابع').replace(`#/course/${e.course_id}`, `#/learn/${e.course_id}`); }).join('') || '<p class="muted">لم تسجّل في أي كورس بعد. <a href="#/courses">تصفّح الكورسات</a></p>'}</div>`;
  } else teacherDash();
}
async function teacherDash() {
  const q = sb.from('courses').select('*').order('created_at', { ascending: false }); if (me.role === 'teacher') q.eq('teacher_id', me.id);
  const { data } = await q; const { data: en } = await sb.from('enrollments').select('course_id');
  const n = {}; (en || []).forEach(e => n[e.course_id] = (n[e.course_id] || 0) + 1);
  app.innerHTML = `<div class="row"><h1 style="flex:1">لوحة المدرس</h1><button class="btn y" id="new">+ كورس جديد</button></div>
  <div class="stats"><div class="stat"><b>${(data || []).length}</b>كورساتي</div><div class="stat"><b>${(en || []).length}</b>إجمالي الطلاب المسجلين</div></div>
  <table><tr><th>الكورس</th><th>الحالة</th><th>الطلاب</th><th></th></tr>${(data || []).map(c => `<tr><td>${esc(c.title)}</td><td>${stAr[c.status]}</td><td>${n[c.id] || 0}</td><td><a class="btn s" href="#/edit/${c.id}">تعديل</a></td></tr>`).join('')}</table>`;
  $('#new').onclick = async () => { const { data: c, error } = await sb.from('courses').insert({ title: 'كورس جديد', teacher_id: me.id }).select().single(); if (error) toast(error.message); else location.hash = `#/edit/${c.id}`; };
}
async function edit(id) {
  if (needLogin()) return;
  const { data: c } = await sb.from('courses').select('*').eq('id', id).single(); if (!c) { app.innerHTML = '<p>غير موجود</p>'; return; }
  const { data: ls } = await sb.from('lessons').select('*').eq('course_id', id).order('position');
  const adm = me.role === 'admin';
  app.innerHTML = `<h1>تعديل الكورس</h1><div class="box"><label>العنوان</label><input id="t" value="${esc(c.title)}"><label>الوصف</label><textarea id="d" rows="4">${esc(c.description)}</textarea>
  <label>التصنيف</label><select id="ct">${cats.map(x => `<option value="${x.id}" ${x.id == c.category_id ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select>
  <label>المستوى</label><select id="lv">${['مبتدئ', 'متوسط', 'متقدم'].map(x => `<option ${x === c.level ? 'selected' : ''}>${x}</option>`).join('')}</select>
  <label>رابط صورة الغلاف (اختياري)</label><input id="cv" value="${esc(c.cover_url)}">
  <div class="row"><button class="btn" id="sv">حفظ</button>${c.status === 'published' && !adm ? '' : `<button class="btn y" id="sub">${adm ? 'نشر' : 'إرسال للمراجعة'}</button>`}
  ${adm && c.status === 'published' ? '<button class="btn o" id="unp">إلغاء النشر</button>' : ''}<button class="btn r" id="del">حذف</button><span class="tag">${stAr[c.status]}</span></div></div>
  <div class="box"><h3>الدروس</h3>${(ls || []).map(l => `<div class="ls"><span style="flex:1">${l.position}. ${esc(l.title)}</span><button class="btn s r" data-del="${l.id}">حذف</button></div>`).join('')}
  <h4>إضافة درس</h4><label>العنوان</label><input id="lt"><label>رابط فيديو (يوتيوب)</label><input id="lv2"><label>الشرح</label><textarea id="lc" rows="4"></textarea><button class="btn" id="al">إضافة الدرس</button></div>`;
  const patch = async o => { const { error } = await sb.from('courses').update(o).eq('id', id); error ? toast(error.message) : toast('تم'); return !error; };
  const vals = () => ({ title: $('#t').value, description: $('#d').value, category_id: +$('#ct').value, level: $('#lv').value, cover_url: $('#cv').value || null });
  $('#sv').onclick = () => patch(vals());
  const sub = $('#sub'); if (sub) sub.onclick = async () => { if (await patch({ ...vals(), status: adm ? 'published' : 'pending' })) edit(id); };
  const unp = $('#unp'); if (unp) unp.onclick = async () => { if (await patch({ status: 'draft' })) edit(id); };
  $('#del').onclick = async () => { if (confirm('حذف الكورس نهائيًا؟')) { await sb.from('courses').delete().eq('id', id); location.hash = '#/dashboard'; } };
  $('#al').onclick = async () => { if (!$('#lt').value) return toast('اكتب عنوان الدرس'); const { error } = await sb.from('lessons').insert({ course_id: id, title: $('#lt').value, video_url: $('#lv2').value || null, content: $('#lc').value, position: (ls || []).length + 1 }); error ? toast(error.message) : edit(id); };
  document.querySelectorAll('[data-del]').forEach(b => b.onclick = async () => { await sb.from('lessons').delete().eq('id', b.dataset.del); edit(id); });
}
async function admin(tab) {
  if (needLogin()) return; if (me.role !== 'admin') { app.innerHTML = '<p>غير مصرّح</p>'; return; }
  tab = tab || 'stats';
  const tabs = `<div class="tabs">${[['stats', 'الإحصائيات'], ['review', 'مراجعة الكورسات'], ['users', 'المستخدمون'], ['cats', 'التصنيفات']].map(([k, v]) => `<a class="${k === tab ? 'on' : ''}" href="#/admin/${k}">${v}</a>`).join('')}</div>`;
  let h = '';
  if (tab === 'stats') {
    const c = async (t, f) => { let q = sb.from(t).select('*', { count: 'exact', head: true }); if (f) q = q.eq(...f); return (await q).count || 0; };
    h = `<div class="stats"><div class="stat"><b>${await c('profiles', ['role', 'student'])}</b>طلاب</div><div class="stat"><b>${await c('profiles', ['role', 'teacher'])}</b>مدرسون</div><div class="stat"><b>${await c('courses', ['status', 'published'])}</b>كورسات منشورة</div><div class="stat"><b>${await c('courses', ['status', 'pending'])}</b>بانتظار المراجعة</div><div class="stat"><b>${await c('enrollments')}</b>تسجيلات</div></div>`;
  } else if (tab === 'review') {
    const { data } = await sb.from('courses').select('*,profiles(full_name)').order('created_at', { ascending: false });
    h = `<table><tr><th>الكورس</th><th>المدرس</th><th>الحالة</th><th></th></tr>${(data || []).map(c => `<tr><td><a href="#/course/${c.id}">${esc(c.title)}</a></td><td>${esc(c.profiles?.full_name)}</td><td>${stAr[c.status]}</td><td><a class="btn s" href="#/edit/${c.id}">فتح</a> ${c.status !== 'published' ? `<button class="btn s y" data-pub="${c.id}">نشر</button>` : ''}</td></tr>`).join('')}</table>`;
  } else if (tab === 'users') {
    const { data } = await sb.from('profiles').select('*').order('created_at', { ascending: false });
    h = `<table><tr><th>الاسم</th><th>الدور</th><th></th></tr>${(data || []).map(u => `<tr><td>${esc(u.full_name)}</td><td><select data-role="${u.id}" style="margin:0">${['student', 'teacher', 'admin'].map(r => `<option value="${r}" ${r === u.role ? 'selected' : ''}>${roleAr[r]}</option>`).join('')}</select></td><td></td></tr>`).join('')}</table>`;
  } else {
    h = `<table><tr><th>التصنيف</th><th></th></tr>${cats.map(c => `<tr><td>${c.icon || ''} ${esc(c.name)}</td><td><button class="btn s r" data-dc="${c.id}">حذف</button></td></tr>`).join('')}</table>
    <div class="box row" style="margin-top:14px"><input id="cn" placeholder="اسم التصنيف" style="flex:2;margin:0"><input id="ci" placeholder="إيموجي" style="flex:1;margin:0"><button class="btn" id="ac">إضافة</button></div>`;
  }
  app.innerHTML = `<h1>لوحة الإدارة</h1>${tabs}${h}`;
  document.querySelectorAll('[data-pub]').forEach(b => b.onclick = async () => { await sb.from('courses').update({ status: 'published' }).eq('id', b.dataset.pub); admin(tab); });
  document.querySelectorAll('[data-role]').forEach(s => s.onchange = async () => { const { error } = await sb.from('profiles').update({ role: s.value }).eq('id', s.dataset.role); toast(error ? error.message : 'تم'); });
  document.querySelectorAll('[data-dc]').forEach(b => b.onclick = async () => { await sb.from('categories').delete().eq('id', b.dataset.dc); await loadMe(); admin(tab); });
  const ac = $('#ac'); if (ac) ac.onclick = async () => { if (!$('#cn').value) return; await sb.from('categories').insert({ name: $('#cn').value, icon: $('#ci').value || '📘' }); await loadMe(); admin(tab); };
}
async function route() {
  const [path, q] = (location.hash.slice(1) || '/').split('?'); const p = path.split('/').filter(Boolean);
  window.scrollTo(0, 0);
  try {
    if (!p.length) return await home();
    switch (p[0]) {
      case 'courses': return await courses(q);
      case 'course': return await course(p[1]);
      case 'learn': return await learn(p[1], p[2]);
      case 'edit': return await edit(p[1]);
      case 'login': return authForm(false);
      case 'register': return authForm(true);
      case 'dashboard': return await dashboard();
      case 'admin': return await admin(p[1]);
      default: return await home();
    }
  } catch (e) { app.innerHTML = '<p>حصل خطأ، حدّث الصفحة.</p>'; console.error(e); }
}
addEventListener('hashchange', route);
loadMe().then(route);
