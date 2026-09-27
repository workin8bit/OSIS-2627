import { Database } from 'lucide-react';
import { Logo } from './ui';

/** Ditampilkan bila variabel lingkungan Supabase belum diisi. */
export default function SetupNotice() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-950 p-4">
      <div className="card w-full max-w-xl p-8">
        <div className="mb-5 flex items-center gap-3">
          <Logo className="h-12 w-12" />
          <div>
            <h1 className="text-xl font-extrabold text-ink-950">OSIS SMA Negeri 3 Rembang</h1>
            <p className="text-sm text-ink-500">Supabase belum dikonfigurasi</p>
          </div>
        </div>
        <div className="flex gap-3 rounded-xl bg-sun-100 p-4 text-sm text-ink-900">
          <Database className="h-5 w-5 shrink-0" />
          <p>
            Buat file <code className="font-mono font-bold">client/.env</code> berisi URL dan publishable/anon key proyek Supabase, lalu jalankan ulang aplikasi.
          </p>
        </div>
        <pre className="mt-4 overflow-x-auto rounded-xl bg-ink-900 p-4 text-xs text-ink-100">
{`VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi... (atau sb_publishable_...)`}
        </pre>
        <p className="mt-4 text-sm text-ink-600">
          Kedua nilai ada di dashboard Supabase → <b>Project Settings → API</b>. Langkah lengkap (migrasi database, bucket storage, akun admin) ada di <code>README.md</code>.
        </p>
      </div>
    </div>
  );
}

/** Ditampilkan bila Supabase terhubung tetapi tabel belum dibuat. */
export function DatabaseSetupNotice({ onRetry }) {
  const steps = [
    <>
      Buka <b>Supabase Dashboard → SQL Editor → New query</b>.
    </>,
    <>
      Salin <b>seluruh</b> isi file <code className="font-mono font-bold">supabase/setup.sql</code> dari repo, tempel, lalu klik <b>Run</b>.
    </>,
    <>
      Buat akun admin di <b>Authentication → Users → Add user</b> (centang <i>Auto Confirm User</i>), lalu jadikan superadmin (perintah SQL ada di README).
    </>,
    <>Klik tombol di bawah untuk memuat ulang.</>,
  ];
  return (
    <div className="flex min-h-screen items-center justify-center bg-ink-950 p-4">
      <div className="card w-full max-w-xl p-8">
        <div className="mb-5 flex items-center gap-3">
          <Logo className="h-12 w-12" />
          <div>
            <h1 className="text-xl font-extrabold text-ink-950">Database belum disiapkan</h1>
            <p className="text-sm text-ink-500">Supabase sudah terhubung, tetapi tabel belum dibuat.</p>
          </div>
        </div>
        <ol className="space-y-3 text-sm text-ink-700">
          {steps.map((s, i) => (
            <li key={i} className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-ink-700 text-xs font-bold text-white">{i + 1}</span>
              <span>{s}</span>
            </li>
          ))}
        </ol>
        <button className="btn-primary mt-6 w-full" onClick={onRetry}>
          <Database className="h-4 w-4" /> Periksa Lagi
        </button>
      </div>
    </div>
  );
}
