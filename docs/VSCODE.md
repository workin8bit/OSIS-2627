# Menjalankan Proyek di VS Code

Panduan dari nol sampai website jalan di komputer Anda, plus cara memakai skill **web-design-engineer** lewat GitHub Copilot.

## 1. Siapkan perangkat lunak

| Aplikasi | Keterangan |
|---|---|
| [Node.js](https://nodejs.org) **v20 atau lebih baru** (pilih LTS) | Cek: `node -v` |
| [Git](https://git-scm.com/downloads) | Cek: `git --version` |
| [VS Code](https://code.visualstudio.com) | — |
| Akun GitHub dengan **GitHub Copilot** | Untuk memakai skill lewat Copilot Chat mode **Agent**. Ketersediaan & kuota tergantung paket Copilot Anda |

## 2. Ambil kode

Di VS Code: **Ctrl+Shift+P → `Git: Clone`** → tempel URL berikut → pilih folder.

```
https://github.com/workin8bit/OSIS-2627.git
```

> Kode aplikasi saat ini ada di branch **`arena/01a0e065-osis-2627`** (branch `main` masih kosong).
> Setelah clone, klik nama branch di pojok kiri bawah VS Code → pilih `origin/arena/01a0e065-osis-2627`.
> Atau lewat terminal: `git clone -b arena/01a0e065-osis-2627 https://github.com/workin8bit/OSIS-2627.git`

Saat folder terbuka, VS Code akan bertanya **"Do you trust the authors?"** → pilih **Yes** (diperlukan agar Copilot, task, dan skill aktif).

## 3. Pasang ekstensi yang direkomendasikan

VS Code akan menampilkan notifikasi *"This workspace has extension recommendations"* → klik **Install All**.
(Atau buka panel Extensions → ketik `@recommended`.)

| Ekstensi | Fungsi |
|---|---|
| GitHub Copilot Chat | Chat AI + agent mode + skill |
| Tailwind CSS IntelliSense | Autocomplete kelas Tailwind & warna `ink-*` (arang) / `sun-*` (kuning) |
| Oxc | Menampilkan peringatan lint langsung di editor |
| Deno | Hanya untuk file Edge Function di `supabase/functions` |

## 4. Install dependensi

Buka terminal: **Ctrl+`** (backtick), lalu:

```bash
npm run setup
```

## 5. Hubungkan ke Supabase

Buat file **`client/.env`** (klik kanan folder `client` → New File → `.env`) berisi:

```
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Nilainya dari Supabase Dashboard → **Project Settings → API Keys / Data API**. File ini tidak ikut ter-upload ke GitHub (sudah di `.gitignore`).

Jika database belum disiapkan, jalankan dulu isi `supabase/setup.sql` di **SQL Editor** Supabase (lihat `README.md` langkah 2–4).

## 6. Jalankan website

Pilih salah satu:

- **F5** → menjalankan dev server lalu otomatis membuka Chrome/Edge dengan debugger terpasang (breakpoint di file `.jsx` langsung berfungsi).
- **Ctrl+Shift+B** → hanya menjalankan dev server, lalu buka http://localhost:5173.
- Terminal: `npm run dev`.

Task lain tersedia di **Ctrl+Shift+P → `Tasks: Run Task`**:

| Task | Fungsi |
|---|---|
| Dev server (Vite) | Menjalankan website dengan hot reload |
| Build produksi | Membuat `client/dist` untuk di-deploy |
| Lint (oxlint) | Memeriksa kode |
| Tes database (PGlite) | Menguji skema, RLS, dan fungsi Supabase secara lokal |
| Buat ulang supabase/setup.sql | Setelah mengubah file migrasi/seed |

## 7. Memakai skill web-design-engineer

Skill sudah terpasang di `.claude/skills/web-design-engineer/` — VS Code membacanya otomatis dari folder itu (selain `.github/skills/` dan `.agents/skills/`). Tidak perlu instalasi tambahan.

**Cek skill terdeteksi:** buka Copilot Chat (**Ctrl+Alt+I**), ketik `/skills` → `web-design-engineer` harus muncul. Atau **Ctrl+Shift+P → `Chat: Open Customizations`** → tab **Skills**.

**Cara memakai:**
1. Di Copilot Chat, pastikan mode **Agent** dipilih (dropdown di bawah kotak chat).
2. Panggil langsung dengan slash command, atau cukup minta dengan bahasa biasa — Copilot memuat skill otomatis bila permintaannya cocok.

Contoh perintah:

```
/web-design-engineer Kritik tampilan halaman beranda (client/src/pages/Home.jsx)
dan beri skor per aspek sebelum mengubah apa pun.
```

```
/web-design-engineer Perbaiki halaman Agenda agar lebih nyaman dibaca di HP.
Pertahankan rute, warna brand, dan pemanggilan data yang sudah ada.
```

```
Rancang ulang kartu pengurus di halaman Struktur supaya lebih elegan,
pakai token warna di index.css.
```

Copilot juga otomatis membaca **`AGENTS.md`** di root repo, yang berisi aturan penerapan skill di proyek ini (misalnya: Tailwind dipasang lewat build, bukan CDN; jangan menggambar ulang logo; jangan mengarang data). Anda tidak perlu mengulang aturan itu di setiap chat.

> Tips: sertakan file yang relevan dengan mengetik `#` di chat (misalnya `#Home.jsx`) atau seret file ke kotak chat. Untuk kritik visual, lampirkan **screenshot** halaman.

## Masalah umum

| Gejala | Solusi |
|---|---|
| Halaman "Supabase belum dikonfigurasi" | `client/.env` belum ada / salah nama variabel → perbaiki lalu **restart** dev server |
| Halaman "Database belum disiapkan" | Jalankan `supabase/setup.sql` di SQL Editor Supabase, lalu klik **Periksa Lagi** |
| `/skills` tidak menampilkan web-design-engineer | Pastikan folder dibuka sebagai root repo (bukan subfolder `client/`) dan workspace sudah di-*trust*; lalu **Ctrl+Shift+P → `Developer: Reload Window`** |
| `npm` tidak dikenali (Windows) | Tutup & buka ulang VS Code setelah memasang Node.js |
| Autocomplete Tailwind tidak muncul | Pastikan ekstensi Tailwind CSS IntelliSense terpasang; buka file `.jsx` dan ketik di dalam `className=""` |
