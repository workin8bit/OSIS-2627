// Menggabungkan migrasi + seed menjadi satu file supabase/setup.sql
// yang bisa langsung ditempel di Supabase SQL Editor.
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';

const root = new URL('../supabase/', import.meta.url);
const migrations = readdirSync(new URL('migrations/', root)).filter((f) => f.endsWith('.sql')).sort();
const init = migrations.map((f) => readFileSync(new URL(`migrations/${f}`, root), 'utf8')).join('\n\n');
const seed = readFileSync(new URL('seed.sql', root), 'utf8');
const indent = (s) => s.split('\n').map((l) => (l.trim() ? '  ' + l : l)).join('\n');

const out = `-- =====================================================================
-- SETUP LENGKAP (skema + data contoh) — OSIS SMA Negeri 3 Rembang
-- Cara pakai: Supabase Dashboard -> SQL Editor -> New query ->
-- tempel SELURUH isi file ini -> Run.
-- Aman dijalankan ulang: skema bersifat idempoten dan data contoh
-- hanya dimasukkan bila tabel masih kosong.
-- JANGAN edit file ini langsung — dibuat otomatis oleh: npm run build:sql
-- =====================================================================

${init}

-- ============================ DATA CONTOH ============================
do $seed$
begin
  if exists (select 1 from public.divisions) then
    raise notice 'Data contoh dilewati: tabel sudah berisi data';
    return;
  end if;
${indent(seed)}
end
$seed$;

-- Muat ulang cache skema API agar tabel baru langsung terbaca
notify pgrst, 'reload schema';
`;
writeFileSync(new URL('setup.sql', root), out);
console.log('supabase/setup.sql dibuat dari', migrations.length, 'migrasi + seed.sql');
