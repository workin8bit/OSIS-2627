-- =====================================================================
-- Data contoh awal OSIS SMA Negeri 3 Rembang 2026/2027
-- Semua nama pengurus adalah CONTOH — ubah melalui panel admin.
-- Aman dijalankan sekali setelah migrasi. Jangan dijalankan ulang di
-- database yang sudah berisi data asli.
-- =====================================================================

insert into public.settings (key, value) values
  ('org_name',         to_jsonb('OSIS SMA Negeri 3 Rembang'::text)),
  ('school_name',      to_jsonb('SMA Negeri 3 Rembang'::text)),
  ('period',           to_jsonb('2026/2027'::text)),
  ('cabinet_name',     to_jsonb('Kabinet Cakrawala Aksara'::text)),
  ('tagline',          to_jsonb('Bergerak Bersama, Berkarya untuk Smaga'::text)),
  ('about',            to_jsonb('Organisasi Siswa Intra Sekolah (OSIS) SMA Negeri 3 Rembang adalah wadah resmi bagi seluruh siswa untuk mengembangkan potensi, menyalurkan aspirasi, dan berperan aktif dalam membangun lingkungan sekolah yang religius, berprestasi, dan berkarakter.'::text)),
  ('vision',           to_jsonb('Mewujudkan OSIS SMA Negeri 3 Rembang sebagai organisasi yang religius, inovatif, kolaboratif, dan menjadi teladan dalam membangun budaya sekolah yang berprestasi dan berkarakter Pancasila.'::text)),
  ('missions',         '[
      "Meningkatkan keimanan dan ketakwaan warga sekolah melalui kegiatan keagamaan yang rutin dan bermakna.",
      "Menjadi jembatan aspirasi yang transparan antara siswa, guru, dan pihak sekolah.",
      "Mengembangkan minat, bakat, dan prestasi siswa di bidang akademik maupun non-akademik.",
      "Membangun budaya literasi, kreativitas, dan pemanfaatan teknologi secara positif.",
      "Menumbuhkan kepedulian sosial dan cinta lingkungan di lingkungan sekolah dan masyarakat."
    ]'::jsonb),
  ('chairman_message', to_jsonb('Assalamu’alaikum warahmatullahi wabarakatuh. Terima kasih atas kepercayaan seluruh warga SMA Negeri 3 Rembang. Bersama Kabinet Cakrawala Aksara, kami berkomitmen menghadirkan OSIS yang terbuka, mendengar, dan bergerak nyata. Mari kita wujudkan Smaga yang lebih hebat, bersama!'::text)),
  ('address',          to_jsonb('Jl. Gajah Mada No. 8, Pantiharjo, Kec. Kaliori, Kab. Rembang, Jawa Tengah'::text)),
  ('email',            to_jsonb('osis@sma3rembang.sch.id'::text)),
  ('phone',            to_jsonb('(0295) 691280'::text)),
  ('instagram',        to_jsonb('osis.smagarembang'::text)),
  ('youtube',          to_jsonb(''::text)),
  ('maps_embed',       to_jsonb('https://www.google.com/maps?q=SMA+Negeri+3+Rembang&output=embed'::text))
on conflict (key) do nothing;

insert into public.divisions (name, short, description, icon, sort_order) values
  ('Keimanan dan Ketakwaan terhadap Tuhan YME', 'Sekbid 1', 'Menyelenggarakan kegiatan keagamaan dan peringatan hari besar keagamaan.', 'Moon', 1),
  ('Budi Pekerti Luhur dan Akhlak Mulia', 'Sekbid 2', 'Menanamkan nilai sopan santun, disiplin, dan etika di lingkungan sekolah.', 'Heart', 2),
  ('Kepribadian Unggul, Wawasan Kebangsaan & Bela Negara', 'Sekbid 3', 'Upacara, LDKS, dan kegiatan cinta tanah air.', 'Flag', 3),
  ('Prestasi Akademik, Seni, dan Olahraga', 'Sekbid 4', 'Mengembangkan dan mewadahi prestasi siswa di berbagai bidang.', 'Trophy', 4),
  ('Demokrasi, HAM, Politik, Lingkungan Hidup & Toleransi Sosial', 'Sekbid 5', 'Pemilos, bakti sosial, dan gerakan peduli lingkungan.', 'Vote', 5),
  ('Kreativitas, Keterampilan, dan Kewirausahaan', 'Sekbid 6', 'Market day, bazar, dan pelatihan kewirausahaan siswa.', 'Lightbulb', 6),
  ('Kualitas Jasmani, Kesehatan, dan Gizi', 'Sekbid 7', 'Senam bersama, classmeeting olahraga, dan kampanye hidup sehat.', 'Activity', 7),
  ('Sastra dan Budaya', 'Sekbid 8', 'Pentas seni, bulan bahasa, dan pelestarian budaya lokal Rembang.', 'Palette', 8),
  ('Teknologi Informasi dan Komunikasi', 'Sekbid 9', 'Pengelolaan media sosial, website, dan dokumentasi OSIS.', 'Monitor', 9),
  ('Komunikasi dalam Bahasa Inggris', 'Sekbid 10', 'English day, debate club, dan lomba berbahasa Inggris.', 'Languages', 10);

