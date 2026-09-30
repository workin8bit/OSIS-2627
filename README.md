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
Dashboard · kelola aspirasi (status + tanggapan) · CRUD berita, agenda, program kerja, pengurus, sekbid, galeri (unggah ke Supabase Storage) · **Tampilan Siswa** (kelola isi Beranda) · pengaturan situs · ubah password · **Hak Akses** (tambah pengurus yang punya akun, tautkan ke seksi bidang, atur modul per orang).

## Keamanan (RLS)

| Tabel | Publik (anon) | Admin |
|---|---|---|
| `settings`, `divisions`, `members`, `programs`, `events`, `gallery` | baca | sesuai hak akses modul (`read` = lihat, `write` = kelola) |
| `posts` | baca yang **terbit** saja | sesuai hak akses modul `berita` |
| `aspirations` | ❌ tidak ada akses langsung — hanya lewat RPC `submit_aspiration`, `track_aspiration`, `public_aspirations` (tanpa identitas pengirim) | sesuai hak akses modul `aspirasi` |
| `admins` | ❌ | baca; tulis khusus superadmin atau admin yang punya `akun: write` |
| `admin_permissions`, `division_permissions` | ❌ | baca; tulis khusus pengelola akses |
| Storage `media` | baca | unggah/ubah/hapus bila punya `galeri: write` |

Admin = user Supabase Auth yang terdaftar di tabel `public.admins`. User login yang tidak ada di tabel itu tidak punya hak apa pun.

### Hak akses berbasis modul & seksi bidang

- `public.admins.member_id` menautkan akun admin ke baris `members`, sehingga Sekbid-nya diketahui.
- `public.admin_permissions` menyimpan hak akses per admin: `read` (buka halaman) atau `write` (tambah/ubah/hapus).
- `public.division_permissions` adalah template per seksi bidang. RPC `apply_division_template(user_id)` menyalin template itu ke akun admin.
- Modul: `beranda` (Tampilan Siswa), `berita`, `agenda`, `program`, `pengurus`, `sekbid`, `galeri`, `aspirasi`, `pengaturan`, `akun`.
- Superadmin selalu punya akses penuh dan tidak dapat diedit/dihapus oleh admin lain. Tidak ada admin yang dapat mengubah hak akses dirinya sendiri (pencegahan eskalasi).
- Semua aturan ditegakkan RLS lewat fungsi `can_access(module, need)`, jadi menyembunyikan menu di antarmuka bukan satu-satunya pengaman.

---

## Cara Memasang

> 💻 Memakai **VS Code**? Ikuti panduan lengkap di [`docs/VSCODE.md`](docs/VSCODE.md) (ekstensi, tombol F5, dan cara memakai skill lewat Copilot).

