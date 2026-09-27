# OSIS SMA Negeri 3 Rembang — Periode 2026/2027

Aplikasi web full stack untuk OSIS SMA Negeri 3 Rembang: website publik dan panel admin untuk pengurus.

**Stack:** React 19 + Vite + Tailwind CSS v4 (frontend) · Node.js + Express 5 + SQLite (`better-sqlite3`) (backend) · JWT untuk autentikasi.

## Fitur

### Website Publik
| Halaman | Isi |
|---|---|
| **Beranda** | Hero, statistik, sambutan ketua, program berjalan, berita terbaru, agenda terdekat |
| **Profil** | Tentang OSIS, visi & misi, 10 seksi bidang, peta lokasi |
| **Pengurus** | Struktur pengurus inti & anggota tiap sekbid |
| **Program Kerja** | Daftar proker lengkap dengan status, progres, filter & pencarian |
| **Berita** | Daftar berita (kategori, pencarian, paginasi) & halaman detail |
| **Agenda** | Kalender bulanan interaktif + daftar kegiatan akan datang |
| **Galeri** | Galeri foto dengan album & lightbox |
| **Aspirasi** | Formulir aspirasi (boleh anonim), **kode tiket** untuk melacak status, daftar aspirasi yang sudah ditindaklanjuti |

### Panel Admin (`/admin`)
- Dashboard ringkasan (aspirasi baru, status proker, agenda terdekat)
- Kelola **aspirasi** (ubah status + beri tanggapan)
- CRUD **berita** (dengan unggah gambar sampul, draf/terbit)
- CRUD **agenda**, **program kerja** (progres %), **pengurus** (foto), **seksi bidang**, **galeri**
- **Pengaturan situs**: identitas, nama kabinet, visi, misi, sambutan, kontak, media sosial
- **Akun**: ubah password, tambah/hapus admin (khusus superadmin)

## Menjalankan

Butuh Node.js 20+.

```bash
npm run setup     # install dependensi server + client, lalu build frontend
npm start         # jalankan server di http://localhost:3000
```

Server Express melayani API (`/api`) sekaligus hasil build frontend.

**Login admin default:** `admin` / `osis2627` — **segera ganti password** lewat menu *Akun & Admin*.

### Mode development (hot reload)

```bash
npm run dev:server   # API di :3000
npm run dev:client   # Vite di :5173 (proxy /api & /uploads ke :3000)
```

### Variabel lingkungan (opsional)

| Variabel | Default | Keterangan |
|---|---|---|
| `PORT` | `3000` | Port server |
| `HOST` | `0.0.0.0` | Host bind |
| `DATA_DIR` | `server/data` | Lokasi database SQLite & folder unggahan |
| `JWT_SECRET` | otomatis dibuat | Secret untuk token login |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | `admin` / `osis2627` | Akun admin pertama (hanya dipakai saat database masih kosong) |
| `SKIP_SEED` | – | Isi `1` untuk memulai tanpa data contoh |

## Struktur Proyek

```
├── client/                 # Frontend React
│   ├── public/             # favicon/logo & gambar hero
│   └── src/
│       ├── components/     # Layout (navbar, footer) & komponen UI
│       ├── lib/            # API client, context (auth, settings, toast), format tanggal
│       └── pages/          # Halaman publik + admin/
└── server/                 # Backend Express
    └── src/
        ├── index.js        # Routing API
        ├── db.js           # Skema database SQLite
        └── seed.js         # Data contoh awal
```

## Catatan

- Nama pengurus di data awal hanyalah **contoh**; ganti melalui panel admin → Pengurus.
- Database dan foto unggahan disimpan di `server/data/` (tidak ikut Git). Cadangkan folder ini secara berkala.
- Formulir aspirasi dibatasi 5 kiriman per 10 menit per IP untuk mencegah spam.
