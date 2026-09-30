-- =====================================================================
-- PATCH 2/3 — Policy RLS
-- Jalankan SETELAH patch-1-skema.sql sukses.
-- Mengatur siapa boleh mengubah data publik & siapa boleh mengelola akun.
-- =====================================================================

-- Tabel publik: ubah mengikuti hak akses modulnya
do $$
declare
  pairs text[] := array[
    'settings', 'pengaturan',
    'divisions', 'sekbid',
    'programs', 'program',
    'events', 'agenda',
    'gallery', 'galeri'
  ];
  i integer;
begin
  for i in 1 .. array_length(pairs, 1) / 2 loop
    execute format('drop policy if exists "Admin dapat mengelola" on public.%I', pairs[i * 2 - 1]);
    execute format(
      'create policy "Admin dapat mengelola" on public.%I for all to authenticated using (public.can_access(%L, ''write'')) with check (public.can_access(%L, ''write''))',
      pairs[i * 2 - 1], pairs[i * 2], pairs[i * 2]
    );
  end loop;
end $$;

-- Anggota: boleh ditulis bila punya akses 'pengurus' write, atau masuk sekbidnya sendiri
drop policy if exists "Admin dapat mengelola" on public.members;
create policy "Admin dapat mengelola" on public.members for all to authenticated
  using (public.can_access('pengurus', 'write') or public.manages_division(division_id))
  with check (public.can_access('pengurus', 'write') or public.manages_division(division_id));

-- Berita: publik hanya melihat yang terbit, admin boleh melihat draf
drop policy if exists "Publik membaca berita terbit" on public.posts;
create policy "Publik membaca berita terbit" on public.posts for select using (published or public.can_access('berita', 'read'));
drop policy if exists "Admin dapat mengelola" on public.posts;
create policy "Admin dapat mengelola" on public.posts for all to authenticated using (public.can_access('berita', 'write')) with check (public.can_access('berita', 'write'));

-- Aspirasi
drop policy if exists "Admin dapat mengelola" on public.aspirations;
create policy "Admin dapat mengelola" on public.aspirations for all to authenticated using (public.can_access('aspirasi', 'write')) with check (public.can_access('aspirasi', 'write'));

-- Akun admin: hanya superadmin atau admin berizin modul 'akun'; baris sendiri tak boleh disentuh
drop policy if exists "Superadmin mengelola admin" on public.admins;
drop policy if exists "Admin berizin mengelola admin" on public.admins;
create policy "Admin berizin mengelola admin" on public.admins for all to authenticated
  using (public.can_manage_access() and user_id <> auth.uid())
  with check (public.can_manage_access() and (public.is_superadmin() or role = 'admin'));

-- Tabel hak akses
drop policy if exists "Admin melihat hak akses" on public.admin_permissions;
create policy "Admin melihat hak akses" on public.admin_permissions for select to authenticated using (public.is_admin());
drop policy if exists "Admin berizin mengelola hak akses" on public.admin_permissions;
create policy "Admin berizin mengelola hak akses" on public.admin_permissions for all to authenticated
  using (public.can_manage_access() and user_id <> auth.uid())
  with check (public.can_manage_access() and user_id <> auth.uid());

drop policy if exists "Admin melihat template sekbid" on public.division_permissions;
create policy "Admin melihat template sekbid" on public.division_permissions for select to authenticated using (public.is_admin());
drop policy if exists "Admin berizin mengelola template sekbid" on public.division_permissions;
create policy "Admin berizin mengelola template sekbid" on public.division_permissions for all to authenticated
  using (public.can_manage_access() or public.can_access('sekbid', 'write'))
  with check (public.can_manage_access() or public.can_access('sekbid', 'write'));

-- Media: mengikuti modul galeri
drop policy if exists "Admin dapat mengunggah media" on storage.objects;
create policy "Admin dapat mengunggah media" on storage.objects
  for insert to authenticated with check (bucket_id = 'media' and public.can_access('galeri', 'write'));
drop policy if exists "Admin dapat mengubah media" on storage.objects;
create policy "Admin dapat mengubah media" on storage.objects
  for update to authenticated using (bucket_id = 'media' and public.can_access('galeri', 'write'));
drop policy if exists "Admin dapat menghapus media" on storage.objects;
create policy "Admin dapat menghapus media" on storage.objects
  for delete to authenticated using (bucket_id = 'media' and public.can_access('galeri', 'write'));
