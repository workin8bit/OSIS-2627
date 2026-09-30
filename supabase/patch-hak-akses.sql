-- =====================================================================
-- PATCH: hak akses admin + tautan ke anggota pengurus
-- Tempel SELURUH isi file ini di Supabase Dashboard -> SQL Editor -> Run.
-- Isinya sama dengan migrations/20260930000000_admin_access.sql dan
-- migrations/20260930010000_division_member_access.sql, digabung agar
-- cukup satu kali jalan. Aman dijalankan ulang.
-- Setelah selesai, muat ulang halaman /admin/akses.
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
    'beranda', 'aspirasi', 'berita', 'agenda', 'program',
    'pengurus', 'sekbid', 'galeri', 'pengaturan', 'akun'
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
-- 4. Pengecekan hak akses
-- ---------------------------------------------------------------------
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
-- 6. Cegah eskalasi oleh admin biasa
-- ---------------------------------------------------------------------
create or replace function public.guard_admin_row()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
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

drop policy if exists "Publik membaca berita terbit" on public.posts;
create policy "Publik membaca berita terbit" on public.posts for select using (published or public.can_access('berita', 'read'));
drop policy if exists "Admin dapat mengelola" on public.posts;
create policy "Admin dapat mengelola" on public.posts for all to authenticated using (public.can_access('berita', 'write')) with check (public.can_access('berita', 'write'));

drop policy if exists "Admin dapat mengelola" on public.aspirations;
create policy "Admin dapat mengelola" on public.aspirations for all to authenticated using (public.can_access('aspirasi', 'write')) with check (public.can_access('aspirasi', 'write'));

drop policy if exists "Superadmin mengelola admin" on public.admins;
drop policy if exists "Admin berizin mengelola admin" on public.admins;
create policy "Admin berizin mengelola admin" on public.admins for all to authenticated
  using (public.can_manage_access() and user_id <> auth.uid())
  with check (public.can_manage_access() and (public.is_superadmin() or role = 'admin'));

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
-- 8. Izin akses tabel & fungsi baru
-- ---------------------------------------------------------------------
grant select, insert, update, delete on public.admin_permissions, public.division_permissions to authenticated;
revoke all on public.admin_permissions, public.division_permissions from anon;
grant execute on function public.can_access(text, text) to anon, authenticated;
grant execute on function public.can_manage_access() to anon, authenticated;
grant execute on function public.apply_division_template(uuid) to authenticated;

-- ---------------------------------------------------------------------
-- 9. Data awal
-- ---------------------------------------------------------------------
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

-- Template awal tiap seksi bidang: boleh melihat modul utama.
insert into public.division_permissions (division_id, module, access)
select d.id, m, 'read'
from public.divisions d
cross join unnest(array['beranda', 'berita', 'agenda', 'program', 'pengaturan']) as m
on conflict (division_id, module) do nothing;

-- ---------------------------------------------------------------------
-- 10. Rapikan data anggota contoh hasil seed berulang
-- ---------------------------------------------------------------------
-- Buang sufiks A / B: "Anggota Sekbid 3 B" -> "Anggota Sekbid 3"
update public.members
   set name = regexp_replace(name, '\s+[AB]$', '')
 where name ~ '^Anggota Sekbid\s+\d+\s+[AB]$';

-- Satu baris per anggota (id terkecil dipertahankan)
delete from public.members m
  using public.members d
 where d.id < m.id
   and d.name = m.name
   and coalesce(d.position, '') = coalesce(m.position, '')
   and coalesce(m.division_id, -1) = coalesce(d.division_id, -1);

-- ---------------------------------------------------------------------
-- 11. Admin tertaut sekbid boleh kelola anggota sekbidnya sendiri
-- ---------------------------------------------------------------------
create or replace function public.manages_division(p_division bigint)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select p_division is not null and exists (
    select 1
    from public.admins a
    join public.members me on me.id = a.member_id
    where a.user_id = auth.uid() and me.division_id = p_division
  )
$$;

drop policy if exists "Admin dapat mengelola" on public.members;
create policy "Admin dapat mengelola" on public.members for all to authenticated
  using (public.can_access('pengurus', 'write') or public.manages_division(division_id))
  with check (public.can_access('pengurus', 'write') or public.manages_division(division_id));

grant execute on function public.manages_division(bigint) to anon, authenticated;

-- ---------------------------------------------------------------------
-- 12. Muat ulang cache skema PostgREST
-- ---------------------------------------------------------------------
notify pgrst, 'reload schema';
