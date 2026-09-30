-- =====================================================================
-- Hak akses berbasis modul + seksi bidang (migrasi)
-- 1. Akun admin (pengurus) bisa ditautkan ke baris `members` + seksi bidangnya.
-- 2. Setiap modul punya akses 'read' atau 'write' per admin.
-- 3. Tiap seksi bidang punya template akses yang bisa disalin ke anggotanya.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Tautan admin -> pengurus
-- ---------------------------------------------------------------------
alter table public.admins add column if not exists member_id bigint references public.members (id) on delete set null;

-- ---------------------------------------------------------------------
-- 2. Daftar modul yang bisa diatur haknya
-- ---------------------------------------------------------------------
create or replace function public.is_admin_module(m text)
returns boolean
language sql immutable
as $$
  select m in (
    'beranda',    -- Tampilan Siswa
    'aspirasi',
    'berita',
    'agenda',
    'program',
    'pengurus',
    'sekbid',
    'galeri',
    'pengaturan',
    'akun'        -- Akun & hak akses
  )
$$;

-- ---------------------------------------------------------------------
-- 3. Tabel hak akses
-- ---------------------------------------------------------------------
create table if not exists public.admin_permissions (
  user_id uuid not null references public.admins (user_id) on delete cascade,
  module  text not null check (public.is_admin_module(module)),
  access  text not null check (access in ('read', 'write')),
  primary key (user_id, module)
);

create table if not exists public.division_permissions (
  division_id bigint not null references public.divisions (id) on delete cascade,
  module      text not null check (public.is_admin_module(module)),
  access      text not null check (access in ('read', 'write')),
  primary key (division_id, module)
);

create index if not exists admin_permissions_module_idx on public.admin_permissions (module);
create index if not exists admins_member_idx on public.admins (member_id);

alter table public.admin_permissions enable row level security;
alter table public.division_permissions enable row level security;

-- ---------------------------------------------------------------------
-- 4. Pengecekan hak akses (dipakai seluruh policy RLS)
-- ---------------------------------------------------------------------
-- Superadmin: selalu TRUE.
-- Admin biasa: TRUE bila modulnya diizinkan. 'akun' hanya write (khusus
-- superadmin atau admin yang memang diberi izin mengelola akses).
create or replace function public.can_access(p_module text, p_need text default 'read')
returns boolean
language sql stable security definer
set search_path = public
as $$
  select case
    when public.is_superadmin() then true
    when not public.is_admin() then false
    when not public.is_admin_module(p_module) then false
    when p_need = 'read' then exists (
      select 1 from public.admin_permissions ap
      where ap.user_id = auth.uid() and ap.module = p_module
    )
    else exists (
      select 1 from public.admin_permissions ap
      where ap.user_id = auth.uid() and ap.module = p_module and ap.access = 'write'
    )
  end
$$;

-- Admin berizin (= superadmin atau punya write pada modul 'akun')
create or replace function public.can_manage_access()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select public.is_superadmin() or (public.is_admin() and public.can_access('akun', 'write'))
$$;

-- ---------------------------------------------------------------------
-- 5. Terapkan template hak akses seksi bidang ke satu admin
-- ---------------------------------------------------------------------
create or replace function public.apply_division_template(p_user_id uuid)
returns integer
language plpgsql security definer
set search_path = public
as $$
declare n integer;
begin
  if not public.can_manage_access() then
    raise exception 'Hanya superadmin atau admin berizin yang dapat mengubah hak akses' using errcode = '42501';
  end if;
  if p_user_id = auth.uid() then
    raise exception 'Tidak dapat mengubah hak akses milik sendiri' using errcode = '42501';
  end if;
  if not exists (select 1 from public.admins a where a.user_id = p_user_id) then
    raise exception 'Admin tidak ditemukan' using errcode = '22023';
  end if;

  delete from public.admin_permissions where user_id = p_user_id;

  insert into public.admin_permissions (user_id, module, access)
  select p_user_id, dp.module, dp.access
  from public.admins a
  join public.members m on m.id = a.member_id
  join public.division_permissions dp on dp.division_id = m.division_id
  where a.user_id = p_user_id
  on conflict (user_id, module) do update set access = excluded.access;

  get diagnostics n = row_count;
  return n;
