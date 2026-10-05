// Lapisan hak akses admin yang tahan banting.
//
// Dua backend, dipilih otomatis lewat deteksi skema:
//
//   'native'   : tabel admins.member_id, admin_permissions, division_permissions
//                dan RPC apply_division_template sudah ada (migrasiTerpasang).
//   'settings' : skema itu belum ada. Tautan anggota & matriks izin disimpan
//                sebagai JSON pada tabel `settings` yang memang sudah ada,
//                sehingga seluruh fitur tetap bisa dipakai tanpa menjalankan
//                satu pun query DDL.
//
// Beralih ke 'native' otomatis begitu migrasi terpasang, tanpa perubahan kode.
import { supabase } from './supabase';

export const ACCESS_KEYS = {
  links: 'admin_member_links',
  permissions: 'admin_permissions_store',
  templates: 'division_permissions_store',
};

/** Modul yang bisa diatur haknya; cerminan ADMIN_MODULES di data.js. */
const MODULES = ['beranda', 'aspirasi', 'berita', 'agenda', 'program', 'pengurus', 'sekbid', 'galeri', 'pengaturan', 'akun'];

/** Izin bawaan untuk admin yang belum pernah diatur: akses penuh seperti semula. */
export const DEFAULT_PERMISSIONS = Object.fromEntries(MODULES.map((m) => [m, 'write']));

/** Template bawaan seksi bidang: boleh melihat modul utama. */
export const DEFAULT_TEMPLATES = { beranda: 'read', berita: 'read', agenda: 'read', program: 'read', pengaturan: 'read' };

/**
 * Buang pasangan yang tidak punya bentuk { modul, 'read' | 'write' }.
 * Database menegakkan keduanya lewat check constraint; memfilter di sini
 * membuat select yang salah bentuk gagal di sisi klien, bukan dengan pesan
 * "violates check constraint" yang sulit dipahami.
 */
const sanitizeAccess = (map) =>
  Object.fromEntries(
    Object.entries(map || {}).filter(([module, access]) => MODULES.includes(module) && (access === 'read' || access === 'write')),
  );

let cached = null;

/**
 * Deteksi backend yang tersedia. `null` selama belum selesai dicek, sehingga
 * pemanggil tidak perlu menunggu: cukup memakai backend 'settings'.
 */
export async function accessBackend(force = false) {
  if (cached && !force) return cached;
  const [memberLink, permissions] = await Promise.all([
    supabase.from('admins').select('member_id').limit(1),
    supabase.from('admin_permissions').select('user_id').limit(1),
  ]);
  cached = { native: !memberLink.error && !permissions.error };
  return cached;
}

/** Cek ulang skema (tombol "Periksa lagi" di halaman Akses). */
export const resetAccessBackend = () => {
  cached = null;
};

// ---------------------------------------------------------------------
// Penyimpanan sementara pada tabel `settings`
// ---------------------------------------------------------------------
async function readStore(key) {
  const { data, error } = await supabase.from('settings').select('value').eq('key', key).maybeSingle();
  if (error) throw error;
  return data?.value && typeof data.value === 'object' ? data.value : {};
}

/** Baca–ubah–tulis. Konkurensi rendah (dipakai panel admin), jadi cukup. */
async function mutateStore(key, mutator) {
  const current = await readStore(key);
  const next = mutator({ ...current });
  const { error } = await supabase.from('settings').upsert({ key, value: next }, { onConflict: 'key' });
  if (error) throw error;
  return next;
}

// ---------------------------------------------------------------------
// Tautan akun admin -> anggota pengurus
// ---------------------------------------------------------------------
/** { [userId]: memberId } */
export async function fetchMemberLinks() {
  const { native } = await accessBackend();
  if (native) {
    const { data, error } = await supabase.from('admins').select('user_id, member_id');
    if (!error) return Object.fromEntries(data.filter((r) => r.member_id).map((r) => [r.user_id, r.member_id]));
  }
  return readStore(ACCESS_KEYS.links);
}

export async function saveMemberLink(userId, memberId) {
  const { native } = await accessBackend();
  if (native) {
    const { error } = await supabase.from('admins').update({ member_id: memberId }).eq('user_id', userId);
    if (error) throw error;
  }
  await mutateStore(ACCESS_KEYS.links, (store) => {
    if (memberId == null) delete store[userId];
    else store[userId] = Number(memberId);
    return store;
  });
}

// ---------------------------------------------------------------------
// Matriks hak akses per admin
// ---------------------------------------------------------------------
/**
 * { [userId]: { module: access } }
 * `null` bila belum ada skema native dan belum ada penyimpanan apa pun, artinya
 * akses dibiarkan penuh supaya tidak ada admin yang terkunci.
 */
export async function fetchPermissionMap() {
  const { native } = await accessBackend();
  if (native) {
    const { data, error } = await supabase.from('admin_permissions').select('user_id, module, access');
    if (!error) {
      const out = {};
      data.forEach((r) => {
        out[r.user_id] = { ...(out[r.user_id] || {}), [r.module]: r.access };
      });
      return out;
    }
  }
  const store = await readStore(ACCESS_KEYS.permissions);
  return Object.keys(store).length ? store : null;
}

export async function fetchPermissions(userId) {
  const map = await fetchPermissionMap();
  // null hanya berarti tabel hak akses belum tersedia, sehingga admin memakai
  // akses penuh. Admin yang tabelnya sudah ada tapi belum punya baris izin
  // harus dapat objek kosong — kalau ikut null, antarmuka menganggapnya punya
  // akses penuh padahal server (can_access & Edge Function) menolaknya.
  if (map === null) return null;
  return map[userId] || {};
}

