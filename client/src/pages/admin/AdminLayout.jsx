import { useState } from 'react';
import { Link, NavLink, Navigate, Outlet, useLocation } from 'react-router-dom';
import {
  CalendarDays, ClipboardList, ExternalLink, Images, KeyRound, Layers, LayoutDashboard, LayoutGrid, LogOut, MessageSquare, Newspaper, Settings, Users, X,
} from 'lucide-react';
import { useAuth } from '../../lib/context';
import { Avatar, Logo, Spinner } from '../../components/ui';

const MENU = [
  { to: '/admin', label: 'Dashboard', short: 'Beranda', icon: LayoutDashboard, end: true, tab: true },
  { to: '/admin/aspirasi', label: 'Aspirasi', icon: MessageSquare, tab: true },
  { to: '/admin/berita', label: 'Berita', icon: Newspaper, tab: true },
  { to: '/admin/agenda', label: 'Agenda', icon: CalendarDays, tab: true },
  { to: '/admin/program', label: 'Program Kerja', icon: ClipboardList },
  { to: '/admin/pengurus', label: 'Pengurus', icon: Users },
  { to: '/admin/sekbid', label: 'Seksi Bidang', icon: Layers },
  { to: '/admin/galeri', label: 'Galeri', icon: Images },
  { to: '/admin/pengaturan', label: 'Pengaturan Situs', icon: Settings },
  { to: '/admin/akun', label: 'Akun & Admin', icon: KeyRound },
];
const isActive = (pathname, m) => (m.end ? pathname === m.to : pathname.startsWith(m.to));

function SideNav({ onNavigate }) {
  return (
    <nav className="space-y-0.5" aria-label="Menu admin">
      {MENU.map((m) => (
        <NavLink
          key={m.to}
          to={m.to}
          end={m.end}
          onClick={onNavigate}
          className={({ isActive: a }) =>
            `flex min-h-11 items-center gap-3 rounded-2xl px-3.5 text-sm font-semibold transition ${a ? 'bg-sun-400 text-ink-950' : 'text-ink-300 hover:bg-white/5 hover:text-white'}`
          }
        >
          <m.icon className="h-[18px] w-[18px]" /> {m.label}
        </NavLink>
      ))}
    </nav>
  );
}

