-- Tambahkan kolom video_url ke tabel candidates
alter table public.candidates
add column if not exists video_url text;