end
$$;

-- ---------------------------------------------------------------------
-- 6. Cegah eskalasi hak akses oleh admin biasa
-- ---------------------------------------------------------------------
create or replace function public.guard_admin_row()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  -- Menolak penambahan/promosi/hapus baris superadmin oleh admin biasa
  if not public.is_superadmin() then
    if (tg_op = 'DELETE' and old.role = 'superadmin')
       or (tg_op = 'UPDATE' and (new.role = 'superadmin' or old.role = 'superadmin')) then
      raise exception 'Hanya superadmin yang dapat mengelola akun superadmin' using errcode = '42501';
    end if;
  end if;

  return case when tg_op = 'DELETE' then old else new end;
end
$$;

drop trigger if exists admins_guard on public.admins;
create trigger admins_guard
  before update or delete on public.admins
  for each row execute function public.guard_admin_row();

-- ---------------------------------------------------------------------
-- 7. Policy RLS
-- ---------------------------------------------------------------------
-- Konten publik: baca tetap terbuka, ubah mengikuti hak akses modul.
-- Pasangan: tabel -> modul yang mengendalikannya.
do $$
declare
  pairs text[] := array[
    'settings', 'pengaturan',
    'divisions', 'sekbid',
    'members', 'pengurus',
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

-- Berita: publik hanya melihat yang terbit, admin boleh melihat draf
drop policy if exists "Publik membaca berita terbit" on public.posts;
create policy "Publik membaca berita terbit" on public.posts for select using (published or public.can_access('berita', 'read'));
drop policy if exists "Admin dapat mengelola" on public.posts;
create policy "Admin dapat mengelola" on public.posts for all to authenticated using (public.can_access('berita', 'write')) with check (public.can_access('berita', 'write'));

-- Aspirasi
drop policy if exists "Admin dapat mengelola" on public.aspirations;
create policy "Admin dapat mengelola" on public.aspirations for all to authenticated using (public.can_access('aspirasi', 'write')) with check (public.can_access('aspirasi', 'write'));

-- Admin: superadmin atau admin berizin modul 'akun'; baris sendiri tidak boleh disentuh
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

-- ---------------------------------------------------------------------
-- 8. Izin akses tabel baru
-- ---------------------------------------------------------------------
grant select, insert, update, delete on public.admin_permissions, public.division_permissions to authenticated;
revoke all on public.admin_permissions, public.division_permissions from anon;
grant execute on function public.can_access(text, text) to anon, authenticated;
grant execute on function public.can_manage_access() to anon, authenticated;
grant execute on function public.apply_division_template(uuid) to authenticated;

-- ---------------------------------------------------------------------
-- 9. Data awal
-- ---------------------------------------------------------------------
-- Superadmin tidak butuh baris izin (dilewati otomatis oleh can_access).
-- Admin lama tetap penuh supaya tidak ada perubahan perilaku mendadak.
insert into public.admin_permissions (user_id, module, access)
select a.user_id, m, 'write'
from public.admins a
cross join unnest(array[
  'beranda', 'aspirasi', 'berita', 'agenda', 'program',
  'pengurus', 'sekbid', 'galeri', 'pengaturan', 'akun'
]) as m
where a.role = 'admin'
on conflict (user_id, module) do nothing;

-- Template awal tiap seksi bidang: boleh melihat modul utama, ubah ditentukan per.Repository
insert into public.division_permissions (division_id, module, access)
select d.id, m, 'read'
from public.divisions d
cross join unnest(array['beranda', 'berita', 'agenda', 'program', 'pengaturan']) as m
on conflict (division_id, module) do nothing;
