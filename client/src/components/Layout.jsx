import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  CalendarDays, ChevronRight, House, Images, LayoutGrid, LogIn, Mail, MapPin, MessageSquarePlus, Newspaper, Phone, Target, UserRound, Users, X,
} from 'lucide-react';
import { InstagramIcon as Instagram, Logo, YoutubeIcon as Youtube } from './ui';
import { useSettings } from '../lib/context';

/** Semua halaman publik (dipakai navigasi desktop, sheet "Lainnya", dan footer). */
const PAGES = [
  { to: '/', label: 'Beranda', icon: House, end: true },
  { to: '/profil', label: 'Profil', icon: UserRound, desc: 'Visi, misi & sekbid' },
  { to: '/struktur', label: 'Pengurus', icon: Users, desc: 'Struktur organisasi' },
  { to: '/program', label: 'Program Kerja', short: 'Proker', icon: Target },
  { to: '/berita', label: 'Berita', icon: Newspaper },
  { to: '/agenda', label: 'Agenda', icon: CalendarDays, desc: 'Kalender kegiatan' },
  { to: '/galeri', label: 'Galeri', icon: Images, desc: 'Dokumentasi foto' },
];
const MORE = PAGES.filter((p) => p.desc);
const byPath = (to) => PAGES.find((p) => p.to === to);

function isActivePath(pathname, to, end) {
  return end ? pathname === to : pathname === to || pathname.startsWith(`${to}/`);
}

/** Bar atas: ringkas di HP, navigasi lengkap di desktop. */
function TopBar() {
  const { settings } = useSettings();
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`sticky top-0 z-40 transition-colors duration-300 ${scrolled ? 'border-b border-ink-200/70 bg-ink-50/85 backdrop-blur-xl' : 'border-b border-transparent bg-ink-50'}`}>
      <div className="container-x flex h-14 items-center gap-3 lg:h-[72px]">
        <Link to="/" className="flex min-w-0 items-center gap-2.5" aria-label="Beranda OSIS SMAN 3 Rembang">
          <Logo className="h-9 w-9 shrink-0 lg:h-10 lg:w-10" />
          <div className="min-w-0 leading-tight">
            <p className="truncate text-[15px] font-extrabold tracking-tight text-ink-950">OSIS SMAN 3 Rembang</p>
            <p className="text-[11px] font-semibold text-ink-500">Periode {settings.period || '2026/2027'}</p>
          </div>
        </Link>

        <nav className="ml-auto hidden items-center gap-0.5 lg:flex" aria-label="Navigasi utama">
          {PAGES.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                `relative rounded-full px-3.5 py-2 text-sm font-semibold transition ${isActive ? 'bg-ink-900 text-white' : 'text-ink-600 hover:bg-ink-100 hover:text-ink-950'}`
              }
            >
              {n.label}
            </NavLink>
          ))}
          <Link to="/aspirasi" className="btn-sun ml-3">
            <MessageSquarePlus className="h-4 w-4" /> Sampaikan Aspirasi
          </Link>
        </nav>

        <Link to="/agenda" className="btn-icon ml-auto text-ink-700 hover:bg-ink-100 lg:hidden" aria-label="Agenda">
          <CalendarDays className="h-5 w-5" />
        </Link>
      </div>
    </header>
  );
}

function Tab({ item, pathname, moreOpen }) {
  const active = isActivePath(pathname, item.to, item.end) && !moreOpen;
  return (
    <Link to={item.to} className="flex flex-1 flex-col items-center justify-center gap-1 py-2" aria-current={active ? 'page' : undefined}>
      <item.icon className={`h-[22px] w-[22px] transition ${active ? 'text-sun-400' : 'text-ink-400'}`} strokeWidth={active ? 2.4 : 2} />
      <span className={`text-[10.5px] font-bold ${active ? 'text-white' : 'text-ink-400'}`}>{item.short || item.label}</span>
    </Link>
  );
}

