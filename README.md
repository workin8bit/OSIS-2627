# OSIS SMA Negeri 3 Rembang — Periode 2026/2027

Aplikasi web full stack untuk OSIS SMA Negeri 3 Rembang: website publik dan panel admin pengurus.

**Stack**
- **Frontend:** React 19 + Vite + Tailwind CSS v4 (SPA statis)
- **Backend:** [Supabase](https://supabase.com)
  - **Postgres** + Row Level Security (RLS) untuk semua data
  - **Auth** (email + password) untuk login admin
  - **Storage** (bucket `media`) untuk foto & gambar
  - **Fungsi RPC Postgres** untuk aspirasi publik (kirim anonim, lacak tiket, rate limit)
  - **Edge Function** `admin-users` untuk membuat/menghapus akun admin

Tidak ada server Node sendiri — frontend langsung berbicara dengan Supabase, dan keamanan dijamin oleh kebijakan RLS di database.

## Fitur

### Website Publik
| Halaman | Isi |
|---|---|
| **Beranda** | Hero, statistik, sambutan ketua, program berjalan, berita terbaru, agenda terdekat |
| **Profil** | Tentang OSIS, visi & misi, 10 seksi bidang, peta lokasi |
| **Pengurus** | Struktur pengurus inti & anggota tiap sekbid |
| **Program Kerja** | Status, progres, filter & pencarian |
| **Berita** | Kategori, pencarian, paginasi & halaman detail |
| **Agenda** | Kalender bulanan interaktif |
| **Galeri** | Album foto dengan lightbox |
| **Aspirasi** | Formulir aspirasi (boleh anonim) → **kode tiket** untuk melacak status |

### Panel Admin (`/admin`)
Dashboard · kelola aspirasi (status + tanggapan) · CRUD berita, agenda, program kerja, pengurus, sekbid, galeri (unggah ke Supabase Storage) · pengaturan situs · ubah password · tambah/hapus admin (superadmin).

## Keamanan (RLS)

| Tabel | Publik (anon) | Admin |
|---|---|---|
| `settings`, `divisions`, `members`, `programs`, `events`, `gallery` | baca | baca & tulis |
| `posts` | baca yang **terbit** saja | baca & tulis |
| `aspirations` | ❌ tidak ada akses langsung — hanya lewat RPC `submit_aspiration`, `track_aspiration`, `public_aspirations` (tanpa identitas pengirim) | baca, ubah, hapus |
| `admins` | ❌ | baca; tulis khusus superadmin |
| Storage `media` | baca | unggah/ubah/hapus |

Admin = user Supabase Auth yang terdaftar di tabel `public.admins`. User login yang tidak ada di tabel itu tidak punya hak apa pun.

---

## Cara Memasang

### 1. Buat proyek Supabase
Buat proyek baru di [supabase.com/dashboard](https://supabase.com/dashboard) (region **Southeast Asia (Singapore)** disarankan).

### 2. Jalankan migrasi database
Buka **SQL Editor → New query**, tempel **seluruh** isi file [`supabase/setup.sql`](supabase/setup.sql), lalu klik **Run**.
File ini berisi skema (tabel, RLS, fungsi, bucket storage) + data contoh, dan aman dijalankan ulang (data contoh hanya dimasukkan bila tabel masih kosong).

> `setup.sql` dibuat otomatis dari `supabase/migrations/` + `supabase/seed.sql`. Setelah mengubah salah satunya, jalankan `npm run build:sql`.

<details><summary>Atau dengan Supabase CLI</summary>

```bash
npx supabase login
npx supabase link --project-ref <PROJECT_REF>
npx supabase db push          # menjalankan migrasi
psql "<CONNECTION_STRING>" -f supabase/seed.sql   # data contoh (opsional)
```
</details>

### 3. Matikan pendaftaran publik
**Authentication → Sign In / Providers → Email**: nonaktifkan **Allow new users to sign up**. Akun admin dibuat oleh superadmin, bukan daftar sendiri.

### 4. Buat superadmin pertama
1. **Authentication → Users → Add user → Create new user**: isi email & password, centang *Auto Confirm User*.
2. Di **SQL Editor** jalankan (ganti emailnya):
   ```sql
   insert into public.admins (user_id, name, email, role)
   select id, 'Administrator OSIS', email, 'superadmin'
   from auth.users where email = 'admin@contoh.sch.id';
   ```

### 5. Deploy Edge Function (untuk menambah/menghapus admin dari panel)
```bash
npx supabase functions deploy admin-users --project-ref <PROJECT_REF>
```
Tanpa langkah ini semua fitur tetap jalan, hanya menu *Tambah Admin* yang tidak aktif (admin tetap bisa ditambah manual seperti langkah 4).

### 6. Jalankan frontend
```bash
cp client/.env.example client/.env   # isi VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY
npm run setup
npm run dev                          # http://localhost:5173
```
Nilai URL dan anon/publishable key ada di **Project Settings → API** (aman untuk frontend; jangan pernah memakai *service_role key* di frontend).

### 7. Deploy ke hosting
```bash
npm run build     # hasil di client/dist
```
Unggah `client/dist` ke Vercel, Netlify, Cloudflare Pages, dsb. (sudah ada `vercel.json` & `_redirects` untuk routing SPA). Set environment variable `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` di hosting, lalu tambahkan domain situs ke **Authentication → URL Configuration**.

---

## Pengujian database

Skema, RLS, trigger, dan fungsi RPC diuji dengan Postgres asli (PGlite/WASM) — tanpa Docker:

```bash
npm install
npm run test:db
```

## Struktur Proyek

```
├── client/                       # Frontend React (SPA)
│   ├── public/                   # logo & gambar hero
│   └── src/
│       ├── components/           # Layout & komponen UI
│       ├── lib/
│       │   ├── supabase.js       # inisialisasi client Supabase
│       │   ├── data.js           # semua query / RPC / storage / auth
│       │   └── context.jsx       # auth, settings, toast, useQuery
│       └── pages/                # halaman publik + admin/
└── supabase/
    ├── migrations/               # skema database + RLS + RPC + storage
    ├── functions/admin-users/    # Edge Function manajemen admin
    ├── seed.sql                  # data contoh
    ├── tests/db.test.mjs         # tes database (PGlite)
    └── config.toml               # konfigurasi Supabase CLI
```

## Skill untuk AI Agent

Repo ini menyertakan skill **[web-design-engineer](.claude/skills/web-design-engineer/SKILL.md)** (dari [ConardLi/garden-skills](https://github.com/ConardLi/garden-skills), lisensi MIT) untuk pekerjaan desain antarmuka. Agent seperti Claude Code membacanya otomatis dari `.claude/skills/`; panduan penerapannya di proyek ini ada di [`AGENTS.md`](AGENTS.md).

## Catatan
- Nama pengurus, nama kabinet, dan program di data contoh hanyalah **contoh** — ubah lewat panel admin.
- Aspirasi dibatasi 5 kiriman per 10 menit per IP (di fungsi `submit_aspiration`).
- Paket gratis Supabase akan *pause* proyek yang tidak aktif selama 7 hari; buka dashboard untuk mengaktifkan kembali.
