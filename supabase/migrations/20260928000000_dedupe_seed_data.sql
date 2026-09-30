-- Bersihkan data kembar hasil seed yang sempat dijalankan dua kali.
-- Idempoten: hanya menghapus baris duplikat, menyisakan satu baris (id terkecil).
delete from public.events e
  using public.events d
 where d.id < e.id
   and d.date = e.date
   and coalesce(d.time::text, '') = coalesce(e.time::text, '')
   and d.title = e.title;

delete from public.programs p
  using public.programs d
 where d.id < p.id
   and d.title = p.title;

delete from public.posts p
  using public.posts d
 where d.id < p.id
   and d.slug = p.slug;

delete from public.members m
  using public.members d
 where d.id < m.id
   and d.name = m.name
   and coalesce(d.position, '') = coalesce(m.position, '')
   and coalesce(m.division_id, -1) = coalesce(d.division_id, -1);
