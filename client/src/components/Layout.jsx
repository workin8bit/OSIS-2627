import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Mail, MapPin, Menu, Phone, X, Bell, Settings, LogOut, User, LayoutDashboard, Calendar, Grid, ChevronRight, ArrowLeft, Home } from 'lucide-react';
import { Logo, BottomNav, Avatar, BottomSheet } from './ui';
import { useSettings, useAuth } from '../lib/context';

function Navbar({ onOpenMenu }) {
  const { settings } = useSettings();
  const [scrolled, setScrolled] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const cabinet = (settings.cabinet_name || '').replace(/^Kabinet\s+/i, '').trim();
  const isHome = pathname === '/';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`top-bar ${scrolled ? 'top-bar-scrolled' : ''}`}>
      <div className="container-x flex h-16 items-center justify-between gap-2">
        <Link to="/" className="flex min-w-0 items-center gap-2.5 text-ink-900 sm:gap-3" aria-label="OSIS SMAN 3 Rembang - Beranda">
          <Logo className="h-9 w-9 shrink-0 sm:h-10 sm:w-10" />
          <div className="min-w-0 leading-tight">
            <p className="truncate text-xs font-extrabold text-ink-900 sm:text-sm">{settings.org_name || 'OSIS SMA Negeri 3 Rembang'}</p>
            <p className="truncate text-[10px] text-ink-500 sm:text-[11px]">
              {cabinet ? `${cabinet} · Periode ${settings.period || '2026/2027'}` : `Periode ${settings.period || '2026/2027'}`}
            </p>
          </div>
        </Link>

        <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
          <Link to="/agenda" className="btn-ghost hidden p-2 lg:inline-flex" aria-label="Agenda">
            <Calendar className="h-5 w-5" />
          </Link>
          <Link to="/admin" className="btn-ghost hidden text-sm lg:inline-flex">
            <LayoutDashboard className="h-4 w-4" />
            <span>Admin</span>
          </Link>
          {!isHome && (
            <>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="btn-ghost touch p-2"
                aria-label="Kembali ke halaman sebelumnya"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <Link to="/" className="btn-ghost touch p-2" aria-label="Kembali ke beranda">
                <Home className="h-5 w-5" />
              </Link>
            </>
          )}
          <button
            type="button"
            onClick={onOpenMenu}
            className="btn-ghost touch p-2 lg:hidden"
            aria-label="Buka menu navigasi"
            aria-haspopup="dialog"
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </div>
    </header>
  );
}

function Footer() {
  const { settings: s } = useSettings();
  const tiktok = String(s.tiktok || s.instagram || '').replace('@', '').trim();
  return (
    <footer className="footer-main">
      <div className="container-x grid gap-8 py-10 md:grid-cols-2 lg:grid-cols-3">
        <div className="md:col-span-2 lg:col-span-2">
          <div className="footer-brand">
            <Logo className="h-10 w-10 shrink-0" />
            <div className="min-w-0">
              <p className="text-base font-extrabold text-white">{s.org_name}</p>
              <p className="text-sm text-gold-400">
                {s.cabinet_name} · {s.period}
              </p>
              <p className="mt-1 text-xs text-ink-400">{s.tagline}</p>
            </div>
          </div>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-ink-400">{s.about || s.tagline}</p>
          <div className="footer-social mt-4">
            {s.instagram && (
              <a href={`https://instagram.com/${s.instagram}`} target="_blank" rel="noreferrer" className="footer-social-btn" aria-label="Instagram">
                <InstagramIcon className="h-5 w-5" />
              </a>
            )}
            {s.youtube && (
              <a href={s.youtube} target="_blank" rel="noreferrer" className="footer-social-btn" aria-label="YouTube">
                <YoutubeIcon className="h-5 w-5" />
              </a>
            )}
            {tiktok && (
              <a href={`https://tiktok.com/@${tiktok}`} target="_blank" rel="noreferrer" className="footer-social-btn" aria-label="TikTok">
                <TiktokIcon className="h-5 w-5" />
              </a>
            )}
            {s.email && (
              <a href={`mailto:${s.email}`} className="footer-social-btn" aria-label="Email">
                <Mail className="h-5 w-5" />
              </a>
            )}
          </div>
        </div>
        <div>
          <p className="mb-3 font-bold text-white">Kontak</p>
          <ul className="footer-contact">
            <li className="flex gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold-400" /> {s.address}
            </li>
            {s.phone && (
              <li className="flex gap-2">
                <Phone className="h-4 w-4 shrink-0 text-gold-400" /> {s.phone}
              </li>
            )}
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <div className="container-x flex flex-col items-center justify-between gap-2 py-4 text-xs text-ink-500 sm:flex-row">
          <p>© {new Date().getFullYear()} {s.org_name}. Hak cipta dilindungi.</p>
          <p className="sm:text-right">Navigasi halaman tersedia lewat menu di bagian atas</p>
        </div>
      </div>
    </footer>
  );
}

