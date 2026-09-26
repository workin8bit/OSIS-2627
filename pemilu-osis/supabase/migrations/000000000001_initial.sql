-- ============================================================================
--  PEMILIHAN KETUA OSIS — FIX ADMIN FUNCTIONS
--  Migration to create all missing RPC functions.
--  Run this in Supabase SQL Editor.
-- ============================================================================

-- NOTE: pgcrypto is already enabled on this Supabase project.
-- If you get "function gen_salt does not exist", run this first:
--   create extension if not exists pgcrypto;

-- ------------------------------ TABLES --------------------------------------

create table if not exists public.settings (
  id                  int primary key default 1 check (id = 1),
  school_name         text not null default 'SMA Negeri 3 Rembang',
  election_name       text not null default 'Pemilihan Ketua OSIS',
  academic_year       text not null default '2026/2027',
  start_at            timestamptz,
  end_at              timestamptz,
  is_open             boolean not null default false,
  show_results        boolean not null default false,
  admin_username      text not null default 'admin@osissmaga.id',
  admin_password_hash text not null,
  updated_at          timestamptz not null default now()
);

-- Seed default admin password.
-- Pre-computed bcrypt hash of 'admin2627' (12 rounds).
insert into public.settings (id, admin_password_hash)
select 1, '$2b$12$VW85BjR/LZ9t2oajsv6x.O1BzrQA.EhoWBDKmoOWzbLe7O7BnWgna'
where not exists (select 1 from public.settings where id = 1);

create table if not exists public.candidates (
  id              uuid primary key default gen_random_uuid(),
  number          int not null unique,
  name            text not null,
  class_name      text not null default '',
  wakil_name      text,
  wakil_class_name text,
  photo_url       text,
  video_url       text,
  slogan          text,
  vision          text not null default '',
  mission         text not null default '',
  is_active       boolean not null default true,
  created_at      timestamptz not null default now()
);

create table if not exists public.voters (
  id            uuid primary key default gen_random_uuid(),
  nis           text not null unique,
  name          text not null,
  class_name    text not null default '',
  password_hash text not null,
  has_voted     boolean not null default false,
  created_at    timestamptz not null default now()
);

create table if not exists public.votes (
  id           bigint generated always as identity primary key,
  candidate_id uuid not null references public.candidates(id) on delete cascade,
  voter_id     uuid not null unique references public.voters(id) on delete cascade,
  voted_at     timestamptz not null default now()
);

create index if not exists idx_votes_candidate on public.votes(candidate_id);

-- --------------------------- PUBLIC FUNCTIONS ---------------------------------

-- Status umum pemilihan (aman dibaca semua orang, tanpa data sensitif)
create or replace function public.get_status()
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare
  s public.settings%rowtype;
begin
  select * into s from public.settings where id = 1;
  return jsonb_build_object(
    'school_name',   s.school_name,
    'election_name', s.election_name,
    'academic_year', s.academic_year,
    'start_at',      s.start_at,
    'end_at',        s.end_at,
    'is_open',       s.is_open,
    'show_results',  s.show_results
  );
end;
$$;

-- Cek login pemilih (NISN + password). Hasil kosong = salah/tidak terdaftar.
create or replace function public.check_voter(p_nis text, p_password text)
returns table(name text, class_name text, has_voted boolean)
language plpgsql stable security definer set search_path = public
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

-- Kirim suara. Mengembalikan 'ok' atau 'error:<pesan>'.
create or replace function public.cast_vote(p_nis text, p_password text, p_candidate_id uuid)
returns text
language plpgsql security definer set search_path = public set timezone = 'Asia/Jakarta'
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

-- Hasil per kandidat (hanya kalau admin membuka hasil)
create or replace function public.get_results()
returns table(candidate_id uuid, candidate_number int, candidate_name text, total bigint)
language sql stable security definer set search_path = public
as $$
  select c.id, c.number, c.name, count(v.id)
  from public.candidates c
  left join public.votes v on v.candidate_id = c.id
  where c.is_active
    and (select s.show_results from public.settings s where s.id = 1)
  group by c.id, c.number, c.name
  order by c.number;
