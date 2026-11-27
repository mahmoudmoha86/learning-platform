const root = $('#root'); let me = null, cur = 'overview';
const SECTIONS = [['overview', '📊 لوحة التحكم الرئيسية'], ['students', '🎓 إدارة الطلاب'], ['teachers', '👨‍🏫 إدارة المدرسين'], ['courses', '📚 إدارة الكورسات'], ['lectures', '🎬 إدارة الأقسام والمحاضرات'], ['review', '✅ مراجعة المحتوى'], ['hero', '🖼️ إدارة الإعلانات والبنرات'], ['msgs', '✉️ رسائل واستفسارات الطلاب'], ['staff', '🛡️ إدارة الموظفين'], ['roles', '🔑 الصلاحيات والأدوار'], ['logs', '🧾 سجل النشاطات'], ['general', '⚙️ إعدادات المنصة'], ['sep', 'أقسام أخرى'], ['cats', '🗂️ التصنيفات'], ['enr', '🧾 التسجيلات'], ['reviews', '⭐ التقييمات'], ['tracks', '🧭 مجالات التعلّم'], ['features', '✨ المميزات'], ['faqs', '❓ الأسئلة الشائعة'], ['testi', '💬 آراء الطلاب'], ['partners', '🤝 الشركاء'], ['about', 'ℹ️ عن المنصة'], ['contactset', '📞 التواصل والسوشيال'], ['legal', '📄 الشروط والخصوصية'], ['media', '🖼️ مكتبة الصور']];
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
const fmtDT = d => d ? new Date(d).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' }) : '-';
const PERMS = [['users', 'إدارة الطلاب والمدرسين'], ['courses', 'إدارة الكورسات والمحتوى'], ['exams', 'إدارة الامتحانات'], ['support', 'الدعم الفني والرسائل'], ['website', 'إدارة الموقع'], ['logs', 'سجل النشاطات'], ['finance', 'الحسابات المالية'], ['reports', 'التقارير']];
const PERM_OF = { overview: null, general: 'website', hero: 'website', tracks: 'website', features: 'website', faqs: 'website', testi: 'website', partners: 'website', about: 'website', contactset: 'website', legal: 'website', media: 'website', review: 'courses', courses: 'courses', cats: 'courses', reviews: 'courses', teachers: 'users', students: 'users', enr: 'users', msgs: 'support', logs: 'logs', staff: 'ADMIN', lectures: 'courses', roles: 'ADMIN', sep: null };
const can = k => !me ? false : me.role === 'admin' || (me.role === 'supervisor' && (PERM_OF[k] === null || (PERM_OF[k] !== 'ADMIN' && me.permissions && me.permissions[PERM_OF[k]])));
function modal(html, onReady) {
  const o = document.createElement('div'); o.className = 'mdl'; o.innerHTML = `<div class="mdb"><button class="mdx" aria-label="إغلاق">✕</button>${html}</div>`; document.body.append(o);
  const close = () => o.remove(); o.onclick = e => { if (e.target === o) close(); }; o.querySelector('.mdx').onclick = close; onReady && onReady(o, close); return close;
}
async function call(fn, args, okMsg) { const { data, error } = await sb.rpc(fn, args); if (error) { toast(error.message); return { error }; } if (okMsg) toast(okMsg); return { data }; }
function dtable(cfg) {
  const st = { q: '', f: {}, sc: cfg.sort ? cfg.sort[0] : -1, dir: cfg.sort ? cfg.sort[1] : 1 };
  const box = root.querySelector('#pg');
  box.innerHTML = `<div class="row"><h1 style="flex:1">${cfg.title} <span class="muted" id="dc"></span></h1>${cfg.add || ''}</div>
  <div class="row dtb"><input id="dq" placeholder="بحث..." style="max-width:260px">${(cfg.filters || []).map((f, i) => `<select data-f="${i}"><option value="">${f.l}: الكل</option>${f.opts.map(([v, l]) => `<option value="${v}">${l}</option>`).join('')}</select>`).join('')}${cfg.extra || ''}</div>
  <div class="tw"><table><thead><tr>${cfg.cols.map((c, i) => `<th data-s="${i}" style="cursor:pointer">${c.l} <i></i></th>`).join('')}${cfg.actions ? '<th></th>' : ''}</tr></thead><tbody id="dbd"></tbody></table></div>`;
  const draw = () => {
    let rows = (cfg.rows || []).filter(r => (!st.q || String(cfg.search(r)).toLowerCase().includes(st.q)) && (cfg.filters || []).every((f, i) => !st.f[i] || f.f(r, st.f[i])));
    if (st.sc >= 0) { const g = cfg.cols[st.sc].s || (() => ''); rows = [...rows].sort((a, b) => { const x = g(a), y = g(b); return (x > y ? 1 : x < y ? -1 : 0) * st.dir; }); }
    box.querySelector('#dc').textContent = `(${rows.length})`;
    box.querySelector('#dbd').innerHTML = rows.map((r, ri) => `<tr>${cfg.cols.map(c => `<td>${c.v(r)}</td>`).join('')}${cfg.actions ? `<td style="min-width:150px"><div class="row" style="gap:4px">${cfg.actions(r).map(([a, l, cl]) => `<button class="btn s ${cl || 'o'}" data-a="${a}" data-i="${ri}">${l}</button>`).join(' ')}</div></td>` : ''}</tr>`).join('') || `<tr><td colspan="${cfg.cols.length + 1}" class="muted" style="text-align:center">لا توجد نتائج</td></tr>`;
    box.querySelectorAll('th[data-s] i').forEach((el, i) => el.textContent = i === st.sc ? (st.dir > 0 ? '▲' : '▼') : '');
    box.querySelectorAll('#dbd [data-a]').forEach(b => b.onclick = () => cfg.onAct(b.dataset.a, rows[+b.dataset.i]));
  };
  box.querySelector('#dq').oninput = e => { st.q = e.target.value.trim().toLowerCase(); draw(); };
  box.querySelectorAll('[data-f]').forEach(s => s.onchange = () => { st.f[s.dataset.f] = s.value; draw(); });
  box.querySelectorAll('th[data-s]').forEach(th => th.onclick = () => { const i = +th.dataset.s; if (st.sc === i) st.dir *= -1; else { st.sc = i; st.dir = 1; } draw(); });
  cfg.onReady && cfg.onReady(box);
  draw();
}
async function accountsPage(kind) {
  const [{ data: ps, error: e1 }, { data: en }, { data: ls }, { data: pr }, { data: cs }, { data: qa }, { data: rv }] = await Promise.all([sb.rpc('admin_profiles'), sb.from('enrollments').select('student_id,course_id'), sb.from('lessons').select('id,course_id').eq('approved', true), sb.from('lesson_progress').select('student_id,lesson_id'), sb.from('courses').select('id,title,teacher_id,status'), sb.from('quiz_attempts').select('student_id,course_id,score,total,created_at'), sb.from('reviews').select('course_id,rating')]);
  if (e1) throw e1;
  const title = Object.fromEntries((cs || []).map(c => [c.id, c.title])), lc = {}; (ls || []).forEach(l => (lc[l.course_id] = lc[l.course_id] || new Set()).add(l.id));
  const roles = kind === 'staff' ? ['admin', 'supervisor'] : [kind];
  const rows = (ps || []).filter(p => roles.includes(p.role)).map(p => {
    if (kind === 'student') {
      const my = (en || []).filter(e => e.student_id === p.id), done = new Set((pr || []).filter(x => x.student_id === p.id).map(x => x.lesson_id));
      const items = my.map(e => { const all = [...(lc[e.course_id] || [])], d = all.filter(x => done.has(x)).length; return { id: e.course_id, t: title[e.course_id], d, n: all.length, pc: all.length ? Math.round(d / all.length * 100) : 0 }; });
      return { ...p, items, nc: items.length, avg: items.length ? Math.round(items.reduce((s, i) => s + i.pc, 0) / items.length) : 0, att: (qa || []).filter(a => a.student_id === p.id) };
    }
    if (kind === 'teacher') {
      const mine = (cs || []).filter(c => c.teacher_id === p.id), ids = new Set(mine.map(c => c.id)), es = (en || []).filter(e => ids.has(e.course_id)), rr = (rv || []).filter(r => ids.has(r.course_id));
      return { ...p, mine, nc: mine.length, ns: new Set(es.map(e => e.student_id)).size, ne: es.length, rating: rr.length ? +(rr.reduce((s, r) => s + r.rating, 0) / rr.length).toFixed(1) : 0, es };
    }
    return p;
  });
  const lbl = { student: 'طالب', teacher: 'مدرس', staff: 'موظف' }[kind];
  const stTag = r => r.suspended ? '<span class="tag" style="background:#fdeaea;color:#b42318">موقوف</span>' : '<span class="tag" style="background:#e6f6ea;color:#067647">نشط</span>';
  const common = [{ l: 'الاسم', v: r => `<b>${esc(r.full_name)}</b>`, s: r => r.full_name }, { l: 'البريد', v: r => esc(r.email), s: r => r.email }, { l: 'الهاتف', v: r => esc(r.phone || '-'), s: r => r.phone || '' }];
  const cols = kind === 'student' ? [...common, { l: 'الكورسات', v: r => r.nc, s: r => r.nc }, { l: 'متوسط التقدم', v: r => r.avg + '%', s: r => r.avg }, { l: 'الحالة', v: stTag, s: r => r.suspended }, { l: 'التسجيل', v: r => fmtDate(r.created_at), s: r => r.created_at }]
    : kind === 'teacher' ? [...common, { l: 'الكورسات', v: r => r.nc, s: r => r.nc }, { l: 'الطلاب', v: r => r.ns, s: r => r.ns }, { l: 'التقييم', v: r => r.rating ? '★ ' + r.rating : '-', s: r => r.rating }, { l: 'الحالة', v: stTag, s: r => r.suspended }]
      : [...common, { l: 'الدور', v: r => r.role === 'admin' ? 'مدير رئيسي' : 'مشرف', s: r => r.role }, { l: 'الصلاحيات', v: r => r.role === 'admin' ? 'كاملة' : PERMS.filter(([k]) => r.permissions && r.permissions[k]).map(([, l]) => l).join('، ') || '-', s: r => 0 }, { l: 'الحالة', v: stTag, s: r => r.suspended }, { l: 'آخر دخول', v: r => fmtDT(r.last_sign_in_at), s: r => r.last_sign_in_at || '' }];
  const reload = () => show(cur);
  const form = (r) => {
    const isNew = !r, perms = r?.permissions || {};
    return `<h2>${isNew ? 'إضافة ' : 'تعديل '}${lbl}</h2><label>الاسم</label><input id="fn" value="${esc(r?.full_name || '')}">${isNew ? `<label>البريد الإلكتروني</label><input id="fe" type="email" dir="ltr">` : `<label>البريد</label><input value="${esc(r.email)}" disabled dir="ltr">`}
    <label>الهاتف</label><input id="fp" value="${esc(r?.phone || '')}" dir="ltr">${kind === 'teacher' ? `<label>المسمى</label><input id="ft" value="${esc(r?.title || '')}"><label>نبذة</label><textarea id="fb" rows="2">${esc(r?.bio || '')}</textarea><label><input type="checkbox" id="fcc" style="width:auto;margin:0 0 0 6px" ${perms.create_course === false ? '' : 'checked'}>يسمح له بإنشاء كورسات جديدة</label>` : ''}
    ${isNew ? '<label>كلمة المرور (6 أحرف على الأقل)</label><input id="fw" type="text" dir="ltr" autocomplete="off">' : ''}
    ${kind === 'staff' ? `<label>الدور</label><select id="fr"><option value="supervisor" ${r?.role === 'admin' ? '' : 'selected'}>مشرف</option><option value="admin" ${r?.role === 'admin' ? 'selected' : ''}>مدير رئيسي</option></select><div id="pb"><b>صلاحيات المشرف</b>${PERMS.map(([k, l]) => `<label style="display:block"><input type="checkbox" data-pm="${k}" style="width:auto;margin:0 0 0 6px" ${perms[k] ? 'checked' : ''}>${l}</label>`).join('')}</div>` : ''}
    ${!isNew && kind !== 'staff' ? `<label>الدور</label><select id="fr"><option value="student" ${r.role === 'student' ? 'selected' : ''}>طالب</option><option value="teacher" ${r.role === 'teacher' ? 'selected' : ''}>مدرس</option></select>` : ''}
    <div class="row" style="margin-top:12px"><button class="btn" id="fs">حفظ</button></div>`;
  };
  const openForm = r => modal(form(r), (o, close) => {
    o.querySelector('#fs').onclick = async () => {
      const name = o.querySelector('#fn').value.trim(); if (!name) return toast('اكتب الاسم');
      const perms = {}; o.querySelectorAll('[data-pm]').forEach(c => perms[c.dataset.pm] = c.checked); const cc = o.querySelector('#fcc'); if (cc) perms.create_course = cc.checked;
      const role = o.querySelector('#fr') ? o.querySelector('#fr').value : (kind === 'staff' ? 'supervisor' : kind);
      if (!r) {
        const { error, data: nid } = await call('admin_create_user', { p_email: o.querySelector('#fe').value, p_password: o.querySelector('#fw').value, p_name: name, p_role: role, p_phone: o.querySelector('#fp').value, p_perms: kind === 'student' ? {} : perms }); if (error) return;
        if (kind === 'teacher' && nid) await sb.from('profiles').update({ title: o.querySelector('#ft').value || null, bio: o.querySelector('#fb').value || null }).eq('id', nid);
        toast('تمت الإضافة بنجاح ✓'); close(); reload();
      } else {
        const upd = { full_name: name, phone: o.querySelector('#fp').value || null };
        if (kind === 'teacher') { upd.title = o.querySelector('#ft').value || null; upd.bio = o.querySelector('#fb').value || null; upd.permissions = perms; }
        if (kind === 'staff') { upd.permissions = perms; if (r.id !== me.id) upd.role = role; } else if (o.querySelector('#fr')) upd.role = role;
        const { error } = await sb.from('profiles').update(upd).eq('id', r.id); if (error) return toast(error.message); toast('تم الحفظ بنجاح ✓'); close(); reload();
      }
    };
    if (kind === 'teacher' && !r) { /* teacher extra fields saved on edit */ }
  });
  const details = r => modal(kind === 'student' ? `<h2>${esc(r.full_name)}</h2><p class="muted">${esc(r.email)} · ${esc(r.phone || '')}</p><h3>الكورسات والتقدم</h3>${r.items.map(i => `<div class="row" style="margin:6px 0"><span style="min-width:170px">${esc(i.t)}</span><div class="bar" style="flex:1"><i style="width:${i.pc}%"></i></div><span class="muted">${i.pc}% (${i.d}/${i.n})</span><button class="btn s o" data-rs="${i.id}">تصفير</button><button class="btn s r" data-un="${i.id}">إلغاء التسجيل</button></div>`).join('') || '<p class="muted">غير مسجّل في أي كورس</p>'}<h3>نتائج الاختبارات</h3>${r.att.map(a => `<div class="muted">${esc(title[a.course_id])}: ${a.score}/${a.total} · ${fmtDate(a.created_at)}</div>`).join('') || '<p class="muted">لا توجد نتائج</p>'}`
    : `<h2>${esc(r.full_name)}</h2><p class="muted">${esc(r.email)} · ${esc(r.phone || '')}</p><p>الكورسات: <b>${r.nc}</b> · الطلاب: <b>${r.ns}</b> · التسجيلات: <b>${r.ne}</b> · التقييم: <b>${r.rating || '-'}</b></p>${r.mine.map(c => `<div>• ${esc(c.title)} (${stAr[c.status]}): ${r.es.filter(e => e.course_id === c.id).length} طالب</div>`).join('')}<p><a class="btn" href="index.html#/teacher/${r.id}">دخول صفحة المدرس</a></p>`,
    (o, close) => {
      o.querySelectorAll('[data-un]').forEach(b => b.onclick = async () => { if (!confirm('إلغاء تسجيل الطالب من هذا الكورس؟')) return; const { error } = await sb.from('enrollments').delete().eq('student_id', r.id).eq('course_id', b.dataset.un); error ? toast(error.message) : (toast('تم إلغاء التسجيل'), close(), reload()); });
      o.querySelectorAll('[data-rs]').forEach(b => b.onclick = async () => { if (!confirm('تصفير تقدم الطالب في هذا الكورس؟')) return; const ids = [...(lc[b.dataset.rs] || [])]; const { error } = await sb.from('lesson_progress').delete().eq('student_id', r.id).in('lesson_id', ids); error ? toast(error.message) : (toast('تم تصفير التقدم'), close(), reload()); });
    });
  const pwForm = r => modal(`<h2>إعادة تعيين كلمة المرور</h2><p class="muted">${esc(r.full_name)}</p><label>كلمة المرور الجديدة (6 أحرف على الأقل)</label><input id="np" type="text" dir="ltr" autocomplete="off"><button class="btn" id="npb" style="margin-top:10px">تعيين</button>`, (o, close) => { o.querySelector('#npb').onclick = async () => { const { error } = await call('admin_reset_password', { p_user: r.id, p_password: o.querySelector('#np').value }, 'تم تغيير كلمة المرور بنجاح ✓'); if (!error) close(); }; });
  dtable({ title: { student: 'إدارة الطلاب', teacher: 'إدارة المدرسين', staff: 'الموظفون والصلاحيات' }[kind], rows, cols, search: r => `${r.full_name} ${r.email} ${r.phone || ''}`,
    filters: [{ l: 'الحالة', opts: [['a', 'نشط'], ['s', 'موقوف']], f: (r, v) => v === 's' ? r.suspended : !r.suspended }],
    add: `<button class="btn y" id="addu">+ إضافة ${lbl}</button>`, onReady: b => b.querySelector('#addu').onclick = () => openForm(null),
    actions: r => [['d', 'تفاصيل'], ['e', 'تعديل'], ['p', 'كلمة المرور'], r.suspended ? ['t', 'تفعيل', 'y'] : ['t', 'إيقاف', 'o'], ['x', 'حذف', 'r']].filter(a => !(kind === 'staff' && a[0] === 'd')),
    onAct: async (a, r) => {
      if (a === 'd') return details(r); if (a === 'e') return openForm(r); if (a === 'p') return pwForm(r);
      if (a === 't') { if (r.id === me.id) return toast('لا يمكنك إيقاف حسابك'); if (!r.suspended && !confirm(`إيقاف حساب ${r.full_name}؟ لن يتمكن من الدخول.`)) return; const { error } = await sb.from('profiles').update({ suspended: !r.suspended }).eq('id', r.id); error ? toast(error.message) : (toast(r.suspended ? 'تم تفعيل الحساب ✓' : 'تم إيقاف الحساب ✓'), reload()); }
      if (a === 'x') { if (!confirm(`حذف حساب ${r.full_name} نهائيًا؟ لا يمكن التراجع.`)) return; const { error } = await call('admin_delete_user', { p_user: r.id }, 'تم حذف الحساب ✓'); if (!error) reload(); }
    } });
}
const pages = {
  async overview() {
    const cnt = async (t, f) => { let q = sb.from(t).select('created_at', { count: 'exact', head: true }); if (f) q = q.eq(...f); return (await q).count || 0; };
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
  async review() {
    const [{ data: pc }, { data: pl }, { data: pq }] = await Promise.all([
      sb.from('courses').select('id,title,created_at,profiles!teacher_id(full_name)').eq('status', 'pending'),
      sb.from('lessons').select('id,title,video_url,image_url,file_url,course_id,courses(title,status,profiles!teacher_id(full_name))').eq('approved', false),
      sb.from('quiz_questions').select('id,question,course_id,courses(title,status,profiles!teacher_id(full_name))').eq('approved', false)]);
    const tn = x => esc(x?.courses?.profiles?.full_name || x?.profiles?.full_name || '');
    root.querySelector('#pg').innerHTML = `<h1>مراجعة المحتوى</h1><p class="muted">كل ما يرفعه المدرسون يظهر هنا. الطالب لا يرى شيئًا حتى توافق عليه.</p>
    <div class="box"><h3>كورسات بانتظار النشر (${(pc || []).length})</h3>${(pc || []).map(c => `<div class="lrow"><div><b>${esc(c.title)}</b><div class="muted">المدرس: ${tn(c)}</div></div><a class="btn s o" href="index.html#/edit/${c.id}">فتح</a><button class="btn s y" data-a="courses:${c.id}">✓ نشر</button><button class="btn s r" data-r="courses:${c.id}">رفض (مسودة)</button></div>`).join('') || '<p class="muted">لا يوجد.</p>'}</div>
    <div class="box"><h3>دروس جديدة أو معدلة (${(pl || []).length})</h3>${(pl || []).map(l => `<div class="lrow"><div><b>${esc(l.title)}</b> ${l.video_url ? '🎬' : ''}${l.image_url ? '🖼️' : ''}${l.file_url ? '📎' : ''}<div class="muted">${esc(l.courses?.title)} · المدرس: ${tn(l)}</div></div><a class="btn s o" href="index.html#/edit/${l.course_id}">فتح</a><button class="btn s y" data-a="lessons:${l.id}">✓ موافقة</button><button class="btn s r" data-d="lessons:${l.id}">حذف</button></div>`).join('') || '<p class="muted">لا يوجد.</p>'}</div>
    <div class="box"><h3>أسئلة اختبار جديدة (${(pq || []).length})</h3>${(pq || []).map(q => `<div class="lrow"><div><b>${esc(q.question)}</b><div class="muted">${esc(q.courses?.title)} · المدرس: ${tn(q)}</div></div><a class="btn s o" href="index.html#/edit/${q.course_id}">فتح</a><button class="btn s y" data-a="quiz_questions:${q.id}">✓ موافقة</button><button class="btn s r" data-d="quiz_questions:${q.id}">حذف</button></div>`).join('') || '<p class="muted">لا يوجد.</p>'}</div>`;
    const done = async (p, o) => { const [t, k] = p.split(':'); const { error } = o ? await sb.from(t).update(o).eq('id', k) : await sb.from(t).delete().eq('id', k); error ? toast(error.message) : show('review'); };
    $$('[data-a]').forEach(b => b.onclick = () => done(b.dataset.a, b.dataset.a.startsWith('courses') ? { status: 'published' } : { approved: true }));
    $$('[data-r]').forEach(b => b.onclick = () => done(b.dataset.r, { status: 'draft' }));
    $$('[data-d]').forEach(b => b.onclick = () => { if (confirm('حذف نهائي؟')) done(b.dataset.d); });
  },
  async lectures() {
    const { data, error } = await sb.from('lessons').select('id,title,position,approved,video_url,image_url,file_url,course_id,courses(title,status,profiles!teacher_id(full_name))').order('created_at', { ascending: false });
    if (error) throw error;
    dtable({ title: 'إدارة الأقسام والمحاضرات', rows: data || [], search: r => `${r.title} ${r.courses?.title || ''} ${r.courses?.profiles?.full_name || ''}`,
      filters: [{ l: 'الحالة', opts: [['a', 'معتمد'], ['p', 'بانتظار الموافقة']], f: (r, v) => v === 'a' ? r.approved : !r.approved }, { l: 'المحتوى', opts: [['v', 'فيديو'], ['i', 'صورة'], ['f', 'ملف']], f: (r, v) => v === 'v' ? r.video_url : v === 'i' ? r.image_url : r.file_url }],
      cols: [{ l: 'المحاضرة', v: r => `<b>${esc(r.title)}</b>`, s: r => r.title }, { l: 'الكورس', v: r => esc(r.courses?.title), s: r => r.courses?.title || '' }, { l: 'المدرس', v: r => esc(r.courses?.profiles?.full_name || '-'), s: r => r.courses?.profiles?.full_name || '' }, { l: 'المحتوى', v: r => `${r.video_url ? '🎬 ' : ''}${r.image_url ? '🖼️ ' : ''}${r.file_url ? '📎' : ''}` || '-', s: r => (r.video_url ? 1 : 0) + (r.file_url ? 1 : 0) }, { l: 'الحالة', v: r => r.approved ? '<span class="tag" style="background:#e6f6ea;color:#067647">معتمد</span>' : '<span class="tag y">بانتظار الموافقة</span>', s: r => r.approved }],
      actions: r => [['e', 'فتح وتعديل'], ...(r.approved ? [] : [['a', 'موافقة', 'y']]), ['x', 'حذف', 'r']],
      onAct: async (act, r) => { if (act === 'e') { location.href = `index.html#/edit/${r.course_id}`; return; } if (act === 'a') { const { error } = await sb.from('lessons').update({ approved: true }).eq('id', r.id); error ? toast(error.message) : (toast('تمت الموافقة ✓'), show('lectures')); } if (act === 'x' && confirm('حذف المحاضرة نهائيًا؟')) { const { error } = await sb.from('lessons').delete().eq('id', r.id); error ? toast(error.message) : (toast('تم الحذف ✓'), show('lectures')); } } });
  },
  async roles() {
    const { data: ps } = await sb.rpc('admin_profiles');
    const n = r => (ps || []).filter(p => p.role === r).length;
    const rows = [['admin', 'المدير الرئيسي', 'كل الصلاحيات: جميع الأقسام والإعدادات والموظفين والتقارير.'], ['supervisor', 'المشرف', 'متابعة الطلاب والمدرسين والكورسات والامتحانات والشكاوى حسب الصلاحيات الممنوحة له فقط. لا يعدّل حسابات المدراء.'], ['teacher', 'المدرس', 'يدير كورساته فقط: محاضرات وفيديوهات وملفات وأسئلة، ويتابع طلابه ونتائجهم. المحتوى لا يظهر للطلاب إلا بعد موافقة الإدارة.'], ['student', 'الطالب', 'يشاهد الكورسات المسجّل بها ويؤدي الاختبارات ويتابع تقدمه وشهاداته.']];
    root.querySelector('#pg').innerHTML = `<h1>الصلاحيات والأدوار</h1><p class="muted">تُطبَّق هذه الصلاحيات من قاعدة البيانات نفسها. لتحديد صلاحيات مشرف أو مدرس افتح صفحة إدارة الموظفين أو إدارة المدرسين.</p>${rows.map(([k, t, d]) => `<div class="box"><div class="row"><b style="flex:1">${t}</b><span class="tag">${n(k)} حساب</span></div><p class="muted">${d}</p>${k === 'supervisor' ? `<div>الصلاحيات المتاحة: ${PERMS.map(([, l]) => `<span class="tag">${l}</span>`).join(' ')}</div>` : ''}</div>`).join('')}<p><a class="btn" href="#" id="gs">إدارة الموظفين والصلاحيات</a></p>`;
    $('#gs').onclick = e => { e.preventDefault(); show('staff'); };
  },
  async teachers() { await accountsPage('teacher'); },
  async students() { await accountsPage('student'); },
  async staff() { await accountsPage('staff'); },
  async logs() {
    const { data, error } = await sb.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(1000);
    if (error) throw error;
    const act = { insert: 'إضافة', update: 'تعديل', delete: 'حذف', suspend: 'إيقاف', activate: 'تفعيل', change_role: 'تغيير الدور', change_permissions: 'تغيير الصلاحيات', approve: 'موافقة', create: 'إنشاء حساب', reset_password: 'إعادة تعيين كلمة المرور', status_published: 'نشر', status_draft: 'إلغاء نشر', status_pending: 'إرسال للمراجعة' };
    const ent = { profiles: 'حسابات', courses: 'كورسات', lessons: 'دروس', quiz_questions: 'أسئلة', enrollments: 'تسجيلات', categories: 'تصنيفات', site_settings: 'إعدادات الموقع' };
    dtable({ title: 'سجل النشاطات', rows: data || [], search: r => `${r.actor_name} ${r.details?.label || ''}`,
      filters: [{ l: 'العملية', opts: Object.entries(act), f: (r, v) => r.action === v }, { l: 'القسم', opts: Object.entries(ent), f: (r, v) => r.entity === v }, { l: 'الدور', opts: [['admin', 'مدير'], ['supervisor', 'مشرف'], ['teacher', 'مدرس']], f: (r, v) => r.actor_role === v }],
      cols: [{ l: 'الوقت', v: r => fmtDT(r.created_at), s: r => r.created_at }, { l: 'المنفّذ', v: r => `${esc(r.actor_name)} <span class="muted">(${roleAr[r.actor_role] || r.actor_role})</span>`, s: r => r.actor_name }, { l: 'العملية', v: r => act[r.action] || esc(r.action), s: r => r.action }, { l: 'القسم', v: r => ent[r.entity] || esc(r.entity), s: r => r.entity }, { l: 'التفاصيل', v: r => esc(r.details?.label || ''), s: r => r.details?.label || '' }], sort: [0, -1] });
  },
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
  root.innerHTML = `<div class="shell"><aside class="side"><div class="sbh"><span class="lg">🎓</span> ${esc(S.name || "منصة تعلّم")}<small>لوحة الإدارة</small></div>${SECTIONS.filter(([k]) => can(k)).map(([k, l]) => k === 'sep' ? `<div class="sepl">${l}</div>` : `<a data-k="${k}">${l}</a>`).join('')}<a href="index.html" target="_blank">↗ فتح الموقع</a><a href="index.html#/profile">👤 الملف الشخصي</a><a id="lo">🚪 تسجيل الخروج</a></aside><div class="mw"><div class="tb"><div class="hs2"><button aria-label="بحث">🔍</button><input id="sq" placeholder="ابحث في الأقسام"></div><span class="adm-u">👤 ${esc(me.full_name || "الأدمن")}</span></div><section class="cont" id="pg"></section></div></div>`;
  $$('.side a[data-k]').forEach(a => a.onclick = () => show(a.dataset.k));
  $('#sq').oninput = e => { const v = e.target.value.trim(); $$('.side a[data-k]').forEach(a => a.style.display = !v || a.innerText.includes(v) ? '' : 'none'); };
  $('#lo').onclick = async () => { await sb.auth.signOut(); boot(); };
  const k = location.hash.slice(1); show(pages[k] && can(k) ? k : 'overview');
}
function login(msg = '') {
  root.innerHTML = `<div class="afm"><h1>دخول الإدارة</h1>${msg ? `<p style="color:#d92d20">${msg}</p>` : ''}<div class="fl"><label for="em">البريد الإلكتروني</label><input id="em" type="email"></div><div class="fl"><label for="pw">كلمة المرور</label><input id="pw" type="password"></div><button class="btn big2" id="ok">دخول</button><p><a href="index.html">← العودة للموقع</a></p></div>`;
  $('#ok').onclick = async () => { const { error } = await sb.auth.signInWithPassword({ email: $('#em').value.trim(), password: $('#pw').value }); if (error) toast(error.message); else boot(); };
}
async function boot() {
  try { await loadSettings(); me = await getMe(); } catch (e) { console.error(e); }
  if (!me) return login();
  if (!['admin', 'supervisor'].includes(me.role) || me.suspended) { await sb.auth.signOut(); return login('هذا الحساب ليس له صلاحية الدخول للوحة الإدارة.'); }
  shell();
}
boot();
