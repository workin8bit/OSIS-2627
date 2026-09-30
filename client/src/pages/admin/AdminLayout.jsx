import { useState } from 'react';
import { Link, NavLink, Navigate, Outlet, useLocation } from 'react-router-dom';
import {
  CalendarDays, ClipboardList, ExternalLink, Images, KeyRound, Layers, LayoutDashboard, LogOut, Menu, MessageSquare, MonitorSmartphone, Newspaper, Settings, ShieldCheck, Users, X,
} from 'lucide-react';
import { useAuth } from '../../lib/context';
import { Empty, Logo, Spinner } from '../../components/ui';

const MENU = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/tampilan-siswa', label: 'Tampilan Siswa', icon: MonitorSmartphone, module: 'beranda' },
  { to: '/admin/aspirasi', label: 'Aspirasi', icon: MessageSquare, module: 'aspirasi' },
  { to: '/admin/berita', label: 'Berita', icon: Newspaper, module: 'berita' },
  { to: '/admin/agenda', label: 'Agenda', icon: CalendarDays, module: 'agenda' },
  { to: '/admin/program', label: 'Program Kerja', icon: ClipboardList, module: 'program' },
  { to: '/admin/pengurus', label: 'Pengurus', icon: Users, module: 'pengurus' },
  { to: '/admin/sekbid', label: 'Seksi Bidang', icon: Layers, module: 'sekbid' },
  { to: '/admin/galeri', label: 'Galeri', icon: Images, module: 'galeri' },
  { to: '/admin/pengaturan', label: 'Pengaturan Situs', icon: Settings, module: 'pengaturan' },
  { to: '/admin/akun', label: 'Akun & Admin', icon: KeyRound, module: 'akun' },
  { to: '/admin/akses', label: 'Hak Akses', icon: ShieldCheck, module: 'akun' },
];

export default function AdminLayout() {
  const { user, loading, logout, can } = useAuth();
  const [open, setOpen] = useState(false);
  const loc = useLocation();

  if (loading) return <Spinner className="min-h-screen" />;
  if (!user) return <Navigate to="/admin/login" state={{ from: loc.pathname }} replace />;

  // Menu & rute hanya ditampilkan bila pengguna punya hak akses modulnya
  const menu = MENU.filter((m) => !m.module || can(m.module));
  const current = menu.find((m) => (m.end ? loc.pathname === m.to : loc.pathname.startsWith(m.to)));
  const blocked = !current && MENU.some((m) => (m.end ? loc.pathname === m.to : loc.pathname.startsWith(m.to)));

  return (
    <div className="flex min-h-screen bg-slate-100">
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-brand-950 text-brand-100 transition-transform lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex h-16 items-center gap-3 border-b border-white/10 px-5">
          <Logo className="h-9 w-9" />
          <div className="leading-tight">
            <p className="text-sm font-extrabold text-white">Panel OSIS</p>
            <p className="text-[11px] text-brand-300">SMAN 3 Rembang</p>
          </div>
          <button className="ml-auto lg:hidden" onClick={() => setOpen(false)} aria-label="Tutup menu">
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {menu.map((m) => (
            <NavLink
              key={m.to}
              to={m.to}
              end={m.end}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${isActive ? 'bg-white/15 text-white' : 'hover:bg-white/5 hover:text-white'}`
              }
            >
              <m.icon className="h-4.5 w-4.5" /> {m.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-white/10 p-3">
          <Link to="/" target="_blank" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm hover:bg-white/5">
            <ExternalLink className="h-4.5 w-4.5" /> Lihat Website
          </Link>
          <button onClick={logout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-red-300 hover:bg-white/5">
            <LogOut className="h-4.5 w-4.5" /> Keluar
          </button>
        </div>
      </aside>
      {open && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setOpen(false)} />}

      <div className="flex min-w-0 flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-6">
          <button className="rounded-lg p-2 hover:bg-slate-100 lg:hidden" onClick={() => setOpen(true)} aria-label="Menu">
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-bold text-slate-900">{current?.label || 'Admin'}</h1>
          <div className="ml-auto text-right text-sm">
            <p className="font-semibold text-slate-800">{user.name}</p>
            <p className="text-xs text-slate-500">
              {user.member?.division?.short || user.member?.position || user.email}
            </p>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6">
          {blocked ? (
            <Empty
              icon="Shield"
              title="Akses ditolak"
              desc="Akun Anda belum diberi hak akses untuk halaman ini. Minta superadmin atau admin pengelola akses untuk mengaktifkannya."
            />
          ) : (
            <Outlet />
          )}
        </main>
      </div>
    </div>
  );
}
