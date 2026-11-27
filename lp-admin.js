// Visitor page management (draft / publish)
let LD = null, LP = null, LTAB = 'hero', LT = null;
const lpClone = o => JSON.parse(JSON.stringify(o));
const LPTABS = [['hero', 'الواجهة الرئيسية'], ['banners', 'البنرات والصور'], ['courses', 'الكورسات المعروضة'], ['teachers', 'المدرسون المعروضون'], ['features', 'مميزات المنصة'], ['reviews', 'آراء الطلاب'], ['faqs', 'الأسئلة الشائعة'], ['msgs', 'رسائل الزوار'], ['design', 'إعدادات التصميم'], ['seo', 'إعدادات SEO']];
const LPSEC = { hero: 'القسم الرئيسي (الأحمر)', banners: 'البنرات', courses: 'الكورسات المميزة', teachers: 'المدرسون المميزون', features: 'مميزات المنصة', reviews: 'آراء الطلاب', faq: 'الأسئلة الشائعة', contact: 'التواصل معنا', tracks: 'مجالات التعلّم (قائمة)', categories: 'التصنيفات', partners: 'الشركاء', cta: 'دعوة التسجيل' };
const lpDirty = () => JSON.stringify(LD) !== JSON.stringify(LP);
function lpBar() {
  const b = $('#lpbar'); if (!b) return;
  const d = lpDirty();
  b.innerHTML = `<span class="tag ${d ? 'y' : ''}">${d ? '● تغييرات غير منشورة (الزوار لا يرونها)' : '✓ المنشور مطابق للمسودة'}</span>
  <a class="btn s o" href="index.html#/?preview=1" target="_blank">👁️ معاينة المسودة</a>
  <button class="btn s y" id="lppub" ${d ? '' : 'disabled'}>نشر التغييرات</button><button class="btn s o" id="lpdis" ${d ? '' : 'disabled'}>تجاهل المسودة</button>`;
  $('#lppub').onclick = async () => {
    if (!confirm('نشر كل التغييرات للزوار الآن؟')) return;
    const { error } = await sb.from('site_settings').upsert({ key: 'landing', value: LD });
    if (error) return toast(error.message); LP = lpClone(LD); toast('تم النشر ✓'); lpBar();
  };
  $('#lpdis').onclick = async () => {
    if (!confirm('الرجوع للنسخة المنشورة وإلغاء كل تعديلات المسودة؟')) return;
    LD = lpClone(LP); await lpSave(true); lpDraw();
  };
}
async function lpSave(quiet) {
  const { error } = await sb.from('site_settings').upsert({ key: 'landing_draft', value: LD });
  if (error) return toast(error.message); if (!quiet) toast('تم حفظ المسودة ✓'); lpBar();
}
async function lpPage(tab) {
  if (tab) LTAB = tab;
  const [{ data: p }, { data: d }] = await Promise.all([sb.from('site_settings').select('value').eq('key', 'landing').maybeSingle(), sb.from('site_settings').select('value').eq('key', 'landing_draft').maybeSingle()]);
  LP = (p && p.value) || { hero: {}, design: {} }; LD = (d && d.value) || lpClone(LP);
  root.querySelector('#pg').innerHTML = `<h1>إدارة صفحة الزائر</h1><div class="box row" id="lpbar" style="justify-content:space-between"></div><div class="row" id="lptabs" style="flex-wrap:wrap;gap:6px"></div><div id="lpc" style="margin-top:14px"></div>`;
  lpDraw();
}
function lpDraw() {
  $('#lptabs').innerHTML = LPTABS.map(([k, l]) => `<button class="btn s ${k === LTAB ? '' : 'o'}" data-t="${k}">${l}</button>`).join('');
  $$('#lptabs [data-t]').forEach(b => b.onclick = () => { LTAB = b.dataset.t; lpDraw(); });
  lpBar(); const c = $('#lpc'); c.innerHTML = '';
  ({ hero: lpHero, banners: lpBanners, courses: lpCourses, teachers: lpTeachers, features: lpFeatures, reviews: lpReviews, faqs: lpFaqs, msgs: c => lpMsgs(c), design: lpDesign, seo: lpSeo })[LTAB](c);
}
// plain text / image / color fields bound to a path of LD
function lpField(path, label, type = 'text', opts) {
  const v = get(LD, path) ?? '';
  if (type === 'img') return `<div class="fld"><label>${label}</label><div class="imgf">${v ? `<img src="${esc(v)}">` : ''}<input type="file" accept="image/*" data-pimg="${path}" style="flex:1"><button class="btn o s" data-pclr="${path}">إزالة</button></div></div>`;
  if (type === 'area') return `<div class="fld"><label>${label}</label><textarea data-pp="${path}" rows="4">${esc(v)}</textarea></div>`;
  if (type === 'color') return `<div class="fld"><label>${label}</label><div class="row"><input type="color" data-pp="${path}" value="${esc(v || '#e30000')}" style="height:44px;padding:4px;width:90px"><button class="btn o s" data-pclr="${path}">الافتراضي</button></div></div>`;
  if (type === 'select') return `<div class="fld"><label>${label}</label><select data-pp="${path}">${opts.map(([a, b]) => `<option value="${esc(a)}" ${a === v ? 'selected' : ''}>${b}</option>`).join('')}</select></div>`;
  if (type === 'bool') return `<label class="row" style="gap:8px"><input type="checkbox" data-pb="${path}" ${v !== false ? 'checked' : ''} style="width:auto"> ${label}</label>`;
  return `<div class="fld"><label>${label}</label><input data-pp="${path}" value="${esc(v)}"></div>`;
}
function lpBind(c) {
  $$('[data-pp]', c).forEach(i => i.onchange = async () => { set(LD, i.dataset.pp, i.value); await lpSave(); });
  $$('[data-pb]', c).forEach(i => i.onchange = async () => { set(LD, i.dataset.pb, i.checked); await lpSave(); });
  $$('[data-pimg]', c).forEach(i => i.onchange = async () => { const u = await uploadImage(i.files[0], 'site'); if (u) { set(LD, i.dataset.pimg, u); await lpSave(); lpDraw(); } });
  $$('[data-pclr]', c).forEach(b => b.onclick = async () => { set(LD, b.dataset.pclr, ''); await lpSave(); lpDraw(); });
}
// ordered list editor for an array at path in LD
function lpList(c, path, fields, blank, intro = '', max = 0) {
  let arr = get(LD, path); if (!Array.isArray(arr)) { set(LD, path, []); arr = get(LD, path); }
  const fld = (i, [k, l, t], v) => t === 'img' ? `<div><label>${l}</label>${v ? `<img src="${esc(v)}" style="height:44px;display:block;margin-bottom:4px">` : ''}<input type="file" accept="image/*" data-li="${i}" data-lk="${k}" data-up="1"></div>`
    : t === 'area' ? `<div style="flex:2"><label>${l}</label><textarea rows="2" data-li="${i}" data-lk="${k}">${esc(v)}</textarea></div>`
    : t === 'bool' ? `<label class="row" style="gap:6px;white-space:nowrap"><input type="checkbox" data-li="${i}" data-lk="${k}" data-bool="1" ${v !== false && v ? 'checked' : ''} style="width:auto"> ${l}</label>`
    : t === 'show' ? `<label class="row" style="gap:6px;white-space:nowrap"><input type="checkbox" data-li="${i}" data-lk="${k}" data-bool="1" ${v !== false ? 'checked' : ''} style="width:auto"> ${l}</label>`
    : t === 'num' ? `<div style="max-width:90px"><label>${l}</label><input type="number" min="0" max="5" data-li="${i}" data-lk="${k}" data-num="1" value="${esc(v ?? 0)}"></div>`
    : `<div><label>${l}</label><input data-li="${i}" data-lk="${k}" value="${esc(v)}"></div>`;
  c.innerHTML = `${intro}${arr.map((it, i) => `<div class="lrow"><div class="row" style="gap:4px"><button class="btn s o" data-mv="${i}:-1">▲</button><button class="btn s o" data-mv="${i}:1">▼</button></div>${fields.map(f => fld(i, f, it[f[0]])).join('')}<button class="btn s r" data-rm="${i}">حذف</button></div>`).join('') || '<p class="muted">لا عناصر.</p>'}<button class="btn" id="lpadd">+ إضافة</button>`;
  $$('[data-lk]', c).forEach(el => el.onchange = async () => {
    const it = arr[+el.dataset.li], k = el.dataset.lk;
    if (el.dataset.up) { const u = await uploadImage(el.files[0], 'site'); if (!u) return; it[k] = u; await lpSave(); return lpList(c, path, fields, blank, intro, max); }
    it[k] = el.dataset.bool ? el.checked : el.dataset.num ? +el.value : el.value; await lpSave();
  });
  $$('[data-rm]', c).forEach(b => b.onclick = async () => { if (!confirm('حذف هذا العنصر؟')) return; arr.splice(+b.dataset.rm, 1); await lpSave(); lpList(c, path, fields, blank, intro, max); });
  $$('[data-mv]', c).forEach(b => b.onclick = async () => { const [i, d] = b.dataset.mv.split(':').map(Number), j = i + d; if (j < 0 || j >= arr.length) return; [arr[i], arr[j]] = [arr[j], arr[i]]; await lpSave(); lpList(c, path, fields, blank, intro, max); });
  $('#lpadd', c).onclick = async () => { arr.push(lpClone(blank)); await lpSave(); lpList(c, path, fields, blank, intro, max); };
}
function lpHero(c) {
  c.innerHTML = `<div class="box">${lpField('hero.show', 'إظهار القسم الرئيسي للزوار', 'bool')}${lpField('hero.title', 'العنوان الرئيسي')}${lpField('hero.subtitle', 'الوصف الترحيبي', 'area')}${lpField('hero.cta', 'نص الزر الرئيسي')}</div><h3>البطاقات الثلاث (الصور)</h3><div id="lpt"></div>`;
  lpBind(c); lpList($('#lpt'), 'hero.tracks', [['title', 'العنوان'], ['image', 'الصورة', 'img'], ['emoji', 'إيموجي (لو بدون صورة)'], ['desc', 'الوصف']], { title: 'جديد', emoji: '📘', desc: '', image: '' }, '<p class="muted">أول 3 بطاقات تظهر في الصندوق الأحمر.</p>');
}
function lpBanners(c) { lpList(c, 'banners', [['title', 'العنوان'], ['image', 'الصورة', 'img'], ['link', 'الرابط (اختياري)'], ['show', 'ظاهر', 'show']], { title: '', image: '', link: '', show: true }, '<p class="muted">البنرات النشطة تظهر تحت القسم الرئيسي بالترتيب. لا تظهر شيئًا لو القائمة فارغة.</p>'); }
function lpFeatures(c) { lpList(c, 'features', [['emoji', 'الأيقونة (إيموجي)'], ['title', 'العنوان'], ['desc', 'الوصف', 'area'], ['show', 'ظاهرة', 'show']], { emoji: '✨', title: 'ميزة جديدة', desc: '', show: true }, '<p class="muted">يظهر أول 8 مميزات ظاهرة (صفين × 4).</p>'); }
function lpReviews(c) { lpList(c, 'reviews', [['name', 'الاسم'], ['role', 'الصفة'], ['text', 'النص', 'area'], ['avatar', 'الصورة', 'img'], ['rating', 'التقييم (0-5)', 'num'], ['approved', 'معتمد', 'bool']], { name: 'اسم الطالب', role: 'طالب', text: '', avatar: '', rating: 5, approved: false }, '<p class="muted">يظهر للزوار المعتمد فقط، أول 8 (صفين × 4). أي تقييم جديد يبدأ غير معتمد.</p>'); }
function lpFaqs(c) { lpList(c, 'faqs', [['q', 'السؤال'], ['a', 'الإجابة', 'area'], ['show', 'ظاهر', 'show']], { q: 'سؤال جديد', a: '', show: true }, '<p class="muted">يظهر أول 6 أسئلة ظاهرة (صفين × 3).</p>'); }
async function lpCourses(c) {
  const { data: all } = await sb.from('courses').select('id,title,price,status,profiles!teacher_id(full_name)').eq('status', 'published').order('title');
  const m = new Map((all || []).map(x => [x.id, x])); const arr = LD.courses = LD.courses || [];
  const draw = () => {
    const rest = (all || []).filter(x => !arr.some(a => a.id === x.id));
    c.innerHTML = `<p class="muted">اختر الكورسات التي تظهر للزوار وترتيبها. يظهر أول 8 ظاهرة (صفين × 4). الكورس غير المنشور لا يظهر. السعر يحفظ في الكورس نفسه فورًا (0 = مجاني).</p>
    ${arr.map((a, i) => { const x = m.get(a.id); return `<div class="lrow"><div class="row" style="gap:4px"><button class="btn s o" data-mv="${i}:-1">▲</button><button class="btn s o" data-mv="${i}:1">▼</button></div><div style="flex:2"><b>${esc(x ? x.title : '(كورس غير منشور أو محذوف)')}</b><div class="muted">المدرس: ${esc(x?.profiles?.full_name || '-')}</div></div>
    <div style="max-width:120px"><label>السعر (ج.م)</label><input type="number" min="0" data-pr="${a.id}" value="${x ? +x.price : 0}"></div><label class="row" style="gap:6px"><input type="checkbox" data-sh="${i}" ${a.show !== false ? 'checked' : ''} style="width:auto"> ظاهر</label><button class="btn s r" data-rm="${i}">إزالة</button></div>`; }).join('') || '<p class="muted">لا كورسات.</p>'}
    <div class="row" style="margin-top:10px"><select id="lpsel" style="flex:1"><option value="">+ إضافة كورس منشور...</option>${rest.map(x => `<option value="${x.id}">${esc(x.title)}</option>`).join('')}</select><button class="btn" id="lpadd">إضافة</button></div>`;
    $$('[data-sh]', c).forEach(el => el.onchange = async () => { arr[+el.dataset.sh].show = el.checked; await lpSave(); });
    $$('[data-rm]', c).forEach(b => b.onclick = async () => { arr.splice(+b.dataset.rm, 1); await lpSave(); draw(); });
    $$('[data-mv]', c).forEach(b => b.onclick = async () => { const [i, d] = b.dataset.mv.split(':').map(Number), j = i + d; if (j < 0 || j >= arr.length) return; [arr[i], arr[j]] = [arr[j], arr[i]]; await lpSave(); draw(); });
    $$('[data-pr]', c).forEach(el => el.onchange = async () => { const { error } = await sb.from('courses').update({ price: Math.max(0, +el.value || 0) }).eq('id', el.dataset.pr); toast(error ? error.message : 'تم حفظ السعر ✓'); });
    $('#lpadd', c).onclick = async () => { const v = $('#lpsel', c).value; if (!v) return; arr.push({ id: v, show: true }); await lpSave(); draw(); };
  }; draw();
}
async function lpTeachers(c) {
  const { data: ps } = await sb.rpc('admin_profiles');
  const cand = (ps || []).filter(p => ['teacher', 'admin', 'supervisor'].includes(p.role) && !p.suspended); const m = new Map(cand.map(p => [p.id, p])); const arr = LD.teachers = LD.teachers || [];
  const draw = () => {
    const rest = cand.filter(p => !arr.some(a => a.id === p.id));
    c.innerHTML = `<p class="muted">اختر المدرسين الذين يظهرون للزوار وترتيبهم، وعدّل التخصص والنبذة (تظهر في صفحة الزائر فقط). يظهر أول 8.</p>
    ${arr.map((a, i) => { const p = m.get(a.id); return `<div class="lrow"><div class="row" style="gap:4px"><button class="btn s o" data-mv="${i}:-1">▲</button><button class="btn s o" data-mv="${i}:1">▼</button></div><div><b>${esc(p ? p.full_name : '(غير متاح)')}</b></div>
    <div><label>التخصص</label><input data-f="${i}:specialty" value="${esc(a.specialty || '')}"></div><div style="flex:2"><label>النبذة التعريفية</label><textarea rows="2" data-f="${i}:bio">${esc(a.bio || '')}</textarea></div><label class="row" style="gap:6px"><input type="checkbox" data-sh="${i}" ${a.show !== false ? 'checked' : ''} style="width:auto"> ظاهر</label><button class="btn s r" data-rm="${i}">إزالة</button></div>`; }).join('') || '<p class="muted">لم يتم اختيار مدرسين بعد، القسم مخفي للزوار.</p>'}
    <div class="row" style="margin-top:10px"><select id="lpsel" style="flex:1"><option value="">+ إضافة مدرس...</option>${rest.map(p => `<option value="${p.id}">${esc(p.full_name)} (${roleAr[p.role]})</option>`).join('')}</select><button class="btn" id="lpadd">إضافة</button></div>`;
    $$('[data-f]', c).forEach(el => el.onchange = async () => { const [i, k] = el.dataset.f.split(':'); arr[+i][k] = el.value; await lpSave(); });
    $$('[data-sh]', c).forEach(el => el.onchange = async () => { arr[+el.dataset.sh].show = el.checked; await lpSave(); });
    $$('[data-rm]', c).forEach(b => b.onclick = async () => { arr.splice(+b.dataset.rm, 1); await lpSave(); draw(); });
    $$('[data-mv]', c).forEach(b => b.onclick = async () => { const [i, d] = b.dataset.mv.split(':').map(Number), j = i + d; if (j < 0 || j >= arr.length) return; [arr[i], arr[j]] = [arr[j], arr[i]]; await lpSave(); draw(); });
    $('#lpadd', c).onclick = async () => { const v = $('#lpsel', c).value; if (!v) return; arr.push({ id: v, specialty: '', bio: '', show: true }); await lpSave(); draw(); };
  }; draw();
}
function lpDesign(c) {
  const d = LD.design = LD.design || {}; const arr = d.sections = d.sections || [];
  c.innerHTML = `<div class="box"><p class="muted">اترك اللون فارغًا (الافتراضي) ليبقى الأحمر. التصميم متجاوب مع الكمبيوتر والتابلت والموبايل تلقائيًا.</p>${lpField('design.primary', 'اللون الرئيسي', 'color')}${lpField('design.accent', 'لون التمييز', 'color')}${lpField('design.bg', 'لون الخلفية', 'color')}${lpField('design.font', 'الخط', 'select', [['', 'Cairo (الافتراضي)'], ['Tahoma', 'Tahoma'], ['Arial', 'Arial'], ['Segoe UI', 'Segoe UI']])}</div>
  <h3>ترتيب الأقسام وظهورها</h3><div id="lpsl"></div>`;
  lpBind(c);
  const draw = () => { $('#lpsl').innerHTML = arr.map((s, i) => `<div class="lrow"><div class="row" style="gap:4px"><button class="btn s o" data-mv="${i}:-1">▲</button><button class="btn s o" data-mv="${i}:1">▼</button></div><b style="flex:1">${LPSEC[s.k] || s.k}</b><label class="row" style="gap:6px"><input type="checkbox" data-sh="${i}" ${s.show !== false ? 'checked' : ''} style="width:auto"> ظاهر</label></div>`).join('');
    $$('#lpsl [data-sh]').forEach(el => el.onchange = async () => { arr[+el.dataset.sh].show = el.checked; await lpSave(); });
    $$('#lpsl [data-mv]').forEach(b => b.onclick = async () => { const [i, dd] = b.dataset.mv.split(':').map(Number), j = i + dd; if (j < 0 || j >= arr.length) return; [arr[i], arr[j]] = [arr[j], arr[i]]; await lpSave(); draw(); }); };
  draw();
}
function lpSeo(c) {
  c.innerHTML = `<div class="box">${lpField('seo.title', 'عنوان الصفحة')}${lpField('seo.description', 'وصف الصفحة', 'area')}${lpField('seo.keywords', 'الكلمات المفتاحية (مفصولة بفاصلة)')}${lpField('seo.image', 'صورة المشاركة', 'img')}<p class="muted">ملاحظة: الموقع يعمل على استضافة ثابتة، فمحركات البحث تقرأ العنوان والوصف بعد تشغيل الصفحة. معاينة روابط واتساب وفيسبوك تعتمد على القيم الثابتة في ملف الصفحة.</p></div>`; lpBind(c);
}
const MSG_ST = [['new', 'جديدة'], ['read', 'تمت القراءة'], ['handled', 'تم الرد/المعالجة']];
async function lpMsgs(c) {
  const { data, error } = await sb.from('messages').select('*').order('created_at', { ascending: false }); if (error) throw error;
  c.innerHTML = `<p class="muted">رسائل نموذج التواصل. لا يوجد إرسال بريد من المنصة، فالرد يتم عبر بريد الزائر (زر رد) وتسجّل ملاحظة داخلية وحالة الرسالة هنا.</p>` + ((data || []).map(m => `<div class="box" style="${m.status === 'new' ? 'border-color:var(--p)' : ''}"><div class="row" style="justify-content:space-between"><b>${esc(m.subject || '(بدون موضوع)')}</b><span class="muted">${fmtDT(m.created_at)}</span></div><div class="muted">من ${esc(m.name)} ${esc(m.email || '')}</div><p style="white-space:pre-wrap">${esc(m.body)}</p>
  <div class="row" style="flex-wrap:wrap"><select data-st="${m.id}" style="width:auto">${MSG_ST.map(([k, l]) => `<option value="${k}" ${m.status === k ? 'selected' : ''}>${l}</option>`).join('')}</select><input data-nt="${m.id}" placeholder="ملاحظة داخلية" value="${esc(m.note || '')}" style="flex:1;min-width:160px">${m.email ? `<a class="btn s o" href="mailto:${esc(m.email)}?subject=${encodeURIComponent('رد: ' + (m.subject || ''))}">رد بالبريد</a>` : ''}<button class="btn s r" data-del="${m.id}">حذف</button></div></div>`).join('') || '<p class="muted">لا رسائل.</p>');
  $$('[data-st]', c).forEach(el => el.onchange = async () => { const { error } = await sb.from('messages').update({ status: el.value, is_read: el.value !== 'new' }).eq('id', el.dataset.st); toast(error ? error.message : 'تم ✓'); });
  $$('[data-nt]', c).forEach(el => el.onchange = async () => { const { error } = await sb.from('messages').update({ note: el.value }).eq('id', el.dataset.nt); toast(error ? error.message : 'تم الحفظ ✓'); });
  $$('[data-del]', c).forEach(b => b.onclick = async () => { if (!confirm('حذف الرسالة نهائيًا؟')) return; await sb.from('messages').delete().eq('id', b.dataset.del); lpMsgs(c); });
}
