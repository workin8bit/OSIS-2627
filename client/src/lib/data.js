// Lapisan akses data: seluruh komunikasi ke Supabase (database, RPC, storage,
// auth, edge function) terkumpul di sini agar halaman tetap sederhana.
import { MEDIA_BUCKET, supabase } from './supabase';

const ERROR_ID = {
  'Invalid login credentials': 'Email atau password salah',
  'Email not confirmed': 'Email belum dikonfirmasi',
  'new row violates row-level security policy': 'Anda tidak memiliki izin untuk melakukan aksi ini',
};

function translate(msg = '') {
  for (const [en, id] of Object.entries(ERROR_ID)) if (msg.includes(en)) return id;
  return msg || 'Terjadi kesalahan';
}

/** Ambil `data` dari respons Supabase, lempar Error berbahasa Indonesia bila gagal. */
function unwrap({ data, error }) {
  if (error) throw new Error(translate(error.message));
  return data;
}

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// ---------------------------------------------------------------------
// Publik
// ---------------------------------------------------------------------
export async function getSettings() {
  const rows = unwrap(await supabase.from('settings').select('key, value'));
  const s = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  if (!Array.isArray(s.missions)) s.missions = [];
  return s;
}

export async function getHome() {
  const [stats, core, posts, events, programs] = await Promise.all([
    supabase.rpc('public_stats').then(unwrap),
    supabase.from('members').select('*').eq('is_core', true).order('sort_order').order('id').limit(3).then(unwrap),
    supabase.from('posts').select('id,title,slug,excerpt,cover,category,created_at').eq('published', true).order('created_at', { ascending: false }).limit(3).then(unwrap),
    supabase.from('events').select('*').gte('date', today()).order('date').order('time').limit(4).then(unwrap),
    supabase.from('programs').select('*, division:divisions(short)').eq('status', 'berjalan').order('progress', { ascending: false }).limit(4).then(unwrap),
  ]);
  return { stats, core, posts, events, programs: programs.map((p) => ({ ...p, division_short: p.division?.short })) };
}

export async function getDivisions() {
  return unwrap(await supabase.from('divisions').select('*').order('sort_order').order('id'));
}

export async function getStructure() {
  const [divisions, members] = await Promise.all([
    getDivisions(),
    supabase.from('members').select('*').order('sort_order').order('id').then(unwrap),
  ]);
  return {
    core: members.filter((m) => m.is_core),
    divisions: divisions.map((d) => ({ ...d, members: members.filter((m) => m.division_id === d.id && !m.is_core) })),
  };
}

export async function getPrograms() {
  const rows = unwrap(await supabase.from('programs').select('*, division:divisions(name, short, sort_order)').order('start_date'));
  return rows
    .map((p) => ({ ...p, division_name: p.division?.name, division_short: p.division?.short, _order: p.division?.sort_order ?? 999 }))
    .sort((a, b) => a._order - b._order);
}

export async function getPosts({ q = '', category = '', page = 1, limit = 9 } = {}) {
  const from = (Math.max(page, 1) - 1) * limit;
  let query = supabase
    .from('posts')
    .select('id,title,slug,excerpt,cover,category,author,created_at,views', { count: 'exact' })
    .eq('published', true)
    .order('created_at', { ascending: false })
    .range(from, from + limit - 1);
  if (category) query = query.eq('category', category);
  if (q) {
    const safe = q.replace(/[%,()]/g, ' ').trim();
    if (safe) query = query.or(`title.ilike.%${safe}%,excerpt.ilike.%${safe}%`);
  }
  const [{ data, count, error }, cats] = await Promise.all([query, supabase.from('posts').select('category').eq('published', true)]);
  if (error) throw new Error(translate(error.message));
  const categories = [...new Set(unwrap(cats).map((r) => r.category))];
  return { items: data, total: count, page, pages: Math.max(1, Math.ceil((count || 0) / limit)), categories };
}

export async function getPost(slug) {
  const post = unwrap(await supabase.from('posts').select('*').eq('slug', slug).eq('published', true).maybeSingle());
  if (!post) throw new Error('Berita tidak ditemukan');
  supabase.rpc('increment_post_views', { p_slug: slug }).then(() => {});
  const related = unwrap(
    await supabase.from('posts').select('id,title,slug,cover,created_at').eq('published', true).neq('id', post.id).order('created_at', { ascending: false }).limit(3)
  );
  return { ...post, related };
}

export async function getEvents() {
  return unwrap(await supabase.from('events').select('*').order('date').order('time'));
}

export async function getGallery() {
  return unwrap(await supabase.from('gallery').select('*').order('created_at', { ascending: false }));
}

export async function submitAspiration({ name, class_name, category, message, anonymous }) {
  return unwrap(
    await supabase.rpc('submit_aspiration', {
      p_message: message,
      p_category: category,
      p_name: name || null,
      p_class: class_name || null,
      p_anonymous: !!anonymous,
    })
  );
}

