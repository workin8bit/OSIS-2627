-- =====================================================================
-- PATCH 3/3 — Data awal & pembersihan
-- Jalankan SETELAH patch-1-skema.sql dan patch-2-rls.sql sukses.
-- =====================================================================

-- 1. Admin lama tetap akses penuh supaya tidak ada perubahan perilaku mendadak.
--    Superadmin tidak butuh baris izin (dilewati otomatis oleh can_access).
insert into public.admin_permissions (user_id, module, access)
select a.user_id, m, 'write'
from public.admins a
cross join unnest(array[
  'beranda', 'aspirasi', 'berita', 'agenda', 'program',
  'pengurus', 'sekbid', 'galeri', 'pengaturan', 'akun'
]) as m
where a.role = 'admin'
on conflict (user_id, module) do nothing;

-- 2. Template awal tiap seksi bidang: boleh melihat modul utama.
--    Ubah Afterwards dari halaman "Template Hak Akses per Seksi Bidang".
insert into public.division_permissions (division_id, module, access)
select d.id, m, 'read'
from public.divisions d
cross join unnest(array['beranda', 'berita', 'agenda', 'program', 'pengaturan']) as m
on conflict (division_id, module) do nothing;

-- 3. Buang sufiks A / B: "Anggota Sekbid 3 B" -> "Anggota Sekbid 3"
update public.members
   set name = regexp_replace(name, '\s+[AB]$', '')
 where name ~ '^Anggota Sekbid\s+\d+\s+[AB]$';

-- 4. Satu baris per anggota (id terkecil dipertahankan)
delete from public.members m
  using public.members d
 where d.id < m.id
   and d.name = m.name
   and coalesce(d.position, '') = coalesce(m.position, '')
   and coalesce(m.division_id, -1) = coalesce(d.division_id, -1);

-- 5. Muat ulang cache skema PostgREST supaya kolom & tabel baru langsung terbaca.
--    Baik cara ini maupun "Settings -> API -> Reload schema" menyelesaikan
--    error "Could not find the 'member_id' column of 'admins' in the schema cache".
notify pgrst, 'reload schema';

-- 6. Verifikasi: semua nilai di bawah harus bernilai 1 / 10
select
  (select count(*) from information_schema.columns
     where table_schema = 'public' and table_name = 'admins' and column_name = 'member_id') as kolom_member_id,
  (select count(*) from information_schema.tables
     where table_schema = 'public' and table_name in ('admin_permissions', 'division_permissions')) as tabel_izin,
  (select count(*) from public.members) as jumlah_anggota,
  (select count(*) from public.division_permissions) as template_sekbid;
