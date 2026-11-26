const sb = supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY);
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const toast = m => { const d = document.createElement('div'); d.className = 'toast'; d.textContent = m; document.body.append(d); setTimeout(() => d.remove(), 2400); };
const roleAr = { student: 'طالب', teacher: 'مدرس', admin: 'أدمن' };
const stAr = { draft: 'مسودة', pending: 'بانتظار الموافقة', published: 'منشور' };
const fmtDate = d => new Date(d).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
const emb = u => { if (!u) return ''; const m = u.match(/(?:youtu\.be\/|v=|embed\/)([\w-]{11})/); return m ? 'https://www.youtube.com/embed/' + m[1] : u; };
let S = {}; // site settings
async function loadSettings() {
  try { const { data } = await sb.from('site_settings').select('value').eq('key', 'site').single(); S = (data && data.value) || {}; } catch (e) { S = {}; }
  S.contact = S.contact || {}; S.social = S.social || {}; S.tracks = S.tracks || []; S.features = S.features || [];
  const r = document.documentElement.style;
  if (S.primary) { r.setProperty('--p', S.primary); r.setProperty('--p2', shade(S.primary, -35)); }
  if (S.accent) r.setProperty('--a', S.accent);
  if (S.name) document.title = S.name;
  return S;
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
async function getMe() {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) return null;
  const { data } = await sb.from('profiles').select('*').eq('id', session.user.id).single();
  if (data) data.email = session.user.email;
  return data;
}
