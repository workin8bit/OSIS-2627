-- ============================================================================
--  FIX: Update search_path to include 'extensions' schema for pgcrypto functions
--  pgcrypto functions (crypt, gen_salt) are in the 'extensions' schema,
--  but functions only have set search_path = public
-- ============================================================================

create extension if not exists pgcrypto;

-- Recreate admin_check with extended search_path
drop function if exists public.admin_check(p_username text, p_key text);
create or replace function public.admin_check(p_username text, p_key text)
returns boolean
language plpgsql stable security definer set search_path = public, extensions
as $$
declare
  s public.settings%rowtype;
begin
  select * into s from public.settings where id = 1;
  if s.admin_username is distinct from coalesce(p_username, '') then
    return false;
  end if;
  return crypt(coalesce(p_key, ''), s.admin_password_hash) = s.admin_password_hash;
end;
$$;

-- Recreate check_voter with extended search_path
drop function if exists public.check_voter(p_nis text, p_password text);
create or replace function public.check_voter(p_nis text, p_password text)
returns table(name text, class_name text, has_voted boolean)
language plpgsql stable security definer set search_path = public, extensions
as $$
begin
  return query
    select v.name, v.class_name, v.has_voted
    from public.voters v
    where v.nis = p_nis
      and crypt(coalesce(p_password, ''), v.password_hash) = v.password_hash
    limit 1;
end;
$$;

-- Recreate cast_vote with extended search_path
drop function if exists public.cast_vote(p_nis text, p_password text, p_candidate_id uuid);
create or replace function public.cast_vote(p_nis text, p_password text, p_candidate_id uuid)
returns text
language plpgsql security definer set search_path = public, extensions set timezone = 'Asia/Jakarta'
as $$
declare
  v public.voters%rowtype;
  s public.settings%rowtype;
  n int;
begin
  select * into s from public.settings where id = 1;
  if not s.is_open then
    return 'error:Voting belum dibuka atau sudah ditutup.';
  end if;
  if s.start_at is not null and now() < s.start_at then
    return 'error:Voting belum dimulai. Mulai: ' || to_char(s.start_at, 'DD MMM YYYY HH24:MI');
  end if;
  if s.end_at is not null and now() > s.end_at then
    return 'error:Voting sudah ditutup pada ' || to_char(s.end_at, 'DD MMM YYYY HH24:MI');
  end if;
  if p_nis is null or trim(p_nis) = '' then
    return 'error:NISN wajib diisi.';
  end if;
  select * into v from public.voters where nis = trim(p_nis);
  if not found then
    return 'error:NISN tidak terdaftar.';
  end if;
  if crypt(coalesce(p_password, ''), v.password_hash) <> v.password_hash then
    return 'error:Password salah.';
  end if;
  if v.has_voted then
    return 'error:Kamu sudah melakukan voting.';
  end if;
  select count(*) into n from public.candidates c
  where c.id = p_candidate_id and c.is_active;
  if n = 0 then
    return 'error:Candidat tidak ditemukan.';
  end if;
  insert into public.votes (candidate_id, voter_id) values (p_candidate_id, v.id);
  update public.voters set has_voted = true where id = v.id;
  return 'ok';
end;
$$;

-- Recreate admin_stats with extended search_path
drop function if exists public.admin_stats(p_username text, p_key text);
create or replace function public.admin_stats(p_username text, p_key text)
returns jsonb
language plpgsql stable security definer set search_path = public, extensions
as $$
declare
  out jsonb;
  tv bigint; vv bigint; vc bigint; ct int;
begin
  if not public.admin_check(p_username, p_key) then raise exception 'Unauthorized'; end if;
  select count(*) into tv from public.voters;
  select count(*) into vv from public.votes;
  select count(*) into vc from public.voters where has_voted;
  select count(*) into ct from public.candidates where is_active;
  return jsonb_build_object(
    'total_voters', tv, 'total_votes', vv, 'voted', vc, 'candidates', ct
  );
end;
$$;

