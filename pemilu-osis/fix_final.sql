set search_path = public, extensions;

CREATE OR REPLACE FUNCTION admin_remove_voter(p_username TEXT, p_key TEXT, p_id TEXT)
RETURNS void AS $func$
DECLARE
  s public.settings%rowtype;
  v public.voters%rowtype;
BEGIN
  IF not public.admin_check(p_username, p_key) THEN raise EXCEPTION 'Unauthorized'; END IF;
  SELECT * INTO s FROM public.settings WHERE id = 1;
  IF s.admin_username IS DISTINCT FROM coalesce(p_username, '') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  IF crypt(coalesce(p_key, ''), s.admin_password_hash) <> s.admin_password_hash THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  SELECT * INTO v FROM public.voters WHERE
    ((role = 'siswa' AND nis = p_id)
     OR (role = 'guru' AND nip IS NOT NULL AND nip = p_id));
  IF NOT found THEN
    RAISE EXCEPTION 'Pemilih tidak ditemukan.';
  END IF;
  DELETE FROM public.votes WHERE voter_id = v.id;
  DELETE FROM public.voters WHERE id = v.id;
END;
$func$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions;

CREATE OR REPLACE FUNCTION admin_reset_vote(p_username TEXT, p_key TEXT, p_id TEXT)
RETURNS void AS $func$
DECLARE
  s public.settings%rowtype;
  v public.voters%rowtype;
BEGIN
  IF not public.admin_check(p_username, p_key) THEN raise EXCEPTION 'Unauthorized'; END IF;
  SELECT * INTO s FROM public.settings WHERE id = 1;
  IF s.admin_username IS DISTINCT FROM coalesce(p_username, '') THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  IF crypt(coalesce(p_key, ''), s.admin_password_hash) <> s.admin_password_hash THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;
  SELECT * INTO v FROM public.voters WHERE
    ((role = 'siswa' AND nis = p_id)
     OR (role = 'guru' AND nip IS NOT NULL AND nip = p_id));
  IF NOT found THEN
    RAISE EXCEPTION 'Pemilih tidak ditemukan.';
  END IF;
  UPDATE public.voters SET has_voted = false WHERE id = v.id;
  DELETE FROM public.votes WHERE voter_id = v.id;
END;
$func$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, extensions;

NOTIFY pgrst, 'reload';
