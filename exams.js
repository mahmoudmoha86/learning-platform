// Exams staff UI (admin, supervisor, teacher): exams, question bank, results
async function examsStaff(box, tab = 'exams', tabs = ['exams', 'qbank', 'results']) {
  const NAMES = { exams: 'الامتحانات', qbank: 'بنك الأسئلة', results: 'النتائج' };
  const all = me.role !== 'teacher';
  const nav = `<div class="row" style="margin-bottom:14px">${tabs.map(k => `<button class="btn s ${k === tab ? '' : 'o'}" data-xt="${k}">${NAMES[k]}</button>`).join('')}</div>`;
  const draw = html => { box.innerHTML = nav + html; $$('[data-xt]', box).forEach(b => b.onclick = () => examsStaff(box, b.dataset.xt, tabs)); };
  const cq = sb.from('courses').select('id,title').order('title'); if (!all) cq.eq('teacher_id', me.id);
  const { data: courses } = await cq; const { data: subs } = await sb.from('subjects').select('id,name').order('position'); const cn = id => ((courses || []).find(c => c.id === id) || {}).title || '-';
  const again = () => examsStaff(box, tab, tabs);
  if (tab === 'qbank') {
    const q = sb.from('questions').select('*').order('created_at', { ascending: false }); if (!all) q.eq('owner_id', me.id);
    const { data: qs } = await q;
    const opt = (list, cur, ph) => `<option value="">${ph}</option>` + (list || []).map(x => `<option value="${x.id}" ${x.id == cur ? 'selected' : ''}>${esc(x.title || x.name)}</option>`).join('');
    draw(`<div class="box"><h3 style="margin-top:0">إضافة سؤال</h3><label>نص السؤال</label><textarea id="qb" rows="2"></textarea>
    <div class="two"><div><label>النوع</label><select id="qt"><option value="mcq">اختيار من متعدد</option><option value="tf">صح / خطأ</option></select></div><div><label>الدرجة</label><input id="qm" type="number" min="0" step="0.5" value="1"></div>
    <div><label>الكورس (اختياري)</label><select id="qc">${opt(courses, '', 'بدون')}</select></div><div><label>المادة (اختياري)</label><select id="qs">${opt(subs, '', 'بدون')}</select></div></div>
    <div id="qo"><label>الاختيارات (اكتب اختيارين على الأقل)</label>${[0, 1, 2, 3].map(i => `<input id="o${i}" placeholder="الاختيار ${i + 1}">`).join('')}</div>
    <label>الإجابة الصحيحة</label><select id="qa"></select><button class="btn" id="qadd">إضافة السؤال</button></div>
    <div class="box"><h3 style="margin-top:0">الأسئلة (${(qs || []).length})</h3>${(qs || []).map(x => `<div class="lrow"><div style="flex:3"><label>السؤال</label><input data-q="${x.id}" data-k="body" value="${esc(x.body)}"><div class="muted">${(x.options || []).map((o, i) => (i === x.answer ? '✅ ' : '') + esc(o)).join(' | ')}</div></div><div><label>الدرجة</label><input type="number" step="0.5" data-q="${x.id}" data-k="marks" value="${x.marks}" style="max-width:90px"></div><div><label>الإجابة الصحيحة</label><select data-q="${x.id}" data-k="answer">${(x.options || []).map((o, i) => `<option value="${i}" ${i === x.answer ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select></div><button class="btn s r" data-dq="${x.id}">حذف</button></div>`).join('') || '<p class="muted">لا أسئلة بعد.</p>'}<p class="saved">يتم الحفظ تلقائيًا. بعد تعديل إجابة صحيحة استخدم "إعادة التصحيح" في تبويب النتائج.</p></div>`);
    const sync = () => { const tf = $('#qt', box).value === 'tf'; $('#qo', box).style.display = tf ? 'none' : ''; $('#qa', box).innerHTML = tf ? '<option value="0">صح</option><option value="1">خطأ</option>' : [1, 2, 3, 4].map((n, i) => `<option value="${i}">${n}</option>`).join(''); };
    $('#qt', box).onchange = sync; sync();
    $('#qadd', box).onclick = async () => {
      const body = $('#qb', box).value.trim(); if (!body) return toast('اكتب نص السؤال');
      const tf = $('#qt', box).value === 'tf'; const options = tf ? ['صح', 'خطأ'] : [0, 1, 2, 3].map(i => $('#o' + i, box).value.trim()).filter(Boolean);
      if (options.length < 2) return toast('اكتب اختيارين على الأقل');
      const answer = +$('#qa', box).value; if (answer >= options.length) return toast('الإجابة الصحيحة غير موجودة بين الاختيارات');
      const { error } = await sb.from('questions').insert({ body, qtype: $('#qt', box).value, options, answer, marks: +$('#qm', box).value || 1, course_id: $('#qc', box).value || null, subject_id: $('#qs', box).value ? +$('#qs', box).value : null });
      if (error) return toast(error.message); toast('تمت الإضافة ✓'); again();
    };
    $$('[data-q]', box).forEach(i => i.onchange = async () => { const k = i.dataset.k; const v = k === 'body' ? i.value : +i.value; const { error } = await sb.from('questions').update({ [k]: v }).eq('id', i.dataset.q); toast(error ? error.message : 'تم الحفظ ✓'); if (k === 'answer') again(); });
    $$('[data-dq]', box).forEach(b => b.onclick = async () => { if (!confirm('حذف السؤال؟ سيُحذف من الامتحانات المرتبطة به.')) return; const { error } = await sb.from('questions').delete().eq('id', b.dataset.dq); if (error) toast(error.message); else again(); });
    return;
  }
  const eq = sb.from('exams').select('*,exam_questions(question_id)').order('created_at', { ascending: false }); if (!all) eq.eq('owner_id', me.id);
  const { data: exams } = await eq;
  if (tab === 'exams') {
    draw(`<div class="row"><h2 style="flex:1;margin:0">الامتحانات</h2><button class="btn y" id="xnew">+ امتحان جديد</button></div>
    <div class="tw"><table><tr><th>العنوان</th><th>الكورس</th><th>المدة</th><th>النجاح</th><th>الأسئلة</th><th>الحالة</th><th></th></tr>${(exams || []).map(e => `<tr><td>${esc(e.title)}</td><td>${esc(cn(e.course_id))}</td><td>${e.duration_min} د</td><td>${e.pass_mark}%</td><td>${(e.exam_questions || []).length}</td><td><span class="tag ${e.status === 'published' ? '' : 'y'}">${e.status === 'published' ? 'منشور' : 'مسودة'}</span></td><td><button class="btn s" data-xe="${e.id}">تعديل</button> <button class="btn s r" data-xd="${e.id}">حذف</button></td></tr>`).join('') || '<tr><td colspan="7" class="muted" style="text-align:center">لا امتحانات بعد</td></tr>'}</table></div>`);
    $('#xnew', box).onclick = async () => {
      if (!(courses || []).length) return toast('أنشئ كورسا أولا');
      const { data, error } = await sb.from('exams').insert({ title: 'امتحان جديد', course_id: courses[0].id }).select().single(); if (error) return toast(error.message); editExam(data.id);
    };
    $$('[data-xe]', box).forEach(b => b.onclick = () => editExam(b.dataset.xe));
    $$('[data-xd]', box).forEach(b => b.onclick = async () => { if (!confirm('حذف الامتحان ونتائجه؟')) return; const { error } = await sb.from('exams').delete().eq('id', b.dataset.xd); if (error) toast(error.message); else again(); });
    async function editExam(id) {
      const { data: e } = await sb.from('exams').select('*,exam_questions(question_id,position)').eq('id', id).single(); if (!e) return;
      const qq = sb.from('questions').select('id,body,marks,course_id').order('created_at', { ascending: false }); if (!all) qq.eq('owner_id', me.id);
      const { data: bank } = await qq; const sel = new Set((e.exam_questions || []).map(x => x.question_id));
      const close = xmodal(`<h2>تعديل الامتحان</h2><label>العنوان</label><input id="mt" value="${esc(e.title)}"><div class="two"><div><label>الكورس</label><select id="mc">${(courses || []).map(c => `<option value="${c.id}" ${c.id === e.course_id ? 'selected' : ''}>${esc(c.title)}</option>`).join('')}</select></div>
      <div><label>المدة بالدقائق</label><input id="md" type="number" min="1" value="${e.duration_min}"></div><div><label>درجة النجاح (%)</label><input id="mp" type="number" min="0" max="100" value="${e.pass_mark}"></div>
      <div><label>الحالة</label><select id="ms"><option value="draft" ${e.status === 'draft' ? 'selected' : ''}>مسودة (مخفي)</option><option value="published" ${e.status === 'published' ? 'selected' : ''}>منشور للطلاب</option></select></div></div>
      <label><input type="checkbox" id="mr" ${e.retake ? 'checked' : ''} style="width:auto;margin:0 0 0 6px">السماح بإعادة الامتحان</label>
      <h3>اختر الأسئلة من البنك</h3><div style="max-height:260px;overflow:auto">${(bank || []).map(x => `<label class="row" style="font-weight:400"><input type="checkbox" data-pick="${x.id}" ${sel.has(x.id) ? 'checked' : ''} style="width:auto;margin:0 0 0 6px"><span style="flex:1">${esc(x.body)}</span><span class="tag">${x.marks} د</span></label>`).join('') || '<p class="muted">أضف أسئلة في تبويب بنك الأسئلة أولا.</p>'}</div>
      <div class="row" style="margin-top:12px"><button class="btn" id="msave">حفظ</button><span class="muted" id="mtot"></span></div>`, o => {
        const tot = () => { const ids = $$('[data-pick]:checked', o).map(c => c.dataset.pick); $('#mtot', o).textContent = ids.length + ' سؤال، المجموع ' + (bank || []).filter(x => ids.includes(x.id)).reduce((s, x) => s + +x.marks, 0) + ' درجة'; };
        $$('[data-pick]', o).forEach(c => c.onchange = tot); tot();
        $('#msave', o).onclick = async () => {
          const ids = $$('[data-pick]:checked', o).map(c => c.dataset.pick); const st = $('#ms', o).value;
          if (st === 'published' && !ids.length) return toast('اختر سؤالا واحدا على الأقل قبل النشر');
          const { error } = await sb.from('exams').update({ title: $('#mt', o).value.trim() || 'امتحان', course_id: $('#mc', o).value, duration_min: Math.max(1, +$('#md', o).value || 30), pass_mark: Math.min(100, Math.max(0, +$('#mp', o).value || 0)), status: st, retake: $('#mr', o).checked }).eq('id', id);
          if (error) return toast(error.message);
          const d1 = await sb.from('exam_questions').delete().eq('exam_id', id); if (d1.error) return toast(d1.error.message);
          if (ids.length) { const r = await sb.from('exam_questions').insert(ids.map((qid, i) => ({ exam_id: id, question_id: qid, position: i }))); if (r.error) return toast(r.error.message); }
          toast('تم الحفظ ✓'); close(); again();
        };
      });
    }
    return;
  }
  // results
  const xid = box.dataset.xid || (exams[0] && exams[0].id) || '';
  const { data: at } = xid ? await sb.from('exam_attempts').select('*,profiles!student_id(full_name)').eq('exam_id', xid).order('submitted_at', { ascending: false }) : { data: [] };
  draw(`<div class="row"><select id="xs" style="max-width:340px">${(exams || []).map(e => `<option value="${e.id}" ${e.id === xid ? 'selected' : ''}>${esc(e.title)}</option>`).join('') || '<option>لا امتحانات</option>'}</select>${xid ? '<button class="btn s y" id="xr">إعادة التصحيح</button>' : ''}</div>
  <div class="tw"><table><tr><th>الطالب</th><th>الدرجة</th><th>النسبة</th><th>النتيجة</th><th>وقت التسليم</th><th></th></tr>${(at || []).map(a => { const p = a.total ? Math.round(a.score / a.total * 100) : 0; return `<tr><td>${esc(a.profiles?.full_name)}</td><td>${a.submitted_at ? a.score + '/' + a.total : 'قيد الحل'}</td><td>${a.submitted_at ? p + '%' : '-'}</td><td>${a.submitted_at ? (a.passed ? '<span class="tag">ناجح</span>' : '<span class="tag y">راسب</span>') : '-'}</td><td>${a.submitted_at ? new Date(a.submitted_at).toLocaleString('ar-EG') : '-'}${a.regraded_at ? ' (أُعيد تصحيحه)' : ''}</td><td><button class="btn s r" data-xa="${a.id}">حذف المحاولة</button></td></tr>`; }).join('') || '<tr><td colspan="6" class="muted" style="text-align:center">لا نتائج بعد</td></tr>'}</table></div><p class="saved">حذف المحاولة يسمح للطالب بإعادة الامتحان.</p>`);
  const xs = $('#xs', box); if (xs) xs.onchange = () => { box.dataset.xid = xs.value; again(); };
  const xr = $('#xr', box); if (xr) xr.onclick = async () => { const { data, error } = await sb.rpc('exam_regrade', { p_exam: xid }); toast(error ? error.message : `تمت إعادة تصحيح ${data} محاولة ✓`); if (!error) again(); };
  $$('[data-xa]', box).forEach(b => b.onclick = async () => { if (!confirm('حذف هذه المحاولة؟')) return; const { error } = await sb.from('exam_attempts').delete().eq('id', b.dataset.xa); if (error) toast(error.message); else again(); });
}

function xmodal(html, onReady) {
  const o = document.createElement('div'); o.className = 'mdl'; o.innerHTML = `<div class="mdb"><button class="mdx" aria-label="إغلاق">✕</button>${html}</div>`; document.body.append(o);
  const close = () => o.remove(); o.onclick = e => { if (e.target === o) close(); }; o.querySelector('.mdx').onclick = close; onReady && onReady(o, close); return close;
}
