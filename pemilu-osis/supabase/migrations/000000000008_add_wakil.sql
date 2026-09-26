-- Tambahkan kolom untuk calon wakil ketua OSIS
alter table public.candidates
add column if not exists wakil_name text,
add column if not exists wakil_class_name text;