-- Recreate admin_results with extended search_path
drop function if exists public.admin_results(p_username text, p_key text);
create or replace function public.admin_results(p_username text, p_key text)
returns table(candidate_id uuid, candidate_number int, candidate_name text, total bigint)
language plpgsql stable security definer set search_path = public, extensions
as $$
begin
  if not public.admin_check(p_username, p_key) then raise exception 'Unauthorized'; end if;
  return query
    select c.id, c.number, c.name, count(v.id)
    from public.candidates c
    left join public.votes v on v.candidate_id = c.id
    group by c.id, c.number, c.name
    order by c.number;
end;
$$;

-- Recreate admin_list_voters with extended search_path
drop function if exists public.admin_list_voters(p_username text, p_key text);
create or replace function public.admin_list_voters(p_username text, p_key text)
returns table("NISN" text, name text, class_name text, has_voted boolean, role text, "NIP" text)
language plpgsql stable security definer set search_path = public, extensions
as $$
begin
  if not public.admin_check(p_username, p_key) then raise exception 'Unauthorized'; end if;
  return query
    select v.nis as "NISN", v.name, v.class_name, v.has_voted, v.role, v.nip as "NIP"
    from public.voters v
    order by v.nis;
end;
$$;

-- Recreate admin_set_settings with extended search_path
drop function if exists public.admin_set_settings(p_username text, p_key text, p_school_name text, p_election_name text, p_academic_year text, p_start_at text, p_end_at text, p_is_open boolean, p_show_results boolean);
create or replace function public.admin_set_settings(
  p_username      text,
  p_key           text,
  p_school_name   text default null,
  p_election_name text default null,
  p_academic_year text default null,
  p_start_at      text default null,
  p_end_at        text default null,
  p_is_open       boolean default null,
  p_show_results  boolean default null
)
returns void
language plpgsql security definer set search_path = public, extensions
as $$
declare
  s public.settings%rowtype;
  new_start timestamptz;
  new_end   timestamptz;
begin
  select * into s from public.settings where id = 1;
  if not public.admin_check(p_username, p_key) then raise exception 'Unauthorized'; end if;
  if p_start_at is not null then
    new_start := case when p_start_at = 'CLEAR' then null else p_start_at::timestamptz end;
  end if;
  if p_end_at is not null then
    new_end := case when p_end_at = 'CLEAR' then null else p_end_at::timestamptz end;
  end if;
  update public.settings set
    school_name   = coalesce(p_school_name, school_name),
    election_name = coalesce(p_election_name, election_name),
    academic_year = coalesce(p_academic_year, academic_year),
    start_at      = coalesce(new_start, start_at),
    end_at        = coalesce(new_end, end_at),
    is_open       = coalesce(p_is_open, is_open),
    show_results  = coalesce(p_show_results, show_results),
    updated_at    = now()
  where id = 1;
end;
$$;

-- Recreate admin_upsert_candidate with extended search_path
drop function if exists public.admin_upsert_candidate(p_username text, p_key text, p_number int, p_name text, p_class_name text, p_wakil_name text, p_wakil_class_name text, p_photo_url text, p_video_url text, p_slogan text, p_vision text, p_mission text, p_is_active boolean, p_id uuid);
create or replace function public.admin_upsert_candidate(
  p_username       text,
  p_key            text,
  p_number         int default 0,
  p_name           text default '',
  p_class_name     text default '',
  p_wakil_name     text default null,
  p_wakil_class_name text default null,
  p_photo_url      text default null,
  p_video_url      text default null,
  p_slogan         text default null,
  p_vision         text default '',
  p_mission        text default '',
  p_is_active      boolean default true,
  p_id             uuid default null
)
returns uuid
language plpgsql security definer set search_path = public, extensions
as $$
declare
  out_id uuid;
begin
  if not public.admin_check(p_username, p_key) then raise exception 'Unauthorized'; end if;
  if p_id is null then
    insert into public.candidates
      (number, name, class_name, wakil_name, wakil_class_name, photo_url, video_url, slogan, vision, mission, is_active)
    values
      (p_number, p_name, p_class_name, p_wakil_name, p_wakil_class_name, p_photo_url, p_video_url, p_slogan, p_vision, p_mission, p_is_active)
    returning id into out_id;
  else
    update public.candidates set
      number           = p_number,
      name             = p_name,
      class_name       = p_class_name,
      wakil_name       = coalesce(p_wakil_name, wakil_name),
      wakil_class_name = coalesce(p_wakil_class_name, wakil_class_name),
      photo_url        = coalesce(p_photo_url, photo_url),
      video_url        = coalesce(p_video_url, video_url),
      slogan           = coalesce(p_slogan, slogan),
      vision           = p_vision,
      mission          = p_mission,
      is_active        = p_is_active
    where id = p_id;
    out_id := p_id;
  end if;
  return out_id;
