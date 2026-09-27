// Data contoh awal. Semua nama pengurus adalah CONTOH dan dapat diubah melalui panel admin.

export function seed(db) {
  const setSetting = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
  const settings = {
    org_name: 'OSIS SMA Negeri 3 Rembang',
    school_name: 'SMA Negeri 3 Rembang',
    period: '2026/2027',
    cabinet_name: 'Kabinet Cakrawala Aksara',
    tagline: 'Bergerak Bersama, Berkarya untuk Smaga',
    about:
      'Organisasi Siswa Intra Sekolah (OSIS) SMA Negeri 3 Rembang adalah wadah resmi bagi seluruh siswa untuk mengembangkan potensi, menyalurkan aspirasi, dan berperan aktif dalam membangun lingkungan sekolah yang religius, berprestasi, dan berkarakter.',
    vision:
      'Mewujudkan OSIS SMA Negeri 3 Rembang sebagai organisasi yang religius, inovatif, kolaboratif, dan menjadi teladan dalam membangun budaya sekolah yang berprestasi dan berkarakter Pancasila.',
    missions: JSON.stringify([
      'Meningkatkan keimanan dan ketakwaan warga sekolah melalui kegiatan keagamaan yang rutin dan bermakna.',
      'Menjadi jembatan aspirasi yang transparan antara siswa, guru, dan pihak sekolah.',
      'Mengembangkan minat, bakat, dan prestasi siswa di bidang akademik maupun non-akademik.',
      'Membangun budaya literasi, kreativitas, dan pemanfaatan teknologi secara positif.',
      'Menumbuhkan kepedulian sosial dan cinta lingkungan di lingkungan sekolah dan masyarakat.',
    ]),
    chairman_message:
      'Assalamu’alaikum warahmatullahi wabarakatuh. Terima kasih atas kepercayaan seluruh warga SMA Negeri 3 Rembang. Bersama Kabinet Cakrawala Aksara, kami berkomitmen menghadirkan OSIS yang terbuka, mendengar, dan bergerak nyata. Mari kita wujudkan Smaga yang lebih hebat, bersama!',
    address: 'Jl. Gajah Mada No. 8, Pantiharjo, Kec. Kaliori, Kab. Rembang, Jawa Tengah',
    email: 'osis@sma3rembang.sch.id',
    phone: '(0295) 691280',
    instagram: 'osis.smagarembang',
    youtube: '',
    tiktok: '',
    maps_embed:
      'https://www.google.com/maps?q=SMA+Negeri+3+Rembang&output=embed',
  };
  for (const [k, v] of Object.entries(settings)) setSetting.run(k, v);

  const divisions = [
    ['Keimanan dan Ketakwaan terhadap Tuhan YME', 'Sekbid 1', 'Menyelenggarakan kegiatan keagamaan dan peringatan hari besar keagamaan.', 'Moon'],
    ['Budi Pekerti Luhur dan Akhlak Mulia', 'Sekbid 2', 'Menanamkan nilai sopan santun, disiplin, dan etika di lingkungan sekolah.', 'Heart'],
    ['Kepribadian Unggul, Wawasan Kebangsaan & Bela Negara', 'Sekbid 3', 'Upacara, LDKS, dan kegiatan cinta tanah air.', 'Flag'],
    ['Prestasi Akademik, Seni, dan Olahraga', 'Sekbid 4', 'Mengembangkan dan mewadahi prestasi siswa di berbagai bidang.', 'Trophy'],
    ['Demokrasi, HAM, Politik, Lingkungan Hidup & Toleransi Sosial', 'Sekbid 5', 'Pemilos, bakti sosial, dan gerakan peduli lingkungan.', 'Vote'],
    ['Kreativitas, Keterampilan, dan Kewirausahaan', 'Sekbid 6', 'Market day, bazar, dan pelatihan kewirausahaan siswa.', 'Lightbulb'],
    ['Kualitas Jasmani, Kesehatan, dan Gizi', 'Sekbid 7', 'Senam bersama, classmeeting olahraga, dan kampanye hidup sehat.', 'Activity'],
    ['Sastra dan Budaya', 'Sekbid 8', 'Pentas seni, bulan bahasa, dan pelestarian budaya lokal Rembang.', 'Palette'],
    ['Teknologi Informasi dan Komunikasi', 'Sekbid 9', 'Pengelolaan media sosial, website, dan dokumentasi OSIS.', 'Monitor'],
    ['Komunikasi dalam Bahasa Inggris', 'Sekbid 10', 'English day, debate club, dan lomba berbahasa Inggris.', 'Languages'],
  ];
  const insDiv = db.prepare('INSERT INTO divisions (name, short, description, icon, sort_order) VALUES (?,?,?,?,?)');
  const divIds = divisions.map((d, i) => insDiv.run(d[0], d[1], d[2], d[3], i + 1).lastInsertRowid);

  const insMember = db.prepare(
    'INSERT INTO members (name, position, class_name, division_id, is_core, quote, sort_order) VALUES (?,?,?,?,?,?,?)'
  );
  const core = [
    ['Nama Ketua OSIS', 'Ketua OSIS', 'XI-1', 'Pemimpin yang baik adalah pendengar yang baik.'],
    ['Nama Wakil Ketua I', 'Wakil Ketua I', 'XI-2', 'Kolaborasi adalah kunci.'],
    ['Nama Wakil Ketua II', 'Wakil Ketua II', 'X-3', 'Kecil langkahnya, besar dampaknya.'],
    ['Nama Sekretaris I', 'Sekretaris I', 'XI-3', 'Rapi administrasi, lancar organisasi.'],
    ['Nama Sekretaris II', 'Sekretaris II', 'X-1', ''],
    ['Nama Bendahara I', 'Bendahara I', 'XI-4', 'Transparan dan amanah.'],
    ['Nama Bendahara II', 'Bendahara II', 'X-2', ''],
  ];
  core.forEach((m, i) => insMember.run(m[0], m[1], m[2], null, 1, m[3], i + 1));
  divIds.forEach((id, i) => {
    insMember.run(`Koordinator Sekbid ${i + 1}`, 'Koordinator', 'XI', id, 0, '', 1);
    insMember.run(`Anggota Sekbid ${i + 1} A`, 'Anggota', 'X', id, 0, '', 2);
    insMember.run(`Anggota Sekbid ${i + 1} B`, 'Anggota', 'X', id, 0, '', 3);
  });

  const insProg = db.prepare(
    'INSERT INTO programs (title, description, division_id, target, start_date, end_date, status, progress) VALUES (?,?,?,?,?,?,?,?)'
  );
  const programs = [
    ['Jumat Berkah & Kajian Rutin', 'Kajian keagamaan dan berbagi takjil/sarapan setiap hari Jumat.', 0, 'Seluruh siswa', '2026-08-01', '2027-06-30', 'berjalan', 35],
    ['Peringatan Maulid Nabi Muhammad SAW', 'Pengajian dan lomba islami dalam rangka Maulid Nabi.', 0, 'Seluruh warga sekolah', '2026-08-25', '2026-08-25', 'selesai', 100],
    ['Gerakan 5S (Senyum, Sapa, Salam, Sopan, Santun)', 'Piket penyambutan siswa di gerbang sekolah setiap pagi.', 1, 'Seluruh siswa', '2026-07-20', '2027-06-30', 'berjalan', 40],
    ['LDKS Pengurus OSIS & MPK', 'Latihan Dasar Kepemimpinan Siswa untuk pengurus baru.', 2, 'Pengurus OSIS & MPK', '2026-10-17', '2026-10-18', 'rencana', 20],
    ['Upacara Hari Sumpah Pemuda', 'Upacara dan lomba bertema kepemudaan.', 2, 'Seluruh siswa', '2026-10-28', '2026-10-28', 'rencana', 10],
    ['Smaga Cup 2026', 'Turnamen olahraga antar-kelas dan antar-SMP se-Kabupaten Rembang.', 3, 'Siswa & SMP se-Rembang', '2026-11-09', '2026-11-14', 'rencana', 15],
    ['Pemilihan Ketua OSIS (Pemilos) Digital', 'Pemilihan ketua OSIS periode berikutnya secara digital dan jujur.', 4, 'Seluruh siswa', '2027-08-01', '2027-08-15', 'rencana', 0],
    ['Smaga Go Green', 'Penanaman pohon, bank sampah, dan lomba kebersihan kelas.', 4, 'Seluruh kelas', '2026-09-01', '2027-05-31', 'berjalan', 25],
    ['Market Day Smaga', 'Bazar kewirausahaan siswa per kelas.', 5, 'Seluruh kelas', '2027-02-20', '2027-02-20', 'rencana', 0],
    ['Senam Sehat Jumat', 'Senam bersama seluruh warga sekolah.', 6, 'Seluruh warga sekolah', '2026-08-01', '2027-06-30', 'berjalan', 35],
    ['Pensi & Bulan Bahasa', 'Pentas seni, musikalisasi puisi, dan lomba bahasa.', 7, 'Seluruh siswa', '2026-10-01', '2026-10-31', 'rencana', 30],
    ['Smaga Media Center', 'Pengelolaan konten Instagram, TikTok, dan website OSIS.', 8, 'Publik', '2026-07-15', '2027-06-30', 'berjalan', 45],
    ['English Day Every Wednesday', 'Pembiasaan berbahasa Inggris setiap hari Rabu.', 9, 'Seluruh siswa', '2026-09-02', '2027-06-30', 'berjalan', 20],
  ];
  programs.forEach((p) => insProg.run(p[0], p[1], divIds[p[2]], p[3], p[4], p[5], p[6], p[7]));

  const insPost = db.prepare(
    'INSERT INTO posts (title, slug, excerpt, content, category, author, created_at) VALUES (?,?,?,?,?,?,?)'
  );
  insPost.run(
    'Pelantikan Pengurus OSIS Periode 2026/2027',
    'pelantikan-pengurus-osis-2026-2027',
    'Pengurus OSIS SMA Negeri 3 Rembang Kabinet Cakrawala Aksara resmi dilantik oleh Kepala Sekolah.',
    'Pengurus OSIS SMA Negeri 3 Rembang periode 2026/2027 resmi dilantik dalam upacara bendera yang diikuti seluruh warga sekolah.\n\nDalam sambutannya, Kepala Sekolah berpesan agar pengurus baru menjadi teladan, amanah, dan mampu menjadi jembatan aspirasi siswa.\n\nKetua OSIS terpilih menyampaikan komitmen untuk menjalankan program kerja yang inovatif serta membuka kanal aspirasi digital yang dapat diakses seluruh siswa melalui website ini.',
    'Organisasi',
    'Sekbid 9 - TIK',
    '2026-08-03 08:00:00'
  );
  insPost.run(
    'Semarak Peringatan Maulid Nabi di Smaga',
    'semarak-maulid-nabi-smaga',
    'Rangkaian lomba islami dan pengajian meriahkan peringatan Maulid Nabi Muhammad SAW.',
    'OSIS melalui Sekbid 1 menyelenggarakan peringatan Maulid Nabi Muhammad SAW dengan rangkaian lomba adzan, tartil Al-Qur’an, dan kaligrafi.\n\nAcara ditutup dengan pengajian bersama dan doa untuk kemajuan sekolah.',
    'Kegiatan',
    'Sekbid 1',
    '2026-08-26 10:00:00'
  );
  insPost.run(
    'Kanal Aspirasi Digital Resmi Dibuka',
    'kanal-aspirasi-digital-dibuka',
    'Kini siswa dapat menyampaikan aspirasi, kritik, dan saran secara online dan dapat dilacak statusnya.',
    'OSIS SMA Negeri 3 Rembang meluncurkan Kanal Aspirasi Digital. Siswa dapat mengirim aspirasi (boleh anonim) melalui menu Aspirasi, lalu mendapatkan kode tiket untuk memantau tindak lanjutnya.\n\nSetiap aspirasi akan dibahas dalam rapat pengurus dan ditanggapi secara terbuka.',
    'Pengumuman',
    'Sekbid 9 - TIK',
    '2026-09-10 07:30:00'
  );

  const insEvent = db.prepare(
    'INSERT INTO events (title, description, date, time, location, category) VALUES (?,?,?,?,?,?)'
  );
  [
    ['Rapat Pleno Pengurus OSIS', 'Evaluasi bulanan program kerja.', '2026-10-03', '13:30', 'Ruang OSIS', 'Rapat'],
    ['LDKS OSIS & MPK', 'Latihan Dasar Kepemimpinan Siswa.', '2026-10-17', '07:00', 'Lapangan & Aula', 'Pelatihan'],
    ['Upacara Hari Sumpah Pemuda', 'Upacara bendera memperingati Sumpah Pemuda.', '2026-10-28', '07:00', 'Lapangan Utama', 'Upacara'],
    ['Pensi Bulan Bahasa', 'Puncak acara bulan bahasa.', '2026-10-31', '08:00', 'Aula Sekolah', 'Seni'],
    ['Smaga Cup 2026', 'Turnamen futsal, voli, dan basket.', '2026-11-09', '07:30', 'GOR & Lapangan', 'Olahraga'],
    ['Peringatan Hari Guru Nasional', 'Apresiasi untuk bapak/ibu guru.', '2026-11-25', '07:00', 'Lapangan Utama', 'Upacara'],
    ['Classmeeting Semester Gasal', 'Lomba antar-kelas setelah PAS.', '2026-12-14', '07:30', 'Lingkungan Sekolah', 'Olahraga'],
  ].forEach((e) => insEvent.run(...e));

  const insAsp = db.prepare(
    'INSERT INTO aspirations (ticket, name, class_name, category, message, anonymous, status, response) VALUES (?,?,?,?,?,?,?,?)'
  );
  insAsp.run('ASP-DEMO01', null, null, 'Fasilitas', 'Mohon kran air di dekat musala diperbaiki karena sering bocor.', 1, 'selesai', 'Terima kasih! Sudah diteruskan ke Waka Sarpras dan kran telah diperbaiki.');
  insAsp.run('ASP-DEMO02', 'Siswa Contoh', 'X-4', 'Kegiatan', 'Usul diadakan lomba e-sport saat classmeeting.', 0, 'diproses', 'Usulan sedang dibahas bersama Sekbid 4 dan pembina.');
}
