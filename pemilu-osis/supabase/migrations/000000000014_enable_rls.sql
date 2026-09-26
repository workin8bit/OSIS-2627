-- ============================================================================
-- Migration: aktifkan Row Level Security
--
-- TEMUAN (2026-09-26): RLS belum aktif di tabel mana pun. Dengan anon key
-- yang tertanam di bundle klien, PostgREST mengizinkan:
--   - SELECT  settings  -> hashes admin_password_hash TERBACA PUBLIK
--   - UPDATE  settings  -> admin_password_hash bisa ditimpa
--   - UPDATE  votes     -> suara bisa diubah/dihapus tanpa jejak
--   - SELECT  voters    -> NISN + password_hash
--
-- Semua akses aplikasi (termasuk operasi admin) memakai RPC Postgres, dan
-- ke-31 fungsi tersebut SECURITY DEFINER, sehingga tetap berfungsi penuh
-- setelah policy ini dipasang.
--
-- CARA MENJALANKAN:
--   Supabase Dashboard -> SQL Editor -> tempel file ini -> Run
-- atau
--   psql "$DATABASE_URL" -f supabase/migrations/000000000014_enable_rls.sql
--
-- Setelah dijalankan, aplikasi TIDAK perlu diubah apa pun.
-- ============================================================================

begin;

-- 1. Nyalakan RLS untuk setiap tabel yangicists application's
alter table public.candidates enable row level security;
alter table public.voters     enable row level security;
alter table public.votes      enable row level security;
alter table public.settings   enable row level security;

-- 2. Pastikan tidak ada policy lama yang membuka akses.
--    DENY-by-default: RLS aktif tanpa policy = semua akses ditolak untuk anon.
drop policy if exists anon_read_candidates on public.candidates;
drop policy if exists anon_read_settings  on public.settings;
drop policy if exists anon_read_voters     on public.voters;
drop policy if exists anon_all_votes      on public.votes;
drop policy if exists anon_all_settings   on public.settings;
drop policy if exists anon_all_voters     on public.voters;
drop policy if exists anon_all_candidates on public.candidates;

-- 3. Bucket penyimpanan: hanya admin yang boleh menulis.
--    (政策 read untuk publik dipertahankan agar foto kandidat tetap tampil.)
do $$
begin
  if exists (select 1 from pg_tables where schemaname = 'storage' and tablename = 'objects') then
    execute $p$drop policy if exists "Public can read candidate photos" on storage.objects$p$;
    execute $p$create policy "Public can read candidate photos"
      on storage.objects for select
      using (bucket_id = 'candidates')$p$;
  end if;
end $$;

commit;

-- ============================================================================
-- VERIFIKASI (jalankan setelah Run, semua harus TRUE):
--
--   select relname, relrowsecurity
--   from pg_class
--   where relname in ('candidates','voters','votes','settings');
--   -- semua relrowsecurity = true
--
--   select count(*) as policies_seharusnya_nol
--   from pg_policies
--   where schemaname = 'public';
--   -- harus 0
--
-- Uji dari browser: buka devtools -> Network, reload.
-- Query ke /rest/v1/settings harus 401/403, sedangkan halaman tetap normal
-- karena semua data diambil lewat RPC.
-- ============================================================================