function InstagramIcon({ className = 'h-5 w-5', ...props }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
    </svg>
  );
}

function YoutubeIcon({ className = 'h-5 w-5', ...props }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} {...props}>
      <path d="M2.5 17a24 24 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.6 49.6 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24 24 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.6 49.6 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
      <path d="m10 15 5-3-5-3z" />
    </svg>
  );
}

function TiktokIcon({ className = 'h-5 w-5', ...props }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} {...props}>
      <path d="M16.6 3c.4 2.1 1.8 3.6 4 3.9v2.7c-1.5 0-2.9-.5-4-1.3v5.6c0 3.4-2.4 5.8-5.6 5.8A5.6 5.6 0 0 1 5.4 14c0-3.2 2.6-5.7 5.9-5.5v2.9c-.2-.1-.5-.1-.8-.1a2.7 2.7 0 0 0-2.6 2.8c0 1.5 1.2 2.7 2.7 2.7 1.6 0 2.7-1.2 2.7-2.9V3h3.3z" />
    </svg>
  );
}

function PublicLayout() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { settings } = useSettings();
  const { user: adminUser } = useAuth();
  const [sheetOpen, setSheetOpen] = useState(false);
  const isAdmin = Boolean(adminUser);

  useEffect(() => {
    window.scrollTo(0, 0);
    setSheetOpen(false); // Close sheet on route change
  }, [pathname]);

  // Check if we're on admin routes
  const isAdminRoute = pathname.startsWith('/admin');

  if (isAdminRoute) {
    return <AdminLayout />;
  }

  const handleNavigate = (path) => {
    navigate(path);
    setSheetOpen(false);
  };

  return (
    <div className={`flex min-h-screen flex-col ${isAdmin ? 'pb-24' : ''}`}> {/* pb-24 for tab bar */}
      <Navbar onOpenMenu={() => setSheetOpen(true)} />
      <main className="flex-1 pt-16 lg:pt-20">
        <Outlet />
      </main>
      {isAdmin && (
        <BottomNav
          currentPath={pathname}
          onNavigate={handleNavigate}
          onOpenSheet={() => setSheetOpen(true)}
        />
      )}
      <BottomSheet
        isOpen={sheetOpen}
        onClose={() => setSheetOpen(false)}
        currentPath={pathname}
        onNavigate={handleNavigate}
      />
      <Footer />
    </div>
  );
}

// Admin Layout
import { AdminSidebar } from './ui';

function AdminLayout() {
  const { pathname } = useLocation();
  const { user, adminProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  const currentMenu = pathname.replace('/admin', '') || '/admin';

  return (
    <div className="flex min-h-screen bg-ink-50">
      {/* Mobile sidebar overlay */}
      <div 
        className={`fixed inset-0 z-30 bg-ink-950/50 lg:hidden transition-opacity ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />
      
      {/* Sidebar */}
      <AdminSidebar 
        currentPath={currentMenu} 
        onNavigate={(path) => {
          navigate('/admin' + path);
          setSidebarOpen(false);
        }} 
      />
      
      {/* Main content */}
      <div className="flex-1 lg:ml-64">
        {/* Top header */}
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-ink-200 bg-white/95 backdrop-blur-xl px-4 lg:px-6">
          <button 
            className="lg:hidden btn-ghost p-2" 
            onClick={() => setSidebarOpen(true)}
            aria-label="Buka menu"
          >
            <Menu className="h-6 w-6" />
          </button>
          
          <div className="flex-1">
            <h1 className="text-lg font-bold text-ink-900 truncate">
              {getPageTitle(currentMenu)}
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 text-sm text-ink-600">
              <div className="text-right">
                <p className="font-medium text-ink-900">{adminProfile?.name || user?.email}</p>
                <p className="text-xs text-ink-500 capitalize">{adminProfile?.role || 'admin'}</p>
              </div>
              <Avatar name={adminProfile?.name || user?.email} className="h-8 w-8 text-sm" />
            </div>
            <div className="flex items-center gap-1">
              <Link to="/admin/akun" className="btn-ghost p-2" aria-label="Pengaturan akun">
                <Settings className="h-5 w-5" />
              </Link>
              <button onClick={signOut} className="btn-ghost p-2 text-error-600 hover:text-error-700" aria-label="Keluar">
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </header>
        
        <main className="p-4 lg:p-6 pb-20">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export { Navbar, Footer, PublicLayout, AdminLayout };

export default PublicLayout;

// MessageSquare import for Navbar
import { MessageSquare } from 'lucide-react';