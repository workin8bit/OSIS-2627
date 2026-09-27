import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Activity, ArrowRight, BookOpen, Camera, Flag, Heart, ImagePlus, Inbox, Languages, Lightbulb, Loader2, Megaphone,
  Monitor, Moon, Music, Palette, Shield, Star, Trophy, Users, Vote, X,
} from 'lucide-react';
import { initials } from '../lib/format';
import { uploadFile } from '../lib/data';
import { useToast } from '../lib/context';

// Ikon yang tersedia untuk sekbid (dapat dipilih di panel admin)
export const ICONS = { Activity, BookOpen, Camera, Flag, Heart, Inbox, Languages, Lightbulb, Megaphone, Monitor, Moon, Music, Palette, Shield, Star, Trophy, Users, Vote };

export function Icon({ name, ...props }) {
  const C = ICONS[name] || Users;
  return <C {...props} />;
}

export function Logo({ className = 'h-10 w-10' }) {
  return <img src="/favicon.svg" alt="Logo OSIS" className={className} />;
}

export function Spinner({ className = '' }) {
  return (
    <div className={`flex items-center justify-center py-16 text-ink-400 ${className}`} role="status" aria-label="Memuat">
      <Loader2 className="h-7 w-7 animate-spin" />
    </div>
  );
}

/** Kerangka abu-abu saat memuat, agar tata letak tidak meloncat. */
export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-3xl bg-ink-100 ${className}`} />;
}

export function ErrorBox({ message }) {
  return <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{message}</div>;
}

export function Empty({ icon = 'Inbox', title = 'Belum ada data', desc }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-ink-300 bg-white/60 px-6 py-14 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-ink-100 text-ink-500">
        <Icon name={icon} className="h-7 w-7" />
      </div>
      <p className="font-bold text-ink-800">{title}</p>
      {desc && <p className="mt-1 max-w-xs text-sm text-ink-500">{desc}</p>}
    </div>
  );
}

const AVATAR_TONES = ['bg-ink-900 text-sun-400', 'bg-sun-400 text-ink-950', 'bg-ink-200 text-ink-800', 'bg-ink-700 text-white', 'bg-sun-200 text-ink-900'];

export function Avatar({ name, src, className = 'h-20 w-20 text-xl' }) {
  if (src) return <img src={src} alt={name} className={`${className} rounded-full object-cover`} />;
  const idx = [...(name || '')].reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_TONES.length;
  return (
    <div className={`${className} flex shrink-0 items-center justify-center rounded-full font-extrabold ${AVATAR_TONES[idx]}`} aria-label={name}>
      {initials(name)}
    </div>
  );
}

/** Judul bagian — rata kiri (pola aplikasi), dengan tautan "Lihat semua" opsional. */
export function SectionTitle({ eyebrow, title, desc, to, linkLabel = 'Lihat semua', dark = false }) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div className="min-w-0">
        {eyebrow && <p className={`eyebrow mb-1.5 ${dark ? 'text-ink-400' : ''}`}>{eyebrow}</p>}
        <h2 className={`text-2xl leading-tight font-extrabold tracking-tight sm:text-3xl ${dark ? 'text-white' : 'text-ink-950'}`}>{title}</h2>
        {desc && <p className={`mt-2 max-w-2xl text-sm leading-relaxed sm:text-base ${dark ? 'text-ink-300' : 'text-ink-600'}`}>{desc}</p>}
      </div>
      {to && (
        <Link to={to} className={`group inline-flex shrink-0 items-center gap-1 py-2 text-sm font-bold ${dark ? 'text-sun-400' : 'text-ink-900'}`}>
          {linkLabel} <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}

/** Kepala halaman ringkas. `highlight` = kata yang diberi stabilo kuning. */
export function PageHeader({ title, highlight, desc, eyebrow, children }) {
  return (
    <header className="container-x pt-6 pb-6 sm:pt-12 sm:pb-10">
      {eyebrow && (
        <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-ink-900 py-1 pr-3 pl-1.5 text-[11px] font-extrabold tracking-[.12em] text-white uppercase">
          <span className="h-4 w-4 rounded-full bg-sun-400" />
          {eyebrow}
        </p>
      )}
      <h1 className="text-[2rem] leading-[1.1] font-extrabold tracking-tight text-ink-950 sm:text-5xl">
        {title} {highlight && <span className="mark">{highlight}</span>}
      </h1>
      {desc && <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-ink-600 sm:text-lg">{desc}</p>}
      {children}
    </header>
  );
}

/** Modal — tampil sebagai bottom sheet di HP, dialog di tengah pada layar besar. */
export function Modal({ open, onClose, title, children, wide = false }) {
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
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-ink-950/60 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={onClose} role="dialog" aria-modal="true" aria-label={title}>
      <div
        className={`sheet-in flex max-h-[92dvh] w-full flex-col rounded-t-4xl bg-white sm:fade-in sm:rounded-4xl ${wide ? 'sm:max-w-3xl' : 'sm:max-w-lg'}`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mt-2.5 h-1.5 w-10 rounded-full bg-ink-200 sm:hidden" />
        <div className="flex items-center justify-between gap-3 px-5 pt-3 pb-3 sm:px-6 sm:pt-5">
          <h3 className="text-lg font-extrabold text-ink-950">{title}</h3>
          <button onClick={onClose} className="btn-icon -mr-2 text-ink-500 hover:bg-ink-100" aria-label="Tutup">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="safe-bottom overflow-y-auto px-5 pb-6 sm:px-6">{children}</div>
      </div>
    </div>
  );
}

export function ImageInput({ value, onChange }) {
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
    <div className="flex items-center gap-3">
      <div className="flex h-20 w-28 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-ink-200 bg-ink-50">
        {value ? <img src={value} alt="" className="h-full w-full object-cover" /> : <ImagePlus className="h-6 w-6 text-ink-400" />}
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn-outline" onClick={() => ref.current.click()} disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />} {value ? 'Ganti' : 'Unggah'}
        </button>
        {value && (
          <button type="button" className="btn-ghost text-red-600" onClick={() => onChange('')}>
            Hapus
          </button>
        )}
      </div>
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={onFile} />
    </div>
  );
}

/** Bar progres. `dark` untuk dipakai di atas permukaan gelap (isi kuning). */
export function Progress({ value = 0, dark = false }) {
  const v = Math.min(100, Math.max(0, value));
  return (
    <div className={`h-2 w-full overflow-hidden rounded-full ${dark ? 'bg-white/15' : 'bg-ink-100'}`} role="progressbar" aria-valuenow={v} aria-valuemin={0} aria-valuemax={100}>
      <div className={`h-full rounded-full transition-all duration-700 ${dark ? 'bg-sun-400' : 'bg-ink-900'}`} style={{ width: `${v}%` }} />
    </div>
  );
}

export function InstagramIcon({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
    </svg>
  );
}

export function YoutubeIcon({ className = 'h-5 w-5' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M2.5 17a24 24 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.6 49.6 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24 24 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.6 49.6 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
      <path d="m10 15 5-3-5-3z" />
    </svg>
  );
}
