# 🗳️ Web App Pemilihan Ketua OSIS

Aplikasi web voting digital pemilihan ketua OSIS — **Next.js + Supabase**.

Fitur:

- ✅ **1 orang 1 suara** — diverifikasi di level database (Postgres), bukan cuma di UI
- 🔐 Login pemilih: **NIS + password** (dibuat oleh admin)
- 👤 Halaman kandidat: foto, slogan, visi & misi
- 🗳️ Alur voting dengan konfirmasi ganda
- 📊 Halaman hasil **live** (auto-refresh 5 detik) dengan partisipasi & persentase
- 🔒 Halaman hasil bisa **dibuka/ditutup oleh admin** kapan saja
-  Periode voting (mulai–selesai) yang bisa diatur
- 🧑💼 Panel admin: dashboard, kelola kandidat, impor pemilih massal, pengaturan, reset
- 🎭 **Mode demo** otomatis: tanpa kredensial Supabase, aplikasi tetap jalan penuh dengan data contoh di browser

## Menjalankan Lokal

```bash
npm install
npm run dev        # http://localhost:3000
```

Tanpa konfigurasi apa pun, aplikasi masuk **mode demo**:

| Role    | Akses                        |
| ------- | ---------------------------- |
| Pemilih | NIS `2025001` … `2025024`, password `siswa123` |
| Admin   | /admin, kunci `admin123`     |

> ⚠️ Data demo hanya disimpan di browser (localStorage). Bersihkan lewat
> /admin → Zona Bahaya → *Reset Data Demo*.

## Menyiapkan Backend Supabase (Sekali Saja)

1. Buat akun & project baru di [supabase.com](https://supabase.com) (gratis cukup).
2. Buka **SQL Editor** di dashboard project → *New query*.
3. Salin **seluruh** isi [`supabase/setup.sql`](supabase/setup.sql) dan **Run**.
   - Membuat tabel `settings`, `candidates`, `voters`, `votes`
   - Membuat fungsi aman (vote, admin) + Row Level Security
   - Menyiapkan 3 kandidat contoh
   - *(Opsional)* blok di bagian bawah skrip membuat 10 pemilih demo
4. Ambil kredensial: **Project Settings → API** →
   - `Project URL`
   - `anon public key`
5. Salin `.env.example` menjadi `.env.local` dan isi:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
   ```

6. Restart `npm run dev` — aplikasi langsung terhubung ke database asli.

## Alur Penggunaan

1. **Admin** (/admin, kunci awal `admin123`):
   - Tab **Pengaturan**: isi nama sekolah, tahun ajaran, periode voting,
     lalu nyalakan *Buka voting*. **Ganti kunci admin secepatnya!**
   - Tab **Pemilih**: impor massal siswa, format satu baris:
     `NIS;Nama;Kelas;Password`
   - Tab **Kandidat**: tambah/edit kandidat (nomor urut, foto, visi misi).
   - Saat voting selesai: matikan *Buka voting*, nyalakan *Tampilkan hasil publik*.
2. **Siswa**: buka aplikasi → login NIS+password → pilih kandidat →
   konfirmasi → selesai.

## Keamanan

- Password pemilih & admin disimpan **ter-hash** (bcrypt) di database.
- Row Level Security aktif: role anon **tidak bisa** membaca/menulis tabel
  `voters`/`votes` secara langsung; semua operasi lewat fungsi
  `SECURITY DEFINER` di Postgres.
- Pencegahan vote ganda dijaga `UNIQUE(voter_id)` di tabel `votes`.
- Halaman hasil hanya menampilkan data bila admin menyalakannya.
- Kunci admin & password siswa **hanya** dikirim saat dibutuhkan (RPC),
  tidak disimpan di localStorage (password siswa hanya di sessionStorage
  selama sesi tab, untuk verifikasi kirim suara).

## Deploy (Vercel)

1. Push repository ke GitHub → import di [vercel.com](https://vercel.com).
2. Tambahkan Environment Variables:
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. Deploy. Selesai — database tetap di Supabase.

## Struktur

```
app/               # halaman (landing, login, candidates, vote, results, admin)
components/        # Header, Avatar
lib/               # types, helper format, adapter Supabase, mock demo
supabase/setup.sql # skrip inisialisasi database (tabel + RLS + fungsi + seed)
```