-- Pengurus inti
insert into public.members (name, position, class_name, is_core, quote, sort_order) values
  ('Nama Ketua OSIS', 'Ketua OSIS', 'XI-1', true, 'Pemimpin yang baik adalah pendengar yang baik.', 1),
  ('Nama Wakil Ketua I', 'Wakil Ketua I', 'XI-2', true, 'Kolaborasi adalah kunci.', 2),
  ('Nama Wakil Ketua II', 'Wakil Ketua II', 'X-3', true, 'Kecil langkahnya, besar dampaknya.', 3),
  ('Nama Sekretaris I', 'Sekretaris I', 'XI-3', true, 'Rapi administrasi, lancar organisasi.', 4),
  ('Nama Sekretaris II', 'Sekretaris II', 'X-1', true, null, 5),
  ('Nama Bendahara I', 'Bendahara I', 'XI-4', true, 'Transparan dan amanah.', 6),
  ('Nama Bendahara II', 'Bendahara II', 'X-2', true, null, 7);

-- Anggota tiap sekbid (1 koordinator + 2 anggota)
insert into public.members (name, position, class_name, division_id, is_core, sort_order)
select format(v.label, d.sort_order), v.position, v.class_name, d.id, false, v.ord
from public.divisions d
cross join (values
  ('Koordinator Sekbid %s', 'Koordinator', 'XI', 1),
  ('Anggota Sekbid %s A', 'Anggota', 'X', 2),
  ('Anggota Sekbid %s B', 'Anggota', 'X', 3)
) as v(label, position, class_name, ord)
order by d.sort_order, v.ord;

insert into public.programs (title, description, division_id, target, start_date, end_date, status, progress)
select p.title, p.description, (select id from public.divisions where short = p.sekbid), p.target, p.start_date::date, p.end_date::date, p.status, p.progress
from (values
  ('Jumat Berkah & Kajian Rutin', 'Kajian keagamaan dan berbagi takjil/sarapan setiap hari Jumat.', 'Sekbid 1', 'Seluruh siswa', '2026-08-01', '2027-06-30', 'berjalan', 35),
  ('Peringatan Maulid Nabi Muhammad SAW', 'Pengajian dan lomba islami dalam rangka Maulid Nabi.', 'Sekbid 1', 'Seluruh warga sekolah', '2026-08-25', '2026-08-25', 'selesai', 100),
  ('Gerakan 5S (Senyum, Sapa, Salam, Sopan, Santun)', 'Piket penyambutan siswa di gerbang sekolah setiap pagi.', 'Sekbid 2', 'Seluruh siswa', '2026-07-20', '2027-06-30', 'berjalan', 40),
  ('LDKS Pengurus OSIS & MPK', 'Latihan Dasar Kepemimpinan Siswa untuk pengurus baru.', 'Sekbid 3', 'Pengurus OSIS & MPK', '2026-10-17', '2026-10-18', 'rencana', 20),
  ('Upacara Hari Sumpah Pemuda', 'Upacara dan lomba bertema kepemudaan.', 'Sekbid 3', 'Seluruh siswa', '2026-10-28', '2026-10-28', 'rencana', 10),
  ('Smaga Cup 2026', 'Turnamen olahraga antar-kelas dan antar-SMP se-Kabupaten Rembang.', 'Sekbid 4', 'Siswa & SMP se-Rembang', '2026-11-09', '2026-11-14', 'rencana', 15),
  ('Pemilihan Ketua OSIS (Pemilos) Digital', 'Pemilihan ketua OSIS periode berikutnya secara digital dan jujur.', 'Sekbid 5', 'Seluruh siswa', '2027-08-01', '2027-08-15', 'rencana', 0),
  ('Smaga Go Green', 'Penanaman pohon, bank sampah, dan lomba kebersihan kelas.', 'Sekbid 5', 'Seluruh kelas', '2026-09-01', '2027-05-31', 'berjalan', 25),
  ('Market Day Smaga', 'Bazar kewirausahaan siswa per kelas.', 'Sekbid 6', 'Seluruh kelas', '2027-02-20', '2027-02-20', 'rencana', 0),
  ('Senam Sehat Jumat', 'Senam bersama seluruh warga sekolah.', 'Sekbid 7', 'Seluruh warga sekolah', '2026-08-01', '2027-06-30', 'berjalan', 35),
  ('Pensi & Bulan Bahasa', 'Pentas seni, musikalisasi puisi, dan lomba bahasa.', 'Sekbid 8', 'Seluruh siswa', '2026-10-01', '2026-10-31', 'rencana', 30),
  ('Smaga Media Center', 'Pengelolaan konten Instagram, TikTok, dan website OSIS.', 'Sekbid 9', 'Publik', '2026-07-15', '2027-06-30', 'berjalan', 45),
  ('English Day Every Wednesday', 'Pembiasaan berbahasa Inggris setiap hari Rabu.', 'Sekbid 10', 'Seluruh siswa', '2026-09-02', '2027-06-30', 'berjalan', 20)
) as p(title, description, sekbid, target, start_date, end_date, status, progress);

