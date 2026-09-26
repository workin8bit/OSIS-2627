-- Update admin_add_voters to handle role & nip columns
drop function if exists public.admin_add_voters(p_username text, p_key text, p_rows jsonb);

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
