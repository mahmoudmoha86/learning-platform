const root = $('#root'); let me = null, cur = 'overview';
const SECTIONS = [['overview', '📊 نظرة عامة'], ['general', '⚙️ إعدادات الموقع'], ['hero', '🏠 الصفحة الرئيسية'], ['tracks', '🧭 مجالات التعلّم'], ['features', '✨ المميزات'], ['faqs', '❓ الأسئلة الشائعة'], ['testi', '💬 آراء الطلاب'], ['partners', '🤝 الشركاء'], ['about', 'ℹ️ عن المنصة'], ['contactset', '📞 التواصل والسوشيال'], ['legal', '📄 الشروط والخصوصية'], ['courses', '📚 الكورسات'], ['cats', '🗂️ التصنيفات'], ['users', '👥 المستخدمون'], ['enr', '🎓 التسجيلات'], ['reviews', '⭐ التقييمات'], ['msgs', '✉️ الرسائل'], ['media', '🖼️ الصور']];
const get = (o, p) => p.split('.').reduce((a, k) => (a == null ? a : a[k]), o);
const set = (o, p, v) => { const ks = p.split('.'); let a = o; ks.slice(0, -1).forEach(k => a = a[k] = a[k] || {}); a[ks.at(-1)] = v; };
async function saveS() { const { error } = await sb.from('site_settings').upsert({ key: 'site', value: S }); toast(error ? 'فشل الحفظ: ' + error.message : 'تم الحفظ ✓'); if (!error) loadSettingsTheme(); }
function loadSettingsTheme() { const r = document.documentElement.style; if (S.primary) { r.setProperty('--p', S.primary); r.setProperty('--p2', shade(S.primary, -35)); } if (S.accent) r.setProperty('--a', S.accent); }

