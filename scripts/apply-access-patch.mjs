// Menjalankan patch skema hak akses langsung ke Supabase.
//
//   $env:PG_PASSWORD = "password-database-anda"   # Project Settings -> Database
//   npm run db:patch
//
// Env yang didukung: PG_PASSWORD (wajib), PG_HOST, PG_PORT, PG_USER, PG_DB.
// Defaultnya memakai pooler region Asia Tenggara proyek OSIS-2627.
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from 'pg';

const REF = process.env.PG_REF || 'fawwphybcnxwvwimoqwp';
const PATCHES = ['patch-1-skema.sql', 'patch-2-rls.sql', 'patch-3-data.sql'];
const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'supabase');

const password = process.env.PG_PASSWORD;
if (!password) {
  console.error('PG_PASSWORD belum diisi.');
  console.error('  $env:PG_PASSWORD = "..."   # Supabase Dashboard -> Project Settings -> Database');
  process.exit(1);
}

const client = new Client({
  host: process.env.PG_HOST || 'aws-0-ap-southeast-1.pooler.supabase.com',
  port: Number(process.env.PG_PORT || 5432),
  user: process.env.PG_USER || `postgres.${REF}`,
  password,
  database: process.env.PG_DB || 'postgres',
  ssl: { rejectUnauthorized: false },
});

await client.connect();
console.log(`Terhubung ke ${client.host}/${client.database}.`);

for (const file of PATCHES) {
  try {
    await client.query(readFileSync(path.join(dir, file), 'utf8'));
    console.log(`  OK    ${file}`);
  } catch (err) {
    console.error(`  GAGAL ${file}\n    ${err.message}`);
    await client.end();
    process.exit(1);
  }
}

const show = async (label) => {
  const { rows } = await client.query(`
    select
      (select count(*) from information_schema.columns
        where table_schema = 'public' and table_name = 'admins' and column_name = 'member_id')::int as kolom_member_id,
      (select count(*) from information_schema.tables
        where table_schema = 'public' and table_name in ('admin_permissions','division_permissions'))::int as tabel_izin,
      (select count(*) from public.members)::int as jumlah_anggota,
      (select count(*) from public.admin_permissions)::int as izin_admin,
      (select count(*) from public.division_permissions)::int as template_sekbid
  `);
  console.log(`${label}:`, rows[0]);
};

console.log('\nVerifikasi:');
await show('  ');
for (const file of PATCHES) await client.query(readFileSync(path.join(dir, file), 'utf8'));
console.log('  Patch dijalankan dua kali tanpa error (idempoten).');

await client.end();
console.log('\nSelesai. Muat ulang cache skema: Dashboard -> Project Settings -> API -> Reload schema.');
console.log('Kalau hanya refresh halaman, tekan Ctrl+Shift+R setelah masuk ke /admin/akses.');
