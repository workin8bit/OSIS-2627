import { useEffect, useRef, useState } from 'react';
import {
  Activity, BookOpen, Camera, Flag, Heart, ImagePlus, Inbox, Languages, Lightbulb, Loader2, Megaphone,
  Monitor, Moon, Music, Palette, Shield, Star, Trophy, Users, Vote, X, ChevronLeft, ChevronRight,
  CheckCircle2, Copy, MessageSquare, Search, Send, ShieldCheck, CalendarDays, Eye, Newspaper, User,
  ArrowLeft, ArrowRight, MapPin, Phone, Mail, Quote, Target, Clock, ChevronDown, Home, Bell, Settings,
  Image, LayoutDashboard, BarChart2, FileText, FolderOpen, Grid, Megaphone as MegaphoneIcon,
  GraduationCap
} from 'lucide-react';
import { initials, igHandle, jabatanLengkap } from '../lib/format';
import { uploadFile } from '../lib/data';
import { useToast } from '../lib/context';

// Icons available for divisions (selectable in admin panel)
export const ICONS = {
  Activity, BookOpen, Camera, Flag, Heart, Inbox, Languages, Lightbulb, Megaphone, Monitor, Moon, Music, Palette, Shield, Star, Trophy, Users, Vote
};

function Icon({ name, className = 'h-5 w-5', ...props }) {
  const C = ICONS[name] || Users;
  return <C className={className} {...props} />;
}

function Logo({ className = 'h-10 w-10' }) {
  return <img src="/logo-osis.jpg" alt="Logo OSIS SMA Negeri 3 Rembang" className={`${className} object-cover`} />;
}

function Spinner({ className = '', size = 'h-8 w-8' }) {
  return (
    <div className={`flex items-center justify-center py-16 text-brand-600 ${className}`}>
      <Loader2 className={`${size} animate-spin`} />
    </div>
  );
}

function ErrorBox({ message }) {
  return (
    <div className="rounded-xl border border-error-200 bg-error-50 p-4 text-sm text-error-700" role="alert">
      {message}
    </div>
  );
}

