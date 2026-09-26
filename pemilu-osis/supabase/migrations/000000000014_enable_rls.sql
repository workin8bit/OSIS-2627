-- ============================================================================
-- Migration: harden RLS untuk tables election
--
-- KOREKSI CATATAN (2026-09-26):
-- Versi awal file ini mengira RLS belum aktif dan mengira PostgREST
-- mengizinkan UPDATE/DELETE anon lewat direct-table. Keduanya SALAH:
--   - RLS sudah aktif lebih dulu (sudah true sebelum migrasi ini).
--   - Respons "204 No Content" pada PATCH /rest/v1/settings bukan bukti
--     akses diizinkan. Dengan RLS, baris yang tidak terlihat policy
--     diperlakukan sebagai 0 baris tersentuh, sehingga PostgREST
--     membalas 204, bukan error. Akses sebenarnya sudah DITOLAK.
--
-- TEMUAN YANG SEBENARNYA (satu-satunya kebocoran nyata):
--   policy "read_settings" on public.settings
--     -> PERMISSIVE, roles={public}, cmd=SELECT, qual='true'
--     -> membocorkan admin_username + admin_password_hash ke peran apa pun
--        yang memegang anon key (anon key tertanam di bundle klien).
--
-- Yang perlu diperbaiki: hapus policy itu, BUKAN menyalakan RLS.
-- Seluruh akses aplikasi (termasuk operasi admin) memakai RPC Postgres,
-- dan semuanya SECURITY DEFINER sehingga tetap berfungsi penuh.
--
-- STATUS: sudah dijalankan manual di production 2026-09-26 via
--         Supabase Management API, hasil diverifikasi (lihat bawah).
--         File ini sengaja dibuat idempoten agar aman dijalankan ulang.
-- ============================================================================

begin;

-- 1. Pastikan RLS aktif (idempoten; biasanya sudah true).
alter table public.candidates enable row level security;
alter table public.voters     enable row level security;
alter table public.votes      enable row level security;
alter table public.settings   enable row level security;

-- 2. Tutup kebocoran nyata: jangan pernah expose settings ke publik,
--    karena tabel ini memuat admin_password_hash.
--    read_candidates sengaja dipertahankan: data kandidat memang publik.
drop policy if exists read_settings  on public.settings;
drop policy if exists anon_read_settings on public.settings;
drop policy if exists anon_all_settings  on public.settings;

-- 3. Bersihkan sisa policy legacy yang tidak lagi dipakai.
--    Tabel voters/votes tidak punya policy sama sekali -> DENY-by-default.
drop policy if exists anon_read_voters     on public.voters;
drop policy if exists anon_all_votes      on public.votes;
drop policy if exists anon_all_voters     on public.voters;
drop policy if exists anon_read_candidates on public.candidates;
drop policy if exists anon_all_candidates on public.candidates;

-- CATATAN storage.objects:
-- RLS aktif tetapi bucket TIDAK ADA (SELECT * FROM storage.buckets -> 0 baris),
-- jadi foto kandidat memakai URL eksternal, bukan Supabase Storage.
-- Tidak ada policy storage yang perlu disentuh di sini. Menambah policy
-- untuk bucket 'candidates' akan menjadi policy yang tidak pernah cocok.

commit;

-- ============================================================================
-- VERIFIKASI (semua sudah dijalankan & lolos pada 2026-09-26):
--
-- 1. RLS aktif di keempat tabel -> semua relrowsecurity = true
--
-- 2. Hanya policy yang tersisa di schema public:
--      select tablename, policyname, cmd from pg_policies
--      where schemaname = 'public';
--      -- hasil: candidates | read_candidates | SELECT   (saja)
--
-- 3. settings tidak lagi bocor (0 baris, kolom tidak terekspos):
--      curl "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/settings?select=*" \
--        -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY" \
--        -H "Authorization: Bearer $NEXT_PUBLIC_SUPABASE_ANON_KEY"
--      -- sebelum: 200 + admin_password_hash
--      -- sesudah: 200 + 0 baris
--
-- 4. Aplikasi tetap normal (semua SECURITY DEFINER, bypass RLS):
--      get_status  -> 200
--      get_results -> 200
--      get_tally   -> 200
--      candidates  -> 200 (read_candidates masih berlaku)
-- ============================================================================
