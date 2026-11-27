window.addEventListener('error', e => { const m = $('#app'); if (m && m.innerText.includes('جاري التحميل')) m.innerHTML = '<p style="text-align:center;margin-top:60px">حصل خطأ في التحميل، حدّث الصفحة. (' + esc(e.message || '') + ')</p>'; });
const app = $('#app');
let me = null, cats = [];
const catName = id => (cats.find(c => c.id == id) || {}).name || 'عام';
const catIcon = id => (cats.find(c => c.id == id) || {}).icon || '📘';
const needLogin = () => { if (!me) { location.hash = '#/login'; return true; } };
const stars = n => '★'.repeat(Math.round(n || 0)) + '☆'.repeat(5 - Math.round(n || 0));
const avg = a => a.length ? a.reduce((s, x) => s + x.rating, 0) / a.length : 0;
const img = (u, cls = '') => u ? `<img class="${cls}" src="${esc(u)}" alt="" loading="lazy">` : '';
const avatar = (p, size = 44) => p && p.avatar_url ? `<img class="av" style="width:${size}px;height:${size}px" src="${esc(p.avatar_url)}" alt="">` : `<span class="av ph" style="width:${size}px;height:${size}px;font-size:${size / 2.2}px">${esc((p && p.full_name || '؟').trim().charAt(0))}</span>`;
const socialIcons = { facebook: '📘', youtube: '▶️', instagram: '📸', twitter: '🐦', linkedin: '💼' };

function coverHtml(c) {
  if (c.cover_url) return `<div class="cv" style="background-image:url('${esc(c.cover_url)}')"></div>`;
  const col = c.color || '#1b5fd1';
  return `<div class="cv" style="background:linear-gradient(135deg,${col},${shade(col, -40)})"><span class="cvi">${c.emoji || catIcon(c.category_id)}</span></div>`;
}
async function loadMe() {
  me = await getMe();
  const { data: c } = await sb.from('categories').select('*').order('id'); cats = c || [];
  header();
}
function header() {
  const logo = S.logo_url ? `<img src="${esc(S.logo_url)}" alt="" style="height:38px">` : `<span class="lg">🎓</span> ${esc(S.name || 'منصة تعلّم')}`;
  $('#top').innerHTML = S.announcement ? `<div class="ann">${esc(S.announcement)}</div>` : '';
  $('#hdr').innerHTML = `<a class="logo" href="#/">${logo}</a>
  <div class="dd"><button class="ddb" id="ddb">تصفح الدورات <i>⌄</i></button><div class="ddm" id="ddm">${cats.map(c => `<a href="#/courses?cat=${c.id}">${c.icon || '📘'} ${esc(c.name)}</a>`).join('')}<hr><a href="#/courses">كل الكورسات</a><a href="#/instructors">المدرسون</a><a href="#/about">عن المنصة</a><a href="#/contact">اتصل بنا</a>${me && me.role === 'admin' ? '<a href="admin.html">لوحة الإدارة</a>' : ''}</div></div>
  <form class="hs2" id="hs2"><button aria-label="بحث">🔍</button><input id="hq2" placeholder="ابحث عن دورات"></form>
  <div class="auth">${me ? `<a href="#/dashboard" class="btn s o">لوحتي</a><a href="#/profile" class="who">${avatar(me, 34)}</a><button class="btn g s" id="out">خروج</button>` : '<a class="btn g" href="#/login">تسجيل الدخول</a><a class="btn" href="#/register">إنشاء حساب</a>'}</div>`;
  $('#ddb').onclick = e => { e.stopPropagation(); $('#ddm').classList.toggle('open'); };
  document.onclick = () => { const m = $('#ddm'); if (m) m.classList.remove('open'); };
  $('#hs2').onsubmit = e => { e.preventDefault(); location.hash = `#/courses?s=${encodeURIComponent($('#hq2').value)}`; };
  quick();
  const o = $('#out'); if (o) o.onclick = async () => { await sb.auth.signOut(); location.hash = '#/'; await loadMe(); route(); };
}
function quick() {
  let el = document.getElementById('qa'); if (!el) { el = document.createElement('div'); el.id = 'qa'; document.body.appendChild(el); }
  const tr = (S.tracks || []).slice(0, 3);
  const L = (h, i, t) => `<a href="${h}">${i} <span>${t}</span></a>`;
  el.innerHTML = `<button class="qfab" id="qfab" aria-label="وصول سريع">☰<small>وصول سريع</small></button><div class="qov" id="qov"></div>
  <aside class="qpn" id="qpn"><div class="qh"><b>🎓 ${esc(S.name || 'منصة تعلّم')}</b><button id="qx" aria-label="إغلاق">✕</button></div>
  ${me ? `<div class="qg"><b>▦ لوحتي التعليمية</b>${L('#/dashboard', '📘', 'الدورات الحالية')}${L('#/dashboard', '✅', 'الدورات المنتهية')}${L('#/dashboard', '📊', 'أدائي')}${L('#/dashboard', '🏅', 'شهاداتي')}</div>` : `<div class="qg">${L('#/login', '🔑', 'تسجيل الدخول')}${L('#/register', '📝', 'إنشاء حساب')}</div>`}
  ${tr.map(t => L('#/courses', esc(t.emoji || '📘'), esc(t.title))).join('')}
  ${L('#/courses', '📚', 'تصفح جميع الدورات')}${me ? L('#/dashboard', '✨', 'المقترح لي') : ''}${L('#/instructors', '👨‍🏫', 'المدرسون')}${L('#/faq', '❓', 'الأسئلة الشائعة')}${L('#/contact', '✉️', 'اتصل بنا')}${me ? L('#/profile', '👤', 'حسابي') : ''}${me && me.role === 'admin' ? L('admin.html', '⚙️', 'لوحة الإدارة') : ''}</aside>`;
  const open = v => { $('#qpn').classList.toggle('open', v); $('#qov').classList.toggle('open', v); };
  $('#qfab').onclick = () => open(true); $('#qx').onclick = () => open(false); $('#qov').onclick = () => open(false);
  $$('#qpn a').forEach(a => a.onclick = () => open(false));
}
function footer() {
  const c = S.contact || {}, so = S.social || {};
  $('#ftr').innerHTML = `<div class="fgrid"><div><div class="logo" style="color:#fff">${esc(S.name || 'منصة تعلّم')}</div><p>${esc(S.tagline || '')}</p>
  <div class="soc">${Object.keys(socialIcons).filter(k => so[k]).map(k => `<a href="${esc(so[k])}" target="_blank" rel="noopener">${socialIcons[k]}</a>`).join('')}</div></div>
  <div><h4>روابط سريعة</h4><a href="#/courses">الكورسات</a><a href="#/instructors">المدرسون</a><a href="#/about">عن المنصة</a><a href="#/faq">الأسئلة الشائعة</a><a href="#/contact">اتصل بنا</a></div>
  <div><h4>قانوني</h4><a href="#/terms">الشروط والأحكام</a><a href="#/privacy">سياسة الخصوصية</a></div>
  <div><h4>تواصل معنا</h4>${c.email ? `<span>✉️ ${esc(c.email)}</span>` : ''}${c.phone ? `<span>📞 ${esc(c.phone)}</span>` : ''}${c.address ? `<span>📍 ${esc(c.address)}</span>` : ''}${c.hours ? `<span>🕘 ${esc(c.hours)}</span>` : ''}</div></div>
  <div class="copy">${esc(S.footer_text || '')}</div>`;
}
function courseCard(c, extra = '', link = null) {
  const rv = c.reviews || [], r = avg(rv);
  return `<div class="card">${coverHtml(c)}<div class="bd"><div class="row" style="justify-content:space-between"><span class="tag">${esc(catName(c.category_id))}</span><span class="tag y">${esc(c.level || '')}</span></div>
  <h3>${esc(c.title)}</h3><div class="muted">${esc(c.profiles?.full_name || c.instructor_name || '')}${c.duration ? ' · ⏱ ' + esc(c.duration) : ''}</div>
  ${rv.length ? `<div class="stars">${stars(r)} <span class="muted">(${rv.length})</span></div>` : ''}${extra}
  <div style="margin-top:auto"><a class="btn s" href="${link || '#/course/' + c.id}">التفاصيل</a></div></div></div>`;
}
const CSEL = '*,profiles!teacher_id(full_name,avatar_url),reviews(rating)';

