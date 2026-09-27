import { Database } from 'lucide-react';
import { Logo } from './ui';

/** Ditampilkan bila variabel lingkungan Supabase belum diisi. */
export default function SetupNotice() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-950 p-4">
      <div className="card w-full max-w-xl p-8">
        <div className="mb-5 flex items-center gap-3">
          <Logo className="h-12 w-12" />
          <div>
            <h1 className="text-xl font-extrabold text-brand-950">OSIS SMA Negeri 3 Rembang</h1>
            <p className="text-sm text-slate-500">Supabase belum dikonfigurasi</p>
          </div>
        </div>
        <div className="flex gap-3 rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
          <Database className="h-5 w-5 shrink-0" />
          <p>
            Buat file <code className="font-mono font-bold">client/.env</code> berisi URL dan publishable/anon key proyek Supabase, lalu jalankan ulang aplikasi.
          </p>
        </div>
        <pre className="mt-4 overflow-x-auto rounded-xl bg-slate-900 p-4 text-xs text-slate-100">
{`VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOi... (atau sb_publishable_...)`}
        </pre>
        <p className="mt-4 text-sm text-slate-600">
          Kedua nilai ada di dashboard Supabase → <b>Project Settings → API</b>. Langkah lengkap (migrasi database, bucket storage, akun admin) ada di <code>README.md</code>.
        </p>
      </div>
    </div>
  );
}