end;
$$;

-- Recreate admin_delete_candidate with extended search_path
drop function if exists public.admin_delete_candidate(p_username text, p_key text, p_id uuid);
create or replace function public.admin_delete_candidate(p_username text, p_key text, p_id uuid)
returns void
language plpgsql security definer set search_path = public, extensions
as $$
begin
  if not public.admin_check(p_username, p_key) then raise exception 'Unauthorized'; end if;
  delete from public.candidates where id = p_id;
end;
$$;

-- Recreate admin_add_voters with extended search_path and role/nip support
drop function if exists public.admin_add_voters(p_username text, p_key text, p_rows jsonb);
create or replace function public.admin_add_voters(p_username text, p_key text, p_rows jsonb)
returns int
language plpgsql security definer set search_path = public, extensions
as $$
declare
  r jsonb;
  n int := 0;
begin
  if not public.admin_check(p_username, p_key) then raise exception 'Unauthorized'; end if;
  for r in select * from jsonb_array_elements(p_rows)
  loop
    begin
      insert into public.voters (nis, name, class_name, password_hash, role, nip)
      values (
        trim(r->>'nis'),
        trim(r->>'name'),
        coalesce(trim(r->>'class_name'), ''),
        crypt(coalesce(r->>'password', ''), gen_salt('bf')),
        case when r->>'role' in ('siswa', 'guru') then r->>'role' else 'siswa' end,
        case when length(coalesce(trim(r->>'nip'), '')) > 0 then trim(r->>'nip') else null end
      )
      on conflict (nis) do update
        set name          = excluded.name,
            class_name    = excluded.class_name,
            password_hash = excluded.password_hash,
            role          = excluded.role,
            nip           = excluded.nip;
      n := n + 1;
    exception when others then
      null;
    end;
  end loop;
  return n;
end;
$$;

-- Recreate admin_remove_voter with extended search_path and p_id parameter
drop function if exists public.admin_remove_voter(p_username text, p_key text, p_id text);
drop function if exists public.admin_remove_voter(p_username text, p_key text, p_nis text);
create or replace function public.admin_remove_voter(p_username text, p_key text, p_id text)
returns void
language plpgsql security definer set search_path = public, extensions
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

-- Recreate admin_reset_vote with extended search_path and p_id parameter
drop function if exists public.admin_reset_vote(p_username text, p_key text, p_id text);
drop function if exists public.admin_reset_vote(p_username text, p_key text, p_nis text);
create or replace function public.admin_reset_vote(p_username text, p_key text, p_id text)
returns void
language plpgsql security definer set search_path = public, extensions
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

-- Recreate admin_reset_votes with extended search_path
drop function if exists public.admin_reset_votes(p_username text, p_key text);
create or replace function public.admin_reset_votes(p_username text, p_key text)
returns void
language plpgsql security definer set search_path = public, extensions
as $$
begin
  if not public.admin_check(p_username, p_key) then raise exception 'Unauthorized'; end if;
  truncate public.votes;
  update public.voters set has_voted = false;
end;
$$;

-- Recreate admin_set_admin_password with extended search_path
drop function if exists public.admin_set_admin_password(p_username text, p_key text, p_new text);
create or replace function public.admin_set_admin_password(p_username text, p_key text, p_new text)
returns void
language plpgsql security definer set search_path = public, extensions
as $$
begin
  if not public.admin_check(p_username, p_key) then raise exception 'Unauthorized'; end if;
  update public.settings
  set admin_password_hash = crypt(p_new, gen_salt('bf')), updated_at = now()
  where id = 1;
end;
$$;

-- Reload PostgREST schema cache
notify pgrst, 'reload';