$$;

-- Rekap partisipasi (hanya kalau admin membuka hasil)
create or replace function public.get_tally()
returns table(total_voters bigint, total_votes bigint)
language sql stable security definer set search_path = public
as $$
  select
    (select count(*) from public.voters) as total_voters,
    (select count(*) from public.votes)  as total_votes
  where (select s.show_results from public.settings s where s.id = 1);
$$;

-- --------------------------- ADMIN FUNCTIONS ----------------------------------

create or replace function public.admin_check(p_username text, p_key text)
returns boolean
language plpgsql stable security definer set search_path = public
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

create or replace function public.admin_stats(p_username text, p_key text)
returns jsonb
language plpgsql stable security definer set search_path = public
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

-- Hasil untuk admin (selalu boleh, tidak bergantung show_results)
create or replace function public.admin_results(p_username text, p_key text)
returns table(candidate_id uuid, candidate_number int, candidate_name text, total bigint)
language plpgsql stable security definer set search_path = public
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

-- Daftar pemilih (admin saja)
create or replace function public.admin_list_voters(p_username text, p_key text)
returns table(nis text, name text, class_name text, has_voted boolean, created_at timestamptz)
language plpgsql stable security definer set search_path = public
as $$
begin
  if not public.admin_check(p_username, p_key) then raise exception 'Unauthorized'; end if;
  return query
    select nis, name, class_name, has_voted, created_at
    from public.voters
    order by nis;
end;
$$;

-- Perbarui pengaturan. Parameter null = tidak diubah.
-- Untuk mengosongkan start_at/end_at kirim string 'CLEAR'.
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
language plpgsql security definer set search_path = public
as $$
declare
  s public.settings%rowtype;
  new_start timestamptz;
  new_end   timestamptz;
begin
  select * into s from public.settings where id = 1;
  if s.admin_username is distinct from coalesce(p_username, '') then
    raise exception 'Unauthorized';
  end if;
  if crypt(coalesce(p_key, ''), s.admin_password_hash) <> s.admin_password_hash then
    raise exception 'Unauthorized';
  end if;
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

-- Tambah/ubah kandidat
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
language plpgsql security definer set search_path = public
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

