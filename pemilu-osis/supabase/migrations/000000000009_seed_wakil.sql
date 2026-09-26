-- Perbarui data calon: tambahkan wakil_name & wakil_class_name, perbarui nama & kelas
update public.candidates set
  name = 'Anindya Aya Kurniawan',
  class_name = 'XI.10',
  wakil_name = 'Rizky Pratama',
  wakil_class_name = 'XI.10',
  slogan = 'Bersama Wujudkan OSIS yang Lebih Baik',
  vision = 'Terwujudnya OSIS yang inovatif dan inklusif sebagai wadah aktualisasi diri seluruh siswa SMA Negeri 3 Rembang.',
  mission = E'- Membuka ruang kreativitas melalui festival seni, budaya, dan teknologi\n- Digitalisasi pengumuman dan administrasi OSIS\n- Menampung aspirasi siswa melalui kotak saran digital\n- Menjalin kerja sama dengan komunitas pelajar se-Rembang'
where number = 1;

update public.candidates set
  name = 'Dinda Aulia Oktavani',
  class_name = 'XI.10',
  wakil_name = 'Siti Nuraini',
  wakil_class_name = 'XI.10',
  slogan = 'Kreatif, Kolaboratif, Berkarakter',
  vision = 'OSIS menjadi rumah kedua yang membina karakter, mengasah potensi, dan mempererat kebersamaan seluruh warga sekolah.',
  mission = E'- Program mentoring antarangkatan dan buddy system\n- Penguatan kegiatan keagamaan dan pembiasaan akhlak\n- Lomba intra-kelas setiap semester untuk menyatukan kelas\n- Publikasi prestasi siswa di media sosial sekolah'
where number = 2;

update public.candidates set
  name = 'Muhammad Anzil Arriski',
  class_name = 'XI.10',
  wakil_name = 'Budi Santoso',
  wakil_class_name = 'XI.10',
  slogan = 'Suaramu, Wujudkan!',
  vision = 'Setiap aspirasi siswa menjadi nyata melalui program kerja OSIS yang transparan dan berbasis kebutuhan siswa.',
  mission = E'- Survei kebutuhan siswa awal periode sebagai dasar progker\n- Transparansi anggaran dan laporan kegiatan bulanan\n- Revitalisasi fasilitas olahraga dan taman baca\n- Forum rutin siswa-pengurus untuk menampung kritik & saran'
where number = 3;