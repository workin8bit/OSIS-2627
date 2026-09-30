-- =====================================================================
-- 1. Sederhanakan nama anggota contoh: "Anggota Sekbid N A/B" -> "Anggota Sekbid N"
-- 2. Sisakan satu anggota per sekbid (duplikat dihapus, id terkecil dipertahankan)
-- 3. Admin yang tertaut ke anggota sebuah sekbid boleh menambah/mengubah
--    anggota sekbidnya sendiri, tanpa perlu akses penuh modul 'pengurus'
-- =====================================================================

-- 1. Buang sufiks A / B pada nama anggota contoh
update public.members
   set name = regexp_replace(name, '\s+[AB]$', '')
 where name ~ '^Anggota Sekbid\s+\d+\s+[AB]$';

-- 2. Satu anggota per sekbid
delete from public.members m
  using public.members d
 where d.id < m.id
   and d.name = m.name
   and coalesce(d.position, '') = coalesce(m.position, '')
   and coalesce(m.division_id, -1) = coalesce(d.division_id, -1);

-- 3. Hak kelola anggota milik sekbid sendiri
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