create or replace function public.admin_delete_candidate(p_username text, p_key text, p_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not public.admin_check(p_username, p_key) then raise exception 'Unauthorized'; end if;
  delete from public.candidates where id = p_id;
end;
$$;

-- Tambah pemilih massal: p_rows = [{"nis":"...","name":"...","class_name":"...","password":"..."}]
-- NISN yang sudah ada akan diperbarui (password baru), status has_voted tidak disentuh.
create or replace function public.admin_add_voters(p_username text, p_key text, p_rows jsonb)
returns int
language plpgsql security definer set search_path = public
as $$
declare
  r jsonb;
  n int := 0;
begin
  if not public.admin_check(p_username, p_key) then raise exception 'Unauthorized'; end if;
  for r in select * from jsonb_array_elements(p_rows)
  loop
    begin
      insert into public.voters (nis, name, class_name, password_hash)
      values (
        trim(r->>'nis'),
        trim(r->>'name'),
        coalesce(trim(r->>'class_name'), ''),
        crypt(coalesce(r->>'password', ''), gen_salt('bf'))
      )
      on conflict (nis) do update
        set name          = excluded.name,
            class_name    = excluded.class_name,
            password_hash = excluded.password_hash;
      n := n + 1;
    exception when others then
      null; -- baris tidak valid dilewati
    end;
  end loop;
  return n;
end;
$$;

create or replace function public.admin_remove_voter(p_username text, p_key text, p_nis text)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not public.admin_check(p_username, p_key) then raise exception 'Unauthorized'; end if;
  delete from public.voters where nis = trim(p_nis);
end;
$$;

create or replace function public.admin_reset_vote(p_username text, p_key text, p_nis text)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not public.admin_check(p_username, p_key) then raise exception 'Unauthorized'; end if;
  delete from public.votes
  where voter_id = (select id from public.voters where nis = trim(p_nis));
  update public.voters set has_voted = false where nis = trim(p_nis);
end;
$$;

-- NUKLIR: hapus semua suara & kembalikan semua pemilih ke belum vote
create or replace function public.admin_reset_votes(p_username text, p_key text)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  if not public.admin_check(p_username, p_key) then raise exception 'Unauthorized'; end if;
  truncate public.votes;
  update public.voters set has_voted = false;
end;
$$;

create or replace function public.admin_set_admin_password(p_username text, p_key text, p_new text)
returns void
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
  update public.settings
  set admin_password_hash = crypt(p_new, gen_salt('bf')), updated_at = now()
  where id = 1;
end;
$$;

-- ------------------------------ RLS ----------------------------------------

alter table public.settings   enable row level security;
alter table public.candidates enable row level security;
alter table public.voters     enable row level security;
alter table public.votes      enable row level security;

-- settings & candidates: bisa dibaca publik (tanpa data sensitif)
drop policy if exists "read_settings" on public.settings;
create policy "read_settings" on public.settings
  for select using (true);

drop policy if exists "read_candidates" on public.candidates;
create policy "read_candidates" on public.candidates
  for select using (true);

-- voters & votes: TIDAK ada policy untuk anon/authenticated
-- (akses hanya lewat fungsi SECURITY DEFINER di atas)

-- ------------------------------ SEED --------------------------------------

insert into public.candidates
  (number, name, class_name, wakil_name, wakil_class_name, slogan, vision, mission)
values
  (1, 'Anindya Aya Kurniawan', 'XI.10', 'Rizky Pratama', 'XI.10',
   'Bersama Wujudkan OSIS yang Lebih Baik',
   'Terwujudnya OSIS yang inovatif dan inklusif sebagai wadah aktualisasi diri seluruh siswa SMA Negeri 3 Rembang.',
   E'- Membuka ruang kreativitas melalui festival seni, budaya, dan teknologi\n- Digitalisasi pengumuman dan administrasi OSIS\n- Menampung aspirasi siswa melalui kotak saran digital\n- Menjalin kerja sama dengan komunitas pelajar se-Rembang'),
  (2, 'Dinda Aulia Oktavani', 'XI.10', 'Siti Nuraini', 'XI.10',
   'Kreatif, Kolaboratif, Berkarakter',
   'OSIS menjadi rumah kedua yang membina karakter, mengasah potensi, dan mempererat kebersamaan seluruh warga sekolah.',
   E'- Program mentoring antarangkatan dan buddy system\n- Penguatan kegiatan keagamaan dan pembiasaan akhlak\n- Lomba intra-kelas setiap semester untuk menyatukan kelas\n- Publikasi prestasi siswa di media sosial sekolah'),
  (3, 'Muhammad Anzil Arriski', 'XI.10', 'Budi Santoso', 'XI.10',
   'Suaramu, Wujudkan!',
   'Setiap aspirasi siswa menjadi nyata melalui program kerja OSIS yang transparan dan berbasis kebutuhan siswa.',
   E'- Survei kebutuhan siswa awal periode sebagai dasar progker\n- Transparansi anggaran dan laporan kegiatan bulanan\n- Revitalisasi fasilitas olahraga dan taman baca\n- Forum rutin siswa-pengurus untuk menampung kritik & saran')
on conflict (number) do update set
  name = excluded.name,
  class_name = excluded.class_name,
  wakil_name = excluded.wakil_name,
  wakil_class_name = excluded.wakil_class_name,
  slogan = excluded.slogan,
  vision = excluded.vision,
  mission = excluded.mission;