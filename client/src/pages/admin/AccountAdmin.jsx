import { useState } from 'react';
import { Trash2, UserPlus } from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth, useFetch, useToast } from '../../lib/context';
import { formatDate } from '../../lib/format';

export default function AccountAdmin() {
  const { user } = useAuth();
  const toast = useToast();
  const { data: users, reload } = useFetch('/admin/users');
  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [nu, setNu] = useState({ username: '', name: '', password: '', role: 'admin' });

  const changePw = async (e) => {
    e.preventDefault();
    if (pw.next !== pw.confirm) return toast('Konfirmasi password tidak sama', 'error');
    try {
      await api('/auth/password', { method: 'POST', body: pw });
      toast('Password berhasil diubah');
      setPw({ current: '', next: '', confirm: '' });
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const addUser = async (e) => {
    e.preventDefault();
    try {
      await api('/admin/users', { method: 'POST', body: nu });
      toast('Admin ditambahkan');
      setNu({ username: '', name: '', password: '', role: 'admin' });
      reload();
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const delUser = async (u) => {
    if (!confirm(`Hapus admin ${u.username}?`)) return;
    try {
      await api(`/admin/users/${u.id}`, { method: 'DELETE' });
      toast('Admin dihapus');
      reload();
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const isSuper = user.role === 'superadmin';

  return (
    <div className="grid max-w-5xl gap-6 lg:grid-cols-2">
      <form onSubmit={changePw} className="card space-y-4 p-6">
        <h2 className="font-bold text-slate-900">Ubah Password</h2>
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
        <button className="btn-primary">Simpan Password</button>
      </form>

      <div className="card p-6">
        <h2 className="mb-4 font-bold text-slate-900">Daftar Admin</h2>
        <div className="divide-y divide-slate-100">
          {(users || []).map((u) => (
            <div key={u.id} className="flex items-center justify-between py-3">
              <div>
                <p className="font-semibold text-slate-900">
                  {u.name} <span className="text-sm font-normal text-slate-500">@{u.username}</span>
                </p>
                <p className="text-xs text-slate-500">
                  {u.role} · sejak {formatDate(u.created_at)}
                </p>
              </div>
              {isSuper && u.id !== user.id && (
                <button className="rounded-lg p-2 text-red-600 hover:bg-red-50" onClick={() => delUser(u)} aria-label="Hapus admin">
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
          ))}
        </div>
        {isSuper && (
          <form onSubmit={addUser} className="mt-4 space-y-3 border-t border-slate-200 pt-4">
            <p className="text-sm font-semibold text-slate-700">Tambah Admin Baru</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <input className="input" placeholder="Nama" value={nu.name} onChange={(e) => setNu({ ...nu, name: e.target.value })} required />
              <input className="input" placeholder="Username" value={nu.username} onChange={(e) => setNu({ ...nu, username: e.target.value })} required />
              <input className="input" type="password" placeholder="Password (min. 6)" value={nu.password} onChange={(e) => setNu({ ...nu, password: e.target.value })} required minLength={6} />
              <select className="input" value={nu.role} onChange={(e) => setNu({ ...nu, role: e.target.value })}>
                <option value="admin">Admin</option>
                <option value="superadmin">Superadmin</option>
              </select>
            </div>
            <button className="btn-primary">
              <UserPlus className="h-4 w-4" /> Tambah
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
