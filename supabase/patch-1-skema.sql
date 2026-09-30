-- =====================================================================
-- PATCH 1/3 — Skema hak akses
-- Tempel file INI SAJA dulu di Supabase SQL Editor -> Run.
-- Berisi: kolom admins.member_id, tabel izin, fungsi can_access & friends.
-- Aman dijalankan ulang. Lanjut ke patch-2-rls.sql setelah ini sukses.
-- =====================================================================

-- 1. Tautan admin -> anggota pengurus
alter table public.admins
  add column if not exists member_id bigint references public.members (id) on delete set null;

create index if not exists admins_member_idx on public.admins (member_id);

-- 2. Daftar modul yang bisa diatur haknya
create or replace function public.is_admin_module(m text)
returns boolean
language sql immutable
as $$
  select m in (
    'beranda', 'aspirasi', 'berita', 'agenda', 'program',
    'pengurus', 'sekbid', 'galeri', 'pengaturan', 'akun'
  )
$$;

-- 3. Tabel hak akses
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

alter table public.admin_permissions enable row level security;
alter table public.division_permissions enable row level security;

-- 4. Pengecekan hak akses
--    Superadmin: selalu TRUE. Admin biasa: TRUE bila modulnya diizinkan.
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

-- 5. Salin template hak akses seksi bidang ke satu akun admin
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

-- 6. Admin tertaut ke sebuah seksi boleh mengelola anggota seksi itu
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

-- 7. Cegah admin biasa menaikkan akun jadi superadmin
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

-- 8. Izin akses untuk tabel & fungsi baru
grant select, insert, update, delete on public.admin_permissions, public.division_permissions to authenticated;
revoke all on public.admin_permissions, public.division_permissions from anon;
grant execute on function public.is_admin_module(text) to anon, authenticated;
grant execute on function public.can_access(text, text) to anon, authenticated;
grant execute on function public.can_manage_access() to anon, authenticated;
grant execute on function public.manages_division(bigint) to anon, authenticated;
grant execute on function public.apply_division_template(uuid) to authenticated;
