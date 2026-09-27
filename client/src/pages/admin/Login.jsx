import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, LogIn } from 'lucide-react';
import { useAuth } from '../../lib/context';
import { Logo } from '../../components/ui';

export default function Login() {
  const { user, login } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [form, setForm] = useState({ username: '', password: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/admin" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try {
      await login(form.username, form.password);
      nav(loc.state?.from || '/admin', { replace: true });
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-brand-950 p-4">
      <img src="/hero.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-15" />
      <div className="fade-in relative w-full max-w-sm">
        <div className="card p-8">
          <div className="mb-6 text-center">
            <Logo className="mx-auto h-16 w-16" />
            <h1 className="mt-3 text-xl font-extrabold text-brand-950">Panel Pengurus OSIS</h1>
            <p className="text-sm text-slate-500">SMA Negeri 3 Rembang</p>
          </div>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="label">Username</label>
              <input className="input" autoFocus value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
            </div>
            <div>
              <label className="label">Password</label>
              <input className="input" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
            </div>
            {err && <p className="rounded-lg bg-red-50 p-2.5 text-sm text-red-600">{err}</p>}
            <button className="btn-primary w-full py-3" disabled={busy}>
              <LogIn className="h-4 w-4" /> {busy ? 'Memproses...' : 'Masuk'}
            </button>
          </form>
        </div>
        <Link to="/" className="mt-4 flex items-center justify-center gap-1 text-sm text-brand-200 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Kembali ke website
        </Link>
      </div>
    </div>
  );
}