export default function AdminLayout() {
  const { user, loading, logout } = useAuth();
  const loc = useLocation();
  // Sheet menu terikat ke path saat dibuka → otomatis tertutup ketika pindah halaman.
  const [sheetAt, setSheetAt] = useState(null);
  const sheet = sheetAt === loc.pathname;
  const setSheet = (open) => setSheetAt(open ? loc.pathname : null);

  if (loading) return <Spinner className="min-h-dvh" />;
  if (!user) return <Navigate to="/admin/login" state={{ from: loc.pathname }} replace />;

  const current = MENU.find((m) => isActive(loc.pathname, m));
  const inSheet = current && !current.tab;

  return (
    <div className="min-h-dvh bg-ink-50">
      {/* Sidebar desktop */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-ink-950 p-3 lg:flex">
        <div className="flex items-center gap-3 px-2 py-3">
          <Logo className="h-10 w-10" />
          <div className="leading-tight">
            <p className="text-sm font-extrabold text-white">Panel OSIS</p>
            <p className="text-[11px] text-ink-400">SMAN 3 Rembang</p>
          </div>
        </div>
        <div className="mt-4 flex-1 overflow-y-auto">
          <SideNav />
        </div>
        <div className="space-y-0.5 border-t border-white/10 pt-3">
          <Link to="/" target="_blank" className="flex min-h-11 items-center gap-3 rounded-2xl px-3.5 text-sm font-semibold text-ink-300 hover:bg-white/5 hover:text-white">
            <ExternalLink className="h-[18px] w-[18px]" /> Lihat Website
          </Link>
          <button onClick={logout} className="flex min-h-11 w-full items-center gap-3 rounded-2xl px-3.5 text-sm font-semibold text-red-300 hover:bg-white/5">
            <LogOut className="h-[18px] w-[18px]" /> Keluar
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-col lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-ink-200/70 bg-ink-50/85 backdrop-blur-xl">
          <div className="flex h-14 items-center gap-3 px-4 sm:px-6 lg:h-16">
            <Logo className="h-8 w-8 lg:hidden" />
            <h1 className="min-w-0 truncate text-lg font-extrabold tracking-tight text-ink-950">{current?.label || 'Admin'}</h1>
            <div className="ml-auto flex items-center gap-3">
              <div className="hidden text-right text-sm sm:block">
                <p className="font-bold text-ink-900">{user.name}</p>
                <p className="text-xs text-ink-500">{user.email}</p>
              </div>
              <Avatar name={user.name} className="h-9 w-9 text-xs" />
            </div>
          </div>
        </header>
        <main className="flex-1 px-4 pt-4 pb-32 sm:px-6 sm:pt-6 lg:pb-10">
          <Outlet />
        </main>
      </div>

      {/* Bottom nav HP */}
      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-ink-200/70 bg-white/95 backdrop-blur-xl lg:hidden" aria-label="Navigasi admin">
        <div className="mx-auto flex h-16 max-w-md">
          {MENU.filter((m) => m.tab).map((m) => {
            const a = isActive(loc.pathname, m) && !sheet;
            return (
              <Link key={m.to} to={m.to} className="flex flex-1 flex-col items-center justify-center gap-1" aria-current={a ? 'page' : undefined}>
                <span className={`flex h-8 w-14 items-center justify-center rounded-full transition ${a ? 'bg-sun-400 text-ink-950' : 'text-ink-500'}`}>
                  <m.icon className="h-5 w-5" strokeWidth={a ? 2.4 : 2} />
                </span>
                <span className={`text-[10.5px] font-bold ${a ? 'text-ink-950' : 'text-ink-500'}`}>{m.short || m.label}</span>
              </Link>
            );
          })}
          <button onClick={() => setSheet(true)} className="flex flex-1 flex-col items-center justify-center gap-1" aria-expanded={sheet}>
            <span className={`flex h-8 w-14 items-center justify-center rounded-full ${sheet || inSheet ? 'bg-sun-400 text-ink-950' : 'text-ink-500'}`}>
              <LayoutGrid className="h-5 w-5" />
            </span>
            <span className={`text-[10.5px] font-bold ${sheet || inSheet ? 'text-ink-950' : 'text-ink-500'}`}>Menu</span>
          </button>
        </div>
      </nav>

      {/* Sheet menu HP */}
      {sheet && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu admin">
          <div className="fade-in absolute inset-0 bg-ink-950/50 backdrop-blur-sm" onClick={() => setSheet(false)} />
          <div className="sheet-in safe-bottom absolute inset-x-0 bottom-0 max-h-[88dvh] overflow-y-auto rounded-t-4xl bg-ink-950 p-4 pb-6">
            <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-white/20" />
            <div className="mb-4 flex items-center gap-3 px-1">
              <Avatar name={user.name} className="h-11 w-11 text-sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold text-white">{user.name}</p>
                <p className="truncate text-xs text-ink-400">{user.email}</p>
              </div>
              <button onClick={() => setSheet(false)} className="btn-icon text-ink-400 hover:bg-white/10" aria-label="Tutup">
                <X className="h-5 w-5" />
              </button>
            </div>
            <SideNav onNavigate={() => setSheet(false)} />
            <div className="mt-3 grid grid-cols-2 gap-2 border-t border-white/10 pt-3">
              <Link to="/" target="_blank" className="btn bg-white/10 text-white">
                <ExternalLink className="h-4 w-4" /> Website
              </Link>
              <button onClick={logout} className="btn bg-red-500/15 text-red-300">
                <LogOut className="h-4 w-4" /> Keluar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
