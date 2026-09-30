// Membuat akun superadmin pertama di Supabase.
// Butuh SERVICE ROLE key (Dashboard -> Project Settings -> API Keys).
// Jalankan di komputer Anda sendiri agar kunci tidak ikut tersimpan di repo:
//
//   $env:SUPABASE_URL = "https://<ref>.supabase.co"
//   $env:SUPABASE_SERVICE_ROLE_KEY = "sb_secret_..."   # PowerShell
//   npm run admin:create -- --email superadmin@osissmaga.id --password osis2627 --name "Administrator OSIS"
//
// Tanpa argumen, nilai env ADMIN_EMAIL / ADMIN_PASSWORD / ADMIN_NAME digunakan.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function envFromFile(file) {
  try {
    return Object.fromEntries(
      readFileSync(file, 'utf8')
        .split(/\r?\n/)
        .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
        .map((l) => {
          const i = l.indexOf('=');
          return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, '')];
        })
    );
  } catch {
    return {};
  }
}

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : fallback;
}

const fileEnv = envFromFile(path.join(root, 'client', '.env'));
const url = process.env.SUPABASE_URL || fileEnv.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = (arg('email', process.env.ADMIN_EMAIL) || '').trim().toLowerCase();
const password = arg('password', process.env.ADMIN_PASSWORD) || '';
const name = arg('name', process.env.ADMIN_NAME) || 'Administrator OSIS';
const memberId = arg('member', process.env.ADMIN_MEMBER_ID) || null;

if (!url || !key) {
  console.error('SUPABASE_URL dan SUPABASE_SERVICE_ROLE_KEY wajib diisi (lihat komentar atop file ini).');
  process.exit(1);
}
if (!email || !password) {
  console.error('Email dan password wajib diisi, contoh: --email superadmin@osissmaga.id --password "osis2627"');
  process.exit(1);
}
if (password.length < 6) {
  console.error('Password minimal 6 karakter.');
  process.exit(1);
}

const headers = { apikey: key, Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' };

// 1. Buat user Auth (email langsung terverifikasi)
const created = await fetch(`${url}/auth/v1/admin/users`, {
  method: 'POST',
  headers,
  body: JSON.stringify({ email, password, email_confirm: true, user_metadata: { name } }),
});

let authUser;
if (created.ok) {
  authUser = await created.json();
  console.log(`✓ User Auth dibuat: ${authUser.id}`);
} else {
  const body = await created.json().catch(() => ({}));
  // 422 = email sudah terdaftar -> cari user yang sudah ada
  const found = await fetch(`${url}/auth/v1/admin/users?page=1&per_page=1000`, { headers });
  if (found.ok) {
    const list = await found.json();
    authUser = (list.users || []).find((u) => u.email === email);
  }
  if (!authUser) {
    console.error(`Gagal membuat user: ${body.msg || body.message || created.status}`);
    process.exit(1);
  }
  console.log(`• Email sudah terdaftar, memakai user yang ada: ${authUser.id}`);
}

// 2. Sinkronkan password (dipakai juga bila user sudah ada sebelumnya)
const updated = await fetch(`${url}/auth/v1/admin/users/${authUser.id}`, {
  method: 'PUT',
  headers,
  body: JSON.stringify({ password, email_confirm: true, user_metadata: { name } }),
});

if (!updated.ok) {
  console.error('Gagal mengubah password:', await updated.text());
  process.exit(1);
}

// 3. Jadikan superadmin di tabel publik
const upsert = await fetch(`${url}/rest/v1/admins?on_conflict=user_id`, {
  method: 'POST',
  headers: { ...headers, Prefer: 'resolution=merge-duplicates,return=representation' },
  body: JSON.stringify({
    user_id: authUser.id,
    name,
    email,
    role: 'superadmin',
    member_id: memberId ? Number(memberId) : null,
  }),
});

if (!upsert.ok) {
  console.error('Gagal menulis tabel admins:', await upsert.text());
  process.exit(1);
}

console.log(`\nSuperadmin siap.\n  Email    : ${email}\n  Password : (sesuai yang Anda masukkan)\n  Login    : ${url.replace('https://', '')}/admin/login`);
console.log('\nCatatan: jalankan migrasi supabase/migrations/*.sql (termasuk 20260930000000_admin_access.sql) di SQL Editor sebelum memakai fitur hak akses.');