export async function savePermissions(userId, map) {
  const clean = sanitizeAccess(map);
  const { native } = await accessBackend();
  if (native) {
    const { error: delErr } = await supabase.from('admin_permissions').delete().eq('user_id', userId);
    if (delErr) throw delErr;
    const rows = Object.entries(clean);
    if (rows.length) {
      const { error } = await supabase
        .from('admin_permissions')
        .insert(rows.map(([module, access]) => ({ user_id: userId, module, access })));
      if (error) throw error;
    }
    return;
  }
  await mutateStore(ACCESS_KEYS.permissions, (store) => {
    store[userId] = { ...clean };
    return store;
  });
}

// ---------------------------------------------------------------------
// Template hak akses per seksi bidang
// ---------------------------------------------------------------------
/** { [divisionId]: { module: access } } */
export async function fetchDivisionTemplates() {
  const { native } = await accessBackend();
  if (native) {
    const { data, error } = await supabase.from('division_permissions').select('division_id, module, access');
    if (!error) {
      const out = {};
      data.forEach((r) => {
        out[r.division_id] = { ...(out[r.division_id] || {}), [r.module]: r.access };
      });
      return out;
    }
  }
  return readStore(ACCESS_KEYS.templates);
}

export async function saveDivisionTemplate(divisionId, map) {
  const clean = sanitizeAccess(map);
  const { native } = await accessBackend();
  if (native) {
    const { error: delErr } = await supabase.from('division_permissions').delete().eq('division_id', divisionId);
    if (delErr) throw delErr;
    const rows = Object.entries(clean);
    if (rows.length) {
      const { error } = await supabase
        .from('division_permissions')
        .insert(rows.map(([module, access]) => ({ division_id: Number(divisionId), module, access })));
      if (error) throw error;
    }
    return;
  }
  await mutateStore(ACCESS_KEYS.templates, (store) => {
    store[divisionId] = { ...clean };
    return store;
  });
}

// ---------------------------------------------------------------------
// Penerapan template ke satu akun
// ---------------------------------------------------------------------
/**
 * Salin template hak akses seksi bidang anggota ke akunnya.
 * Mengembalikan jumlah modul yang terpasang, atau 0 bila belum ada template.
 * `resolveMember` menerima (userId) -> Promise<member|null> supaya modul ini
 * tidak bergantung pada data.js (menghindari siklus impor).
 */
export async function applyTemplate(userId, resolveMember) {
  const { native } = await accessBackend();
  if (native) {
    const { data, error } = await supabase.rpc('apply_division_template', { p_user_id: userId });
    if (!error) return data ?? 0;
  }
  const member = await resolveMember(userId);
  if (!member?.division_id) return 0;
  const templates = await fetchDivisionTemplates();
  const template = templates[member.division_id] || DEFAULT_TEMPLATES;
  await savePermissions(userId, { ...template });
  return Object.keys(template).length;
}

/** True bila backend native (tabel hak akses) yang dipakai. */
export async function isNativeBackend() {
  return (await accessBackend()).native;
}

/**
 * Pindahkan isi penyimpanan cadangan ke tabel resmi. Dipanggil setelah migrasi
 * di-install supaya tautan anggota & matriks izin tidak hilang. Idempoten:
 * data yang sudah ada di tabel resmi tidak ditimpa.
 * @returns {Promise<{links: number, permissions: number, templates: number}>}
 */
export async function migrateFallbackToNative() {
  const { native } = await accessBackend(true);
  if (!native) throw new Error('Tabel hak akses belum ada di database. Jalankan patch-1-skema.sql lebih dulu.');

  const [links, permissions, templates] = await Promise.all([
    readStore(ACCESS_KEYS.links),
    readStore(ACCESS_KEYS.permissions),
    readStore(ACCESS_KEYS.templates),
  ]);

  let linkCount = 0;
  for (const [userId, memberId] of Object.entries(links)) {
    if (memberId == null) continue;
    const { data } = await supabase.from('admins').select('member_id').eq('user_id', userId).maybeSingle();
    if (!data || data.member_id) continue; // sudah tertaut
    const { error } = await supabase.from('admins').update({ member_id: Number(memberId) }).eq('user_id', userId);
    if (error) throw error;
    linkCount++;
  }

  let permissionCount = 0;
  for (const [userId, map] of Object.entries(permissions)) {
    const { data: existing } = await supabase.from('admin_permissions').select('module').eq('user_id', userId);
    if (existing?.length) continue; // sudah punya izin resmi
    const rows = Object.entries(map)
      .filter(([, access]) => access)
      .map(([module, access]) => ({ user_id: userId, module, access }));
    if (!rows.length) continue;
    const { error } = await supabase.from('admin_permissions').insert(rows);
    if (error) throw error;
    permissionCount += rows.length;
  }

  let templateCount = 0;
  for (const [divisionId, map] of Object.entries(templates)) {
    const { data: existing } = await supabase
      .from('division_permissions')
      .select('module')
      .eq('division_id', Number(divisionId));
    if (existing?.length) continue;
    const rows = Object.entries(map)
      .filter(([, access]) => access)
      .map(([module, access]) => ({ division_id: Number(divisionId), module, access }));
    if (!rows.length) continue;
    const { error } = await supabase.from('division_permissions').insert(rows);
    if (error) throw error;
    templateCount += rows.length;
  }

  return { links: linkCount, permissions: permissionCount, templates: templateCount };
}
