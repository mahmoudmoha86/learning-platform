const sb = supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY);
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const PCOLS = 'id,full_name,role,bio,avatar_url,created_at,title,suspended,permissions';
const arErr = m => { m = String(m || ''); const t = [[/row-level security|permission denied|42501/i, 'ليس لديك صلاحية لهذه العملية'], [/Invalid login credentials/i, 'البريد الإلكتروني أو كلمة المرور غير صحيحة'], [/banned|suspended/i, 'هذا الحساب موقوف، تواصل مع الإدارة'], [/already registered|already been registered/i, 'هذا البريد مسجّل بالفعل'], [/duplicate key/i, 'هذا العنصر موجود بالفعل'], [/Failed to fetch|NetworkError/i, 'تعذّر الاتصال بالخادم، تحقق من الإنترنت'], [/violates foreign key/i, 'لا يمكن تنفيذ العملية لوجود بيانات مرتبطة'], [/Password should be at least/i, 'كلمة المرور قصيرة (6 أحرف على الأقل)'], [/rate limit/i, 'محاولات كثيرة، حاول بعد قليل']]; for (const [r, a] of t) if (r.test(m)) return a; return m; };
const toast = m => { m = arErr(m); const d = document.createElement('div'); d.className = 'toast'; d.textContent = m; document.body.append(d); setTimeout(() => d.remove(), 2400); };
const roleAr = { student: 'طالب', teacher: 'مدرس', admin: 'أدمن', supervisor: 'مشرف' };
const stAr = { draft: 'مسودة', pending: 'بانتظار الموافقة', published: 'منشور' };
const fmtDate = d => new Date(d).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
const ytId = u => { const m = String(u || '').trim().match(/(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?(?:[^#\s]*&)?v=|embed\/|shorts\/|live\/|v\/)|[?&]v=)([\w-]{11})/); return m ? m[1] : null; };
const emb = u => { u = String(u || '').trim(); if (!u) return ''; const id = ytId(u); if (id) return 'https://www.youtube.com/embed/' + id + '?rel=0'; const v = u.match(/vimeo\.com\/(?:video\/)?(\d+)/); return v ? 'https://player.vimeo.com/video/' + v[1] : u; };
const vidHtml = u => { u = String(u || '').trim(); if (!u) return ''; if (/\.(mp4|webm|ogg)(\?|$)/i.test(u)) return `<video class="vid" src="${esc(u)}" controls></video>`; const id = ytId(u); return `<iframe class="vid" src="${esc(emb(u))}" title="video" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe><p class="muted"><a href="${id ? 'https://www.youtube.com/watch?v=' + id : esc(u)}" target="_blank" rel="noopener">▶ افتح الفيديو في نافذة جديدة</a></p>`; };
let S = {}; // site settings
async function loadSettings() {
  try { const { data } = await sb.from('site_settings').select('value').eq('key', 'site').single(); S = (data && data.value) || {}; } catch (e) { S = {}; }
  S.contact = S.contact || {}; S.social = S.social || {}; S.tracks = S.tracks || []; S.features = S.features || [];
  const r = document.documentElement.style;
  if (S.primary) { r.setProperty('--p', S.primary); r.setProperty('--p2', shade(S.primary, -35)); }
  if (S.accent) r.setProperty('--a', S.accent);
  if (S.name) document.title = S.name;
  try { const { data: l } = await sb.from('site_settings').select('value').eq('key', 'landing').maybeSingle(); LND = (l && l.value) || null; } catch (e) { LND = null; }
  applyDesign(LND && LND.design);
  return S;
}
let LND = null;
function applyDesign(d) {
  d = d || {}; const r = document.documentElement.style;
  if (d.primary) { r.setProperty('--p', d.primary); r.setProperty('--p2', shade(d.primary, -35)); }
  if (d.accent) r.setProperty('--a', d.accent);
  if (d.bg) r.setProperty('--bg', d.bg);
  if (d.font) document.body.style.fontFamily = d.font + ',Cairo,sans-serif';
}
function applySeo(o) {
  o = o || {}; if (o.title) document.title = o.title;
  const m = (attr, name, val) => { if (!val) return; let e = document.head.querySelector(`meta[${attr}="${name}"]`); if (!e) { e = document.createElement('meta'); e.setAttribute(attr, name); document.head.appendChild(e); } e.setAttribute('content', val); };
  m('name', 'description', o.description); m('name', 'keywords', o.keywords); m('property', 'og:title', o.title); m('property', 'og:description', o.description); m('property', 'og:image', o.image); m('name', 'twitter:card', o.image ? 'summary_large_image' : '');
}
function shade(hex, pct) {
  const n = parseInt((hex || '#1b5fd1').slice(1), 16); let r = n >> 16, g = (n >> 8) & 255, b = n & 255;
  const f = v => Math.max(0, Math.min(255, Math.round(v + (v * pct) / 100)));
  return '#' + ((1 << 24) + (f(r) << 16) + (f(g) << 8) + f(b)).toString(16).slice(1);
}
async function uploadImage(file, folder = 'misc') {
  if (!file) return null;
  if (file.size > 5 * 1024 * 1024) { toast('الصورة أكبر من 5 ميجا'); return null; }
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext || 'jpg'}`;
  const { error } = await sb.storage.from('media').upload(path, file, { cacheControl: '3600', contentType: file.type });
  if (error) { toast('فشل رفع الصورة: ' + error.message); return null; }
  return sb.storage.from('media').getPublicUrl(path).data.publicUrl;
}
async function uploadFile(file, folder = 'files', max = 50) {
  if (!file) return null;
  if (file.size > max * 1024 * 1024) { toast('الملف أكبر من ' + max + ' ميجا'); return null; }
  const ext = (file.name.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '');
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext || 'bin'}`;
  const { error } = await sb.storage.from('media').upload(path, file, { cacheControl: '3600', contentType: file.type || 'application/octet-stream' });
  if (error) { toast('فشل الرفع: ' + error.message); return null; }
  return sb.storage.from('media').getPublicUrl(path).data.publicUrl;
}
async function getMe() {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) return null;
  const { data } = await sb.from('profiles').select(PCOLS).eq('id', session.user.id).single();
  if (data) { data.email = session.user.email; const { data: ph } = await sb.rpc('get_my_phone'); data.phone = ph || ''; }
  return data;
}
