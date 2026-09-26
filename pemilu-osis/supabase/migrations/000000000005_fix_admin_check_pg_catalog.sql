CREATE OR REPLACE FUNCTION public.admin_check(p_username text, p_key text)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
declare
  s public.settings%rowtype;
begin
  select * into s from public.settings where id = 1;
  if s.admin_username is distinct from coalesce(p_username, '') then
    return false;
  end if;
  return extensions.crypt(coalesce(p_key, ''), s.admin_password_hash) = s.admin_password_hash;
end;
$function$;