export async function trackAspiration(ticket) {
  const rows = unwrap(await supabase.rpc('track_aspiration', { p_ticket: ticket }));
  if (!rows?.length) throw new Error('Kode tiket tidak ditemukan');
  return rows[0];
}

export async function getPublicAspirations() {
  return unwrap(await supabase.rpc('public_aspirations', { p_limit: 6 }));
}

// ---------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------
export async function signIn(email, password) {
  return unwrap(await supabase.auth.signInWithPassword({ email, password }));
}

export async function signOut() {
  await supabase.auth.signOut();
}

/** Ambil profil admin untuk user yang sedang login (null bila bukan admin). */
export async function getAdminProfile(userId) {
  return unwrap(await supabase.from('admins').select('*').eq('user_id', userId).maybeSingle());
}

export async function changePassword(currentPassword, newPassword) {
  const { data } = await supabase.auth.getUser();
  const email = data?.user?.email;
  // Verifikasi password lama terlebih dahulu
  const { error } = await supabase.auth.signInWithPassword({ email, password: currentPassword });
  if (error) throw new Error('Password lama salah');
  unwrap(await supabase.auth.updateUser({ password: newPassword }));
}

// ---------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------
const ORDER = {
  posts: [['created_at', false]],
  members: [['is_core', false], ['division_id', true], ['sort_order', true], ['id', true]],
  divisions: [['sort_order', true], ['id', true]],
  programs: [['start_date', false]],
  events: [['date', false]],
  gallery: [['created_at', false]],
  aspirations: [['created_at', false]],
};

/** Operasi CRUD generik untuk satu tabel. */
export function table(name) {
  return {
    async list() {
      let q = supabase.from(name).select('*');
      for (const [col, asc] of ORDER[name] || [['id', false]]) q = q.order(col, { ascending: asc, nullsFirst: false });
      return unwrap(await q);
    },
    async create(values) {
      return unwrap(await supabase.from(name).insert(values).select().single());
    },
    async update(id, values) {
      return unwrap(await supabase.from(name).update(values).eq('id', id).select().single());
    },
    async remove(id) {
      unwrap(await supabase.from(name).delete().eq('id', id));
    },
  };
}

export async function getDashboard() {
  const count = (t, f) => {
    let q = supabase.from(t).select('*', { count: 'exact', head: true });
    if (f) q = f(q);
    return q.then(({ count, error }) => {
      if (error) throw new Error(translate(error.message));
      return count || 0;
    });
  };
  const [posts, members, programs, events, gallery, aspirations, aspirations_new, progRows, latest, upcoming] = await Promise.all([
    count('posts'),
    count('members'),
    count('programs'),
    count('events'),
    count('gallery'),
    count('aspirations'),
    count('aspirations', (q) => q.eq('status', 'baru')),
    supabase.from('programs').select('status').then(unwrap),
    supabase.from('aspirations').select('*').order('created_at', { ascending: false }).limit(5).then(unwrap),
    supabase.from('events').select('*').gte('date', today()).order('date').limit(5).then(unwrap),
  ]);
  const byStatus = {};
  progRows.forEach((p) => (byStatus[p.status] = (byStatus[p.status] || 0) + 1));
  return {
    counts: { posts, members, programs, events, gallery, aspirations, aspirations_new },
    program_status: Object.entries(byStatus).map(([status, c]) => ({ status, c })),
    latest_aspirations: latest,
    upcoming_events: upcoming,
  };
}

export async function saveSettings(obj) {
  const rows = Object.entries(obj)
    .filter(([k]) => /^[a-z_]+$/.test(k))
    .map(([key, value]) => ({ key, value: value ?? '' }));
  unwrap(await supabase.from('settings').upsert(rows, { onConflict: 'key' }));
}

export async function uploadFile(file) {
  if (!/^image\/(png|jpe?g|webp|gif)$/.test(file.type)) throw new Error('Hanya file gambar (png, jpg, webp, gif) yang diizinkan');
  if (file.size > 5 * 1024 * 1024) throw new Error('Ukuran maksimal 5 MB');
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
  const path = `${new Date().getFullYear()}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  unwrap(await supabase.storage.from(MEDIA_BUCKET).upload(path, file, { cacheControl: '604800', contentType: file.type }));
  return supabase.storage.from(MEDIA_BUCKET).getPublicUrl(path).data.publicUrl;
}

export async function listAdmins() {
  return unwrap(await supabase.from('admins').select('*').order('created_at'));
}

async function callAdminUsers(body) {
  const { data, error } = await supabase.functions.invoke('admin-users', { body });
  if (error) {
    let msg = error.message;
    try {
      msg = (await error.context.json()).error || msg;
    } catch {
      /* respons bukan JSON */
    }
    if (/Failed to send|not found|404/i.test(msg)) msg = 'Edge Function "admin-users" belum di-deploy. Lihat README.';
    throw new Error(msg);
  }
  return data;
}

export const createAdmin = (payload) => callAdminUsers({ action: 'create', ...payload });
export const deleteAdmin = (userId) => callAdminUsers({ action: 'delete', user_id: userId });
