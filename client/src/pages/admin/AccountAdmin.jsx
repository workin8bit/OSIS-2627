import { useState } from 'react';
import { Link } from 'react-router-dom';
import { KeyRound, ShieldCheck } from 'lucide-react';
import { changePassword, listAdmins } from '../../lib/data';
import { useAuth, useQuery, useToast } from '../../lib/context';
import { formatDate } from '../../lib/format';

export default function AccountAdmin() {
  const { user, can } = useAuth();
  const toast = useToast();
  const { data: users } = useQuery(listAdmins, []);
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [busy, setBusy] = useState(false);

  const changePw = async (e) => {
    e.preventDefault();
    if (pw.next !== pw.confirm) return toast('Konfirmasi password tidak sama', 'error');
    if (pw.next.length < 6) return toast('Password baru minimal 6 karakter', 'error');
    setBusy(true);
    try {
      await changePassword(pw.current, pw.next);
      toast('Password berhasil diubah');
      setPw({ current: '', next: '', confirm: '' });
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid max-w-5xl gap-6 lg:grid-cols-2">
      <form onSubmit={changePw} className="card space-y-4 p-6">
        <div>
          <h2 className="flex items-center gap-2 font-bold text-slate-900">
            <KeyRound className="h-5 w-5 text-brand-600" /> Ubah Password
          </h2>
          <p className="text-sm text-slate-500">{user.email}</p>
        </div>
        <div>
          <label className="label">Password Lama</label>
          <input type="password" className="input" value={pw.current} onChange={(e) => setPw({ ...pw, current: e.target.value })} required />
        </div>
        <div>
          <label className="label">Password Baru</label>
          <input type="password" className="input" value={pw.next} onChange={(e) => setPw({ ...pw, next: e.target.value })} required minLength={6} />
        </div>
        <div>
          <label className="label">Konfirmasi Password Baru</label>
          <input type="password" className="input" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} required />
        </div>
        <button className="btn-primary" disabled={busy}>
          Simpan Password
        </button>
      </form>

      <div className="card p-6">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 className="font-bold text-slate-900">Daftar Admin</h2>
            <p className="text-sm text-slate-500">Akun yang bisa masuk panel beserta kewenangannya.</p>
          </div>
          {can('akun', 'write') && (
            <Link to="/admin/akses" className="btn-secondary shrink-0 text-xs">
              <ShieldCheck className="h-4 w-4" /> Kelola hak akses
            </Link>
          )}
        </div>

        <div className="divide-y divide-slate-100">
          {(users || []).map((u) => (
            <div key={u.user_id} className="py-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">
                    {u.name} {u.user_id === user.id && <span className="text-xs font-normal text-slate-400">(Anda)</span>}
                  </p>
                  <p className="text-xs text-slate-500">
                    {u.email} · {u.role === 'superadmin' ? 'Superadmin' : 'Admin'} · sejak {formatDate(u.created_at)}
                  </p>
                </div>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {u.role === 'superadmin' ? (
                  'Akses penuh semua modul'
                ) : u.member?.division?.short ? (
                  `Pengurus · ${u.member.position}, ${u.member.division.short}`
                ) : (
                  'Belum ditautkan ke anggota pengurus'
                )}
              </p>
            </div>
          ))}
        </div>

        <p className="mt-4 border-t border-slate-200 pt-4 text-xs text-slate-500">
          Menambah, menghapus, dan mengubah hak akses pengurus dilakukan di halaman{' '}
          <Link to="/admin/akses" className="font-semibold text-brand-700 underline">
            Hak Akses
          </Link>
          .
        </p>
      </div>
    </div>
  );
}
