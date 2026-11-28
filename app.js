window.addEventListener('error', e => { const m = $('#app'); if (m && m.innerText.includes('جاري التحميل')) m.innerHTML = '<p style="text-align:center;margin-top:60px">حصل خطأ في التحميل، حدّث الصفحة. (' + esc(e.message || '') + ')</p>'; });
const app = $('#app');
let me = null, cats = [], stages = [], grades = [], subjects = [];
const gradeName = id => (grades.find(g => g.id == id) || {}).name || '', subjName = id => (subjects.find(g => g.id == id) || {}).name || '';
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
  const col = c.color || '#24506f';
  return `<div class="cv" style="background:linear-gradient(135deg,${col},${shade(col, -40)})"><span class="cvi">${c.emoji || catIcon(c.category_id)}</span></div>`;
}
async function loadMe() {
  me = await getMe();
  const { data: c } = await sb.from('categories').select('*').order('id'); cats = c || [];
  const [a1, a2, a3] = await Promise.all([sb.from('stages').select('*').order('position'), sb.from('grades').select('*').order('position'), sb.from('subjects').select('*').order('position')]); stages = a1.data || []; grades = a2.data || []; subjects = a3.data || [];
  header();
}
function header() {
  const logo = S.logo_url ? `<img src="${esc(S.logo_url)}" alt="" style="height:38px">` : `<span class="lg">🎓</span> ${esc(S.name || 'منصة تعلّم')}`;
  $('#top').innerHTML = S.announcement ? `<div class="ann">${esc(S.announcement)}</div>` : '';
  $('#hdr').innerHTML = `<a class="logo" href="#/">${logo}</a>
  <div class="dd"><button class="ddb" id="ddb">تصفح الدورات <i>⌄</i></button><div class="ddm" id="ddm">${cats.map(c => `<a href="#/courses?cat=${c.id}">${c.icon || '📘'} ${esc(c.name)}</a>`).join('')}<hr><a href="#/courses">كل الكورسات</a><a href="#/instructors">المدرسون</a><a href="#/about">عن المنصة</a><a href="#/contact">اتصل بنا</a>${me && (me.role === 'admin' || me.role === 'supervisor') ? '<a href="admin.html">لوحة الإدارة</a>' : ''}</div></div>
  <form class="hs2" id="hs2"><button aria-label="بحث">🔍</button><input id="hq2" placeholder="ابحث عن دورات"></form>
  <div class="auth">${me ? `<a href="#/dashboard" class="btn s o">لوحتي</a><a href="#/profile" class="who">${avatar(me, 34)}</a><span class="tag rl" style="margin:0 6px">${({ student: 'طالب', teacher: 'المدرس', admin: 'المدير', supervisor: 'المشرف' })[me.role] || ''}</span><button class="btn g s" id="out">خروج</button>` : '<a class="btn g" href="#/login">تسجيل الدخول</a><a class="btn" href="#/register">إنشاء حساب</a>'}</div>`;
  $('#ddb').onclick = e => { e.stopPropagation(); $('#ddm').classList.toggle('open'); };
  document.onclick = () => { const m = $('#ddm'); if (m) m.classList.remove('open'); };
  $('#hs2').onsubmit = e => { e.preventDefault(); location.hash = `#/courses?s=${encodeURIComponent($('#hq2').value)}`; };
  quick();
  const o = $('#out'); if (o) o.onclick = async () => { await sb.auth.signOut(); me = null; location.hash = '#/login'; await loadMe(); route(); };
}
const IC = {
  grid: '<rect x="3" y="3" width="7" height="8" rx="2"/><rect x="14" y="3" width="7" height="5" rx="2"/><rect x="14" y="12" width="7" height="9" rx="2"/><rect x="3" y="15" width="7" height="6" rx="2"/>',
  bulb: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.8.8 1 1.5 1 2.5h6c0-1 .2-1.7 1-2.5A6 6 0 0 0 12 3z"/>',
  case: '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 13h18"/>',
  book: '<path d="M6 3h12a1 1 0 0 1 1 1v16a1 1 0 0 1-1 1H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><path d="M9 3v7l2-1.5 2 1.5V3"/>',
  books: '<path d="M4 20V6a2 2 0 0 1 2-2h3v16H6a2 2 0 0 1-2-2zM9 4h4v16H9zM13 6l4-1 3 14-4 1z"/>',
  star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
  chart: '<path d="M4 20h16M6 20v-6M11 20V9M16 20v-9M20 20V5"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6M16 4.5a3.5 3.5 0 0 1 0 7M18 14.5c2.2.6 3.5 2.6 3.5 5.5"/>',
  help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7M12 17h.01"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2"/>',
  key: '<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M16 7l3 3"/>',
  pen: '<path d="M4 20h4L19 9l-4-4L4 16z"/>'
};
function quick() {
  let el = document.getElementById('qa'); if (!el) { el = document.createElement('div'); el.id = 'qa'; document.body.appendChild(el); }
  const h = (location.hash || '#/').split('?')[0];
  const ok = me && MENUS[me.role === 'student' ? 'student' : 'teacher'].some(i => i[0] === h);
  if (!ok) { el.innerHTML = ''; document.body.classList.remove('hasrail'); return; }
  if (!$('#rail')) applyRoleRail(h);
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
  <h3>${esc(c.title)}</h3><div class="muted">${esc(c.profiles?.full_name || c.instructor_name || '')}${c.duration ? ' · ⏱ ' + esc(c.duration) : ''}</div>${c.grade_id || c.subject_id ? `<div class="muted">${esc([gradeName(c.grade_id), subjName(c.subject_id)].filter(Boolean).join(' · '))}</div>` : ''}<div class="tag y" style="align-self:flex-start;margin-top:6px">${+c.price > 0 ? esc(c.price) + ' ج.م' : 'مجاني'}</div>
  ${rv.length ? `<div class="stars">${stars(r)} <span class="muted">(${rv.length})</span></div>` : ''}${extra}
  <div style="margin-top:auto"><a class="btn s" href="${link || '#/course/' + c.id}">التفاصيل</a></div></div></div>`;
}
const CSEL = '*,profiles!teacher_id(full_name,avatar_url),reviews(rating)';

const LP_SECS = ['hero', 'banners', 'courses', 'teachers', 'features', 'reviews', 'faq', 'contact', 'tracks', 'categories', 'partners', 'cta'];
async function home(q) {
  const cnt = async (t, f) => { let qq = sb.from(t).select('id', { count: 'exact', head: true }); if (f) qq = qq.eq(...f); return (await qq).count || 0; };
  let L = LND, prev = false;
  if (/preview=1/.test(q || '') && me && (me.role === 'admin' || me.role === 'supervisor')) { const { data } = await sb.from('site_settings').select('value').eq('key', 'landing_draft').maybeSingle(); if (data) { L = data.value; prev = true; } }
  L = L || { hero: { show: true, title: S.hero_title, subtitle: S.hero_subtitle, cta: S.hero_cta, tracks: S.tracks }, design: {} };
  const H = L.hero || {}, D = L.design || {};
  const shown = a => (a || []).filter(x => x.show !== false);
  const secs = (D.sections && D.sections.length ? D.sections : LP_SECS.map(k => ({ k, show: !['tracks', 'categories', 'partners', 'cta'].includes(k) }))).filter(x => x.show !== false).map(x => x.k);
  const cids = shown(L.courses).map(x => x.id), tl = shown(L.teachers);
  const [crs, tch, par, nc] = await Promise.all([
    cids.length && secs.includes('courses') ? sb.from('courses').select(CSEL).eq('status', 'published').in('id', cids) : { data: [] },
    tl.length && secs.includes('teachers') ? sb.from('profiles').select(PCOLS).in('id', tl.map(x => x.id)) : { data: [] },
    secs.includes('partners') ? sb.from('partners').select('*').order('position') : { data: [] },
    cnt('courses', ['status', 'published'])]);
  applyDesign(D); applySeo(L.seo);
  const grads = ['#8c0000,#e30000', '#6e0000,#c90000', '#a00000,#f04040'];
  const trk = (H.tracks || []).slice(0, 3);
  const trkCards = trk.map((t, i) => `<a class="tcard${t.image ? ' img' : ''}" href="#/courses" style="${t.image ? `background-image:url('${esc(t.image)}')` : `background:linear-gradient(145deg,${grads[i % 3]})`}"><span class="te">${t.image ? '' : esc(t.emoji || '📘')}</span><span class="ta">↖</span><span class="tl">${esc(t.title)}</span></a>`).join('');
  const price = c => `<div class="tag y" style="align-self:flex-start;margin-top:6px">${+c.price > 0 ? esc(c.price) + ' ج.م' : 'مجاني'}</div>`;
  const R = {
    hero: () => H.show === false ? '' : `<section class="hero3"><span class="deco d1"></span><span class="deco d2"></span><span class="deco d3"></span>
  <span class="pill">أكثر من ${Math.max(nc, 1)} دورة مجانية</span><h1>${esc(H.title || '')}</h1><p>${esc(H.subtitle || '')}</p>
  <div class="tcards">${trkCards}</div></section>
  <div class="row" style="justify-content:center;margin:-6px 0 18px"><a class="btn" href="#/courses">${esc(H.cta || 'تصفّح الكورسات')}</a>${me ? '' : '<a class="btn o" href="#/register">ابدأ مجانًا</a>'}</div>`,
    banners: () => { const b = shown(L.banners).filter(x => x.image); return b.length ? `<div class="lp-ban">${b.map(x => { const im = `<img src="${esc(x.image)}" alt="${esc(x.title || '')}" loading="lazy">`; return x.link ? `<a href="${esc(x.link)}">${im}</a>` : im; }).join('')}</div>` : ''; },
    courses: () => { const m = new Map((crs.data || []).map(c => [c.id, c])); const a = cids.map(id => m.get(id)).filter(Boolean).slice(0, 8); return a.length ? `<div class="row" style="justify-content:space-between"><h2 class="sec">الكورسات المميزة</h2><a href="#/courses">عرض الكل ←</a></div><div class="g4">${a.map(c => courseCard(c, price(c))).join('')}</div>` : ''; },
    teachers: () => { const m = new Map((tch.data || []).map(t => [t.id, t])); const a = tl.map(x => ({ x, t: m.get(x.id) })).filter(o => o.t).slice(0, 8); return a.length ? `<h2 class="sec">المدرسون المميزون</h2><div class="g4">${a.map(({ x, t }) => `<a class="card" href="#/instructor/${t.id}"><div class="bd" style="align-items:center;text-align:center">${avatar(t, 84)}<b>${esc(t.full_name)}</b><span class="muted">${esc(x.specialty || t.title || 'مدرس')}</span>${(x.bio || t.bio) ? `<p class="muted" style="font-size:.9rem;margin:6px 0 0">${esc(x.bio || t.bio)}</p>` : ''}</div></a>`).join('')}</div>` : ''; },
    features: () => { const a = shown(L.features).slice(0, 8); return a.length ? `<h2 class="sec">مميزات المنصة</h2><div class="g4">${a.map(f => `<div class="box ft"><div class="big">${esc(f.emoji || '✨')}</div><h3>${esc(f.title)}</h3><p class="muted">${esc(f.desc)}</p></div>`).join('')}</div>` : ''; },
    reviews: () => { const a = (L.reviews || []).filter(x => x.approved && x.show !== false).slice(0, 8); return a.length ? `<h2 class="sec">آراء الطلاب</h2><div class="g4">${a.map(t => `<div class="box">${+t.rating > 0 ? `<div class="stars">${stars(+t.rating)}</div>` : ''}<p>“${esc(t.text)}”</p><div class="row">${avatar({ avatar_url: t.avatar, full_name: t.name }, 40)}<div><b>${esc(t.name)}</b><div class="muted">${esc(t.role)}</div></div></div></div>`).join('')}</div>` : ''; },
    faq: () => { const a = shown(L.faqs).slice(0, 6); return a.length ? `<h2 class="sec">الأسئلة الشائعة</h2><div class="g3">${a.map(f => `<details class="box fq"><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('')}</div>` : ''; },
    contact: () => { const C = L.contact || {}, c = S.contact || {}, so = S.social || {}; if (C.show === false) return '';
      const sv = (d) => `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
      const IC = { mail: sv('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>'), phone: sv('<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>'), chat: sv('<path d="M21 12a9 9 0 1 1-4-7.5L21 4l-1.5 4A9 9 0 0 1 21 12z"/><path d="M9 9c0 3 3 6 6 6l1-2-2-1-1 1c-1-.5-2-1.5-2.5-2.5l1-1-1-2z"/>'), li: sv('<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 11v6M8 7.5v.1M12 17v-6M12 13a3 3 0 0 1 6 0v4"/>'), fb: sv('<circle cx="12" cy="12" r="9"/><path d="M14 8h-1.5A1.5 1.5 0 0 0 11 9.5V21M9 12.5h5"/>'), ig: sv('<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r=".6"/>'), pin: sv('<path d="M12 21s7-6 7-11a7 7 0 0 0-14 0c0 5 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>'), clock: sv('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>') };
      const tg = String(c.telegram || '').trim(), wa = String(c.whatsapp || '').replace(/\D/g, '');
      const tgUrl = tg ? (/^https?:/.test(tg) ? tg : 'https://t.me/' + tg.replace(/^@/, '')) : '';
      const handle = (u) => String(u).replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
      const row = (ic, lab, val, href) => `<div class="cr"><div class="ci">${ic}</div><div class="ct"><span>${lab}</span>${href ? `<a href="${esc(href)}" ${/^http/.test(href) ? 'target="_blank" rel="noopener"' : ''}><b>${esc(val)}</b></a>` : `<b>${esc(val)}</b>`}</div></div>`;
      const rows = [
        c.email ? row(IC.mail, 'البريد الإلكتروني', c.email, 'mailto:' + c.email) : '',
        c.phone ? row(IC.phone, 'رقم الهاتف', '\u202A' + c.phone + '\u202C', 'tel:' + String(c.phone).replace(/\s/g, '')) : '',
        (wa || tg) ? `<div class="cr"><div class="ci">${IC.chat}</div><div class="ct"><span>WhatsApp &amp; Telegram</span><b><bdi dir="ltr">${esc(c.whatsapp || tg)}</bdi>${wa ? ` <a class="mini" href="https://wa.me/${esc(wa)}" target="_blank" rel="noopener" title="WhatsApp">💬</a>` : ''}${tgUrl ? ` <a class="mini" href="${esc(tgUrl)}" target="_blank" rel="noopener" title="Telegram">✈️</a>` : ''}</b></div></div>` : '',
        so.linkedin ? row(IC.li, 'LinkedIn', handle(so.linkedin), so.linkedin) : '',
        so.facebook ? row(IC.fb, 'Facebook', handle(so.facebook), so.facebook) : '',
        so.instagram ? row(IC.ig, 'Instagram', handle(so.instagram), so.instagram) : '',
        c.address ? row(IC.pin, 'العنوان', c.address) : '',
        c.hours ? row(IC.clock, 'مواعيد العمل', c.hours) : ''
      ].join('');
      return `<h2 class="sec" id="lpc">${esc(C.title || 'تواصل معنا')}</h2>${C.text ? `<p class="muted" style="margin-top:-6px">${esc(C.text)}</p>` : ''}<div class="lcw"><div class="box lcc"><h3>بيانات التواصل</h3>${rows || '<p class="muted">لم تتم إضافة بيانات تواصل بعد</p>'}</div>
      <div class="box lcf"><h3>إرسال الرسائل</h3><label>الاسم</label><input id="hn" placeholder="ادخل اسمك هنا"><label>البريد الإلكتروني</label><input id="he" type="email" placeholder="ادخل بريدك الإلكتروني هنا"><label>عنوان الرسالة</label><input id="hs" placeholder="ادخل عنوان الرسالة هنا"><label>رسالتك</label><textarea id="hb" rows="3" placeholder="اكتب رسالتك هنا"></textarea><button class="btn lcb" id="hx"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4z"/></svg> إرسال رسالة</button></div></div>`; },
    tracks: () => (H.tracks || []).length ? `<h2 class="sec">مجالات التعلّم</h2><div class="grid3">${H.tracks.map(t => `<a class="card trk" href="#/courses"><div class="bd"><div class="big">${esc(t.emoji || '📘')}</div><h3>${esc(t.title)}</h3><p class="muted">${esc(t.desc)}</p></div></a>`).join('')}</div>` : '',
    categories: () => `<h2 class="sec">التصنيفات</h2><div class="grid">${cats.map(c => `<a class="card" href="#/courses?cat=${c.id}"><div class="bd" style="text-align:center"><div class="big">${c.icon || '📘'}</div><b>${esc(c.name)}</b><span class="muted">${esc(c.description || '')}</span></div></a>`).join('')}</div>`,
    partners: () => (par.data || []).length ? `<h2 class="sec">شركاؤنا</h2><div class="partners">${par.data.map(p => p.logo_url ? `<img src="${esc(p.logo_url)}" alt="${esc(p.name)}" title="${esc(p.name)}" loading="lazy">` : `<span class="tag">${esc(p.name)}</span>`).join('')}</div>` : '',
    cta: () => `<div class="cta"><h2>جاهز تبدأ؟</h2><p>أنشئ حسابك مجانًا وابدأ التعلّم الآن.</p><a class="btn y" href="${me ? '#/courses' : '#/register'}">${me ? 'تصفّح الكورسات' : 'إنشاء حساب'}</a></div>`
  };
  app.innerHTML = (prev ? '<div class="box" style="background:#fff7e0;border-color:#f5b800;text-align:center">👁️ معاينة المسودة، الزوار لا يرون هذه التغييرات إلا بعد النشر</div>' : '') + secs.map(k => R[k] ? R[k]() : '').join('');
  const hx = $('#hx'); if (hx) { if (me) { $('#hn').value = me.full_name || ''; $('#he').value = me.email || ''; } hx.onclick = async () => { if (!$('#hn').value.trim() || !$('#hb').value.trim()) return toast('اكتب الاسم والرسالة'); hx.disabled = true; const { error } = await sb.from('messages').insert({ name: $('#hn').value, email: $('#he').value, subject: $('#hs').value, body: $('#hb').value }); hx.disabled = false; if (error) return toast('تعذر الإرسال، حاول مرة أخرى'); toast('تم إرسال رسالتك ✓'); ['hs', 'hb'].forEach(i => $('#' + i).value = ''); }; }
}
async function courses(q) {
  const p = new URLSearchParams(q || ''); const cat = p.get('cat') || '', s = p.get('s') || '', lv = p.get('lv') || '', so = p.get('so') || 'new', gr = p.get('gr') || '', sj = p.get('sj') || '', st = p.get('st') || '', pr = p.get('pr') || '';
  let r = sb.from('courses').select(CSEL).eq('status', 'published');
  if (cat) r = r.eq('category_id', cat); if (lv) r = r.eq('level', lv); if (s) r = r.ilike('title', `%${s}%`); if (gr) r = r.eq('grade_id', gr); else if (st) r = r.in('grade_id', grades.filter(g => g.stage_id == st).map(g => g.id).concat([0])); if (sj) r = r.eq('subject_id', sj); if (pr === 'free') r = r.or('price.is.null,price.eq.0'); if (pr === 'paid') r = r.gt('price', 0);
  r = so === 'az' ? r.order('title') : r.order('created_at', { ascending: false });
  const { data } = await r;
  app.innerHTML = `<h1>الكورسات</h1><div class="box row"><input id="s" placeholder="ابحث عن كورس" value="${esc(s)}" style="flex:2;margin:0;min-width:160px">
  <select id="cat" style="flex:1;margin:0"><option value="">كل التصنيفات</option>${cats.map(c => `<option value="${c.id}" ${c.id == cat ? 'selected' : ''}>${esc(c.name)}</option>`).join('')}</select>
  <select id="st" style="flex:1;margin:0"><option value="">كل المراحل</option>${stages.map(x => `<option value="${x.id}" ${x.id == st ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select>
  <select id="gr" style="flex:1;margin:0"><option value="">كل الصفوف</option>${grades.filter(g => !st || g.stage_id == st).map(x => `<option value="${x.id}" ${x.id == gr ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select>
  <select id="sj" style="flex:1;margin:0"><option value="">كل المواد</option>${subjects.map(x => `<option value="${x.id}" ${x.id == sj ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select>
  <select id="pr" style="flex:1;margin:0"><option value="">مجاني ومدفوع</option><option value="free" ${pr === 'free' ? 'selected' : ''}>مجاني</option><option value="paid" ${pr === 'paid' ? 'selected' : ''}>مدفوع</option></select>
  <select id="lv" style="flex:1;margin:0"><option value="">كل المستويات</option>${['مبتدئ', 'متوسط', 'متقدم'].map(x => `<option ${x === lv ? 'selected' : ''}>${x}</option>`).join('')}</select>
  <select id="so" style="flex:1;margin:0"><option value="new">الأحدث</option><option value="az" ${so === 'az' ? 'selected' : ''}>أبجديًا</option></select>
  <button class="btn" id="go">بحث</button></div><p class="muted">${(data || []).length} كورس</p><div class="grid">${(data || []).map(c => courseCard(c)).join('') || '<p class="muted">لا نتائج.</p>'}</div>`;
  const go = () => location.hash = `#/courses?cat=${$('#cat').value}&lv=${encodeURIComponent($('#lv').value)}&st=${$('#st').value}&gr=${$('#gr').value}&sj=${$('#sj').value}&pr=${$('#pr').value}&so=${$('#so').value}&s=${encodeURIComponent($('#s').value)}`;
  $('#go').onclick = go; ['cat', 'lv', 'so', 'gr', 'sj', 'pr'].forEach(i => $('#' + i).onchange = go); $('#st').onchange = () => { $('#gr').value = ''; go(); }; $('#s').onkeydown = e => { if (e.key === 'Enter') go(); };
}
async function course(id) {
  const { data: c } = await sb.from('courses').select('*,profiles!teacher_id(id,full_name,bio,title,avatar_url)').eq('id', id).single();
  if (!c) { app.innerHTML = '<p>الكورس غير موجود.</p>'; return; }
  const [{ data: ls }, { data: rv }, { data: rel }] = await Promise.all([
    sb.from('lessons').select('id,title,position,video_url').eq('course_id', id).order('position'),
    sb.from('reviews').select('*,profiles(full_name,avatar_url)').eq('course_id', id).order('created_at', { ascending: false }),
    sb.from('courses').select(CSEL).eq('status', 'published').eq('category_id', c.category_id || 0).neq('id', id).limit(3)]);
  let enr = false, mine = null, subOk = false;
  if (me) { const { data } = await sb.from('enrollments').select('course_id').eq('student_id', me.id).eq('course_id', id); enr = !!(data && data.length); mine = (rv || []).find(x => x.student_id === me.id); }
  if (me && +c.price > 0) { const { data: sb2 } = await sb.from('subscriptions').select('end_date,status').or(`course_id.eq.${id},course_id.is.null`).eq('student_id', me.id).eq('status', 'active'); subOk = (sb2 || []).some(x => !x.end_date || new Date(x.end_date + 'T23:59:59') >= new Date()); }
  const access = +c.price <= 0 || subOk || (me && (me.role === 'admin' || me.role === 'supervisor')) || (me && me.id === c.teacher_id);
  const r = avg(rv || []);
  app.innerHTML = `<div class="chead">${coverHtml(c)}<div class="cinfo"><span class="tag">${esc(catName(c.category_id))}</span> <span class="tag y">${esc(c.level || '')}</span> ${c.grade_id ? `<span class="tag">${esc(gradeName(c.grade_id))}</span> ` : ''}${c.subject_id ? `<span class="tag">${esc(subjName(c.subject_id))}</span> ` : ''}<span class="tag y">${+c.price > 0 ? esc(c.price) + ' ج.م' : 'مجاني'}</span> ${c.status !== 'published' ? `<span class="tag">${stAr[c.status]}</span>` : ''}
  <h1>${esc(c.title)}</h1><p>${esc(c.description)}</p>
  <div class="muted">${(rv || []).length ? `<span class="stars">${stars(r)}</span> ${r.toFixed(1)} (${rv.length} تقييم) · ` : ''}${(ls || []).length} درس${c.duration ? ' · ⏱ ' + esc(c.duration) : ''}</div>
  <p class="muted">المدرس: ${c.profiles ? `<a href="#/instructor/${c.profiles.id}">${esc(c.profiles.full_name)}</a>` : esc(c.instructor_name || 'فريق المنصة')}</p>
  ${!access ? `<div class="box" style="background:#fff4e5"><b>🔒 الكورس مدفوع</b><p class="muted">فعّل اشتراكك مع الإدارة للوصول لكل دروس الكورس.</p><a class="btn" href="#/contact">تواصل مع الإدارة</a></div>` : enr ? `<a class="btn" href="#/learn/${id}">تابع التعلّم</a>` : `<button class="btn y" id="en">${+c.price > 0 ? 'ابدأ الكورس' : 'سجّل في الكورس مجانًا'}</button>`}</div></div>
  ${c.outcomes ? `<div class="box"><h3>ماذا ستتعلم؟</h3><ul class="chk">${c.outcomes.split('\n').filter(Boolean).map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>` : ''}
  ${(() => { const pv = (ls || []).find(l => l.video_url); return pv ? `<div class="box"><h3>معاينة الكورس</h3>${vidHtml(pv.video_url)}</div>` : ''; })()}
  ${access ? `<div class="box"><h3>محتوى الكورس (${(ls || []).length} درس)</h3>${(ls || []).map((l, i) => `<div class="ls">${i + 1}. ${esc(l.title)}</div>`).join('') || '<p class="muted">لا دروس بعد.</p>'}</div>` : ''}
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
  if (c && +c.price > 0 && me.role === 'student') {
    const { data: sb3 } = await sb.from('subscriptions').select('end_date').or(`course_id.eq.${id},course_id.is.null`).eq('student_id', me.id).eq('status', 'active');
    const okSub = (sb3 || []).some(x => !x.end_date || new Date(x.end_date + 'T23:59:59') >= new Date());
    if (!okSub) { app.innerHTML = `<div class="box" style="text-align:center;max-width:520px;margin:40px auto"><div style="font-size:3rem">🔒</div><h2>هذا الكورس مدفوع</h2><p class="muted">فعّل اشتراكك مع الإدارة للوصول لكل دروس الكورس.</p><a class="btn" href="#/contact">تواصل مع الإدارة</a></div>`; return; }
  }
  const { data: ls } = await sb.from('lessons').select('*').eq('course_id', id).order('position');
  const pg = await progress(id, me.id); const done = pg.set;
  const idx = Math.max(0, (ls || []).findIndex(l => l.id === lid)); const cur = (ls || [])[idx];
  const { count: nq } = await sb.from('quiz_questions').select('*', { count: 'exact', head: true }).eq('course_id', id);
  app.innerHTML = `<div class="row" style="justify-content:space-between"><h2>${esc(c.title)}</h2><a class="btn o s" href="#/course/${id}">صفحة الكورس</a></div><div class="lay"><div class="box" style="padding:0"><div style="padding:12px"><div class="bar"><i style="width:${pg.pct}%"></i></div><div class="muted">${pg.pct}% مكتمل (${pg.done}/${pg.total})</div></div>
  ${(ls || []).map((l, i) => `<div class="ls ${cur && l.id === cur.id ? 'on' : ''}" data-id="${l.id}">${done.has(l.id) ? '✅' : '⭕'} ${i + 1}. ${esc(l.title)}</div>`).join('')}
  <div style="padding:12px;display:grid;gap:8px">${nq ? `<a class="btn s y" href="#/quiz/${id}">📝 اختبار الكورس</a>` : ''}${pg.pct === 100 && pg.total ? `<a class="btn s" href="#/cert/${id}">🏅 شهادة الإتمام</a>` : ''}</div></div>
  <div class="box">${cur ? `<h3>${esc(cur.title)}</h3>${vidHtml(cur.video_url)}${cur.image_url ? `<img src="${esc(cur.image_url)}" style="max-width:100%;border-radius:12px;margin:8px 0">` : ''}<p style="white-space:pre-wrap">${esc(cur.content)}</p>${cur.file_url ? `<p><a class="btn o s" href="${esc(cur.file_url)}" target="_blank" rel="noopener">📎 ${esc(cur.file_name || 'تحميل الملف')}</a></p>` : ''}
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
    const t = d.role === 'teacher';
    app.innerHTML = `<div class="afm" style="text-align:center"><h1>إنشاء حساب جديد</h1>${stepper(3)}<div style="font-size:4rem">${t ? '⏳' : '🎉'}</div><h2>أهلاً بيك يا ${esc(d.fn)}!</h2><p class="muted">${t ? 'تم إنشاء حسابك. حساب المدرس بيتراجع من الإدارة الأول، وبعد الموافقة تقدر تنشر كورساتك. تقدر تكمل بياناتك من صفحة حسابك.' : 'تم إنشاء حسابك بنجاح. تقدر تكمل بياناتك (الصورة والنبذة) من صفحة حسابك.'}</p>
    <a class="btn big2" href="${t ? '#/profile' : '#/dashboard'}">${t ? 'أكمل بيانات حسابي' : 'ابدأ رحلتك'}</a><a class="btn o big2" href="#/" style="margin-top:8px">الصفحة الرئيسية</a></div>`;
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
  if (me.role !== 'student') return tPage('home');
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
  app.innerHTML = `<div class="dl">${roleMenu('#/dashboard')}
  <div class="dm"><h1>أهلاً ${esc(me.full_name)} 👋</h1><div class="stats"><div class="stat"><b>${rows.length}</b>كورسات مسجّل بها</div><div class="stat"><b>${fin.length}</b>كورسات مكتملة</div><div class="stat"><b>${aq}%</b>متوسط الاختبارات</div></div>
  <section id="dcur"><h2>الدورات الحالية</h2>${cur.length ? grid(cur, prog) : '<p class="muted">لا توجد لديك دورات حالية</p>' + empty('', 'تصفح تعليمي'.replace('تعليمي', 'الدورات'))}</section>
  <section id="dfin"><h2>الدورات المنتهية</h2>${fin.length ? grid(fin, prog) : '<p class="muted">لا توجد دورات منتهية بعد</p>'}</section>
  <section id="dper"><h2>أدائي</h2><p class="muted">${(at || []).length} محاولة اختبار، متوسط النتيجة ${aq}%</p></section>
  <section id="dcer"><h2>شهاداتي</h2>${fin.length ? fin.map(({ c }) => `<a class="btn o s" href="#/cert/${c.id}">🏅 ${esc(c.title)}</a>`).join(' ') : '<p class="muted">أكمل دورة لتحصل على شهادتك</p>'}</section>
  <section id="dsug" class="sg"><h2>المقترح لي</h2>${sug.length ? grid(sug, c => courseCard(c)) : empty('لا توجد دورات مقترحة حاليًا', 'تصفح الدورات')}</section></div></div>`;
  $$('.sb a[href^="#d"]').forEach(a => a.onclick = e => { e.preventDefault(); const t = $(a.getAttribute('href')); if (t) t.scrollIntoView({ behavior: 'smooth' }); });
}
async function teacherDash(tid) {
  if (tid && me.role !== 'admin') tid = null;
  let tp = null; if (tid) { tp = (await sb.from('profiles').select('full_name').eq('id', tid).single()).data; }
  const q = sb.from('courses').select('*').order('created_at', { ascending: false }); if (tid) q.eq('teacher_id', tid); else if (me.role === 'teacher') q.eq('teacher_id', me.id);
  const { data } = await q; const ids = (data || []).map(c => c.id);
  const { data: en } = ids.length ? await sb.from('enrollments').select('course_id').in('course_id', ids) : { data: [] };
  const n = {}; (en || []).forEach(e => n[e.course_id] = (n[e.course_id] || 0) + 1);
  const { data: ul } = ids.length ? await sb.from('lessons').select('course_id').eq('approved', false).in('course_id', ids) : { data: [] };
  const { data: uq } = ids.length ? await sb.from('quiz_questions').select('course_id').eq('approved', false).in('course_id', ids) : { data: [] };
  const up = {}; [...(ul || []), ...(uq || [])].forEach(x => up[x.course_id] = (up[x.course_id] || 0) + 1);
  const html = `${tid ? '<div class="box" style="background:#fff4e5">👁️ أنت تشاهد صفحة المدرس كأدمن ويمكنك التعديل فيها. <a href="admin.html#teachers">رجوع لقائمة المدرسين</a></div>' : ''}<div class="row"><h1 style="flex:1">${tid ? 'صفحة المدرس: ' + esc(tp?.full_name) : 'لوحة المدرس'}</h1>${me.role === 'admin' || me.role === 'supervisor' ? '<a class="btn o" href="admin.html">لوحة الإدارة</a>' : ''}<button class="btn y" id="new">+ كورس جديد</button></div>
  <div class="stats"><div class="stat"><b>${(data || []).length}</b>الكورسات</div><div class="stat"><b>${(en || []).length}</b>إجمالي المسجلين</div><div class="stat"><b>${(data || []).filter(c => c.status === 'published').length}</b>منشور</div></div>
  <div class="tw"><table><tr><th>الكورس</th><th>الحالة</th><th>الطلاب</th><th>بانتظار الموافقة</th><th></th></tr>${(data || []).map(c => `<tr><td>${esc(c.title)}</td><td>${stAr[c.status]}</td><td>${n[c.id] || 0}</td><td>${up[c.id] ? '⏳ ' + up[c.id] + ' عنصر' : '-'}</td><td><a class="btn s" href="#/edit/${c.id}">تعديل</a></td></tr>`).join('')}</table></div>`;
  if (tid) app.innerHTML = html; else shellPage('#/t/courses', html);
  $('#new').onclick = async () => { const { data: c, error } = await sb.from('courses').insert({ title: 'كورس جديد', teacher_id: tid || me.id }).select().single(); if (error) toast(error.message); else location.hash = `#/edit/${c.id}`; };
}
async function edit(id) {
  if (needLogin()) return;
  const { data: c } = await sb.from('courses').select('*').eq('id', id).single(); if (!c) { app.innerHTML = '<p>غير موجود</p>'; return; }
  const [{ data: ls }, { data: qs }] = await Promise.all([sb.from('lessons').select('*').eq('course_id', id).order('position'), sb.from('quiz_questions').select('*').eq('course_id', id).order('position')]);
  const adm = me.role === 'admin';
  app.innerHTML = `<h1>تعديل الكورس</h1>${adm ? '' : '<div class="box" style="background:#fff4e5">أي درس أو فيديو أو صورة أو ملف أو سؤال تضيفه يظهر للطلاب بعد موافقة الأدمن فقط.</div>'}<div class="box"><label>العنوان</label><input id="t" value="${esc(c.title)}"><label>الوصف</label><textarea id="d" rows="4">${esc(c.description)}</textarea>
  <div class="two"><div><label>التصنيف</label><select id="ct">${cats.map(x => `<option value="${x.id}" ${x.id == c.category_id ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select></div>
  <div><label>المستوى</label><select id="lv">${['مبتدئ', 'متوسط', 'متقدم'].map(x => `<option ${x === c.level ? 'selected' : ''}>${x}</option>`).join('')}</select></div>
  <div><label>الصف</label><select id="gd"><option value="">بدون</option>${stages.map(st => `<optgroup label="${esc(st.name)}">${grades.filter(g => g.stage_id == st.id).map(g => `<option value="${g.id}" ${g.id == c.grade_id ? 'selected' : ''}>${esc(g.name)}</option>`).join('')}</optgroup>`).join('')}</select></div>
  <div><label>المادة</label><select id="sjt"><option value="">بدون</option>${subjects.map(x => `<option value="${x.id}" ${x.id == c.subject_id ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select></div>
  ${adm || me.role === 'supervisor' ? `<div><label>السعر (ج.م، 0 = مجاني)</label><input id="pc" type="number" min="0" step="0.01" value="${+c.price || 0}"></div>` : ''}
  <div><label>المدة (مثال: 4 ساعات)</label><input id="du" value="${esc(c.duration)}"></div><div><label>إيموجي الغلاف</label><input id="em" value="${esc(c.emoji)}"></div></div>
  <label>ماذا سيتعلم الطالب؟ (سطر لكل نقطة)</label><textarea id="oc" rows="4">${esc(c.outcomes)}</textarea>
  <label>صورة الغلاف</label><div class="row">${c.cover_url ? `<img src="${esc(c.cover_url)}" style="height:60px;border-radius:8px">` : ''}<input type="file" id="cvf" accept="image/*" style="flex:1"><button class="btn o s" id="cvx">إزالة</button></div>
  <div class="row"><button class="btn" id="sv">حفظ</button>${c.status === 'published' && !adm ? '' : `<button class="btn y" id="sub">${adm ? 'نشر' : 'إرسال للمراجعة'}</button>`}
  ${adm && c.status === 'published' ? '<button class="btn o" id="unp">إلغاء النشر</button>' : ''}<button class="btn r" id="del">حذف</button><span class="tag">${stAr[c.status]}</span></div></div>
  <div class="box"><h3>الدروس</h3>${(ls || []).map(l => `<details class="ed"><summary>${l.position}. ${esc(l.title)}${l.approved ? '' : ' <span class="tag y">⏳ بانتظار الموافقة</span>'}</summary><label>العنوان</label><input data-lt="${l.id}" value="${esc(l.title)}"><label>رابط الفيديو</label><input data-lv="${l.id}" value="${esc(l.video_url)}"><div class="two"><div><label>رفع فيديو (حتى 50 ميجا)</label><input type="file" accept="video/*" data-lu="${l.id}" data-kind="video"></div><div><label>صورة</label><input type="file" accept="image/*" data-lu="${l.id}" data-kind="image"></div><div><label>ملف (PDF وغيره)</label><input type="file" data-lu="${l.id}" data-kind="file"></div></div>${l.image_url ? `<img src="${esc(l.image_url)}" style="height:60px;border-radius:8px">` : ''}${l.file_url ? `<div class="muted">📎 ${esc(l.file_name || 'ملف')} <a href="#" data-rf="${l.id}">إزالة</a></div>` : ''}<label>الشرح</label><textarea data-lc="${l.id}" rows="4">${esc(l.content)}</textarea><label>الترتيب</label><input type="number" data-lp="${l.id}" value="${l.position}"><div class="row"><button class="btn s" data-ls="${l.id}">حفظ الدرس</button>${adm && !l.approved ? `<button class="btn s y" data-ap="lessons:${l.id}">✓ موافقة</button>` : ''}<button class="btn s r" data-del="${l.id}">حذف</button></div></details>`).join('')}
  <h4>إضافة درس</h4><label>العنوان</label><input id="lt"><label>رابط فيديو (يوتيوب)</label><input id="lv2"><label>أو ارفع فيديو (حتى 50 ميجا)</label><input type="file" id="lvf" accept="video/*"><label>صورة</label><input type="file" id="lif" accept="image/*"><label>ملف (PDF وغيره)</label><input type="file" id="lff"><label>الشرح</label><textarea id="lc" rows="4"></textarea><button class="btn" id="al">إضافة الدرس</button></div>
  <div class="box"><h3>أسئلة الاختبار</h3>${(qs || []).map((q, i) => `<div class="ls"><span style="flex:1">${i + 1}. ${esc(q.question)} <span class="muted">(الإجابة: ${esc((q.options || [])[q.answer])})</span>${q.approved ? '' : ' <span class="tag y">⏳ بانتظار الموافقة</span>'}</span>${adm && !q.approved ? `<button class="btn s y" data-ap="quiz_questions:${q.id}">✓ موافقة</button>` : ''}<button class="btn s r" data-dq="${q.id}">حذف</button></div>`).join('') || '<p class="muted">لا أسئلة بعد.</p>'}
  <h4>إضافة سؤال</h4><input id="qt" placeholder="نص السؤال"><input id="o0" placeholder="الاختيار 1"><input id="o1" placeholder="الاختيار 2"><input id="o2" placeholder="الاختيار 3 (اختياري)"><input id="o3" placeholder="الاختيار 4 (اختياري)">
  <label>رقم الإجابة الصحيحة</label><select id="qa"><option value="0">1</option><option value="1">2</option><option value="2">3</option><option value="3">4</option></select><button class="btn" id="aq">إضافة السؤال</button></div>`;
  const patch = async o => { const { error } = await sb.from('courses').update(o).eq('id', id); error ? toast(error.message) : toast('تم'); return !error; };
  const vals = () => ({ title: $('#t').value, description: $('#d').value, category_id: +$('#ct').value, level: $('#lv').value, duration: $('#du').value || null, emoji: $('#em').value || null, outcomes: $('#oc').value || null, grade_id: $('#gd').value ? +$('#gd').value : null, subject_id: $('#sjt').value ? +$('#sjt').value : null, ...($('#pc') ? { price: +$('#pc').value || 0 } : {}) });
  $('#sv').onclick = () => patch(vals());
  $('#cvf').onchange = async e => { const u = await uploadImage(e.target.files[0], 'covers'); if (u && await patch({ cover_url: u })) edit(id); };
  $('#cvx').onclick = async () => { if (await patch({ cover_url: null })) edit(id); };
  const sub = $('#sub'); if (sub) sub.onclick = async () => { if (await patch({ ...vals(), status: adm ? 'published' : 'pending' })) edit(id); };
  const unp = $('#unp'); if (unp) unp.onclick = async () => { if (await patch({ status: 'draft' })) edit(id); };
  $('#del').onclick = async () => { if (confirm('حذف الكورس نهائيًا؟')) { await sb.from('courses').delete().eq('id', id); location.hash = '#/dashboard'; } };
  $('#al').onclick = async () => { if (!$('#lt').value) return toast('اكتب عنوان الدرس'); toast('جاري الحفظ...'); const vf = $('#lvf').files[0], imf = $('#lif').files[0], ff = $('#lff').files[0]; const vu = vf ? await uploadFile(vf, 'videos') : null, iu = imf ? await uploadImage(imf, 'lessons') : null, fu = ff ? await uploadFile(ff, 'files') : null; if ((vf && !vu) || (imf && !iu) || (ff && !fu)) return; const { error } = await sb.from('lessons').insert({ course_id: id, title: $('#lt').value, video_url: vu || $('#lv2').value || null, image_url: iu, file_url: fu, file_name: ff ? ff.name : null, content: $('#lc').value, position: (ls || []).length + 1 }); error ? toast(error.message) : edit(id); };
  $$('[data-ls]').forEach(b => b.onclick = async () => { const k = b.dataset.ls; const { error } = await sb.from('lessons').update({ title: $(`[data-lt="${k}"]`).value, video_url: $(`[data-lv="${k}"]`).value || null, content: $(`[data-lc="${k}"]`).value, position: +$(`[data-lp="${k}"]`).value }).eq('id', k); error ? toast(error.message) : toast('تم حفظ الدرس'); });
  $$('[data-lu]').forEach(i => i.onchange = async () => { const k = i.dataset.lu, kd = i.dataset.kind, f = i.files[0]; if (!f) return; toast('جاري الرفع...'); const u = kd === 'image' ? await uploadImage(f, 'lessons') : await uploadFile(f, kd === 'video' ? 'videos' : 'files'); if (!u) return; const o = kd === 'video' ? { video_url: u } : kd === 'image' ? { image_url: u } : { file_url: u, file_name: f.name }; const { error } = await sb.from('lessons').update(o).eq('id', k); error ? toast(error.message) : edit(id); });
  $$('[data-rf]').forEach(a => a.onclick = async e => { e.preventDefault(); await sb.from('lessons').update({ file_url: null, file_name: null }).eq('id', a.dataset.rf); edit(id); });
  $$('[data-ap]').forEach(b => b.onclick = async () => { const [t, k] = b.dataset.ap.split(':'); const { error } = await sb.from(t).update({ approved: true }).eq('id', k); error ? toast(error.message) : edit(id); });
  $$('[data-del]').forEach(b => b.onclick = async () => { await sb.from('lessons').delete().eq('id', b.dataset.del); edit(id); });
  $$('[data-dq]').forEach(b => b.onclick = async () => { await sb.from('quiz_questions').delete().eq('id', b.dataset.dq); edit(id); });
  $('#aq').onclick = async () => { const o = [0, 1, 2, 3].map(i => $('#o' + i).value.trim()).filter(Boolean); if (!$('#qt').value || o.length < 2) return toast('اكتب السؤال واختيارين على الأقل'); const a = +$('#qa').value; if (a >= o.length) return toast('رقم الإجابة غير صحيح'); const { error } = await sb.from('quiz_questions').insert({ course_id: id, question: $('#qt').value, options: o, answer: a, position: (qs || []).length + 1 }); error ? toast(error.message) : edit(id); };
}
async function instructors() {
  const { data } = await sb.from('profiles').select(PCOLS).eq('role', 'teacher').eq('suspended', false).eq('approved', true);
  app.innerHTML = `<h1>المدرسون</h1><div class="grid">${(data || []).map(t => `<a class="card" href="#/instructor/${t.id}"><div class="bd" style="align-items:center;text-align:center">${avatar(t, 80)}<b>${esc(t.full_name)}</b><span class="muted">${esc(t.title || 'مدرس')}</span><p class="muted">${esc((t.bio || '').slice(0, 90))}</p></div></a>`).join('') || '<p class="muted">لا يوجد مدرسون بعد.</p>'}</div>`;
}
async function instructor(id) {
  const { data: t } = await sb.from('profiles').select(PCOLS).eq('id', id).single();
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
  const data = LND && LND.faqs ? LND.faqs.filter(f => f.show !== false) : (await sb.from('faqs').select('*').order('position')).data;
  app.innerHTML = `<h1>الأسئلة الشائعة</h1>${(data || []).map(f => `<details class="box fq"><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join('') || '<p class="muted">لا أسئلة.</p>'}`;
}

const MENUS = {
  student: [['#/dashboard', '🏠', 'الرئيسية'], ['#/courses', '📚', 'تصفح الكورسات'], ['#/s/courses', '🎓', 'كورساتي'], ['#/s/sub', '💳', 'اشتراكي'], ['#/s/lectures', '🎬', 'المحاضرات'], ['#/s/exams', '📝', 'الامتحانات'], ['#/s/homework', '📚', 'الواجبات'], ['#/s/results', '📊', 'نتائجي ودرجاتي'], ['#/s/progress', '📈', 'تقدمي الدراسي'], ['#/s/certs', '🏅', 'شهاداتي'], ['#/profile', '👤', 'الملف الشخصي'], ['#/settings', '⚙️', 'الإعدادات']],
  teacher: [['#/dashboard', '▦', 'لوحة التحكم'], ['#/t/courses', '📚', 'كورساتي'], ['#/t/lectures', '🎬', 'إدارة المحاضرات'], ['#/t/students', '👥', 'إدارة الطلاب'], ['#/t/exams', '📝', 'الامتحانات'], ['#/t/qbank', '🏦', 'بنك الأسئلة'], ['#/t/homework', '📚', 'الواجبات'], ['#/t/results', '📊', 'نتائج الطلاب'], ['#/t/progress', '📈', 'متابعة تقدم الطلاب'], ['#/profile', '👤', 'الملف الشخصي'], ['#/settings', '⚙️', 'الإعدادات']]
};
function roleMenu(active) {
  applyRoleRail(active);
  return '';
}
function applyRoleRail(active) {
  if (!me) return;
  let el = document.getElementById('qa'); if (!el) { el = document.createElement('div'); el.id = 'qa'; document.body.appendChild(el); }
  let r = $('#rail'); if (!r) { el.innerHTML = '<nav class="rail" id="rail"></nav>'; r = $('#rail'); r.onclick = e => { if (!e.target.closest('a')) r.classList.toggle('x'); else r.classList.remove('x'); }; }
  document.body.classList.add('hasrail');
  const items = MENUS[me.role === 'student' ? 'student' : 'teacher'].slice();
  if (me.role === 'admin' || me.role === 'supervisor') items.push(['admin.html', '🛡️', 'لوحة الإدارة']);
  items.push(['#/login', '🚪', 'تسجيل الخروج']);
  r.innerHTML = `<a class="rlogo" href="#/"><span class="lg">🎓</span><span>${esc(S.name || 'منصة تعلّم')}</span></a>` + items.map(([h, i, l]) => `<a href="${h}" class="${h === active ? 'act' : ''}" ${h === '#/login' ? 'id="lo2"' : ''} title="${l}"><b class="ri">${i}</b><span>${l}</span></a>`).join('');
  const o = r.querySelector('#lo2'); if (o) o.onclick = async e => { e.preventDefault(); await sb.auth.signOut(); me = null; location.hash = '#/login'; await loadMe(); header(); route(); };
}
function shellPage(active, inner) {
  if (needLogin()) return;
  app.innerHTML = `<div class="dl">${roleMenu(active)}<div class="dm">${inner}</div></div>`;
  const o = $('#lo2'); if (o) o.onclick = async e => { e.preventDefault(); await sb.auth.signOut(); me = null; location.hash = '#/login'; header(); route(); };
}
const denyPage = () => { app.innerHTML = '<div class="box"><h2>غير مصرح</h2><p>ليس لديك صلاحية الدخول لهذه الصفحة.</p><a class="btn" href="#/">الرئيسية</a></div>'; };
const pctCls = p => `<div class="bar" style="min-width:110px"><i style="width:${p}%"></i></div>`;
async function stuExams(kind, rows) {
  const ids = rows.map(r => r.c.id); const tt = Object.fromEntries(rows.map(r => [r.c.id, r.c.title]));
  const tbl = (h, b) => `<div class="tw"><table><tr>${h.map(x => `<th>${x}</th>`).join('')}</tr>${b || `<tr><td colspan="${h.length}" class="muted" style="text-align:center">لا توجد بيانات</td></tr>`}</table></div>`;
  const { data: ex } = ids.length ? await sb.from('exams').select('*,exam_questions(question_id)').in('course_id', ids).eq('status', 'published').order('created_at', { ascending: false }) : { data: [] };
  const { data: at } = await sb.from('exam_attempts').select('*').eq('student_id', me.id).order('started_at', { ascending: false });
  const by = {}; (at || []).forEach(a => (by[a.exam_id] = by[a.exam_id] || []).push(a));
  const en = Object.fromEntries((ex || []).map(e => [e.id, e]));
  const pct = a => a.total ? Math.round(a.score / a.total * 100) : 0;
  if (kind === 'exams') return `<h1>الامتحانات</h1>${tbl(['الامتحان', 'الكورس', 'المدة', 'الأسئلة', 'النجاح', ''], (ex || []).map(e => { const done = (by[e.id] || []).some(a => a.submitted_at); const open = (by[e.id] || []).find(a => !a.submitted_at); return `<tr><td>${esc(e.title)}</td><td>${esc(tt[e.course_id])}</td><td>${e.duration_min} د</td><td>${(e.exam_questions || []).length}</td><td>${e.pass_mark}%</td><td>${done && !e.retake ? '<span class="tag">تم التقديم</span>' : `<a class="btn s" href="#/exam/${e.id}">${open ? 'استكمال' : done ? 'إعادة' : 'ابدأ'}</a>`}</td></tr>`; }).join(''))}`;
  const sub = (at || []).filter(a => a.submitted_at);
  if (kind === 'myexams') return `<h1>امتحاناتي</h1>${tbl(['الامتحان', 'المحاولات', 'أفضل نتيجة', 'آخر تسليم'], Object.keys(by).map(id => { const l = by[id].filter(a => a.submitted_at); if (!l.length) return ''; const b = l.reduce((m, a) => pct(a) > pct(m) ? a : m, l[0]); return `<tr><td>${esc((en[id] || {}).title || 'امتحان')}</td><td>${l.length}</td><td>${pct(b)}%</td><td>${new Date(l[0].submitted_at).toLocaleDateString('ar-EG')}</td></tr>`; }).join(''))}`;
  const { data: all } = sub.length ? await sb.from('exams').select('id,title,course_id').in('id', [...new Set(sub.map(a => a.exam_id))]) : { data: [] };
  const nm = Object.fromEntries((all || []).map(e => [e.id, e.title]));
  return `<h1>نتائجي ودرجاتي</h1>${tbl(['الامتحان', 'الدرجة', 'النسبة', 'النتيجة', 'التاريخ'], sub.map(a => `<tr><td>${esc(nm[a.exam_id] || en[a.exam_id]?.title || 'امتحان')}</td><td>${a.score}/${a.total}</td><td>${pct(a)}%</td><td>${a.passed ? '<span class="tag">ناجح</span>' : '<span class="tag y">راسب</span>'}</td><td>${new Date(a.submitted_at).toLocaleDateString('ar-EG')}</td></tr>`).join(''))}`;
}
async function examTake(id) {
  if (needLogin()) return; if (me.role !== 'student') return denyPage();
  const { data, error } = await sb.rpc('exam_take', { p_exam: id });
  if (error) { app.innerHTML = `<div class="box"><h2>${esc(error.message)}</h2><a class="btn" href="#/s/exams">رجوع</a></div>`; return; }
  const skew = Date.now() - new Date(data.now).getTime(); const end = new Date(data.started_at).getTime() + skew + data.duration_min * 60000;
  const ans = {};
  app.innerHTML = `<div class="box row" style="position:sticky;top:70px;z-index:5"><h2 style="flex:1;margin:0">${esc(data.title)}</h2><b id="xtm" class="tag y"></b></div>
  ${data.questions.map((q, i) => `<div class="box"><b>${i + 1}. ${esc(q.body)}</b> <span class="muted">(${q.marks} درجة)</span>${q.options.map((o, k) => `<label class="row" style="font-weight:400;margin-top:8px"><input type="radio" name="q${i}" data-q="${q.id}" value="${k}" style="width:auto;margin:0 0 0 8px">${esc(o)}</label>`).join('')}</div>`).join('') || '<div class="box">لا توجد أسئلة في هذا الامتحان.</div>'}
  <button class="btn big2" id="xsub">تسليم الإجابات</button>`;
  let done = false;
  const submit = async auto => {
    if (done) return; if (!auto && !confirm('تسليم الامتحان الآن؟')) return; done = true; clearInterval(tm);
    $$('input[data-q]:checked').forEach(r => ans[r.dataset.q] = +r.value);
    const { data: r, error: e2 } = await sb.rpc('exam_submit', { p_attempt: data.attempt_id, p_answers: ans });
    if (e2) { done = false; return toast(e2.message); }
    app.innerHTML = `<div class="box" style="text-align:center"><h1>${r.passed ? '🎉 ناجح' : 'للأسف لم تنجح'}</h1><h2>${r.score} من ${r.total}</h2><p class="muted">${r.total ? Math.round(r.score / r.total * 100) : 0}% (درجة النجاح ${data.pass_mark}%)</p><a class="btn" href="#/s/results">نتائجي</a></div>`;
  };
  const tick = () => { const left = Math.max(0, Math.floor((end - Date.now()) / 1000)); const m = $('#xtm'); if (m) m.textContent = '⏱ ' + String(Math.floor(left / 60)).padStart(2, '0') + ':' + String(left % 60).padStart(2, '0'); if (left <= 0) submit(true); };
  const tm = setInterval(() => { if (!$('#xtm')) return clearInterval(tm); tick(); }, 1000); tick();
  $('#xsub').onclick = () => submit(false);
}
async function stuData() {
  const { data: en } = await sb.from('enrollments').select('course_id,created_at,courses(id,title,emoji,color,cover_url)').eq('student_id', me.id);
  const rows = []; for (const e of en || []) rows.push({ c: e.courses, pg: await progress(e.course_id, me.id), at: e.created_at });
  const { data: at } = await sb.from('quiz_attempts').select('*').eq('student_id', me.id).order('created_at', { ascending: false });
  return { rows, at: at || [] };
}
async function sPage(kind) {
  if (needLogin()) return; if (me.role !== 'student') return denyPage();
  if (kind === 'homework') { shellPage('#/s/homework', '<div id="hwr"></div>'); return hwStudent($('#hwr')); }
  const { rows, at } = await stuData(); const tt = Object.fromEntries(rows.map(r => [r.c.id, r.c.title]));
  const tbl = (h, b) => `<div class="tw"><table><tr>${h.map(x => `<th>${x}</th>`).join('')}</tr>${b || `<tr><td colspan="${h.length}" class="muted" style="text-align:center">لا توجد بيانات</td></tr>`}</table></div>`;
  const hrefs = { courses: '#/s/courses', sub: '#/s/sub', lectures: '#/s/lectures', exams: '#/s/exams', myexams: '#/s/myexams', homework: '#/s/homework', results: '#/s/results', progress: '#/s/progress', certs: '#/s/certs' };
  let html = '';
  if (kind === 'sub') {
    const [a1, a2] = await Promise.all([sb.from('subscriptions').select('*').eq('student_id', me.id).order('created_at', { ascending: false }), sb.from('transactions').select('*').eq('student_id', me.id).order('created_at', { ascending: false })]);
    const subs = a1.data || [], trx = a2.data || [];
    const cids = [...new Set(subs.map(x => x.course_id).filter(Boolean))];
    const { data: cds } = cids.length ? await sb.from('courses').select('id,title').in('id', cids) : { data: [] };
    const cn = id => (cds || []).find(c => c.id === id)?.title || 'كل الكورسات';
    const mny = n => (+n || 0).toLocaleString('ar-EG', { maximumFractionDigits: 2 }) + ' ج.م';
    const st = x => x.status === 'stopped' ? 'موقوف' : (x.end_date && new Date(x.end_date + 'T23:59:59') < new Date() ? 'منتهي' : 'نشط');
    const paid = trx.filter(t => t.kind === 'payment').reduce((a, t) => a + +t.amount, 0);
    const back = trx.filter(t => t.kind === 'refund').reduce((a, t) => a + +t.amount, 0);
    const meth = { cash: 'نقدي', wallet: 'محفظة إلكترونية', bank: 'تحويل بنكي', other: 'أخرى' };
    html = `<h1>اشتراكي</h1>
    <div class="stats"><div class="stat"><b>${mny(paid)}</b>إجمالي المدفوع</div><div class="stat"><b>${mny(back)}</b>المسترد</div><div class="stat"><b>${mny(paid - back)}</b>الصافي</div><div class="stat"><b>${subs.filter(x => st(x) === 'نشط').length}</b>اشتراك نشط</div></div>
    <h2>اشتراكاتي</h2>${subs.length ? tbl(['الكورس', 'الخطة', 'من', 'إلى', 'المبلغ', 'الحالة'], subs.map(x => `<tr><td>${esc(cn(x.course_id))}</td><td>${esc(x.plan || '-')}</td><td>${fmtDate(x.start_date)}</td><td>${x.end_date ? fmtDate(x.end_date) : 'مفتوح'}</td><td>${mny(x.amount)}</td><td><span class="tag ${st(x) === 'نشط' ? '' : 'y'}">${st(x)}</span></td></tr>`).join('')) : '<p class="muted">لا يوجد اشتراك بعد. تواصل مع الإدارة لتفعيل اشتراكك.</p><a class="btn" href="#/contact">تواصل مع الإدارة</a>'}
    <h2>مدفوعاتي</h2>${trx.length ? tbl(['التاريخ', 'النوع', 'المبلغ', 'الطريقة', 'المرجع'], trx.map(t => `<tr><td>${fmtDate(t.created_at)}</td><td><span class="tag ${t.kind === 'refund' ? 'y' : ''}">${t.kind === 'refund' ? 'استرداد' : 'دفعة'}</span></td><td>${mny(t.amount)}</td><td>${meth[t.method] || ''}</td><td>${esc(t.reference || '-')}</td></tr>`).join('')) : '<p class="muted">لا مدفوعات بعد.</p>'}`;
    return shellPage('#/s/sub', html);
  }
  if (kind === 'courses') html = `<h1>كورساتي</h1>${rows.length ? `<div class="grid">${rows.map(({ c, pg }) => courseCard(c, `<div class="bar"><i style="width:${pg.pct}%"></i></div><span class="muted">${pg.pct}%</span>`, `#/learn/${c.id}`).replace('التفاصيل', 'تابع')).join('')}</div>` : '<p class="muted">لم تسجّل في أي كورس بعد.</p><a class="btn" href="#/courses">تصفح الكورسات</a>'}`;
  if (kind === 'lectures') { const out = []; for (const r of rows) { const { data: ls } = await sb.from('lessons').select('id,title,position').eq('course_id', r.c.id).order('position'); out.push(`<div class="box"><h3>${esc(r.c.title)}</h3>${(ls || []).map((l, i) => `<div class="ls"><span style="flex:1">${r.pg.set.has(l.id) ? '✅' : '⭕'} ${i + 1}. ${esc(l.title)}</span><a class="btn s o" href="#/learn/${r.c.id}/${l.id}">مشاهدة</a></div>`).join('') || '<p class="muted">لا محاضرات بعد</p>'}</div>`); } html = `<h1>المحاضرات</h1>${out.join('') || '<p class="muted">سجّل في كورس لتظهر محاضراته هنا.</p>'}`; }
  if (kind === 'exams') { const out = []; for (const r of rows) { const { count } = await sb.from('quiz_questions').select('*', { count: 'exact', head: true }).eq('course_id', r.c.id); if (count) out.push(`<tr><td>${esc(r.c.title)}</td><td>${count}</td><td>${at.filter(a => a.course_id === r.c.id).length}</td><td><a class="btn s" href="#/quiz/${r.c.id}">ابدأ الاختبار</a></td></tr>`); } html = `<h1>الامتحانات</h1>${tbl(['الكورس', 'عدد الأسئلة', 'محاولاتك', ''], out.join(''))}`; }
  if (kind === 'myexams') { const by = {}; at.forEach(a => { (by[a.course_id] = by[a.course_id] || []).push(a); }); html = `<h1>امتحاناتي</h1>${tbl(['الكورس', 'عدد المحاولات', 'أفضل نتيجة', 'آخر محاولة'], Object.entries(by).map(([k, v]) => `<tr><td>${esc(tt[k] || '')}</td><td>${v.length}</td><td>${Math.max(...v.map(a => Math.round(a.score / a.total * 100)))}%</td><td>${fmtDate(v[0].created_at)}</td></tr>`).join(''))}`; }
  if (kind === 'results') html = `<h1>نتائجي ودرجاتي</h1>${tbl(['الكورس', 'الدرجة', 'النسبة', 'النتيجة', 'التاريخ'], at.map(a => { const p = a.total ? Math.round(a.score / a.total * 100) : 0; return `<tr><td>${esc(tt[a.course_id] || '')}</td><td>${a.score}/${a.total}</td><td>${p}%</td><td>${p >= 60 ? '✅ ناجح' : '❌ لم تنجح'}</td><td>${fmtDate(a.created_at)}</td></tr>`; }).join(''))}`;
  if (kind === 'progress') html = `<h1>تقدمي الدراسي</h1>${tbl(['الكورس', 'المنجز', 'التقدم', ''], rows.map(({ c, pg }) => `<tr><td>${esc(c.title)}</td><td>${pg.done}/${pg.total}</td><td>${pctCls(pg.pct)} ${pg.pct}%</td><td><a class="btn s o" href="#/learn/${c.id}">متابعة</a></td></tr>`).join(''))}`;
  if (kind === 'certs') { const f = rows.filter(r => r.pg.pct === 100 && r.pg.total); html = `<h1>شهاداتي</h1>${f.length ? f.map(({ c }) => `<div class="box row"><b style="flex:1">🏅 ${esc(c.title)}</b><a class="btn" href="#/cert/${c.id}">عرض الشهادة</a></div>`).join('') : '<p class="muted">أكمل كل دروس كورس لتحصل على شهادتك.</p>'}`; }
  if (kind === 'exams' || kind === 'myexams' || kind === 'results') html = await stuExams(kind, rows) + (kind === 'results' ? html.replace('<h1>نتائجي ودرجاتي</h1>', '<h2 style="margin-top:26px">اختبارات الكورسات السريعة</h2>') : '');
  shellPage(hrefs[kind], html);
}
async function tData() {
  if (me.role === 'student') return null;
  const q = sb.from('courses').select('id,title,status,teacher_id').order('created_at', { ascending: false }); if (me.role === 'teacher') q.eq('teacher_id', me.id);
  const { data: cs } = await q; const ids = (cs || []).map(c => c.id); const none = { data: [] };
  const [{ data: en }, { data: ls }, { data: at }] = await Promise.all([ids.length ? sb.from('enrollments').select('student_id,course_id,created_at').in('course_id', ids) : none, ids.length ? sb.from('lessons').select('id,title,position,approved,video_url,image_url,file_url,course_id').in('course_id', ids).order('position') : none, ids.length ? sb.from('quiz_attempts').select('*').in('course_id', ids).order('created_at', { ascending: false }) : none]);
  const sids = [...new Set((en || []).map(e => e.student_id))];
  const { data: ps } = sids.length ? await sb.from('profiles').select('id,full_name').in('id', sids) : none;
  const { data: pr } = sids.length && (ls || []).length ? await sb.from('lesson_progress').select('student_id,lesson_id').in('student_id', sids).in('lesson_id', ls.map(l => l.id)) : none;
  const name = Object.fromEntries((ps || []).map(p => [p.id, p.full_name]));
  const lc = {}; (ls || []).filter(l => l.approved).forEach(l => (lc[l.course_id] = lc[l.course_id] || []).push(l.id));
  const pct = (sid, cid) => { const all = lc[cid] || []; if (!all.length) return 0; const d = new Set((pr || []).filter(p => p.student_id === sid).map(p => p.lesson_id)); return Math.round(all.filter(x => d.has(x)).length / all.length * 100); };
  return { cs: cs || [], en: en || [], ls: ls || [], at: at || [], name, pct, title: Object.fromEntries((cs || []).map(c => [c.id, c.title])) };
}
async function tPage(kind) {
  if (needLogin()) return; if (me.role === 'student') return denyPage();
  const d = await tData(); const tbl = (h, b) => `<div class="tw"><table><tr>${h.map(x => `<th>${x}</th>`).join('')}</tr>${b || `<tr><td colspan="${h.length}" class="muted" style="text-align:center">لا توجد بيانات</td></tr>`}</table></div>`;
  let html = '', act = '#/t/' + kind;
  if (kind === 'home') { act = '#/dashboard'; const pend = d.ls.filter(l => !l.approved).length; html = `<h1>لوحة التحكم</h1><div class="stats"><div class="stat"><b>${d.cs.length}</b>كورساتي</div><div class="stat"><b>${d.ls.length}</b>المحاضرات</div><div class="stat"><b>${new Set(d.en.map(e => e.student_id)).size}</b>الطلاب</div><div class="stat"><b>${pend}</b>بانتظار الموافقة</div></div><h2>آخر التسجيلات</h2>${tbl(['الطالب', 'الكورس', 'التاريخ'], d.en.slice().sort((a, b) => b.created_at > a.created_at ? 1 : -1).slice(0, 8).map(e => `<tr><td>${esc(d.name[e.student_id] || '')}</td><td>${esc(d.title[e.course_id])}</td><td>${fmtDate(e.created_at)}</td></tr>`).join(''))}`; }
  if (kind === 'lectures') html = `<h1>إدارة المحاضرات</h1><p class="muted">من هنا تدير محاضرات كل كورساتك. الرفع (فيديو، صورة، ملف) يتم من صفحة تعديل الكورس.</p>${tbl(['المحاضرة', 'الكورس', 'المحتوى', 'الحالة', ''], d.ls.map(l => `<tr><td>${esc(l.title)}</td><td>${esc(d.title[l.course_id])}</td><td>${l.video_url ? '🎬 ' : ''}${l.image_url ? '🖼️ ' : ''}${l.file_url ? '📎' : ''}</td><td>${l.approved ? 'معتمد' : '⏳ بانتظار الموافقة'}</td><td><a class="btn s" href="#/edit/${l.course_id}">تعديل</a></td></tr>`).join(''))}`;
  if (kind === 'students') { const by = {}; d.en.forEach(e => (by[e.student_id] = by[e.student_id] || []).push(e.course_id)); html = `<h1>إدارة الطلاب</h1>${tbl(['الطالب', 'الكورسات', 'متوسط التقدم'], Object.entries(by).map(([sid, cl]) => `<tr><td>${esc(d.name[sid] || '')}</td><td>${cl.map(c => esc(d.title[c])).join('، ')}</td><td>${Math.round(cl.reduce((s, c) => s + d.pct(sid, c), 0) / cl.length)}%</td></tr>`).join(''))}`; }
  if (kind === 'progress') html = `<h1>متابعة تقدم الطلاب</h1>${tbl(['الطالب', 'الكورس', 'التقدم'], d.en.map(e => { const p = d.pct(e.student_id, e.course_id); return `<tr><td>${esc(d.name[e.student_id] || '')}</td><td>${esc(d.title[e.course_id])}</td><td>${pctCls(p)} ${p}%</td></tr>`; }).join(''))}`;
  if (kind === 'homework') { shellPage('#/t/homework', '<div id="hwr"></div>'); return hwStaff($('#hwr')); }
  if (kind === 'exams' || kind === 'qbank' || kind === 'results') { shellPage('#/t/' + kind, '<div id="exr"></div>'); return examsStaff($('#exr'), kind, ['exams', 'qbank', 'results']); }
  if (kind === 'results_old') html = `<h1>نتائج الطلاب</h1>${tbl(['الطالب', 'الكورس', 'الدرجة', 'النسبة', 'التاريخ'], d.at.map(a => { const p = a.total ? Math.round(a.score / a.total * 100) : 0; return `<tr><td>${esc(d.name[a.student_id] || '')}</td><td>${esc(d.title[a.course_id])}</td><td>${a.score}/${a.total}</td><td>${p}%</td><td>${fmtDate(a.created_at)}</td></tr>`; }).join(''))}`;
  if (!html) return teacherDash();
  shellPage(act, html);
}
function pendingTeacherPage() {
  const q = document.getElementById('qa'); if (q) q.innerHTML = ''; document.body.classList.remove('hasrail');
  app.innerHTML = `<div class="afm" style="text-align:center"><div style="font-size:4rem">⏳</div><h1>حسابك قيد المراجعة</h1><p class="muted">حساب المدرس بيتراجع من الإدارة قبل ما تقدر تنشر كورساتك. هنبلغك أول ما يتم القبول.</p><a class="btn big2" href="#/profile">أكمل بيانات حسابي</a></div>`;
  footer();
}
async function route() {
  quick();
  const [path, q] = (location.hash.slice(1) || '/').split('?'); const p = path.split('/').filter(Boolean);
  window.scrollTo(0, 0);
  try {
    if (!p.length) return await home(q);
    if (me && me.role === 'teacher' && me.approved === false && !['profile', 'settings', 'login', 'register'].includes(p[0])) return pendingTeacherPage();
    switch (p[0]) {
      case 'courses': return await courses(q);
      case 'course': return await course(p[1]);
      case 'learn': return await learn(p[1], p[2]);
      case 'quiz': return await quiz(p[1]);
      case 'exam': return await examTake(p[1]);
      case 'cert': return await cert(p[1]);
      case 'edit': return await edit(p[1]);
      case 's': return await sPage(p[1]);
      case 't': return await tPage(p[1]);
      case 'settings': await profilePage(); { const n = $('#np'); if (n) n.scrollIntoView({ block: 'center' }); } return;
      case 'teacher': if (needLogin()) return; return await teacherDash(p[1]);
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
(async () => { try { await loadSettings(); await loadMe(); if (me && me.suspended) { await sb.auth.signOut(); me = null; toast('هذا الحساب موقوف، تواصل مع الإدارة'); } } catch (e) { console.error(e); } footer(); header(); route(); })();