insert into public.posts (title, slug, excerpt, content, category, author, created_at) values
  ('Pelantikan Pengurus OSIS Periode 2026/2027', 'pelantikan-pengurus-osis-2026-2027',
   'Pengurus OSIS SMA Negeri 3 Rembang Kabinet Cakrawala Aksara resmi dilantik oleh Kepala Sekolah.',
   E'Pengurus OSIS SMA Negeri 3 Rembang periode 2026/2027 resmi dilantik dalam upacara bendera yang diikuti seluruh warga sekolah.\n\nDalam sambutannya, Kepala Sekolah berpesan agar pengurus baru menjadi teladan, amanah, dan mampu menjadi jembatan aspirasi siswa.\n\nKetua OSIS terpilih menyampaikan komitmen untuk menjalankan program kerja yang inovatif serta membuka kanal aspirasi digital yang dapat diakses seluruh siswa melalui website ini.',
   'Organisasi', 'Sekbid 9 - TIK', '2026-08-03 08:00:00+07'),
  ('Semarak Peringatan Maulid Nabi di Smaga', 'semarak-maulid-nabi-smaga',
   'Rangkaian lomba islami dan pengajian meriahkan peringatan Maulid Nabi Muhammad SAW.',
   E'OSIS melalui Sekbid 1 menyelenggarakan peringatan Maulid Nabi Muhammad SAW dengan rangkaian lomba adzan, tartil Al-Qur’an, dan kaligrafi.\n\nAcara ditutup dengan pengajian bersama dan doa untuk kemajuan sekolah.',
   'Kegiatan', 'Sekbid 1', '2026-08-26 10:00:00+07'),
  ('Kanal Aspirasi Digital Resmi Dibuka', 'kanal-aspirasi-digital-dibuka',
   'Kini siswa dapat menyampaikan aspirasi, kritik, dan saran secara online dan dapat dilacak statusnya.',
   E'OSIS SMA Negeri 3 Rembang meluncurkan Kanal Aspirasi Digital. Siswa dapat mengirim aspirasi (boleh anonim) melalui menu Aspirasi, lalu mendapatkan kode tiket untuk memantau tindak lanjutnya.\n\nSetiap aspirasi akan dibahas dalam rapat pengurus dan ditanggapi secara terbuka.',
   'Pengumuman', 'Sekbid 9 - TIK', '2026-09-10 07:30:00+07');

insert into public.events (title, description, date, time, location, category) values
  ('Rapat Pleno Pengurus OSIS', 'Evaluasi bulanan program kerja.', '2026-10-03', '13:30', 'Ruang OSIS', 'Rapat'),
  ('LDKS OSIS & MPK', 'Latihan Dasar Kepemimpinan Siswa.', '2026-10-17', '07:00', 'Lapangan & Aula', 'Pelatihan'),
  ('Upacara Hari Sumpah Pemuda', 'Upacara bendera memperingati Sumpah Pemuda.', '2026-10-28', '07:00', 'Lapangan Utama', 'Upacara'),
  ('Pensi Bulan Bahasa', 'Puncak acara bulan bahasa.', '2026-10-31', '08:00', 'Aula Sekolah', 'Seni'),
  ('Smaga Cup 2026', 'Turnamen futsal, voli, dan basket.', '2026-11-09', '07:30', 'GOR & Lapangan', 'Olahraga'),
  ('Peringatan Hari Guru Nasional', 'Apresiasi untuk bapak/ibu guru.', '2026-11-25', '07:00', 'Lapangan Utama', 'Upacara'),
  ('Classmeeting Semester Gasal', 'Lomba antar-kelas setelah PAS.', '2026-12-14', '07:30', 'Lingkungan Sekolah', 'Olahraga');

insert into public.aspirations (ticket, name, class_name, category, message, anonymous, status, response) values
  ('ASP-DEMO01', null, null, 'Fasilitas', 'Mohon kran air di dekat musala diperbaiki karena sering bocor.', true, 'selesai', 'Terima kasih! Sudah diteruskan ke Waka Sarpras dan kran telah diperbaiki.'),
  ('ASP-DEMO02', 'Siswa Contoh', 'X-4', 'Kegiatan', 'Usul diadakan lomba e-sport saat classmeeting.', false, 'diproses', 'Usulan sedang dibahas bersama Sekbid 4 dan pembina.')
on conflict (ticket) do nothing;
