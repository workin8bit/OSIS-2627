// Edge Function: manajemen akun admin.
// Membuat / menghapus user Supabase Auth membutuhkan service role key,
// sehingga harus dijalankan di sisi server (bukan di browser).
//
// Deploy:  supabase functions deploy admin-users
//
// Body JSON:
//   { "action": "create", "email": "...", "password": "...", "name": "...",
//     "role": "admin" | "superadmin", "member_id": 12 }
//   { "action": "delete", "user_id": "uuid" }
//
// Pemanggil harus superadmin atau admin yang punya akses 'write' pada modul
// 'akun' (lihat tabel admin_permissions).
import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method tidak diizinkan' }, 405);

  const url = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const admin = createClient(url, serviceKey, { auth: { persistSession: false } });

  // Verifikasi pemanggil
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
  const { data: userData, error: userErr } = await admin.auth.getUser(token);
  if (userErr || !userData?.user) return json({ error: 'Silakan login terlebih dahulu' }, 401);

  const callerId = userData.user.id;
  const { data: me } = await admin.from('admins').select('role').eq('user_id', callerId).maybeSingle();
  // Tabel admin_permissions belum ada bila migrasi hak akses belum dijalankan
  const { data: grant } = await admin
    .from('admin_permissions')
    .select('access')
    .eq('user_id', callerId)
    .eq('module', 'akun')
    .maybeSingle();
  const mayManage = me?.role === 'superadmin' || grant?.access === 'write';
  if (!mayManage) return json({ error: 'Anda tidak berwenang menambah atau menghapus akun admin' }, 403);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: 'Body harus berupa JSON' }, 400);
  }

  if (body.action === 'create') {
    const email = String(body.email ?? '').trim().toLowerCase();
    const password = String(body.password ?? '');
    const name = String(body.name ?? '').trim();
    const role = me?.role === 'superadmin' && body.role === 'superadmin' ? 'superadmin' : 'admin';
    const memberId = body.member_id == null || body.member_id === '' ? null : Number(body.member_id);
    if (!email || !name) return json({ error: 'Lengkapi email dan nama' }, 400);
    if (password.length < 6) return json({ error: 'Password minimal 6 karakter' }, 400);

    const { data: created, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name },
    });
    if (error || !created.user) return json({ error: error?.message ?? 'Gagal membuat user' }, 400);

    const row = { user_id: created.user.id, name, email, role };
    const memberValue = Number.isNaN(memberId as number) ? null : memberId;
    // Kolom member_id belum ada bila migrasi hak akses belum dijalankan:
    // buat akunnya dulu, lalu coba tautkan. Jangan gagalkan pembuatan akun.
    const withMember = memberValue == null ? null : { ...row, member_id: memberValue };
    let linked = false;
    let insErr = null;
    if (withMember) {
      const res = await admin.from('admins').insert(withMember);
      insErr = res.error;
      linked = !res.error;
    }
    if (!linked) {
      const res = await admin.from('admins').insert(row);
      insErr = res.error;
    }
    if (insErr) {
      await admin.auth.admin.deleteUser(created.user.id);
      return json({ error: insErr.message }, 400);
    }
    return json(
      {
        user_id: created.user.id,
        email,
        name,
        role,
        member_id: linked ? memberValue : null,
        linked,
        ...(linked ? {} : { warning: 'Kolom admins.member_id belum ada. Jalankan supabase/patch-1-skema.sql lalu tautkan manual.' }),
      },
      201
    );
  }

  if (body.action === 'delete') {
    const userId = String(body.user_id ?? '');
    if (!userId) return json({ error: 'user_id wajib diisi' }, 400);
    if (userId === callerId) return json({ error: 'Tidak bisa menghapus akun sendiri' }, 400);

    // Hanya superadmin boleh menghapus akun superadmin
    if (me?.role !== 'superadmin') {
      const { data: target } = await admin.from('admins').select('role').eq('user_id', userId).maybeSingle();
      if (target?.role === 'superadmin') return json({ error: 'Hanya superadmin yang dapat menghapus akun superadmin' }, 403);
    }

    const { error } = await admin.auth.admin.deleteUser(userId); // baris admins ikut terhapus (on delete cascade)
    if (error) return json({ error: error.message }, 400);
    return json({ ok: true });
  }

  return json({ error: 'Aksi tidak dikenal' }, 400);
});