function Empty({ icon = 'Inbox', title = 'Belum ada data', desc, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-ink-300 bg-white py-14 text-center">
      <Icon name={icon} className="mb-3 h-12 w-12 text-ink-300" />
      <p className="font-semibold text-ink-700">{title}</p>
      {desc && <p className="mt-1 text-sm text-ink-500">{desc}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

function Avatar({ name, src, className = 'h-20 w-20 text-xl', fallbackColor }) {
  if (src) return <img src={src} alt={name} className={`${className} rounded-2xl object-cover`} />;
  const colors = [
    'from-brand-500 to-brand-700',
    'from-gold-500 to-gold-700',
    'from-emerald-500 to-teal-600',
    'from-fuchsia-500 to-purple-600',
    'from-sky-500 to-blue-600',
    'from-rose-500 to-pink-600',
    'from-amber-500 to-orange-600',
    'from-indigo-500 to-blue-700',
  ];
  const idx = [...(name || '')].reduce((a, c) => a + c.charCodeAt(0), 0) % colors.length;
  return (
    <div className={`${className} flex items-center justify-center rounded-2xl bg-gradient-to-br ${fallbackColor || colors[idx]} font-bold text-white`}>
      {initials(name)}
    </div>
  );
}

function SectionTitle({ eyebrow, title, desc, center = true, className = '' }) {
  return (
    <div className={`mb-10 ${center ? 'mx-auto max-w-2xl text-center' : ''} ${className}`}>
      {eyebrow && <p className="mb-2 text-sm font-bold tracking-widest text-gold-600 uppercase">{eyebrow}</p>}
      <h2 className="text-3xl font-extrabold tracking-tight text-ink-900 sm:text-4xl">{title}</h2>
      {desc && <p className="mt-3 text-ink-600">{desc}</p>}
    </div>
  );
}

function PageHeader({ title, desc, eyebrow, children, className = '' }) {
  return (
    <section className={`page-header ${className}`}>
      <div className="pointer-events-none absolute inset-0 opacity-15" style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, #6366f1 0, transparent 40%), radial-gradient(circle at 80% 60%, #e8e008 0, transparent 35%)' }} />
      <div className="container-x relative">
        {eyebrow && <p className="mb-2 text-sm font-bold tracking-widest text-gold-300 uppercase">{eyebrow}</p>}
        <h1 className="text-3xl font-extrabold sm:text-5xl">{title}</h1>
        {desc && <p className="mt-4 max-w-2xl text-ink-900">{desc}</p>}
        {children && <div className="mt-6">{children}</div>}
      </div>
    </section>
  );
}

function Modal({ open, onClose, title, children, wide = false, bodyClassName = 'p-5', className = '' }) {
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
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink-950/60 p-4 backdrop-blur-sm sm:items-center" onMouseDown={onClose} role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className={`slide-up card-elevated my-8 w-full ${wide ? 'max-w-3xl' : 'max-w-lg'} ${className}`} onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-ink-200 px-5 py-4">
          <h3 id="modal-title" className="text-lg font-bold text-ink-900">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-ink-400 hover:bg-ink-100 hover:text-ink-600 transition-colors" aria-label="Tutup">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className={bodyClassName}>{children}</div>
      </div>
    </div>
  );
}

function ImageInput({ value, onChange, label = 'Gambar' }) {
  const ref = useRef();
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  const onFile = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setBusy(true);
    try {
      onChange(await uploadFile(f));
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
      e.target.value = '';
    }
  };
  return (
    <div className="space-y-2">
      <label className="label">{label}</label>
      <div className="flex items-center gap-3">
        <div className="flex h-24 w-32 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-ink-200 bg-ink-50">
          {value ? <img src={value} alt="" className="h-full w-full object-cover" /> : <ImagePlus className="h-8 w-8 text-ink-300" />}
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-outline" onClick={() => ref.current.click()} disabled={busy}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />} {value ? 'Ganti' : 'Unggah'}
          </button>
          {value && (
            <button type="button" className="btn-ghost text-error-600 hover:text-error-700" onClick={() => onChange('')}>
              Hapus
            </button>
          )}
        </div>
        <input ref={ref} type="file" accept="image/*" className="hidden" onChange={onFile} />
      </div>
    </div>
  );
}

function Progress({ value = 0, className = '', showLabel = true }) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div className={className}>
      {showLabel && <div className="mb-1 flex justify-between text-xs"><span className="text-ink-500">Progres</span><span className="font-bold text-brand-700">{pct}%</span></div>}
      <div className="h-2 w-full overflow-hidden rounded-full bg-ink-200">
        <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-gold-400 transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
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

// Bottom Navigation Component - Floating capsule with center Aspirasi button
const MORE_PATHS = ['/profil', '/struktur', '/agenda', '/galeri'];

function BottomNav({ currentPath, onNavigate, onOpenSheet }) {
  const navItems = [
    { path: '/', label: 'Beranda', icon: Home, active: currentPath === '/' },
    { path: '/program', label: 'Proker', icon: Target, active: currentPath.startsWith('/program') },
    { path: '/aspirasi', label: 'Aspirasi', icon: MessageSquare, active: currentPath === '/aspirasi', center: true },
    { path: '/berita', label: 'Berita', icon: Newspaper, active: currentPath.startsWith('/berita') },
    { path: '/lainnya', label: 'Lainnya', icon: Grid, active: MORE_PATHS.some((p) => currentPath.startsWith(p)), sheet: true },
  ];

  return (
    <nav className="bottom-nav" role="navigation" aria-label="Navigasi utama">
      {navItems.map((item) =>
        item.center ? (
          <button
            key={item.path}
            type="button"
            onClick={() => onNavigate(item.path)}
            className="bottom-nav-center-btn"
            aria-label={item.label}
            aria-current={item.active ? 'page' : undefined}
          >
            <item.icon className="h-6 w-6" aria-hidden="true" />
          </button>
        ) : (
          <button
            key={item.path}
            type="button"
            onClick={() => (item.sheet && onOpenSheet ? onOpenSheet() : onNavigate(item.path))}
            className={`bottom-nav-item ${item.active ? 'bottom-nav-item-active' : 'bottom-nav-item-inactive'}`}
            aria-current={item.active ? 'page' : undefined}
            aria-haspopup={item.sheet && onOpenSheet ? 'dialog' : undefined}
          >
            <item.icon className="h-5 w-5" aria-hidden="true" />
            <span>{item.label}</span>
          </button>
        )
      )}
    </nav>
  );
}

// Bottom Sheet - "Lainnya" panel
function BottomSheet({ isOpen, onClose, currentPath, onNavigate }) {
  if (!isOpen) return null;

  const menuItems = [
    { path: '/', label: 'Beranda', icon: Home, active: currentPath === '/' },
    { path: '/profil', label: 'Profil', icon: BookOpen, active: currentPath.startsWith('/profil') },
    { path: '/struktur', label: 'Pengurus', icon: Users, active: currentPath.startsWith('/struktur') },
    { path: '/program', label: 'Proker', icon: Target, active: currentPath.startsWith('/program') },
    { path: '/berita', label: 'Berita', icon: Newspaper, active: currentPath.startsWith('/berita') },
    { path: '/agenda', label: 'Agenda', icon: CalendarDays, active: currentPath.startsWith('/agenda') },
    { path: '/galeri', label: 'Galeri', icon: Image, active: currentPath.startsWith('/galeri') },
    { path: '/aspirasi', label: 'Aspirasi', icon: MessageSquare, active: currentPath.startsWith('/aspirasi') },
  ];

  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menu navigasi">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-ink-950/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div className="bottom-sheet">
        {/* Handle */}
        <div className="bottom-sheet-handle" />

        {/* Header */}
        <div className="bottom-sheet-header">
          <h2 className="bottom-sheet-title">Menu</h2>
          <button
            onClick={onClose}
            className="btn-ghost -mr-1.5 p-1.5"
            aria-label="Tutup menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Grid — 4 ikon dalam satu baris, muat tanpa scroll */}
        <div className="bottom-sheet-grid">
          {menuItems.map((item) => (
            <button
              key={item.path}
              onClick={() => {
                onNavigate(item.path);
                onClose();
              }}
              className={`bottom-sheet-card ${item.active ? 'bottom-sheet-card-active' : 'bottom-sheet-card-inactive'}`}
              aria-current={item.active ? 'page' : undefined}
            >
              <span className={`bottom-sheet-card-icon ${item.active ? 'bottom-sheet-card-icon-active' : 'bottom-sheet-card-icon-inactive'}`}>
                <item.icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="text-[11px] leading-tight font-bold">{item.label}</span>
            </button>
          ))}
        </div>

        {/* Admin Login */}
        <Link
          to="/admin"
          onClick={onClose}
          className="mx-4 mb-4 flex items-center justify-center gap-2 rounded-2xl bg-ink-950 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-ink-900"
        >
          <LayoutDashboard className="h-4 w-4 text-gold-400" aria-hidden="true" />
          Masuk Pengurus
        </Link>
      </div>
    </div>
  );
}

