// Menjalankan patch skema hak akses lewat Supabase Management API.
// Butuh Personal Access Token (supabase.com/dashboard/account/tokens), bukan
// database password. Berisi token hanya di environment; tidak ditulis ke repo.
//
//   $env:SUPABASE_ACCESS_TOKEN = "sbp_..."
//   node scripts/apply-access-patch-api.mjs
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REF = process.env.PG_REF || 'fawwphybcnxwvwimoqwp';
const TOKEN = process.env.SUPABASE_ACCESS_TOKEN;
const DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'supabase');
const PATCHES = ['patch-1-skema.sql', 'patch-2-rls.sql', 'patch-3-data.sql'];

if (!TOKEN) {
  console.error('SUPABASE_ACCESS_TOKEN belum diisi.');
  console.error('  $env:SUPABASE_ACCESS_TOKEN = "sbp_..."   # supabase.com/dashboard/account/tokens');
  process.exit(1);
}

const endpoint = `https://api.supabase.com/v1/projects/${REF}/database/query`;

async function sql(query) {
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${res.status} ${text}`);
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

const VERIFY = `
  select
    (select count(*) from information_schema.columns
      where table_schema = 'public' and table_name = 'admins' and column_name = 'member_id')::int as kolom_member_id,
    (select count(*) from information_schema.tables
      where table_schema = 'public' and table_name in ('admin_permissions','division_permissions'))::int as tabel_izin,
    (select count(*) from public.members)::int as jumlah_anggota,
    (select count(*) from public.admin_permissions)::int as izin_admin,
    (select count(*) from public.division_permissions)::int as template_sekbid,
    (select count(*) from public.admins)::int as jumlah_admin`;

for (const file of PATCHES) {
  const body = readFileSync(path.join(DIR, file), 'utf8');
  try {
    await sql(body);
    console.log(`OK    ${file}`);
  } catch (err) {
    console.error(`GAGAL ${file}\n     ${err.message}`);
    process.exit(1);
  }
}

console.log('\nVerifikasi:', await sql(VERIFY));

for (const file of PATCHES) {
  await sql(readFileSync(path.join(DIR, file), 'utf8'));
}
console.log('Patch dijalankan dua kali tanpa error (idempoten).');

await sql("notify pgrst, 'reload schema'");
console.log('Cache skema PostgREST dimuat ulang.');

console.log('\nRingkasan anggota:');
console.log(
  await sql(`select m.division_id, count(*)::int as anggota
    from public.members m where not m.is_core group by 1 order by 1`)
);

console.log('\nAkun admin:');
console.log(
  await sql(`select a.email, a.role, m.name as anggota, d.short as sekbid,
      (select count(*) from public.admin_permissions p where p.user_id = a.user_id)::int as izin
    from public.admins a
    left join public.members m on m.id = a.member_id
    left join public.divisions d on d.id = m.division_id
    order by a.role`)
);
