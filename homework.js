// Homework: staff (teacher/admin) and student views
const hwDate = d => d ? new Date(d).toLocaleString('ar-EG', { dateStyle: 'medium', timeStyle: 'short' }) : 'بدون موعد';
async function hwStaff(box, view) {
  const all = me.role !== 'teacher';
  const cq = sb.from('courses').select('id,title').order('title'); if (!all) cq.eq('teacher_id', me.id);
  const { data: courses } = await cq; const cn = id => ((courses || []).find(c => c.id === id) || {}).title || '-';
  if (view && view.id) {
    const h = view; const { data: subs } = await sb.from('homework_submissions').select('*,profiles!student_id(full_name)').eq('homework_id', h.id).order('submitted_at', { ascending: false });
    box.innerHTML = `<div class="row" style="margin-bottom:12px"><button class="btn s o" id="hb">← رجوع</button><h2 style="margin:0">${esc(h.title)}</h2></div><p class="muted">${esc(cn(h.course_id))} · الدرجة العظمى ${h.max_score} · التسليم: ${hwDate(h.due_at)}</p>
    ${(subs || []).map(s => `<div class="box" data-s="${s.id}"><div class="row"><b style="flex:1">${esc((s.profiles || {}).full_name || 'طالب')}</b><span class="muted">${hwDate(s.submitted_at)}</span>${s.late ? '<span class="tag y">متأخر</span>' : ''}${s.graded_at ? '<span class="tag">تم التصحيح</span>' : ''}</div>
    <p style="white-space:pre-wrap">${esc(s.content)}</p><div class="row"><input type="number" class="gs" style="max-width:110px" min="0" max="${h.max_score}" step="0.5" placeholder="الدرجة" value="${s.score ?? ''}"><input class="gf" style="flex:1" placeholder="ملاحظات للطالب" value="${esc(s.feedback || '')}"><button class="btn s gsave">حفظ</button></div></div>`).join('') || '<div class="box muted">لا توجد تسليمات بعد.</div>'}`;
    $('#hb', box).onclick = () => hwStaff(box);
    $$('.gsave', box).forEach(b => b.onclick = async () => {
      const c = b.closest('[data-s]'); const v = c.querySelector('.gs').value; if (v === '') return toast('اكتب الدرجة');
      if (+v < 0 || +v > +h.max_score) return toast('الدرجة خارج الحد المسموح');
      const { error } = await sb.from('homework_submissions').update({ score: +v, feedback: c.querySelector('.gf').value, graded_at: new Date().toISOString() }).eq('id', c.dataset.s);
      if (error) return toast(error.message); toast('تم الحفظ ✓'); hwStaff(box, h);
    }); return;
  }
  const { data: hs } = await sb.from('homework').select('*,homework_submissions(id,graded_at)').order('created_at', { ascending: false });
  box.innerHTML = `<div class="row" style="justify-content:space-between;margin-bottom:12px"><h1 style="margin:0">الواجبات</h1><button class="btn" id="hnew">+ واجب جديد</button></div>
  <div class="tw"><table><tr><th>العنوان</th><th>الكورس</th><th>موعد التسليم</th><th>الدرجة</th><th>التسليمات</th><th>الحالة</th><th></th></tr>${(hs || []).map(h => { const n = (h.homework_submissions || []).length, g = (h.homework_submissions || []).filter(x => x.graded_at).length; return `<tr><td>${esc(h.title)}</td><td>${esc(cn(h.course_id))}</td><td>${hwDate(h.due_at)}</td><td>${h.max_score}</td><td>${n} (مصحح ${g})</td><td><span class="tag ${h.status === 'published' ? '' : 'y'}">${h.status === 'published' ? 'منشور' : 'مسودة'}</span></td><td><button class="btn s" data-v="${h.id}">التسليمات</button> <button class="btn s o" data-e="${h.id}">تعديل</button> <button class="btn s red" data-d="${h.id}">حذف</button></td></tr>`; }).join('') || '<tr><td colspan="7" class="muted" style="text-align:center">لا توجد واجبات بعد</td></tr>'}</table></div>`;
  const edit = h => {
    h = h || {}; const dv = h.due_at ? new Date(new Date(h.due_at).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '';
    xmodal(`<h2>${h.id ? 'تعديل الواجب' : 'واجب جديد'}</h2><label>العنوان</label><input id="ht" value="${esc(h.title || '')}"><label>الكورس</label><select id="hc">${(courses || []).map(c => `<option value="${c.id}" ${c.id === h.course_id ? 'selected' : ''}>${esc(c.title)}</option>`).join('')}</select>
    <label>تعليمات الواجب</label><textarea id="hd" rows="4">${esc(h.description || '')}</textarea><div class="two"><div><label>موعد التسليم (اختياري)</label><input type="datetime-local" id="hdue" value="${dv}"></div><div><label>الدرجة العظمى</label><input type="number" id="hm" value="${h.max_score || 10}" min="1"></div></div>
    <label>الحالة</label><select id="hst"><option value="draft" ${h.status !== 'published' ? 'selected' : ''}>مسودة</option><option value="published" ${h.status === 'published' ? 'selected' : ''}>منشور للطلاب</option></select><button class="btn" id="hsave" style="margin-top:14px">حفظ</button>`, (o, close) => {
      o.querySelector('#hsave').onclick = async () => {
        const t = o.querySelector('#ht').value.trim(); if (!t) return toast('اكتب العنوان'); if (!o.querySelector('#hc').value) return toast('اختر الكورس');
        const row = { title: t, course_id: o.querySelector('#hc').value, description: o.querySelector('#hd').value, due_at: o.querySelector('#hdue').value ? new Date(o.querySelector('#hdue').value).toISOString() : null, max_score: +o.querySelector('#hm').value || 10, status: o.querySelector('#hst').value };
        const { error } = h.id ? await sb.from('homework').update(row).eq('id', h.id) : await sb.from('homework').insert(row);
        if (error) return toast(error.message); close(); hwStaff(box);
      };
    });
  };
  $('#hnew', box).onclick = () => edit();
  $$('[data-e]', box).forEach(b => b.onclick = () => edit(hs.find(x => x.id === b.dataset.e)));
  $$('[data-v]', box).forEach(b => b.onclick = () => hwStaff(box, hs.find(x => x.id === b.dataset.v)));
  $$('[data-d]', box).forEach(b => b.onclick = async () => { if (!confirm('حذف الواجب وكل تسليماته؟')) return; const { error } = await sb.from('homework').delete().eq('id', b.dataset.d); if (error) return toast(error.message); hwStaff(box); });
}
async function hwStudent(box) {
  const { data: hs } = await sb.from('homework').select('*,courses(title)').eq('status', 'published').order('created_at', { ascending: false });
  const { data: ss } = await sb.from('homework_submissions').select('*').eq('student_id', me.id); const by = Object.fromEntries((ss || []).map(s => [s.homework_id, s]));
  box.innerHTML = `<h1>الواجبات</h1>${(hs || []).map(h => { const s = by[h.id]; return `<div class="box" data-h="${h.id}"><div class="row"><b style="flex:1">${esc(h.title)}</b><span class="muted">${esc((h.courses || {}).title || '')}</span>${s && s.graded_at ? `<span class="tag">${s.score}/${h.max_score}</span>` : s ? '<span class="tag y">تم التسليم</span>' : '<span class="tag y">لم يتم التسليم</span>'}</div>
    <p style="white-space:pre-wrap">${esc(h.description || '')}</p><p class="muted">موعد التسليم: ${hwDate(h.due_at)}${h.due_at && new Date() > new Date(h.due_at) ? ' (انتهى الموعد، التسليم يُسجَّل متأخرًا)' : ''}</p>
    ${s && s.graded_at ? `<div class="box" style="background:#f4fff4"><b>الدرجة: ${s.score} من ${h.max_score}</b>${s.feedback ? `<p>${esc(s.feedback)}</p>` : ''}<p style="white-space:pre-wrap" class="muted">إجابتك: ${esc(s.content)}</p></div>` : `<textarea rows="4" class="hans" placeholder="اكتب إجابتك هنا">${esc(s ? s.content : '')}</textarea><button class="btn s hsend" style="margin-top:8px">${s ? 'تعديل التسليم' : 'تسليم الواجب'}</button>`}</div>`; }).join('') || '<div class="box muted">لا توجد واجبات حاليًا.</div>'}`;
  $$('.hsend', box).forEach(b => b.onclick = async () => {
    const c = b.closest('[data-h]'), txt = c.querySelector('.hans').value.trim(); if (!txt) return toast('اكتب إجابتك أولًا');
    const id = c.dataset.h, s = by[id];
    const { error } = s ? await sb.from('homework_submissions').update({ content: txt }).eq('id', s.id) : await sb.from('homework_submissions').insert({ homework_id: id, student_id: me.id, content: txt });
    if (error) return toast(error.message); toast('تم التسليم ✓'); hwStudent(box);
  });
}