async function home() {
  const cnt = async (t, f) => { let q = sb.from(t).select('*', { count: 'exact', head: true }); if (f) q = q.eq(...f); return (await q).count || 0; };
  const [feat, instr, tes, par, faq, nc, ns, nt, ne] = await Promise.all([
    sb.from('courses').select(CSEL).eq('status', 'published').order('featured', { ascending: false }).order('created_at', { ascending: false }).limit(6),
    sb.from('profiles').select('*').eq('role', 'teacher').limit(4),
    sb.from('testimonials').select('*').order('position'), sb.from('partners').select('*').order('position'), sb.from('faqs').select('*').order('position').limit(5),
    cnt('courses', ['status', 'published']), cnt('profiles', ['role', 'student']), cnt('profiles', ['role', 'teacher']), cnt('enrollments')]);
  const trk = (S.tracks || []).slice(0, 3);
  const grads = ['#1e3a8a,#3b82f6', '#0b1f4d,#2563eb', '#172554,#60a5fa'];
  const trkCards = trk.map((t, i) => `<a class="tcard" href="#/courses" style="${t.image ? `background-image:url('${esc(t.image)}')` : `background:linear-gradient(145deg,${grads[i % 3]})`}"><span class="te">${t.image ? '' : esc(t.emoji || '📘')}</span><span class="ta">↖</span><span class="tl">${esc(t.title)}</span></a>`).join('');
  app.innerHTML = `<section class="hero3"><span class="deco d1"></span><span class="deco d2"></span><span class="deco d3"></span><button class="arr l" aria-label="prev">→</button><button class="arr r" aria-label="next">←</button>
  <span class="pill">أكثر من ${Math.max(nc, 1)} دورة مجانية</span><h1>${esc(S.hero_title || '')}</h1><p>${esc(S.hero_subtitle || '')}</p>
  <div class="tcards">${trkCards}</div></section>
  <div class="row" style="justify-content:center;margin:-6px 0 18px"><a class="btn" href="#/courses">${esc(S.hero_cta || 'تصفّح الكورسات')}</a>${me ? '' : '<a class="btn o" href="#/register">ابدأ مجانًا</a>'}</div>
  <div class="stats">${[[nc, 'كورس'], [ns, 'طالب'], [nt, 'مدرس'], [ne, 'تسجيل']].map(([n, l]) => `<div class="stat"><b>${n}</b>${l}</div>`).join('')}</div>
  ${(S.tracks || []).length ? `<h2 class="sec">مجالات التعلّم</h2><div class="grid3">${S.tracks.map(t => `<a class="card trk" href="#/courses"><div class="bd"><div class="big">${esc(t.emoji || '📘')}</div><h3>${esc(t.title)}</h3><p class="muted">${esc(t.desc)}</p></div></a>`).join('')}</div>` : ''}
  <h2 class="sec">التصنيفات</h2><div class="grid">${cats.map(c => `<a class="card" href="#/courses?cat=${c.id}"><div class="bd" style="text-align:center"><div class="big">${c.icon || '📘'}</div><b>${esc(c.name)}</b><span class="muted">${esc(c.description || '')}</span></div></a>`).join('')}</div>
  <div class="row" style="justify-content:space-between"><h2 class="sec">أحدث الكورسات</h2><a href="#/courses">عرض الكل ←</a></div>
  <div class="grid">${(feat.data || []).map(c => courseCard(c)).join('') || '<p class="muted">لا توجد كورسات منشورة بعد.</p>'}</div>
  ${(S.features || []).length ? `<h2 class="sec">ليه تتعلم معنا؟</h2><div class="grid">${S.features.map(f => `<div class="box ft"><div class="big">${esc(f.emoji || '✨')}</div><h3>${esc(f.title)}</h3><p class="muted">${esc(f.desc)}</p></div>`).join('')}</div>` : ''}
  ${(instr.data || []).length ? `<h2 class="sec">مدرسون متخصصون</h2><div class="grid">${instr.data.map(t => `<a class="card" href="#/instructor/${t.id}"><div class="bd" style="align-items:center;text-align:center">${avatar(t, 72)}<b>${esc(t.full_name)}</b><span class="muted">${esc(t.title || 'مدرس')}</span></div></a>`).join('')}</div>` : ''}
  ${(tes.data || []).length ? `<h2 class="sec">آراء الطلاب</h2><div class="grid">${tes.data.map(t => `<div class="box"><p>“${esc(t.text)}”</p><div class="row">${avatar(t, 40)}<div><b>${esc(t.name)}</b><div class="muted">${esc(t.role)}</div></div></div></div>`).join('')}</div>` : ''}
  ${(par.data || []).length ? `<h2 class="sec">شركاؤنا</h2><div class="partners">${par.data.map(p => p.logo_url ? `<img src="${esc(p.logo_url)}" alt="${esc(p.name)}" title="${esc(p.name)}">` : `<span class="tag">${esc(p.name)}</span>`).join('')}</div>` : ''}
  ${(faq.data || []).length ? `<h2 class="sec">أسئلة شائعة</h2>${faq.data.map(f => `<details class="box fq"><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('')}` : ''}
  <div class="cta"><h2>جاهز تبدأ؟</h2><p>أنشئ حسابك مجانًا وابدأ التعلّم الآن.</p><a class="btn y" href="${me ? '#/courses' : '#/register'}">${me ? 'تصفّح الكورسات' : 'إنشاء حساب'}</a></div>`;
}
async function courses(q) {
  const p = new URLSearchParams(q || ''); const cat = p.get('cat') || '', s = p.get('s') || '', lv = p.get('lv') || '', so = p.get('so') || 'new';
  let r = sb.from('courses').select(CSEL).eq('status', 'published');
  if (cat) r = r.eq('category_id', cat); if (lv) r = r.eq('level', lv); if (s) r = r.ilike('title', `%${s}%`);
  r = so === 'az' ? r.order('title') : r.order('created_at', { ascending: false });
  const { data } = await r;
  app.innerHTML = `<h1>الكورسات</h1><div class="box row"><input id="s" placeholder="ابحث عن كورس" value="${esc(s)}" style="flex:2;margin:0;min-width:160px">
  <select id="cat" style="flex:1;margin:0"><option value="">كل التصنيفات</option>${cats.map(c => `<option value="${c.id}" ${c.id == cat ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select>
  <select id="lv" style="flex:1;margin:0"><option value="">كل المستويات</option>${['مبتدئ', 'متوسط', 'متقدم'].map(x => `<option ${x === lv ? 'selected' : ''}>${x}</option>`).join('')}</select>
  <select id="so" style="flex:1;margin:0"><option value="new">الأحدث</option><option value="az" ${so === 'az' ? 'selected' : ''}>أبجديًا</option></select>
  <button class="btn" id="go">بحث</button></div><p class="muted">${(data || []).length} كورس</p><div class="grid">${(data || []).map(c => courseCard(c)).join('') || '<p class="muted">لا نتائج.</p>'}</div>`;
  const go = () => location.hash = `#/courses?cat=${$('#cat').value}&lv=${encodeURIComponent($('#lv').value)}&so=${$('#so').value}&s=${encodeURIComponent($('#s').value)}`;
  $('#go').onclick = go; ['cat', 'lv', 'so'].forEach(i => $('#' + i).onchange = go); $('#s').onkeydown = e => { if (e.key === 'Enter') go(); };
}
async function course(id) {
  const { data: c } = await sb.from('courses').select('*,profiles!teacher_id(id,full_name,bio,title,avatar_url)').eq('id', id).single();
  if (!c) { app.innerHTML = '<p>الكورس غير موجود.</p>'; return; }
  const [{ data: ls }, { data: rv }, { data: rel }] = await Promise.all([
    sb.from('lessons').select('id,title,position').eq('course_id', id).order('position'),
    sb.from('reviews').select('*,profiles(full_name,avatar_url)').eq('course_id', id).order('created_at', { ascending: false }),
    sb.from('courses').select(CSEL).eq('status', 'published').eq('category_id', c.category_id || 0).neq('id', id).limit(3)]);
  let enr = false, mine = null;
  if (me) { const { data } = await sb.from('enrollments').select('course_id').eq('student_id', me.id).eq('course_id', id); enr = !!(data && data.length); mine = (rv || []).find(x => x.student_id === me.id); }
  const r = avg(rv || []);
  app.innerHTML = `<div class="chead">${coverHtml(c)}<div class="cinfo"><span class="tag">${esc(catName(c.category_id))}</span> <span class="tag y">${esc(c.level || '')}</span> ${c.status !== 'published' ? `<span class="tag">${stAr[c.status]}</span>` : ''}
  <h1>${esc(c.title)}</h1><p>${esc(c.description)}</p>
  <div class="muted">${(rv || []).length ? `<span class="stars">${stars(r)}</span> ${r.toFixed(1)} (${rv.length} تقييم) · ` : ''}${(ls || []).length} درس${c.duration ? ' · ⏱ ' + esc(c.duration) : ''}</div>
  <p class="muted">المدرس: ${c.profiles ? `<a href="#/instructor/${c.profiles.id}">${esc(c.profiles.full_name)}</a>` : esc(c.instructor_name || 'فريق المنصة')}</p>
  ${enr ? `<a class="btn" href="#/learn/${id}">تابع التعلّم</a>` : `<button class="btn y" id="en">سجّل في الكورس مجانًا</button>`}</div></div>
  ${c.outcomes ? `<div class="box"><h3>ماذا ستتعلم؟</h3><ul class="chk">${c.outcomes.split('\n').filter(Boolean).map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>` : ''}
  <div class="box"><h3>محتوى الكورس (${(ls || []).length} درس)</h3>${(ls || []).map((l, i) => `<div class="ls">${i + 1}. ${esc(l.title)}</div>`).join('') || '<p class="muted">لا دروس بعد.</p>'}</div>
  ${c.profiles ? `<div class="box row">${avatar(c.profiles, 64)}<div><b>${esc(c.profiles.full_name)}</b><div class="muted">${esc(c.profiles.title || 'مدرس')}</div><p>${esc(c.profiles.bio || '')}</p></div></div>` : ''}
  <div class="box"><h3>التقييمات</h3>
  ${enr ? `<div class="rform"><label>تقييمك</label><select id="rt">${[5, 4, 3, 2, 1].map(n => `<option value="${n}" ${mine && mine.rating === n ? 'selected' : ''}>${'★'.repeat(n)}</option>`).join('')}</select><textarea id="rc" rows="2" placeholder="اكتب رأيك">${esc(mine?.comment || '')}</textarea><button class="btn s" id="rs">${mine ? 'تحديث تقييمي' : 'إرسال التقييم'}</button></div>` : ''}
  ${(rv || []).map(x => `<div class="rv">${avatar(x.profiles, 36)}<div><b>${esc(x.profiles?.full_name || '')}</b> <span class="stars">${stars(x.rating)}</span><p>${esc(x.comment)}</p></div></div>`).join('') || '<p class="muted">لا توجد تقييمات بعد.</p>'}</div>
  ${(rel || []).length ? `<h2 class="sec">كورسات مشابهة</h2><div class="grid">${rel.map(x => courseCard(x)).join('')}</div>` : ''}`;
  const b = $('#en'); if (b) b.onclick = async () => {
    if (!me) { location.hash = '#/login'; return; }
    if (me.role !== 'student') { toast('التسجيل في الكورسات للطلاب فقط'); return; }
    const { error } = await sb.from('enrollments').insert({ student_id: me.id, course_id: id });
    if (error) toast('تعذّر التسجيل'); else location.hash = `#/learn/${id}`;
  };
  const rs = $('#rs'); if (rs) rs.onclick = async () => {
    const row = { course_id: id, student_id: me.id, rating: +$('#rt').value, comment: $('#rc').value };
    const { error } = await sb.from('reviews').upsert(row); if (error) toast(error.message); else { toast('شكرًا لتقييمك'); course(id); }
  };
}
async function progress(cid, uid) {
  const { data: ls } = await sb.from('lessons').select('id').eq('course_id', cid);
  const { data: pr } = await sb.from('lesson_progress').select('lesson_id').eq('student_id', uid);
  const set = new Set((pr || []).map(x => x.lesson_id)); const done = (ls || []).filter(l => set.has(l.id)).length;
  return { total: (ls || []).length, done, set, pct: ls && ls.length ? Math.round(done / ls.length * 100) : 0 };
}
async function learn(id, lid) {
  if (needLogin()) return;
  const { data: c } = await sb.from('courses').select('*').eq('id', id).single();
  const { data: ls } = await sb.from('lessons').select('*').eq('course_id', id).order('position');
  const pg = await progress(id, me.id); const done = pg.set;
  const idx = Math.max(0, (ls || []).findIndex(l => l.id === lid)); const cur = (ls || [])[idx];
  const { count: nq } = await sb.from('quiz_questions').select('*', { count: 'exact', head: true }).eq('course_id', id);
  app.innerHTML = `<div class="row" style="justify-content:space-between"><h2>${esc(c.title)}</h2><a class="btn o s" href="#/course/${id}">صفحة الكورس</a></div><div class="lay"><div class="box" style="padding:0"><div style="padding:12px"><div class="bar"><i style="width:${pg.pct}%"></i></div><div class="muted">${pg.pct}% مكتمل (${pg.done}/${pg.total})</div></div>
  ${(ls || []).map((l, i) => `<div class="ls ${cur && l.id === cur.id ? 'on' : ''}" data-id="${l.id}">${done.has(l.id) ? '✅' : '⭕'} ${i + 1}. ${esc(l.title)}</div>`).join('')}
  <div style="padding:12px;display:grid;gap:8px">${nq ? `<a class="btn s y" href="#/quiz/${id}">📝 اختبار الكورس</a>` : ''}${pg.pct === 100 && pg.total ? `<a class="btn s" href="#/cert/${id}">🏅 شهادة الإتمام</a>` : ''}</div></div>
  <div class="box">${cur ? `<h3>${esc(cur.title)}</h3>${cur.video_url ? `<iframe class="vid" src="${esc(emb(cur.video_url))}" allowfullscreen></iframe>` : ''}<p style="white-space:pre-wrap">${esc(cur.content)}</p>
  <div class="row"><button class="btn ${done.has(cur.id) ? 'o' : ''}" id="dn">${done.has(cur.id) ? 'إلغاء الإكمال' : 'تم إكمال الدرس ✓'}</button>
  ${idx > 0 ? `<a class="btn o" href="#/learn/${id}/${ls[idx - 1].id}">السابق</a>` : ''}${idx < ls.length - 1 ? `<a class="btn o" href="#/learn/${id}/${ls[idx + 1].id}">التالي</a>` : ''}</div>` : '<p class="muted">لا دروس بعد.</p>'}</div></div>`;
  $$('.ls[data-id]').forEach(e => e.onclick = () => location.hash = `#/learn/${id}/${e.dataset.id}`);
  const d = $('#dn'); if (d) d.onclick = async () => {
    if (done.has(cur.id)) await sb.from('lesson_progress').delete().eq('student_id', me.id).eq('lesson_id', cur.id);
    else { await sb.from('lesson_progress').insert({ student_id: me.id, lesson_id: cur.id }); if (idx < ls.length - 1) { location.hash = `#/learn/${id}/${ls[idx + 1].id}`; return; } }
    learn(id, cur.id);
  };
}
async function quiz(cid) {
  if (needLogin()) return;
  const { data: c } = await sb.from('courses').select('title').eq('id', cid).single();
  const { data: qs } = await sb.from('quiz_questions').select('*').eq('course_id', cid).order('position');
  const { data: at } = await sb.from('quiz_attempts').select('*').eq('student_id', me.id).eq('course_id', cid).order('created_at', { ascending: false }).limit(5);
  app.innerHTML = `<h2>اختبار: ${esc(c?.title)}</h2><div class="box"><form id="qf">${(qs || []).map((q, i) => `<div class="qq"><b>${i + 1}. ${esc(q.question)}</b>${(q.options || []).map((o, j) => `<label class="opt"><input type="radio" name="q${i}" value="${j}" style="width:auto;margin:0 0 0 8px"> ${esc(o)}</label>`).join('')}</div>`).join('') || '<p class="muted">لا توجد أسئلة.</p>'}
  ${(qs || []).length ? '<button class="btn">تسليم الإجابات</button>' : ''}</form><div id="qr"></div></div>
  ${(at || []).length ? `<div class="box"><h3>محاولاتك السابقة</h3>${at.map(a => `<div class="muted">${fmtDate(a.created_at)}: ${a.score}/${a.total}</div>`).join('')}</div>` : ''}<a class="btn o" href="#/learn/${cid}">رجوع للكورس</a>`;
  const f = $('#qf'); if (f) f.onsubmit = async e => {
    e.preventDefault(); let sc = 0;
    qs.forEach((q, i) => { const v = f.querySelector(`input[name=q${i}]:checked`); if (v && +v.value === q.answer) sc++; });
    await sb.from('quiz_attempts').insert({ student_id: me.id, course_id: cid, score: sc, total: qs.length });
    const pass = sc / qs.length >= 0.6;
    $('#qr').innerHTML = `<div class="box" style="background:${pass ? '#e6f6ea' : '#fdecea'}"><h3>${pass ? '🎉 ممتاز!' : 'حاول مرة أخرى'}</h3><p>نتيجتك: ${sc} من ${qs.length}</p></div>`;
  };
}
async function cert(cid) {
  if (needLogin()) return;
  const { data: c } = await sb.from('courses').select('title,instructor_name,profiles!teacher_id(full_name)').eq('id', cid).single();
  const pg = await progress(cid, me.id);
  if (!pg.total || pg.pct < 100) { app.innerHTML = `<div class="box"><p>أكمل جميع دروس الكورس أولًا للحصول على الشهادة.</p><a class="btn" href="#/learn/${cid}">متابعة الكورس</a></div>`; return; }
  app.innerHTML = `<div class="certwrap"><div class="cert"><div class="cborder"><div class="ctitle">شهادة إتمام</div><p>تشهد ${esc(S.name || 'المنصة')} بأن</p><div class="cname">${esc(me.full_name)}</div>
  <p>قد أتمّ بنجاح كورس</p><div class="ccourse">${esc(c.title)}</div><p class="muted">${fmtDate(new Date())}</p><p class="muted">${esc(c.profiles?.full_name || c.instructor_name || '')}</p></div></div>
  <div class="row noprint" style="justify-content:center;margin-top:16px"><button class="btn" onclick="window.print()">🖨️ طباعة / حفظ PDF</button><a class="btn o" href="#/dashboard">رجوع</a></div></div>`;
}
function authForm(reg) {
  const fl = (id, lab, type = 'text', extra = '') => `<div class="fl"><label for="${id}">${lab}</label><input id="${id}" type="${type}" ${extra}></div>`;
  const stepper = n => `<div class="stp">${['بيانات الحساب', 'نوع الحساب', 'أكمل حسابك'].map((t, i) => `<div class="${i + 1 <= n ? 'on' : ''}"><i></i><b>${t}</b></div>`).join('')}</div>`;
  if (!reg) {
    app.innerHTML = `<div class="afm"><h1>تسجيل الدخول</h1>${fl('em', 'البريد الإلكتروني', 'email')}<div class="fl"><label for="pw">كلمة المرور</label><input id="pw" type="password"><button type="button" class="eye" id="ey">👁</button></div>
    <button class="btn big2" id="ok">دخول</button><p class="muted" style="text-align:center"><a href="#/register">إنشاء حساب جديد</a> · <a href="#/contact">نسيت كلمة المرور؟</a></p></div>`;
    $('#ey').onclick = () => { const p = $('#pw'); p.type = p.type === 'password' ? 'text' : 'password'; };
    $('#ok').onclick = async () => {
      const r = await sb.auth.signInWithPassword({ email: $('#em').value.trim(), password: $('#pw').value });
      if (r.error) { toast('بيانات الدخول غير صحيحة'); return; }
      await loadMe(); location.hash = '#/dashboard';
    };
    return;
  }
  const d = { role: 'student' };
  const step1 = () => {
    app.innerHTML = `<div class="afm"><h1>إنشاء حساب جديد</h1>${stepper(1)}${fl('fn', 'الاسم الأول')}${fl('ln', 'اسم العائلة')}${fl('em', 'البريد الإلكتروني', 'email')}
    <div class="fl ph"><label for="ph">رقم المحمول</label><span class="cc">🇪🇬 +20</span><input id="ph" inputmode="numeric" placeholder="1XXXXXXXXX"></div>
    <div class="fl"><label for="pw">كلمة المرور</label><input id="pw" type="password"><button type="button" class="eye" id="ey">👁</button></div>
    <label class="tm"><input type="checkbox" id="tm"><span>من خلال الاستمرار، فإنك توافق على <a href="#/terms">الشروط والأحكام</a> و<a href="#/privacy">سياسة الخصوصية</a> الخاصة بنا</span></label>
    <button class="btn big2" id="ok">التالي</button><div class="or"><span>أو</span></div><p class="muted" style="text-align:center">عندك حساب؟ <a href="#/login">سجّل دخولك</a></p></div>`;
    $('#ey').onclick = () => { const p = $('#pw'); p.type = p.type === 'password' ? 'text' : 'password'; };
    ['fn', 'ln', 'em', 'ph'].forEach(k => { if (d[k]) $('#' + k).value = d[k]; });
    $('#ok').onclick = () => {
      d.fn = $('#fn').value.trim(); d.ln = $('#ln').value.trim(); d.em = $('#em').value.trim(); d.ph = $('#ph').value.trim(); d.pw = $('#pw').value;
      if (!d.fn || !d.em) return toast('اكتب الاسم والبريد الإلكتروني');
      if (d.pw.length < 6) return toast('كلمة المرور 6 أحرف على الأقل');
      if (!$('#tm').checked) return toast('وافق على الشروط والأحكام للمتابعة');
      step2();
    };
  };
  const step2 = () => {
    app.innerHTML = `<div class="afm"><h1>إنشاء حساب جديد</h1>${stepper(2)}<p class="muted" style="text-align:center">اختار نوع حسابك</p>
    <div class="roles"><button class="rl ${d.role === 'student' ? 'on' : ''}" data-r="student"><span>🎓</span><b>طالب</b><small>أتعلم وأسجّل في الكورسات</small></button><button class="rl ${d.role === 'teacher' ? 'on' : ''}" data-r="teacher"><span>👨‍🏫</span><b>مدرس</b><small>أنشئ كورسات وأشاركها</small></button></div>
    <button class="btn big2" id="ok">أنشئ حسابك</button><button class="btn g big2" id="bk" style="margin-top:8px">رجوع</button></div>`;
    $$('.rl').forEach(b => b.onclick = () => { d.role = b.dataset.r; $$('.rl').forEach(x => x.classList.toggle('on', x === b)); });
    $('#bk').onclick = step1;
    $('#ok').onclick = async () => {
      const r = await sb.auth.signUp({ email: d.em, password: d.pw, options: { data: { full_name: (d.fn + ' ' + d.ln).trim(), role: d.role } } });
      if (r.error) { toast(r.error.message); return; }
      if (!r.data.session) { toast('تحقق من بريدك لتأكيد الحساب'); return; }
      if (d.ph) await sb.from('profiles').update({ phone: '+20' + d.ph.replace(/^0/, '') }).eq('id', r.data.user.id);
      await loadMe(); step3();
    };
  };
  const step3 = () => {
    app.innerHTML = `<div class="afm" style="text-align:center"><h1>إنشاء حساب جديد</h1>${stepper(3)}<div style="font-size:4rem">🎉</div><h2>أهلاً بيك يا ${esc(d.fn)}!</h2><p class="muted">تم إنشاء حسابك بنجاح. تقدر تكمل بياناتك (الصورة والنبذة) من صفحة حسابك.</p>
    <a class="btn big2" href="#/dashboard">ابدأ رحلتك</a><a class="btn o big2" href="#/profile" style="margin-top:8px">أكمل بيانات حسابي</a></div>`;
  };
  step1();
}
async function profilePage() {
  if (needLogin()) return;
  app.innerHTML = `<h1>حسابي</h1><div class="box narrow" style="max-width:520px"><div class="row">${avatar(me, 72)}<label class="btn o s">تغيير الصورة<input type="file" id="pf" accept="image/*" hidden></label></div>
  <label>الاسم</label><input id="pn" value="${esc(me.full_name)}"><label>البريد</label><input value="${esc(me.email)}" disabled><label>الهاتف</label><input id="pp" value="${esc(me.phone)}">
  <label>المسمى (للمدرسين)</label><input id="pt" value="${esc(me.title)}"><label>نبذة</label><textarea id="pb" rows="3">${esc(me.bio)}</textarea><button class="btn" id="ps">حفظ</button></div>
  <div class="box narrow" style="max-width:520px"><h3>تغيير كلمة المرور</h3><input id="np" type="password" placeholder="كلمة المرور الجديدة"><button class="btn o" id="pc">تغيير</button></div>`;
  $('#ps').onclick = async () => { const { error } = await sb.from('profiles').update({ full_name: $('#pn').value, phone: $('#pp').value, title: $('#pt').value, bio: $('#pb').value }).eq('id', me.id); toast(error ? error.message : 'تم الحفظ'); await loadMe(); };
  $('#pf').onchange = async e => { const u = await uploadImage(e.target.files[0], 'avatars'); if (u) { await sb.from('profiles').update({ avatar_url: u }).eq('id', me.id); await loadMe(); profilePage(); } };
  $('#pc').onclick = async () => { const p = $('#np').value; if (p.length < 6) return toast('6 أحرف على الأقل'); const { error } = await sb.auth.updateUser({ password: p }); toast(error ? error.message : 'تم تغيير كلمة المرور'); };
}
async function dashboard() {
  if (needLogin()) return;
  if (me.role !== 'student') return teacherDash();
  const { data } = await sb.from('enrollments').select('course_id,courses(*,profiles!teacher_id(full_name))').eq('student_id', me.id);
  const rows = []; for (const e of data || []) rows.push({ c: e.courses, pg: await progress(e.course_id, me.id) });
  const { data: at } = await sb.from('quiz_attempts').select('score,total').eq('student_id', me.id);
  const done = rows.filter(r => r.pg.pct === 100 && r.pg.total).length;
  const aq = (at || []).length ? Math.round((at.reduce((s, a) => s + a.score / a.total, 0) / at.length) * 100) : 0;
  const mine = new Set(rows.map(r => r.c.id));
  const { data: sg } = await sb.from('courses').select(CSEL).eq('status', 'published').order('featured', { ascending: false }).limit(12);
  const sug = (sg || []).filter(c => !mine.has(c.id)).slice(0, 6);
  const cur = rows.filter(r => !(r.pg.pct === 100 && r.pg.total)), fin = rows.filter(r => r.pg.pct === 100 && r.pg.total);
  const empty = (m, t) => `<div class="emp"><div class="ei">🗂️</div><div><h3>${m}</h3><a class="btn" href="#/courses">${t}</a></div></div>`;
  const grid = (arr, f) => `<div class="grid">${arr.map(f).join('')}</div>`;
  const prog = ({ c, pg }) => courseCard(c, `<div class="bar"><i style="width:${pg.pct}%"></i></div><span class="muted">${pg.pct}%</span>${pg.pct === 100 && pg.total ? `<a href="#/cert/${c.id}">🏅 الشهادة</a>` : ''}`, `#/learn/${c.id}`).replace('التفاصيل', 'تابع');
  const tr = (S.tracks || []).slice(0, 3);
  app.innerHTML = `<div class="dl"><aside class="sb"><div class="sbh">🎓 ${esc(S.name || 'منصة تعلّم')}</div>
  <div class="sbg"><b>▦ لوحتي التعليمية</b><a href="#dcur" class="on">الدورات الحالية</a><a href="#dfin">الدورات المنتهية</a><a href="#dper">أدائي</a><a href="#dcer">شهاداتي</a></div>
  ${tr.map(t => `<a class="sbl" href="#/courses">${esc(t.emoji || '📘')} ${esc(t.title)}</a>`).join('')}
  <a class="sbl" href="#/courses">📚 تصفح جميع الدورات</a><a class="sbl" href="#dsug">✨ المقترح لي</a><a class="sbl" href="#/profile">👤 حسابي</a></aside>
  <div class="dm"><h1>أهلاً ${esc(me.full_name)} 👋</h1><div class="stats"><div class="stat"><b>${rows.length}</b>كورسات مسجّل بها</div><div class="stat"><b>${fin.length}</b>كورسات مكتملة</div><div class="stat"><b>${aq}%</b>متوسط الاختبارات</div></div>
  <section id="dcur"><h2>الدورات الحالية</h2>${cur.length ? grid(cur, prog) : '<p class="muted">لا توجد لديك دورات حالية</p>' + empty('', 'تصفح تعليمي'.replace('تعليمي', 'الدورات'))}</section>
  <section id="dfin"><h2>الدورات المنتهية</h2>${fin.length ? grid(fin, prog) : '<p class="muted">لا توجد دورات منتهية بعد</p>'}</section>
  <section id="dper"><h2>أدائي</h2><p class="muted">${(at || []).length} محاولة اختبار، متوسط النتيجة ${aq}%</p></section>
  <section id="dcer"><h2>شهاداتي</h2>${fin.length ? fin.map(({ c }) => `<a class="btn o s" href="#/cert/${c.id}">🏅 ${esc(c.title)}</a>`).join(' ') : '<p class="muted">أكمل دورة لتحصل على شهادتك</p>'}</section>
  <section id="dsug" class="sg"><h2>المقترح لي</h2>${sug.length ? grid(sug, c => courseCard(c)) : empty('لا توجد دورات مقترحة حاليًا', 'تصفح الدورات')}</section></div></div>`;
  $$('.sb a[href^="#d"]').forEach(a => a.onclick = e => { e.preventDefault(); const t = $(a.getAttribute('href')); if (t) t.scrollIntoView({ behavior: 'smooth' }); });
}
async function teacherDash() {
  const q = sb.from('courses').select('*').order('created_at', { ascending: false }); if (me.role === 'teacher') q.eq('teacher_id', me.id);
  const { data } = await q; const ids = (data || []).map(c => c.id);
  const { data: en } = ids.length ? await sb.from('enrollments').select('course_id').in('course_id', ids) : { data: [] };
  const n = {}; (en || []).forEach(e => n[e.course_id] = (n[e.course_id] || 0) + 1);
  app.innerHTML = `<div class="row"><h1 style="flex:1">لوحة المدرس</h1>${me.role === 'admin' ? '<a class="btn o" href="admin.html">لوحة الإدارة</a>' : ''}<button class="btn y" id="new">+ كورس جديد</button></div>
  <div class="stats"><div class="stat"><b>${(data || []).length}</b>الكورسات</div><div class="stat"><b>${(en || []).length}</b>إجمالي المسجلين</div><div class="stat"><b>${(data || []).filter(c => c.status === 'published').length}</b>منشور</div></div>
  <div class="tw"><table><tr><th>الكورس</th><th>الحالة</th><th>الطلاب</th><th></th></tr>${(data || []).map(c => `<tr><td>${esc(c.title)}</td><td>${stAr[c.status]}</td><td>${n[c.id] || 0}</td><td><a class="btn s" href="#/edit/${c.id}">تعديل</a></td></tr>`).join('')}</table></div>`;
  $('#new').onclick = async () => { const { data: c, error } = await sb.from('courses').insert({ title: 'كورس جديد', teacher_id: me.id }).select().single(); if (error) toast(error.message); else location.hash = `#/edit/${c.id}`; };
}
async function edit(id) {
  if (needLogin()) return;
  const { data: c } = await sb.from('courses').select('*').eq('id', id).single(); if (!c) { app.innerHTML = '<p>غير موجود</p>'; return; }
  const [{ data: ls }, { data: qs }] = await Promise.all([sb.from('lessons').select('*').eq('course_id', id).order('position'), sb.from('quiz_questions').select('*').eq('course_id', id).order('position')]);
  const adm = me.role === 'admin';
  app.innerHTML = `<h1>تعديل الكورس</h1><div class="box"><label>العنوان</label><input id="t" value="${esc(c.title)}"><label>الوصف</label><textarea id="d" rows="4">${esc(c.description)}</textarea>
  <div class="two"><div><label>التصنيف</label><select id="ct">${cats.map(x => `<option value="${x.id}" ${x.id == c.category_id ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select></div>
  <div><label>المستوى</label><select id="lv">${['مبتدئ', 'متوسط', 'متقدم'].map(x => `<option ${x === c.level ? 'selected' : ''}>${x}</option>`).join('')}</select></div>
  <div><label>المدة (مثال: 4 ساعات)</label><input id="du" value="${esc(c.duration)}"></div><div><label>إيموجي الغلاف</label><input id="em" value="${esc(c.emoji)}"></div></div>
  <label>ماذا سيتعلم الطالب؟ (سطر لكل نقطة)</label><textarea id="oc" rows="4">${esc(c.outcomes)}</textarea>
  <label>صورة الغلاف</label><div class="row">${c.cover_url ? `<img src="${esc(c.cover_url)}" style="height:60px;border-radius:8px">` : ''}<input type="file" id="cvf" accept="image/*" style="flex:1"><button class="btn o s" id="cvx">إزالة</button></div>
  <div class="row"><button class="btn" id="sv">حفظ</button>${c.status === 'published' && !adm ? '' : `<button class="btn y" id="sub">${adm ? 'نشر' : 'إرسال للمراجعة'}</button>`}
  ${adm && c.status === 'published' ? '<button class="btn o" id="unp">إلغاء النشر</button>' : ''}<button class="btn r" id="del">حذف</button><span class="tag">${stAr[c.status]}</span></div></div>
  <div class="box"><h3>الدروس</h3>${(ls || []).map(l => `<details class="ed"><summary>${l.position}. ${esc(l.title)}</summary><label>العنوان</label><input data-lt="${l.id}" value="${esc(l.title)}"><label>رابط الفيديو</label><input data-lv="${l.id}" value="${esc(l.video_url)}"><label>الشرح</label><textarea data-lc="${l.id}" rows="4">${esc(l.content)}</textarea><label>الترتيب</label><input type="number" data-lp="${l.id}" value="${l.position}"><div class="row"><button class="btn s" data-ls="${l.id}">حفظ الدرس</button><button class="btn s r" data-del="${l.id}">حذف</button></div></details>`).join('')}
  <h4>إضافة درس</h4><label>العنوان</label><input id="lt"><label>رابط فيديو (يوتيوب)</label><input id="lv2"><label>الشرح</label><textarea id="lc" rows="4"></textarea><button class="btn" id="al">إضافة الدرس</button></div>
  <div class="box"><h3>أسئلة الاختبار</h3>${(qs || []).map((q, i) => `<div class="ls"><span style="flex:1">${i + 1}. ${esc(q.question)} <span class="muted">(الإجابة: ${esc((q.options || [])[q.answer])})</span></span><button class="btn s r" data-dq="${q.id}">حذف</button></div>`).join('') || '<p class="muted">لا أسئلة بعد.</p>'}
  <h4>إضافة سؤال</h4><input id="qt" placeholder="نص السؤال"><input id="o0" placeholder="الاختيار 1"><input id="o1" placeholder="الاختيار 2"><input id="o2" placeholder="الاختيار 3 (اختياري)"><input id="o3" placeholder="الاختيار 4 (اختياري)">
  <label>رقم الإجابة الصحيحة</label><select id="qa"><option value="0">1</option><option value="1">2</option><option value="2">3</option><option value="3">4</option></select><button class="btn" id="aq">إضافة السؤال</button></div>`;
  const patch = async o => { const { error } = await sb.from('courses').update(o).eq('id', id); error ? toast(error.message) : toast('تم'); return !error; };
  const vals = () => ({ title: $('#t').value, description: $('#d').value, category_id: +$('#ct').value, level: $('#lv').value, duration: $('#du').value || null, emoji: $('#em').value || null, outcomes: $('#oc').value || null });
  $('#sv').onclick = () => patch(vals());
  $('#cvf').onchange = async e => { const u = await uploadImage(e.target.files[0], 'covers'); if (u && await patch({ cover_url: u })) edit(id); };
  $('#cvx').onclick = async () => { if (await patch({ cover_url: null })) edit(id); };
  const sub = $('#sub'); if (sub) sub.onclick = async () => { if (await patch({ ...vals(), status: adm ? 'published' : 'pending' })) edit(id); };
  const unp = $('#unp'); if (unp) unp.onclick = async () => { if (await patch({ status: 'draft' })) edit(id); };
  $('#del').onclick = async () => { if (confirm('حذف الكورس نهائيًا؟')) { await sb.from('courses').delete().eq('id', id); location.hash = '#/dashboard'; } };
  $('#al').onclick = async () => { if (!$('#lt').value) return toast('اكتب عنوان الدرس'); const { error } = await sb.from('lessons').insert({ course_id: id, title: $('#lt').value, video_url: $('#lv2').value || null, content: $('#lc').value, position: (ls || []).length + 1 }); error ? toast(error.message) : edit(id); };
  $$('[data-ls]').forEach(b => b.onclick = async () => { const k = b.dataset.ls; const { error } = await sb.from('lessons').update({ title: $(`[data-lt="${k}"]`).value, video_url: $(`[data-lv="${k}"]`).value || null, content: $(`[data-lc="${k}"]`).value, position: +$(`[data-lp="${k}"]`).value }).eq('id', k); error ? toast(error.message) : toast('تم حفظ الدرس'); });
  $$('[data-del]').forEach(b => b.onclick = async () => { await sb.from('lessons').delete().eq('id', b.dataset.del); edit(id); });
  $$('[data-dq]').forEach(b => b.onclick = async () => { await sb.from('quiz_questions').delete().eq('id', b.dataset.dq); edit(id); });
  $('#aq').onclick = async () => { const o = [0, 1, 2, 3].map(i => $('#o' + i).value.trim()).filter(Boolean); if (!$('#qt').value || o.length < 2) return toast('اكتب السؤال واختيارين على الأقل'); const a = +$('#qa').value; if (a >= o.length) return toast('رقم الإجابة غير صحيح'); const { error } = await sb.from('quiz_questions').insert({ course_id: id, question: $('#qt').value, options: o, answer: a, position: (qs || []).length + 1 }); error ? toast(error.message) : edit(id); };
}
async function instructors() {
  const { data } = await sb.from('profiles').select('*').eq('role', 'teacher');
  app.innerHTML = `<h1>المدرسون</h1><div class="grid">${(data || []).map(t => `<a class="card" href="#/instructor/${t.id}"><div class="bd" style="align-items:center;text-align:center">${avatar(t, 80)}<b>${esc(t.full_name)}</b><span class="muted">${esc(t.title || 'مدرس')}</span><p class="muted">${esc((t.bio || '').slice(0, 90))}</p></div></a>`).join('') || '<p class="muted">لا يوجد مدرسون بعد.</p>'}</div>`;
}
async function instructor(id) {
  const { data: t } = await sb.from('profiles').select('*').eq('id', id).single();
  const { data: cs } = await sb.from('courses').select(CSEL).eq('teacher_id', id).eq('status', 'published');
  if (!t) { app.innerHTML = '<p>غير موجود</p>'; return; }
  app.innerHTML = `<div class="box row">${avatar(t, 96)}<div><h1 style="margin:0">${esc(t.full_name)}</h1><div class="muted">${esc(t.title || 'مدرس')}</div><p>${esc(t.bio)}</p></div></div><h2 class="sec">كورسات المدرس</h2><div class="grid">${(cs || []).map(c => courseCard(c)).join('') || '<p class="muted">لا كورسات منشورة بعد.</p>'}</div>`;
}
function textPage(title, body, extra = '') { app.innerHTML = `<h1>${esc(title)}</h1><div class="box" style="white-space:pre-wrap">${esc(body)}</div>${extra}`; }
async function about() {
  const { count: n } = await sb.from('courses').select('*', { count: 'exact', head: true }).eq('status', 'published');
  app.innerHTML = `<h1>${esc(S.about_title || 'عن المنصة')}</h1><div class="box abox">${S.about_image ? `<img src="${esc(S.about_image)}" alt="">` : ''}<div><p style="white-space:pre-wrap">${esc(S.about_text)}</p></div></div>
  <div class="grid">${S.vision ? `<div class="box"><div class="big">👁️</div><h3>رؤيتنا</h3><p>${esc(S.vision)}</p></div>` : ''}${S.mission ? `<div class="box"><div class="big">🎯</div><h3>رسالتنا</h3><p>${esc(S.mission)}</p></div>` : ''}<div class="box"><div class="big">📚</div><h3>${n || 0} كورس</h3><p>متاحة الآن على المنصة</p></div></div>`;
}
async function contact() {
  const c = S.contact || {};
  app.innerHTML = `<h1>اتصل بنا</h1><div class="lay2"><div class="box"><label>الاسم</label><input id="cn"><label>البريد الإلكتروني</label><input id="ce" type="email"><label>الموضوع</label><input id="cs"><label>الرسالة</label><textarea id="cb" rows="5"></textarea><button class="btn" id="cx">إرسال</button></div>
  <div class="box"><h3>بيانات التواصل</h3>${c.email ? `<p>✉️ ${esc(c.email)}</p>` : ''}${c.phone ? `<p>📞 ${esc(c.phone)}</p>` : ''}${c.whatsapp ? `<p><a href="https://wa.me/${esc(String(c.whatsapp).replace(/\D/g, ''))}" target="_blank">💬 واتساب</a></p>` : ''}${c.address ? `<p>📍 ${esc(c.address)}</p>` : ''}${c.hours ? `<p>🕘 ${esc(c.hours)}</p>` : ''}</div></div>`;
  if (me) { $('#cn').value = me.full_name || ''; $('#ce').value = me.email || ''; }
  $('#cx').onclick = async () => { if (!$('#cn').value || !$('#cb').value) return toast('اكتب الاسم والرسالة'); const { error } = await sb.from('messages').insert({ name: $('#cn').value, email: $('#ce').value, subject: $('#cs').value, body: $('#cb').value }); if (error) toast('تعذّر الإرسال'); else { toast('تم إرسال رسالتك'); $('#cb').value = ''; $('#cs').value = ''; } };
}
async function faqPage() {
  const { data } = await sb.from('faqs').select('*').order('position');
  app.innerHTML = `<h1>الأسئلة الشائعة</h1>${(data || []).map(f => `<details class="box fq"><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('') || '<p class="muted">لا أسئلة.</p>'}`;
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
      case 'quiz': return await quiz(p[1]);
      case 'cert': return await cert(p[1]);
      case 'edit': return await edit(p[1]);
      case 'login': return authForm(false);
      case 'register': return authForm(true);
      case 'profile': return await profilePage();
      case 'dashboard': return await dashboard();
      case 'instructors': return await instructors();
      case 'instructor': return await instructor(p[1]);
      case 'about': return await about();
      case 'contact': return await contact();
      case 'faq': return await faqPage();
      case 'terms': return textPage('الشروط والأحكام', S.terms);
      case 'privacy': return textPage('سياسة الخصوصية', S.privacy);
      case 'admin': location.href = 'admin.html'; return;
      default: return await home();
    }
  } catch (e) { app.innerHTML = '<p>حصل خطأ، حدّث الصفحة.</p>'; console.error(e); }
}
addEventListener('hashchange', route);
(async () => { try { await loadSettings(); await loadMe(); } catch (e) { console.error(e); } footer(); header(); route(); })();
