-- Gantikan fungsi admin_upsert_candidate dengan parameter wakil_name & wakil_class_name
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