/** Tab bar bawah bergaya aplikasi — hanya tampil di layar < lg. */
function BottomTabs({ onMore, moreOpen }) {
  const { pathname } = useLocation();
  const moreActive = moreOpen || MORE.some((m) => isActivePath(pathname, m.to));
  const tabs = [byPath('/'), byPath('/program'), null, byPath('/berita')];

  const aspActive = pathname === '/aspirasi' && !moreOpen;
  return (
    <nav className="safe-bottom fixed inset-x-0 bottom-0 z-50 px-3 pb-3 lg:hidden" aria-label="Navigasi bawah">
      <div className="mx-auto flex h-16 max-w-md items-stretch rounded-[26px] bg-ink-950 px-1 shadow-[0_12px_40px_-12px_rgba(21,20,18,.6)]">
        {tabs.slice(0, 2).map((t) => (
          <Tab key={t.to} item={t} pathname={pathname} moreOpen={moreOpen} />
        ))}
        <Link to="/aspirasi" className="flex flex-1 flex-col items-center justify-end pb-2" aria-label="Sampaikan Aspirasi" aria-current={aspActive ? 'page' : undefined}>
          <span
            className={`-mt-6 mb-1 flex h-14 w-14 items-center justify-center rounded-full bg-sun-400 text-ink-950 ring-[5px] ring-ink-50 transition active:scale-90 ${aspActive ? 'scale-105' : ''}`}
          >
            <MessageSquarePlus className="h-6 w-6" strokeWidth={2.3} />
          </span>
          <span className={`text-[10.5px] font-bold ${aspActive ? 'text-white' : 'text-ink-400'}`}>Aspirasi</span>
        </Link>
        <Tab item={tabs[3]} pathname={pathname} moreOpen={moreOpen} />
        <button onClick={onMore} className="flex flex-1 flex-col items-center justify-center gap-1 py-2" aria-expanded={moreOpen} aria-label="Menu lainnya">
          <LayoutGrid className={`h-[22px] w-[22px] ${moreActive ? 'text-sun-400' : 'text-ink-400'}`} strokeWidth={moreActive ? 2.4 : 2} />
          <span className={`text-[10.5px] font-bold ${moreActive ? 'text-white' : 'text-ink-400'}`}>Lainnya</span>
        </button>
      </div>
    </nav>
  );
}

function SocialLinks({ s, className = '' }) {
  const items = [
    s.instagram && { href: `https://instagram.com/${s.instagram}`, label: 'Instagram', icon: Instagram },
    s.youtube && { href: s.youtube, label: 'YouTube', icon: Youtube },
    s.email && { href: `mailto:${s.email}`, label: 'Email', icon: Mail },
  ].filter(Boolean);
  return (
    <div className={`flex gap-2 ${className}`}>
      {items.map((it) => (
        <a key={it.label} href={it.href} target="_blank" rel="noreferrer" className="btn-icon bg-white/10 text-white hover:bg-sun-400 hover:text-ink-950" aria-label={it.label}>
          <it.icon className="h-5 w-5" />
        </a>
      ))}
    </div>
  );
}

