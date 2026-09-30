-- Perbarui tagline resmi dan nama kabinet ke "Kabinet Tri Hita Karana".
-- Idempotent: hanya mengubah baris yang masih memakai nilai lama.
update public.settings
   set value = to_jsonb('Bergerak Bersama, Berkarya untuk SMAGA'::text)
 where key = 'tagline'
   and value is distinct from to_jsonb('Bergerak Bersama, Berkarya untuk SMAGA'::text);

update public.settings
   set value = to_jsonb('Kabinet Tri Hita Karana'::text)
 where key = 'cabinet_name'
   and value is distinct from to_jsonb('Kabinet Tri Hita Karana'::text);
