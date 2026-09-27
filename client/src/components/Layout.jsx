import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { Mail, MapPin, Menu, Phone, X } from 'lucide-react';
import { InstagramIcon as Instagram, Logo, YoutubeIcon as Youtube } from './ui';
import { useSettings } from '../lib/context';

const NAV = [
  { to: '/', label: 'Beranda', end: true },
  { to: '/profil', label: 'Profil' },
  { to: '/struktur', label: 'Pengurus' },
  { to: '/program', label: 'Program Kerja' },
  { to: '/berita', label: 'Berita' },
  { to: '/agenda', label: 'Agenda' },
  { to: '/galeri', label: 'Galeri' },
];

export function Navbar() {
  const { settings } = useSettings();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  useEffect(() => setOpen(false), [pathname]);

  const solid = scrolled || open;
  return (
    <header className={`fixed inset-x-0 top-0 z-40 transition-all ${solid ? 'bg-brand-950/95 shadow-lg backdrop-blur' : 'bg-transparent'}`}>
      <div className="container-x flex h-16 items-center justify-between lg:h-20">
        <Link to="/" className="flex items-center gap-3 text-white">
          <Logo className="h-10 w-10" />
          <div className="leading-tight">
            <p className="text-sm font-extrabold sm:text-base">OSIS SMAN 3 Rembang</p>
            <p className="text-[11px] text-brand-200">Periode {settings.period || '2026/2027'}</p>
          </div>
        </Link>
        <nav className="hidden items-center gap-1 lg:flex">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm font-medium transition ${isActive ? 'bg-white/15 text-white' : 'text-brand-100 hover:bg-white/10 hover:text-white'}`
              }
            >
              {n.label}
            </NavLink>
          ))}
          <Link to="/aspirasi" className="btn-gold ml-2">
            Sampaikan Aspirasi
          </Link>
        </nav>
        <button className="rounded-lg p-2 text-white lg:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X /> : <Menu />}
        </button>
      </div>
      {open && (
        <nav className="container-x flex flex-col gap-1 pb-4 lg:hidden">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) => `rounded-lg px-3 py-2.5 text-sm font-medium ${isActive ? 'bg-white/15 text-white' : 'text-brand-100'}`}
            >
              {n.label}
            </NavLink>
          ))}
          <Link to="/aspirasi" className="btn-gold mt-2">
            Sampaikan Aspirasi
          </Link>
        </nav>
      )}
    </header>
  );
}

export function Footer() {
  const { settings: s } = useSettings();
  return (
    <footer className="bg-brand-950 text-brand-100">
      <div className="container-x grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <div className="flex items-center gap-3">
            <Logo className="h-12 w-12" />
            <div>
              <p className="text-lg font-extrabold text-white">{s.org_name}</p>
              <p className="text-sm text-gold-400">
                {s.cabinet_name} · {s.period}
              </p>
            </div>
          </div>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-brand-200">{s.tagline}</p>
          <div className="mt-5 flex gap-2">
            {s.instagram && (
              <a href={`https://instagram.com/${s.instagram}`} target="_blank" rel="noreferrer" className="rounded-lg bg-white/10 p-2 hover:bg-white/20" aria-label="Instagram">
                <Instagram className="h-5 w-5" />
              </a>
            )}
            {s.youtube && (
              <a href={s.youtube} target="_blank" rel="noreferrer" className="rounded-lg bg-white/10 p-2 hover:bg-white/20" aria-label="YouTube">
                <Youtube className="h-5 w-5" />
              </a>
            )}
            {s.email && (
              <a href={`mailto:${s.email}`} className="rounded-lg bg-white/10 p-2 hover:bg-white/20" aria-label="Email">
                <Mail className="h-5 w-5" />
              </a>
            )}
          </div>
        </div>
        <div>
          <p className="mb-4 font-bold text-white">Tautan</p>
          <ul className="space-y-2 text-sm">
            {[...NAV.slice(1), { to: '/aspirasi', label: 'Aspirasi' }].map((n) => (
              <li key={n.to}>
                <Link to={n.to} className="hover:text-gold-400">
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-4 font-bold text-white">Kontak</p>
          <ul className="space-y-3 text-sm">
            <li className="flex gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold-400" /> {s.address}
            </li>
            {s.phone && (
              <li className="flex gap-2">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-gold-400" /> {s.phone}
              </li>
            )}
            {s.email && (
              <li className="flex gap-2">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-gold-400" /> {s.email}
              </li>
            )}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container-x flex flex-col items-center justify-between gap-2 py-5 text-xs text-brand-300 sm:flex-row">
          <p>© {new Date().getFullYear()} {s.org_name}. Hak cipta dilindungi.</p>
          <Link to="/admin" className="hover:text-white">
            Masuk Pengurus
          </Link>
        </div>
      </div>
    </footer>
  );
}

export default function PublicLayout() {
  const { pathname } = useLocation();
  useEffect(() => window.scrollTo(0, 0), [pathname]);
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
