import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, LogIn } from 'lucide-react';
import { useAuth } from '../../lib/context';
import { Logo } from '../../components/ui';

export default function Login() {
  const { user, login } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/admin" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try {
      await login(form.email.trim(), form.password);
      nav(loc.state?.from || '/admin', { replace: true });
    } catch (e2) {
      setErr(e2.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col bg-ink-950 lg:flex-row">
      <div className="relative flex flex-col justify-end overflow-hidden px-6 pt-10 pb-8 text-white lg:w-1/2 lg:p-14">
        <img src="/hero.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-25" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950 to-transparent" />
        <div className="relative">
          <Link to="/" className="mb-10 inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold text-ink-300 hover:text-white lg:mb-24">
            <ArrowLeft className="h-4 w-4" /> Kembali ke website
          </Link>
          <Logo className="h-14 w-14" />
          <h1 className="mt-4 text-3xl leading-tight font-extrabold tracking-tight sm:text-4xl">
            Panel <span className="text-sun-400">Pengurus</span> OSIS
          </h1>
          <p className="mt-1 text-ink-400">SMA Negeri 3 Rembang</p>
        </div>
      </div>
      <div className="flex flex-1 items-start justify-center rounded-t-4xl bg-ink-50 px-5 pt-8 pb-10 lg:items-center lg:rounded-none">
        <form onSubmit={submit} className="fade-in w-full max-w-sm space-y-4">
          <h2 className="text-xl font-extrabold text-ink-950">Masuk</h2>
          <div>
            <label className="label" htmlFor="login-email">
              Email
            </label>
            <input id="login-email" className="input" type="email" inputMode="email" autoComplete="username" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div>
            <label className="label" htmlFor="login-pass">
              Password
            </label>
            <input id="login-pass" className="input" type="password" autoComplete="current-password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          </div>
          {err && <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{err}</p>}
          <button className="btn-sun min-h-12 w-full text-base" disabled={busy}>
            <LogIn className="h-5 w-5" /> {busy ? 'Memproses…' : 'Masuk'}
          </button>
        </form>
      </div>
    </div>
  );
}
