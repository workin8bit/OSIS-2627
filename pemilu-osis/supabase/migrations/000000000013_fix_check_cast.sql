-- Perbarui fungsi check_voter: p_nis bisa berupa NISN (siswa) atau NIP (guru)
create or replace function public.check_voter(p_nis text, p_password text)
returns table(name text, class_name text, has_voted boolean)
language plpgsql stable security definer set search_path = public
as $$
begin
  return query
    select v.name, v.class_name, v.has_voted
    from public.voters v
    where (
      (v.role = 'siswa' and v.nis = p_nis)
      or (v.role = 'guru' and v.nip is not null and v.nip = p_nis)
    )
      and crypt(coalesce(p_password, ''), v.password_hash) = v.password_hash
    limit 1;
end;
$$;

-- Perbarui fungsi cast_vote: p_nis bisa berupa NISN (siswa) atau NIP (guru)
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
    return 'error:ID wajib diisi.';
  end if;
  select * into v from public.voters where
    ((v.role = 'siswa' and v.nis = trim(p_nis))
     or (v.role = 'guru' and v.nip is not null and v.nip = trim(p_nis)));
  if not found then
    return 'error:ID tidak terdaftar.';
  end if;
  if crypt(coalesce(p_password, ''), v.password_hash) <> v.password_hash then
    return 'error:Password salah.';
  end if;
  if v.has_voted then
    return 'error:Anda sudah memasukkan suara. Satu akun = satu suara.';
  end if;
  select count(*) into n from public.votes where voter_id = v.id;
  if n > 0 then
    return 'error:Anda sudah memasukkan suara.';
  end if;
  insert into public.votes (candidate_id, voter_id) values (p_candidate_id, v.id);
  update public.voters set has_voted = true where id = v.id;
  return 'ok';
end;
$$;