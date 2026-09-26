set search_path = public, extensions;

DROP FUNCTION IF EXISTS public.admin_list_voters(text, text);

CREATE OR REPLACE FUNCTION public.admin_list_voters(p_username text, p_key text)
RETURNS TABLE("NISN" text, name text, class_name text, has_voted boolean, role text, "NIP" text)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public, extensions
AS $func$
BEGIN
  IF not public.admin_check(p_username, p_key) THEN raise EXCEPTION 'Unauthorized'; END IF;
  RETURN QUERY
    SELECT v.nis AS "NISN", v.name, v.class_name, v.has_voted, v.role, v.nip AS "NIP"
    FROM public.voters v
    ORDER BY v.nis;
END;
$func$;

NOTIFY pgrst, 'reload';
