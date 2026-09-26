-- Tambahkan kolom role & nip ke tabel voters
alter table public.voters
add column if not exists role text not null default 'siswa'
  check (role in ('siswa', 'guru')),
add column if not exists nip text;