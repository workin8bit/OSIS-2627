CREATE OR REPLACE FUNCTION public.admin_list_voters(p_username text, p_key text)
RETURNS TABLE(nis text, name text, class_name text, has_voted boolean, created_at timestamptz)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.admin_check(p_username, p_key) THEN RAISE EXCEPTION 'Unauthorized'; END IF;
  RETURN QUERY
    SELECT v.nis, v.name, v.class_name, v.has_voted, v.created_at
    FROM public.voters v
    ORDER BY v.nis;
END;
$$;