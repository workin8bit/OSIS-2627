-- Hapus dan buat ulang fungsi admin_list_voters dengan kolom role & nip
drop function if exists public.admin_list_voters(p_username text, p_key text);

create or replace function public.admin_list_voters(p_username text, p_key text)
returns table(nis text, name text, class_name text, has_voted boolean, role text, nip text)
language plpgsql security definer set search_path = public
as $$
declare
  s public.settings%rowtype;
begin
  select * into s from public.settings where id = 1;
  if s.admin_username is distinct from coalesce(p_username, '') then
    raise exception 'Unauthorized';
  end if;
  if crypt(coalesce(p_key, ''), s.admin_password_hash) <> s.admin_password_hash then
    raise exception 'Unauthorized';
  end if;
  return query
    select v.nis, v.name, v.class_name, v.has_voted, v.role, v.nip
    from public.voters v
    order by v.nis;
end;
$$;

-- Hapus dan buat ulang admin_remove_voter dengan p_id (bisa NISN atau NIP)
drop function if exists public.admin_remove_voter(p_username text, p_key text, p_nis text);

create or replace function public.admin_remove_voter(p_username text, p_key text, p_id text)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  s public.settings%rowtype;
  v public.voters%rowtype;
begin
  select * into s from public.settings where id = 1;
  if s.admin_username is distinct from coalesce(p_username, '') then
    raise exception 'Unauthorized';
  end if;
  if crypt(coalesce(p_key, ''), s.admin_password_hash) <> s.admin_password_hash then
    raise exception 'Unauthorized';
  end if;
  select * into v from public.voters where
    ((v.role = 'siswa' and v.nis = p_id)
     or (v.role = 'guru' and v.nip is not null and v.nip = p_id));
  if not found then
    raise exception 'Pemilih tidak ditemukan.';
  end if;
  delete from public.votes where voter_id = v.id;
  delete from public.voters where id = v.id;
end;
$$;

-- Hapus dan buat ulang admin_reset_vote dengan p_id (bisa NISN atau NIP)
drop function if exists public.admin_reset_vote(p_username text, p_key text, p_nis text);

create or replace function public.admin_reset_vote(p_username text, p_key text, p_id text)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  s public.settings%rowtype;
  v public.voters%rowtype;
begin
  select * into s from public.settings where id = 1;
  if s.admin_username is distinct from coalesce(p_username, '') then
    raise exception 'Unauthorized';
  end if;
  if crypt(coalesce(p_key, ''), s.admin_password_hash) <> s.admin_password_hash then
    raise exception 'Unauthorized';
  end if;
  select * into v from public.voters where
    ((v.role = 'siswa' and v.nis = p_id)
     or (v.role = 'guru' and v.nip is not null and v.nip = p_id));
  if not found then
    raise exception 'Pemilih tidak ditemukan.';
  end if;
  delete from public.votes where voter_id = v.id;
  update public.voters set has_voted = false where id = v.id;
end;
$$;