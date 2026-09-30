-- Pastikan key pengaturan media sosial TikTok selalu tersedia.
insert into public.settings (key, value) values
  ('tiktok', to_jsonb(''::text))
on conflict (key) do nothing;