function field(path, label, type = 'text') {
  const v = get(S, path) ?? '';
  if (type === 'img') return `<div class="fld"><label>${label}</label><div class="imgf">${v ? `<img src="${esc(v)}">` : ''}<input type="file" accept="image/*" data-img="${path}" style="flex:1"><button class="btn o s" data-clr="${path}">إزالة</button></div></div>`;
  if (type === 'area') return `<div class="fld"><label>${label}</label><textarea data-p="${path}" rows="5">${esc(v)}</textarea></div>`;
  if (type === 'color') return `<div class="fld"><label>${label}</label><input type="color" data-p="${path}" value="${esc(v || '#1b5fd1')}" style="height:44px;padding:4px"></div>`;
  return `<div class="fld"><label>${label}</label><input data-p="${path}" value="${esc(v)}"></div>`;
}
function bindSettings(rerender) {
  $$('[data-p]').forEach(i => i.onchange = () => { set(S, i.dataset.p, i.value); saveS(); });
  $$('[data-img]').forEach(i => i.onchange = async () => { const u = await uploadImage(i.files[0], 'site'); if (u) { set(S, i.dataset.img, u); await saveS(); rerender(); } });
  $$('[data-clr]').forEach(b => b.onclick = async () => { set(S, b.dataset.clr, ''); await saveS(); rerender(); });
}
function settingsPage(title, fields, intro = '') {
  root.querySelector('#pg').innerHTML = `<h1>${title}</h1>${intro}<div class="box">${fields.map(f => field(...f)).join('')}</div><p class="saved">يتم الحفظ تلقائيًا عند التعديل.</p>`;
  bindSettings(() => settingsPage(title, fields, intro));
}
function listEditor(key, title, fields) { // array inside S
  const arr = S[key] = S[key] || [];
  const draw = () => {
    root.querySelector('#pg').innerHTML = `<h1>${title}</h1>${arr.map((it, i) => `<div class="lrow">${fields.map(([k, l]) => `<div><label>${l}</label><input data-i="${i}" data-k="${k}" value="${esc(it[k])}"></div>`).join('')}<button class="btn s r" data-rm="${i}">حذف</button></div>`).join('')}<button class="btn" id="add">+ إضافة</button><p class="saved">يتم الحفظ تلقائيًا.</p>`;
    $$('[data-k]').forEach(i => i.onchange = async () => { arr[+i.dataset.i][i.dataset.k] = i.value; await saveS(); });
    $$('[data-rm]').forEach(b => b.onclick = async () => { arr.splice(+b.dataset.rm, 1); await saveS(); draw(); });
    $('#add').onclick = async () => { arr.push(Object.fromEntries(fields.map(([k]) => [k, '']))); await saveS(); draw(); };
  }; draw();
}
function tableEditor(table, title, fields, order = 'position') { // fields: [key,label,type]
  const draw = async () => {
    const { data } = await sb.from(table).select('*').order(order);
    root.querySelector('#pg').innerHTML = `<h1>${title}</h1>${(data || []).map(r => `<div class="lrow">${fields.map(([k, l, t]) => t === 'img' ? `<div><label>${l}</label>${r[k] ? `<img src="${esc(r[k])}" style="height:40px;display:block">` : ''}<input type="file" accept="image/*" data-up="${r.id}" data-k="${k}"></div>` : t === 'area' ? `<div><label>${l}</label><textarea rows="2" data-id="${r.id}" data-k="${k}">${esc(r[k])}</textarea></div>` : `<div><label>${l}</label><input ${t === 'num' ? 'type="number"' : ''} data-id="${r.id}" data-k="${k}" value="${esc(r[k])}"></div>`).join('')}<button class="btn s r" data-rm="${r.id}">حذف</button></div>`).join('') || '<p class="muted">لا عناصر بعد.</p>'}<button class="btn" id="add">+ إضافة</button><p class="saved">يتم الحفظ تلقائيًا.</p>`;
    $$('[data-id]').forEach(i => i.onchange = async () => { const v = i.type === 'number' ? +i.value : i.value; const { error } = await sb.from(table).update({ [i.dataset.k]: v }).eq('id', i.dataset.id); toast(error ? error.message : 'تم الحفظ ✓'); });
    $$('[data-up]').forEach(i => i.onchange = async () => { const u = await uploadImage(i.files[0], table); if (u) { await sb.from(table).update({ [i.dataset.k]: u }).eq('id', i.dataset.up); draw(); } });
    $$('[data-rm]').forEach(b => b.onclick = async () => { await sb.from(table).delete().eq('id', b.dataset.rm); draw(); });
    $('#add').onclick = async () => { const o = fields.some(f => f[0] === 'position') ? { position: (data || []).length + 1 } : {}; fields.forEach(([k, , t]) => { if (t !== 'img' && k !== 'position') o[k] = k === 'name' || k === 'q' ? 'جديد' : ''; }); const { error } = await sb.from(table).insert(o); if (error) toast(error.message); draw(); };
  }; draw();
}
const pages = {
  async overview() {
    const cnt = async (t, f) => { let q = sb.from(t).select('*', { count: 'exact', head: true }); if (f) q = q.eq(...f); return (await q).count || 0; };
    const [st, te, co, pe, en, ms, rv] = await Promise.all([cnt('profiles', ['role', 'student']), cnt('profiles', ['role', 'teacher']), cnt('courses', ['status', 'published']), cnt('courses', ['status', 'pending']), cnt('enrollments'), cnt('messages', ['is_read', false]), cnt('reviews')]);
    const [{ data: us }, { data: pend }] = await Promise.all([sb.from('profiles').select('full_name,role,created_at').order('created_at', { ascending: false }).limit(6), sb.from('courses').select('id,title').eq('status', 'pending')]);
    root.querySelector('#pg').innerHTML = `<h1>نظرة عامة</h1><div class="stats">${[[st, 'طلاب'], [te, 'مدرسون'], [co, 'كورسات منشورة'], [pe, 'بانتظار الموافقة'], [en, 'تسجيلات'], [ms, 'رسائل جديدة'], [rv, 'تقييمات']].map(([n, l]) => `<div class="stat"><b>${n}</b>${l}</div>`).join('')}</div>
    <div class="box"><h3>كورسات بانتظار الموافقة</h3>${(pend || []).map(c => `<div class="lrow"><b>${esc(c.title)}</b><a class="btn s o" href="index.html#/edit/${c.id}">مراجعة</a><button class="btn s y" data-pub="${c.id}">نشر</button></div>`).join('') || '<p class="muted">لا يوجد.</p>'}</div>
    <div class="box"><h3>أحدث المسجلين</h3>${(us || []).map(u => `<div class="muted">${esc(u.full_name)} · ${roleAr[u.role]} · ${fmtDate(u.created_at)}</div>`).join('')}</div>
    <p><a class="btn" href="index.html" target="_blank">فتح الموقع ↗</a></p>`;
    $$('[data-pub]').forEach(b => b.onclick = async () => { await sb.from('courses').update({ status: 'published' }).eq('id', b.dataset.pub); show('overview'); });
  },
  general() { settingsPage('إعدادات الموقع', [['name', 'اسم المنصة'], ['tagline', 'الشعار النصي'], ['logo_url', 'اللوجو', 'img'], ['announcement', 'شريط الإعلان (اتركه فارغًا لإخفائه)'], ['primary', 'اللون الأساسي', 'color'], ['accent', 'اللون الثانوي', 'color'], ['footer_text', 'نص أسفل الصفحة']]); },
  hero() { settingsPage('الصفحة الرئيسية', [['hero_title', 'العنوان الرئيسي'], ['hero_subtitle', 'الوصف', 'area'], ['hero_cta', 'نص الزر'], ['hero_image', 'صورة الواجهة (اتركها فارغة لعرض رسم افتراضي)', 'img']]); },
  tracks() { listEditor('tracks', 'مجالات التعلّم (الصفحة الرئيسية)', [['emoji', 'إيموجي'], ['title', 'العنوان'], ['desc', 'الوصف']]); },
  features() { listEditor('features', 'المميزات (الصفحة الرئيسية)', [['emoji', 'إيموجي'], ['title', 'العنوان'], ['desc', 'الوصف']]); },
  faqs() { tableEditor('faqs', 'الأسئلة الشائعة', [['q', 'السؤال'], ['a', 'الإجابة', 'area'], ['position', 'الترتيب', 'num']]); },
  testi() { tableEditor('testimonials', 'آراء الطلاب', [['name', 'الاسم'], ['role', 'الصفة'], ['text', 'النص', 'area'], ['avatar_url', 'الصورة', 'img'], ['position', 'الترتيب', 'num']]); },
  partners() { tableEditor('partners', 'الشركاء', [['name', 'الاسم'], ['logo_url', 'الشعار', 'img'], ['position', 'الترتيب', 'num']]); },
  about() { settingsPage('عن المنصة', [['about_title', 'العنوان'], ['about_text', 'النص', 'area'], ['about_image', 'الصورة', 'img'], ['vision', 'الرؤية', 'area'], ['mission', 'الرسالة', 'area']]); },
  contactset() { settingsPage('التواصل والسوشيال', [['contact.email', 'البريد الإلكتروني'], ['contact.phone', 'الهاتف'], ['contact.whatsapp', 'واتساب (رقم بكود الدولة)'], ['contact.address', 'العنوان'], ['contact.hours', 'مواعيد العمل'], ['social.facebook', 'رابط فيسبوك'], ['social.youtube', 'رابط يوتيوب'], ['social.instagram', 'رابط إنستجرام'], ['social.twitter', 'رابط تويتر/X'], ['social.linkedin', 'رابط لينكدإن']]); },
  legal() { settingsPage('الشروط والخصوصية', [['terms', 'الشروط والأحكام', 'area'], ['privacy', 'سياسة الخصوصية', 'area']]); },
  async courses() {
    const { data } = await sb.from('courses').select('*,profiles!teacher_id(full_name)').order('created_at', { ascending: false });
    root.querySelector('#pg').innerHTML = `<div class="row"><h1 style="flex:1">الكورسات</h1><button class="btn y" id="nw">+ كورس جديد</button></div>${(data || []).map(c => `<div class="lrow"><div><b>${esc(c.title)}</b><div class="muted">${esc(c.profiles?.full_name || '')}</div></div><div><label>اسم المدرس المعروض</label><input data-id="${c.id}" data-k="instructor_name" value="${esc(c.instructor_name)}"></div>
    <select data-id="${c.id}" data-k="status">${Object.entries(stAr).map(([k, v]) => `<option value="${k}" ${k === c.status ? 'selected' : ''}>${v}</option>`).join('')}</select>
    <label><input type="checkbox" data-id="${c.id}" data-k="featured" ${c.featured ? 'checked' : ''} style="width:auto;margin:0 0 0 6px">مميّز</label>
    <div class="row"><a class="btn s" href="index.html#/edit/${c.id}">تعديل</a><button class="btn s r" data-rm="${c.id}">حذف</button></div></div>`).join('')}`;
    $$('[data-id]').forEach(i => i.onchange = async () => { const v = i.type === 'checkbox' ? i.checked : i.value; const { error } = await sb.from('courses').update({ [i.dataset.k]: v }).eq('id', i.dataset.id); toast(error ? error.message : 'تم ✓'); });
    $$('[data-rm]').forEach(b => b.onclick = async () => { if (confirm('حذف الكورس؟')) { await sb.from('courses').delete().eq('id', b.dataset.rm); show('courses'); } });
    $('#nw').onclick = async () => { const { data: c, error } = await sb.from('courses').insert({ title: 'كورس جديد', teacher_id: me.id, instructor_name: me.full_name }).select().single(); if (error) toast(error.message); else location.href = `index.html#/edit/${c.id}`; };
  },
  cats() { tableEditor('categories', 'التصنيفات', [['name', 'الاسم'], ['icon', 'إيموجي'], ['description', 'الوصف']], 'id'); },
  async users() {
    const { data } = await sb.from('profiles').select('*').order('created_at', { ascending: false });
    root.querySelector('#pg').innerHTML = `<h1>المستخدمون (${(data || []).length})</h1><div class="tw"><table><tr><th>الاسم</th><th>الهاتف</th><th>الانضمام</th><th>الدور</th></tr>${(data || []).map(u => `<tr><td>${esc(u.full_name)}</td><td>${esc(u.phone)}</td><td>${fmtDate(u.created_at)}</td><td><select data-u="${u.id}" style="margin:0">${['student', 'teacher', 'admin'].map(r => `<option value="${r}" ${r === u.role ? 'selected' : ''}>${roleAr[r]}</option>`).join('')}</select></td></tr>`).join('')}</table></div>`;
    $$('[data-u]').forEach(s => s.onchange = async () => { if (s.dataset.u === me.id && s.value !== 'admin' && !confirm('ستفقد صلاحية الأدمن، متأكد؟')) { s.value = 'admin'; return; } const { error } = await sb.from('profiles').update({ role: s.value }).eq('id', s.dataset.u); toast(error ? error.message : 'تم ✓'); });
  },
  async enr() {
    const { data } = await sb.from('enrollments').select('created_at,student_id,course_id,profiles(full_name),courses(title)').order('created_at', { ascending: false }).limit(200);
    root.querySelector('#pg').innerHTML = `<h1>التسجيلات</h1><div class="tw"><table><tr><th>الطالب</th><th>الكورس</th><th>التاريخ</th><th></th></tr>${(data || []).map(e => `<tr><td>${esc(e.profiles?.full_name)}</td><td>${esc(e.courses?.title)}</td><td>${fmtDate(e.created_at)}</td><td><button class="btn s r" data-s="${e.student_id}" data-c="${e.course_id}">حذف</button></td></tr>`).join('')}</table></div>`;
    $$('[data-s]').forEach(b => b.onclick = async () => { await sb.from('enrollments').delete().eq('student_id', b.dataset.s).eq('course_id', b.dataset.c); show('enr'); });
  },
  async reviews() {
    const { data } = await sb.from('reviews').select('*,profiles(full_name),courses(title)').order('created_at', { ascending: false });
    root.querySelector('#pg').innerHTML = `<h1>التقييمات</h1>${(data || []).map(r => `<div class="lrow"><div><b>${esc(r.profiles?.full_name)}</b> على ${esc(r.courses?.title)}</div><div class="stars">${'★'.repeat(r.rating)}</div><div>${esc(r.comment)}</div><button class="btn s r" data-c="${r.course_id}" data-s="${r.student_id}">حذف</button></div>`).join('') || '<p class="muted">لا تقييمات.</p>'}`;
    $$('[data-c]').forEach(b => b.onclick = async () => { await sb.from('reviews').delete().eq('course_id', b.dataset.c).eq('student_id', b.dataset.s); show('reviews'); });
  },
  async msgs() {
    const { data } = await sb.from('messages').select('*').order('created_at', { ascending: false });
    root.querySelector('#pg').innerHTML = `<h1>الرسائل</h1>${(data || []).map(m => `<div class="box" style="${m.is_read ? '' : 'border-color:var(--p)'}"><b>${esc(m.subject || '(بدون موضوع)')}</b> <span class="muted">من ${esc(m.name)} ${esc(m.email)} · ${fmtDate(m.created_at)}</span><p style="white-space:pre-wrap">${esc(m.body)}</p><div class="row">${m.is_read ? '' : `<button class="btn s" data-r="${m.id}">تمت القراءة</button>`}${m.email ? `<a class="btn s o" href="mailto:${esc(m.email)}">رد بالإيميل</a>` : ''}<button class="btn s r" data-d="${m.id}">حذف</button></div></div>`).join('') || '<p class="muted">لا رسائل.</p>'}`;
    $$('[data-r]').forEach(b => b.onclick = async () => { await sb.from('messages').update({ is_read: true }).eq('id', b.dataset.r); show('msgs'); });
    $$('[data-d]').forEach(b => b.onclick = async () => { await sb.from('messages').delete().eq('id', b.dataset.d); show('msgs'); });
  },
  async media() {
    const folders = ['site', 'covers', 'avatars', 'faqs', 'testimonials', 'partners', 'admin'];
    let files = []; for (const f of folders) { const { data } = await sb.storage.from('media').list(f, { limit: 100, sortBy: { column: 'created_at', order: 'desc' } }); (data || []).filter(x => x.name && x.id).forEach(x => files.push(`${f}/${x.name}`)); }
    root.querySelector('#pg').innerHTML = `<h1>مكتبة الصور</h1><div class="box"><input type="file" id="mu" accept="image/*" multiple></div><div class="mgrid">${files.map(p => { const u = sb.storage.from('media').getPublicUrl(p).data.publicUrl; return `<div class="m"><img src="${esc(u)}" loading="lazy"><div class="row" style="margin-top:6px"><button class="btn s o" data-cp="${esc(u)}">نسخ الرابط</button><button class="btn s r" data-dp="${esc(p)}">حذف</button></div></div>`; }).join('') || '<p class="muted">لا صور بعد.</p>'}</div>`;
    $('#mu').onchange = async e => { for (const f of e.target.files) await uploadImage(f, 'admin'); show('media'); };
    $$('[data-cp]').forEach(b => b.onclick = () => { navigator.clipboard && navigator.clipboard.writeText(b.dataset.cp); toast('تم نسخ الرابط'); });
    $$('[data-dp]').forEach(b => b.onclick = async () => { if (confirm('حذف الصورة؟')) { await sb.storage.from('media').remove([b.dataset.dp]); show('media'); } });
  }
};
async function show(k) {
  cur = k; location.hash = k;
  $$('.side a[data-k]').forEach(a => a.classList.toggle('on', a.dataset.k === k));
  root.querySelector('#pg').innerHTML = '<p class="muted">جاري التحميل...</p>';
  try { await pages[k](); } catch (e) { root.querySelector('#pg').innerHTML = '<p>حصل خطأ: ' + esc(e.message) + '</p>'; console.error(e); }
}
function shell() {
  root.innerHTML = `<div class="shell"><aside class="side"><h2>⚙️ لوحة الإدارة</h2>${SECTIONS.map(([k, l]) => `<a data-k="${k}">${l}</a>`).join('')}<a href="index.html" target="_blank">↗ فتح الموقع</a><a id="lo">🚪 خروج</a></aside><section class="cont" id="pg"></section></div>`;
  $$('.side a[data-k]').forEach(a => a.onclick = () => show(a.dataset.k));
  $('#lo').onclick = async () => { await sb.auth.signOut(); boot(); };
  const k = location.hash.slice(1); show(pages[k] ? k : 'overview');
}
function login(msg = '') {
  root.innerHTML = `<div class="box narrow"><h2>دخول الإدارة</h2>${msg ? `<p style="color:#d92d20">${msg}</p>` : ''}<label>البريد الإلكتروني</label><input id="em" type="email"><label>كلمة المرور</label><input id="pw" type="password"><button class="btn" id="ok" style="width:100%">دخول</button><p><a href="index.html">← العودة للموقع</a></p></div>`;
  $('#ok').onclick = async () => { const { error } = await sb.auth.signInWithPassword({ email: $('#em').value.trim(), password: $('#pw').value }); if (error) toast(error.message); else boot(); };
}
async function boot() {
  try { await loadSettings(); me = await getMe(); } catch (e) { console.error(e); }
  if (!me) return login();
  if (me.role !== 'admin') { await sb.auth.signOut(); return login('هذا الحساب ليس أدمن.'); }
  shell();
}
boot();
