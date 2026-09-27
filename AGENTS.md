# Panduan untuk AI Agent

Website & panel admin **OSIS SMA Negeri 3 Rembang 2026/2027** — React 19 + Vite + Tailwind CSS v4, backend Supabase. Lihat `README.md` untuk setup.

## Skill yang tersedia

| Skill | Lokasi | Kapan dipakai |
|---|---|---|
| **web-design-engineer** | [`.claude/skills/web-design-engineer/SKILL.md`](.claude/skills/web-design-engineer/SKILL.md) | Membuat/merombak tampilan halaman, komponen UI, dashboard admin, kritik desain, atau QA visual |

Skill ini terdeteksi otomatis oleh Claude Code dan GitHub Copilot (VS Code) dari `.claude/skills/`. Baca `SKILL.md` lebih dulu, lalu file di `references/` **hanya sesuai kebutuhan** (lihat tabel *References Routing* di akhir SKILL.md).

### Menerapkan web-design-engineer di proyek ini

Skill tersebut ditulis umum (banyak aturannya untuk prototipe HTML tunggal via CDN). Di repo ini berlaku penyesuaian berikut:

- **Mode kerja = Extension/Preserve** (`references/redesign-protocol.md`): pertahankan rute (`/`, `/profil`, `/struktur`, `/program`, `/berita`, `/agenda`, `/galeri`, `/aspirasi`, `/admin/*`), alur formulir aspirasi, dan lapisan data `client/src/lib/data.js`. Perombakan total hanya bila diminta eksplisit.
- **Design tokens** sudah dideklarasikan di `client/src/index.css` (`@theme`: `brand-*` biru tua, `gold-*` aksen emas, font Plus Jakarta Sans). Gunakan token ini; jangan menambah warna liar.
- **Tailwind di sini dipasang lewat build (`@tailwindcss/vite`), bukan CDN** — larangan "Tailwind CDN" di skill tidak berlaku. Komponen kelas kustom memakai `@utility` (Tailwind v4), bukan `@layer components`.
- **Ikon memakai `lucide-react`** yang sudah jadi dependensi — boleh dipakai. Ikon sekbid yang dapat dipilih admin didaftarkan di `ICONS` (`client/src/components/ui.jsx`). Lucide versi ini tidak punya ikon merek; pakai `InstagramIcon`/`YoutubeIcon` dari `ui.jsx`.
- Aturan **"ekspor via `Object.assign(window, …)`"** dan **React/Babel CDN** hanya untuk prototipe CDN — **tidak berlaku**; gunakan ES module import biasa.
- **Brand asset**: logo OSIS saat ini adalah placeholder SVG (`client/public/favicon.svg`). Jika merombak identitas visual, minta logo resmi OSIS/sekolah kepada pengguna — jangan menggambar ulang logo (lihat *Asset Protocol* di SKILL.md).
- **Tanpa data fiktif baru**: nama pengurus di seed adalah placeholder yang ditandai jelas; jangan menambah statistik/testimoni karangan.
- Bahasa antarmuka: **Bahasa Indonesia**.

## Perintah

```bash
npm run setup      # install dependensi
npm run dev        # dev server Vite (port 5173), butuh client/.env
npm run build      # build produksi -> client/dist
npm run test:db    # uji skema/RLS/RPC Supabase dengan PGlite
npm run build:sql  # regenerasi supabase/setup.sql setelah mengubah migrasi/seed
```

Setelah perubahan UI: jalankan `npm run build` dan `npx oxlint src` (di folder `client/`).