### 1. Buat proyek Supabase
Buat proyek baru di [supabase.com/dashboard](https://supabase.com/dashboard) (region **Southeast Asia (Singapore)** disarankan).

### 2. Jalankan migrasi database
Buka **SQL Editor → New query**, tempel **seluruh** isi file [`supabase/setup.sql`](supabase/setup.sql), lalu klik **Run**.
File ini berisi skema (tabel, RLS, fungsi, bucket storage) + data contoh, dan aman dijalankan ulang (data contoh hanya dimasukkan bila tabel masih kosong).

> `setup.sql` dibuat otomatis dari `supabase/migrations/` + `supabase/seed.sql`. Setelah mengubah salah satunya, jalankan `npm run build:sql`.

> **Situs sudah terpasang, tapi hak akses belum aktif?** Error yang muncul adalah `Could not find the 'member_id' column of 'admins' in the schema cache` atau `relation "public.admin_permissions" does not exist`.

#### Cara tercepat: satu perintah dari komputer Anda

Buka **Supabase Dashboard → Project Settings → Database → Database password**, lalu di terminal repo ini:

```powershell
$env:PG_PASSWORD = "password-yang-anda-salin"
npm run db:patch
```

Alternatif tanpa database password — pakai **Personal Access Token** dari [supabase.com/dashboard/account/tokens](https://supabase.com/dashboard/account/tokens):

```powershell
$env:SUPABASE_ACCESS_TOKEN = "sbp_..."
npm run db:patch:api
```

Kedua skrip menjalankan `patch-1` → `patch-2` → `patch-3` berurutan, mencetak hasil verifikasi, memuat ulang cache skema PostgREST, lalu menjalankan patch sekali lagi untuk membuktikan idempoten. Kredensial hanya hidup di environment Powershell sesi itu — tidak pernah ditulis ke repo atau frontend.

Selesai setelah itu: buka `/admin/akses` dengan Ctrl+Shift-R. Pita "Mode sementara" akan hilang otomatis karena tabel resmi sudah terdeteksi.

<details><summary>Alternatif: tempel manual di SQL Editor</summary>

Buka **SQL Editor → New query**, lalu jalankan **satu per satu** (SQL Editor memakai satu transaksi, jadi memecahkannya membuat kesalahan mudah dilacak):

   | Urutan | File | Isi |
   | --- | --- | --- |
   | 1 | [`supabase/patch-1-skema.sql`](supabase/patch-1-skema.sql) | kolom `admins.member_id`, tabel `admin_permissions` & `division_permissions`, fungsi `can_access` / `can_manage_access` / `manages_division` / `apply_division_template` |
   | 2 | [`supabase/patch-2-rls.sql`](supabase/patch-2-rls.sql) | policy RLS untuk tabel publik, anggota, akun admin, dan bucket media |
   | 3 | [`supabase/patch-3-data.sql`](supabase/patch-3-data.sql) | backfill izin admin lama, template seksi bidang, pembersihan anggota contoh, `notify pgrst, 'reload schema'`, dan query verifikasi |

   Ketiganya idempoten (aman dijalankan ulang). Patch 3 ditutup query verifikasi — `kolom_member_id` harus `1`, `tabel_izin` `2`, `jumlah_anggota` `27`, `template_sekbid` `50`.
   Bila `kolom_member_id` sudah `1` tetapi error *schema cache* masih muncul, muat ulang cache lewat **Project Settings → API → Reload schema**, lalu hard refresh browser (Ctrl+Shift+R).

</details>

#### Mode sementara (opsional, tidak memblokir)

Anda **tidak harus** menjalankan patch di atas untuk memakai fitur hak akses. Selama tabel `admins.member_id` / `admin_permissions` belum ada, aplikasi otomatis menyimpan tautan anggota, matriks izin, dan template seksi bidang sebagai JSON pada tabel `settings` yang memang sudah ada (lihat `client/src/lib/access.js`). Halaman **Akun & Hak Akses** menampilkan pita kuning "Mode sementara" beserta tombol:

- **Periksa lagi** — mendeteksi ulang apakah patch sudah terpasang.
- **Pindahkan data ke tabel resmi** — menyalin isi penyimpanan cadangan ke `admins.member_id`, `admin_permissions`, dan `division_permissions` tanpa menimpa data yang sudah ada.

Yang **belum** aktif selama mode sementara: penjagaan di sisi server. RLS masih memakai aturan lama (semua admin boleh mengubah data publik), jadi pembatasan modul baru ditegakkan di antarmuka, bukan di database. Menjalankan ketiga patch menutup celah tersebut. Panel berpindah ke backend native secara otomatis begitu kolomnya terdeteksi.

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
**Opsi A — lewat Dashboard (paling aman, kunci tidak menyentuh komputer lain):**
1. **Authentication → Users → Add user → Create new user**: isi email & password, centang *Auto Confirm User*.
2. Di **SQL Editor** jalankan (ganti emailnya):
   ```sql
   insert into public.admins (user_id, name, email, role)
   select id, 'Administrator OSIS', 'admin@contoh.sch.id', 'superadmin'
   from auth.users where email = 'admin@contoh.sch.id';
   ```

**Opsi B — lewat skrip di komputer Anda sendiri** (butuh *service_role key* dari **Project Settings → API Keys**; jangan pernah menaruh key itu di repo atau di frontend):
```powershell
$env:SUPABASE_URL = "https://<ref>.supabase.co"
$env:SUPABASE_SERVICE_ROLE_KEY = "sb_secret_..."      # atau setx agar permanen
npm run admin:create -- --email superadmin@osissmaga.id --password "osis2627" --name "Administrator OSIS"
```
Skrip membuat user Auth (email langsung terverifikasi) sekaligus.insert baris `admins` ber-role `superadmin`. Jalankan **setelah** migrasi `supabase/migrations/*.sql` terpasang.

<details><summary>Butuh akses database dari komputer sendiri (opsional)</summary>

Semua pekerjaan SQL di halaman ini cukup lewat **SQL Editor** di Dashboard. Bila ingin menjalankan migrasi dari terminal, butuh salah satu dari:

- **Supabase CLI** (disarankan):
  ```bash
  npx supabase login                                  # access token dari supabase.com/dashboard/account/tokens
  npx supabase link --project-ref fawwphybcnxwvwimoqwp
  npx supabase db push
  ```
  `db push` hanya menjalankan berkas di `supabase/migrations/`. Untuk proyek yang database-nya sudah terlanjur terpasang tanpa migrasi hak akses, jalankan `supabase/patch-*.sql` lewat SQL Editor.
- **PostgreSQL langsung** (butuh *database password* dari **Project Settings → Database** dan `psql` terpasang):
  ```bash
  psql "postgresql://postgres.<ref>:<password>@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres" -f supabase/patch-1-skema.sql
  ```
- **Service role key** hanya diperlukan untuk skrip `npm run admin:create`. Key itu tidak dapat menjalankan DDL — untuk itu tetap perlu CLI atau SQL Editor.
</details>

### 5. Deploy Edge Function (untuk menambah/menghapus admin dari panel)
```bash
npx supabase functions deploy admin-users --project-ref <PROJECT_REF>
```
Tanpa langkah ini semua fitur tetap jalan, hanya menambah/mengapus akun dari halaman *Hak Akses* yang tidak aktif (admin tetap bisa ditambah manual seperti langkah 4). Fungsi ini memakai kolom `admins.member_id` dan tabel `admin_permissions`, jadi **deploy ulang** setelah patch skema hak akses dipakai. Fungsi sudah menangani kolom yang belum ada: akun tetap dibuat, hanya tautan ke seksi bidang yang dilewati dan dilaporkan lewat `warning`.

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

Repo ini menyertakan skill **[web-design-engineer](.claude/skills/web-design-engineer/SKILL.md)** (dari [ConardLi/garden-skills](https://github.com/ConardLi/garden-skills), lisensi MIT) untuk pekerjaan desain antarmuka. Agent seperti Claude Code dan **GitHub Copilot di VS Code** membacanya otomatis dari `.claude/skills/` (lihat [`docs/VSCODE.md`](docs/VSCODE.md#7-memakai-skill-web-design-engineer)); panduan penerapannya di proyek ini ada di [`AGENTS.md`](AGENTS.md).

## Catatan
- Nama pengurus, nama kabinet, dan program di data contoh hanyalah **contoh** — ubah lewat panel admin.
- Aspirasi dibatasi 5 kiriman per 10 menit per IP (di fungsi `submit_aspiration`).
- Paket gratis Supabase akan *pause* proyek yang tidak aktif selama 7 hari; buka dashboard untuk mengaktifkan kembali.