// Card components
function PostCard({ post, large = false, className = '' }) {
  return (
    <article className={`card-hover flex flex-col overflow-hidden transition-all duration-300 ${className}`}>
      <div className={`relative overflow-hidden bg-gradient-to-br from-brand-600 to-brand-800 ${large ? 'aspect-[16/9]' : 'aspect-video'}`}>
        {post.cover ? (
          <img src={post.cover} alt={post.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Newspaper className="h-12 w-12 text-white/30" />
          </div>
        )}
        <span className="badge-gold absolute top-3 left-3">{post.category}</span>
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="flex items-center gap-1 text-xs text-ink-500">
          <CalendarDays className="h-3.5 w-3.5" /> {post.created_at ? new Date(post.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}
        </p>
        <h3 className="mt-2 font-bold text-ink-900 group-hover:text-brand-600 transition-colors line-clamp-2 {large ? 'text-xl' : ''}">{post.title}</h3>
        <p className="mt-2 line-clamp-2 text-sm text-ink-600">{post.excerpt}</p>
      </div>
    </article>
  );
}

function EventCard({ event, compact = false }) {
  const date = new Date(event.date);
  const day = date.getDate();
  const month = date.toLocaleDateString('id-ID', { month: 'short' });
  
  return (
    <div className={`card p-4 ${compact ? '' : 'flex gap-4'}`}>
      <div className={`flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-gold-400 text-ink-950 ${compact ? 'h-12 w-12' : ''}`}>
        <span className={`text-lg leading-none font-extrabold ${compact ? 'text-base' : ''}`}>{day}</span>
        <span className={`text-[10px] uppercase ${compact ? 'text-[9px]' : ''}`}>{month}</span>
      </div>
      <div className="min-w-0">
        <span className="badge-gold">{event.category}</span>
        <p className="mt-1 font-bold text-ink-900">{event.title}</p>
        {event.description && <p className="text-xs text-ink-500 line-clamp-1">{event.description}</p>}
        <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-ink-500">
          {event.time && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" /> {event.time.slice(0, 5).replace(':', '.')}
            </span>
          )}
          {event.location && (
            <span className="flex items-center gap-1">
              <MapPin className="h-3 w-3" /> {event.location}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function ProgramCard({ program, className = '' }) {
  const statusConfig = {
    rencana: { label: 'Rencana', cls: 'badge' },
    berjalan: { label: 'Berjalan', cls: 'badge-info' },
    selesai: { label: 'Selesai', cls: 'badge-success' },
    batal: { label: 'Dibatalkan', cls: 'badge-error' },
  };
  const st = statusConfig[program.status] || statusConfig.rencana;
  
  return (
    <div className={`card flex flex-col p-5 ${className}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="badge bg-ink-100 text-ink-700">{program.division_short || 'Umum'}</span>
        <span className={st.cls}>{st.label}</span>
      </div>
      <h3 className="mt-3 font-bold text-ink-900">{program.title}</h3>
      <p className="mt-1 flex-1 text-sm text-ink-600">{program.description}</p>
      <div className="mt-4 space-y-1.5 text-xs text-ink-500">
        <p className="flex items-center gap-1.5">
          <CalendarDays className="h-3.5 w-3.5" />
          {new Date(program.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
          {program.end_date && program.end_date !== program.start_date ? ` – ${new Date(program.end_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}` : ''}
        </p>
        {program.target && (
          <p className="flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" /> Sasaran: {program.target}
          </p>
        )}
      </div>
      <div className="mt-4">
        <Progress value={program.progress} showLabel />
      </div>
    </div>
  );
}

function MemberCard({ member, big = false, showInstagram = true, onSelect, className = '' }) {
  return (
    <div className={`card-hover group relative flex flex-col items-center p-6 text-center ${big ? 'ring-2 ring-gold-400' : ''} ${className}`}>
      <Avatar name={member.name} src={member.photo} className={big ? 'h-28 w-28 text-3xl' : 'h-20 w-20 text-xl'} />
      <p className={`mt-4 font-bold text-ink-900 ${big ? 'text-lg' : ''}`}>{member.name}</p>
      <p className="text-sm font-semibold text-gold-600">{member.position}</p>
      {member.class_name && <p className="text-xs text-ink-500">Kelas {member.class_name}</p>}
      {member.quote && <p className="mt-3 text-xs text-ink-500 italic">"{member.quote}"</p>}
      {showInstagram && member.instagram && (
        <a href={`https://instagram.com/${igHandle(member.instagram)}`} target="_blank" rel="noreferrer noopener" className="relative z-20 mt-3 inline-flex items-center gap-1 text-xs text-rose-600 hover:underline">
          <InstagramIcon className="h-3.5 w-3.5" /> @{igHandle(member.instagram)}
        </a>
      )}
      {(onSelect || member.id) && (
        <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-gold-600">
          Lihat profil
          <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
        </span>
      )}
      <MemberProfileLink member={member} onSelect={onSelect} />
    </div>
  );
}

/**
 * Area klik pada kartu pengurus memakai pola stretched-link: elemen transparan
 * menutupi seluruh kartu. Kalau `onSelect` diberikan, elemennya <button> yang
 * membuka modal di tempat; tanpa itu menjadi <Link> ke halaman profil.
 */
function MemberProfileLink({ member, onSelect }) {
  if (!member?.id && !onSelect) return null;
  const className =
    'absolute inset-0 z-10 rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600';
  const label = `Lihat profil lengkap ${member?.name ?? ''}`.trim();

  if (onSelect) {
    return (
      <button type="button" onClick={() => onSelect(member)} className={className} aria-label={label}>
        <span className="sr-only">Lihat profil lengkap</span>
      </button>
    );
  }
  return (
    <Link to={`/pengurus/${member.id}`} className={className} aria-label={label}>
      <span className="sr-only">Lihat profil lengkap</span>
    </Link>
  );
}

/**
 * Isi satu kartu profil: foto, nama, jabatan, kelas, Instagram, dan motto.
 * Panel motto dibuat full-bleed dan menempel ke sisi bawah kartu, jadi batas
 * kartu tepat berhenti di bawah moto — tanpa ruang kosong menggantung.
 * Pembungkus kartu induk harus memakai `overflow-hidden p-0`.
 */
function MemberProfileCard({ member }) {
  const instagram = igHandle(member.instagram);
  const kelasNama = (member.class_name ?? '').trim();
  const jabatan = jabatanLengkap(member);

  return (
    <div className={`px-6 pt-8 text-center sm:px-8 ${member.quote ? 'pb-0' : 'pb-8'}`}>
      <Avatar name={member.name} src={member.photo} className="mx-auto h-40 w-40 text-4xl ring-4 ring-gold-400" />
      <h2 className="mt-6 text-2xl font-extrabold text-ink-900">{member.name}</h2>

      {jabatan && (
        <p className="mx-auto mt-3 w-fit rounded-full bg-gold-400/15 px-5 py-1.5 text-center text-sm font-bold text-gold-700 ring-1 ring-gold-400/40">
          {jabatan}
        </p>
      )}

      <div className="mt-5 flex flex-col items-center gap-2 text-sm text-ink-600">
        {kelasNama && (
          <p className="flex items-center gap-1.5">
            <GraduationCap className="h-4 w-4 text-ink-400" /> Kelas {kelasNama}
          </p>
        )}
        {instagram && (
          <a
            href={`https://instagram.com/${instagram}`}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1.5 font-semibold text-rose-600 hover:underline"
          >
            <InstagramIcon className="h-4 w-4" /> @{instagram}
          </a>
        )}
      </div>

      {member.quote && (
        <div className="-mx-6 mt-8 bg-ink-50 px-6 py-6 sm:-mx-8 sm:px-8">
          <Quote className="mx-auto h-6 w-6 text-gold-500" />
          <p className="mt-3 text-base leading-relaxed text-ink-700 italic">“{member.quote}”</p>
        </div>
      )}
    </div>
  );
}

function DivisionCard({ division, members = [], onSelectMember }) {
  return (
    <div className="card overflow-hidden">
      <div className="flex items-center gap-4 border-b border-ink-200 bg-ink-50/50 px-6 py-4">
        <div className="rounded-xl bg-gold-400 p-2.5 text-brand-950">
          <Icon name={division.icon} className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-bold text-gold-600">{division.short}</p>
          <p className="font-bold text-ink-900">{division.name}</p>
        </div>
      </div>
      <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
        {members.length === 0 && <p className="text-sm text-ink-500 col-span-full text-center py-4">Belum ada anggota.</p>}
        {members.map((m) => (
          <div key={m.id} className="group relative flex items-center gap-3 rounded-xl border border-ink-200 p-3 hover:border-gold-400 hover:bg-ink-50 transition-colors">
            <Avatar name={m.name} src={m.photo} className="h-12 w-12 text-sm" />
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-ink-900">{m.name}</p>
              <p className="text-xs text-gold-600">{m.position}</p>
              {m.class_name && <p className="text-xs text-ink-500">Kelas {m.class_name}</p>}
            </div>
            <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-ink-300 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-gold-600" />
            <MemberProfileLink member={m} onSelect={onSelectMember} />
          </div>
        ))}
      </div>
    </div>
  );
}

function StatCard({ icon: IconComponent, label, value, trend, className = '' }) {
  return (
    <div className={`card p-5 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="rounded-xl bg-brand-100 p-3 text-brand-700">
          <IconComponent className="h-6 w-6" />
        </div>
        {trend && (
          <span className="badge-success text-xs">{trend}</span>
        )}
      </div>
      <p className="mt-4 text-3xl font-extrabold text-ink-900">{value ?? '–'}</p>
      <p className="text-sm text-ink-500">{label}</p>
    </div>
  );
}

function TabButton({ active, onClick, children, className = '' }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200 ${active ? 'bg-brand-600 text-white shadow-sm' : 'bg-white text-ink-600 ring-1 ring-ink-200 hover:bg-ink-50'} ${className}`}
    >
      {children}
    </button>
  );
}

function Chip({ children, onClick, active = false, className = '' }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-full px-4 py-1.5 text-sm font-medium transition-all duration-200 ${active ? 'bg-brand-600 text-white shadow-sm' : 'bg-white text-ink-600 ring-1 ring-ink-200 hover:bg-ink-50'} ${className}`}
    >
      {children}
    </button>
  );
}

// Toast notification - Top center capsule
function Toast({ message, type = 'info', onClose }) {
  const configs = {
    success: { bg: 'bg-emerald-600', icon: CheckCircle2, iconColor: 'text-gold-400' },
    error: { bg: 'bg-red-600', icon: X, iconColor: 'text-white' },
    warning: { bg: 'bg-warning-600', icon: ShieldCheck, iconColor: 'text-white' },
    info: { bg: 'bg-brand-600', icon: MessageSquare, iconColor: 'text-white' },
  };
  const cfg = configs[type];
  const IconComp = cfg.icon;
  
  return (
    <div className={`toast ${cfg.bg} animate-fade-in`} onClick={onClose} role="alert">
      <IconComp className={`h-5 w-5 ${cfg.iconColor}`} />
      <span className="text-sm font-medium">{message}</span>
    </div>
  );
}

// Admin sidebar navigation
function AdminSidebar({ currentPath, onNavigate }) {
  const sections = [
    { title: 'Utama', items: [
      { path: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
      { path: '/admin/aspirasi', label: 'Aspirasi', icon: MessageSquare },
    ]},
    { title: 'Konten', items: [
      { path: '/admin/berita', label: 'Berita', icon: FileText },
      { path: '/admin/agenda', label: 'Agenda', icon: CalendarDays },
      { path: '/admin/program', label: 'Program Kerja', icon: BarChart2 },
      { path: '/admin/pengurus', label: 'Pengurus', icon: Users },
      { path: '/admin/sekbid', label: 'Seksi Bidang', icon: FolderOpen },
      { path: '/admin/galeri', label: 'Galeri', icon: Image },
    ]},
    { title: 'Pengaturan', items: [
      { path: '/admin/pengaturan', label: 'Pengaturan Situs', icon: Settings },
      { path: '/admin/akun', label: 'Akun Saya', icon: User },
    ]},
  ];

  return (
    <aside className="fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-ink-200 lg:sticky lg:top-0 lg:h-screen">
      <div className="flex h-16 items-center justify-between border-b border-ink-200 px-4">
        <Link to="/admin" className="flex items-center gap-2 text-brand-700">
          <Logo className="h-8 w-8" />
          <span className="font-bold text-sm">Admin OSIS</span>
        </Link>
      </div>
      <nav className="flex-1 overflow-y-auto p-4 space-y-6">
        {sections.map((section, si) => (
          <div key={si}>
            <p className="mb-2 px-3 text-xs font-bold uppercase text-ink-400 tracking-wider">{section.title}</p>
            <ul className="space-y-1">
              {section.items.map((item) => {
                const isActive = item.exact ? currentPath === item.path : currentPath.startsWith(item.path);
                return (
                  <li key={item.path}>
                    <button
                      onClick={() => onNavigate(item.path)}
                      className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${isActive ? 'bg-brand-50 text-brand-700' : 'text-ink-600 hover:bg-ink-50'}`}
                    >
                      <item.icon className={`h-5 w-5 ${isActive ? 'text-brand-600' : 'text-ink-400'}`} aria-hidden="true" />
                      {item.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      <div className="border-t border-ink-200 p-4">
        <a href="/" target="_blank" rel="noreferrer" className="btn-secondary w-full justify-center">
          <ArrowRight className="h-4 w-4" /> Lihat Website
        </a>
      </div>
    </aside>
  );
}

// Card wrapper component
function Card({ children, className = '', ...props }) {
  return <div className={`card ${className}`} {...props}>{children}</div>;
}

// Badge wrapper component
function Badge({ children, variant = 'primary', className = '', ...props }) {
  const variants = {
    primary: 'badge-primary',
    gold: 'badge-gold',
    success: 'badge-success',
    warning: 'badge-warning',
    error: 'badge-error',
    info: 'badge-info',
  };
  return <span className={`badge ${variants[variant]} ${className}`} {...props}>{children}</span>;
}

// Import Link for AdminSidebar
import { Link } from 'react-router-dom';

// Export all components
export {
  Icon,
  Logo,
  Spinner,
  ErrorBox,
  Empty,
  Avatar,
  SectionTitle,
  PageHeader,
  Modal,
  ImageInput,
  Progress,
  InstagramIcon,
  YoutubeIcon,
  BottomNav,
  BottomSheet,
  PostCard,
  EventCard,
  ProgramCard,
  MemberCard,
  DivisionCard,
  MemberProfileCard,
  StatCard,
  TabButton,
  Chip,
  Toast,
  AdminSidebar,
  Card,
  Badge,
};