/** Sheet "Lainnya" — halaman sekunder, kontak, dan akses pengurus. */
function MoreSheet({ open, onClose }) {
  const { settings: s } = useSettings();
  const { pathname } = useLocation();
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[45] lg:hidden" role="dialog" aria-modal="true" aria-label="Menu lainnya">
      <div className="fade-in absolute inset-0 bg-ink-950/50 backdrop-blur-sm" onClick={onClose} />
      <div className="sheet-in absolute inset-x-0 bottom-0 max-h-[85dvh] overflow-y-auto rounded-t-4xl bg-ink-50 px-4 pt-3 pb-28">
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-ink-200" />
        <div className="mb-4 flex items-center justify-between">
          <p className="text-lg font-extrabold text-ink-950">Menu</p>
          <button onClick={onClose} className="btn-icon -mr-2 text-ink-500 hover:bg-ink-100" aria-label="Tutup">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {MORE.map((m) => {
            const active = isActivePath(pathname, m.to);
            return (
              <Link key={m.to} to={m.to} onClick={onClose} className={`rounded-3xl p-4 transition active:scale-[.97] ${active ? 'bg-ink-900 text-white' : 'border border-ink-200/70 bg-white text-ink-900'}`}>
                <span className={`mb-6 flex h-11 w-11 items-center justify-center rounded-2xl ${active ? 'bg-sun-400 text-ink-950' : 'bg-ink-100 text-ink-800'}`}>
                  <m.icon className="h-5 w-5" />
                </span>
                <p className="font-extrabold">{m.label}</p>
                <p className={`text-xs ${active ? 'text-ink-300' : 'text-ink-500'}`}>{m.desc}</p>
              </Link>
            );
          })}
        </div>

        <div className="mt-3 rounded-3xl bg-ink-950 p-5 text-ink-200">
          <p className="eyebrow mb-3 text-ink-400">Sekretariat</p>
          <ul className="space-y-2.5 text-sm">
            <li className="flex gap-2.5">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-sun-400" /> {s.address}
            </li>
            {s.phone && (
              <li>
                <a href={`tel:${s.phone.replace(/[^\d+]/g, '')}`} className="flex gap-2.5">
                  <Phone className="mt-0.5 h-4 w-4 shrink-0 text-sun-400" /> {s.phone}
                </a>
              </li>
            )}
          </ul>
          <SocialLinks s={s} className="mt-4" />
        </div>

        <Link to="/admin" onClick={onClose} className="mt-3 flex items-center gap-3 rounded-3xl border border-ink-200/70 bg-white p-4 text-sm font-bold text-ink-800">
          <LogIn className="h-5 w-5 text-ink-500" /> Masuk Pengurus <ChevronRight className="ml-auto h-4 w-4 text-ink-400" />
        </Link>
      </div>
    </div>
  );
}

function Footer() {
  const { settings: s } = useSettings();
  return (
    <footer className="mt-16 bg-ink-950 text-ink-300">
      <div className="container-x grid gap-10 pt-12 pb-32 md:grid-cols-2 lg:grid-cols-4 lg:pb-12">
        <div className="lg:col-span-2">
          <div className="flex items-center gap-3">
            <Logo className="h-12 w-12" />
            <div>
              <p className="text-lg font-extrabold text-white">{s.org_name}</p>
              <p className="text-sm font-semibold text-sun-400">
                {s.cabinet_name} · {s.period}
              </p>
            </div>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-400">{s.tagline}</p>
          <SocialLinks s={s} className="mt-5" />
        </div>
        <div className="hidden lg:block">
          <p className="mb-4 font-bold text-white">Tautan</p>
          <ul className="space-y-2 text-sm">
            {[...PAGES.slice(1), { to: '/aspirasi', label: 'Aspirasi' }].map((n) => (
              <li key={n.to}>
                <Link to={n.to} className="hover:text-sun-400">
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-4 font-bold text-white">Kontak</p>
          <ul className="space-y-3 text-sm">
            <li className="flex gap-2.5">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-sun-400" /> {s.address}
            </li>
            {s.phone && (
              <li className="flex gap-2.5">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-sun-400" /> {s.phone}
              </li>
            )}
            {s.email && (
              <li className="flex gap-2.5 break-all">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-sun-400" /> {s.email}
              </li>
            )}
          </ul>
        </div>
        <div className="flex flex-col gap-2 border-t border-white/10 pt-6 text-xs text-ink-500 sm:flex-row sm:items-center sm:justify-between md:col-span-2 lg:col-span-4">
          <p>
            © {new Date().getFullYear()} {s.org_name}
          </p>
          <Link to="/admin" className="font-semibold hover:text-white">
            Masuk Pengurus
          </Link>
        </div>
      </div>
    </footer>
  );
}

export default function PublicLayout() {
  const { pathname } = useLocation();
  // Sheet "Lainnya" terikat ke path saat dibuka → otomatis tertutup ketika pindah halaman.
  const [moreAt, setMoreAt] = useState(null);
  const more = moreAt === pathname;
  useEffect(() => window.scrollTo(0, 0), [pathname]);

  return (
    <div className="flex min-h-dvh flex-col">
      <TopBar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <MoreSheet open={more} onClose={() => setMoreAt(null)} />
      <BottomTabs onMore={() => setMoreAt(more ? null : pathname)} moreOpen={more} />
    </div>
  );
}
