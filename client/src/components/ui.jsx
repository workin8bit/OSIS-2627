import { useEffect, useRef, useState } from 'react';
import {
  Activity, BookOpen, Camera, Flag, Heart, ImagePlus, Inbox, Languages, Lightbulb, Loader2, Megaphone,
  Monitor, Moon, Music, Palette, Shield, Star, Trophy, Users, Vote, X,
} from 'lucide-react';
import { initials } from '../lib/format';
import { uploadFile } from '../lib/api';
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
    <div className={`flex items-center justify-center py-16 text-brand-700 ${className}`}>
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  );
}

export function ErrorBox({ message }) {
  return <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{message}</div>;
}

export function Empty({ icon = 'Inbox', title = 'Belum ada data', desc }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white py-14 text-center">
      <Icon name={icon} className="mb-3 h-10 w-10 text-slate-400" />
      <p className="font-semibold text-slate-700">{title}</p>
      {desc && <p className="mt-1 text-sm text-slate-500">{desc}</p>}
    </div>
  );
}

export function Avatar({ name, src, className = 'h-20 w-20 text-xl' }) {
  if (src) return <img src={src} alt={name} className={`${className} rounded-full object-cover`} />;
  const colors = ['from-brand-600 to-brand-800', 'from-amber-400 to-orange-500', 'from-emerald-500 to-teal-600', 'from-fuchsia-500 to-purple-600', 'from-sky-500 to-blue-600'];
  const idx = [...(name || '')].reduce((a, c) => a + c.charCodeAt(0), 0) % colors.length;
  return (
    <div className={`${className} flex items-center justify-center rounded-full bg-gradient-to-br ${colors[idx]} font-bold text-white`}>
      {initials(name)}
    </div>
  );
}

export function SectionTitle({ eyebrow, title, desc, center = true }) {
  return (
    <div className={`mb-10 ${center ? 'mx-auto max-w-2xl text-center' : ''}`}>
      {eyebrow && <p className="mb-2 text-sm font-bold tracking-widest text-gold-500 uppercase">{eyebrow}</p>}
      <h2 className="text-3xl font-extrabold tracking-tight text-brand-950 sm:text-4xl">{title}</h2>
      {desc && <p className="mt-3 text-slate-600">{desc}</p>}
    </div>
  );
}

export function PageHeader({ title, desc, eyebrow }) {
  return (
    <section className="relative overflow-hidden bg-brand-950 pt-28 pb-16 text-white">
      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, #3b65f6 0, transparent 40%), radial-gradient(circle at 80% 60%, #f59e0b 0, transparent 35%)' }} />
      <div className="container-x relative">
        {eyebrow && <p className="mb-2 text-sm font-bold tracking-widest text-gold-400 uppercase">{eyebrow}</p>}
        <h1 className="text-3xl font-extrabold sm:text-5xl">{title}</h1>
        {desc && <p className="mt-4 max-w-2xl text-brand-100">{desc}</p>}
      </div>
    </section>
  );
}

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
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4 backdrop-blur-sm sm:items-center" onMouseDown={onClose}>
      <div className={`fade-in card my-8 w-full ${wide ? 'max-w-3xl' : 'max-w-lg'}`} onMouseDown={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h3 className="text-lg font-bold text-slate-900">{title}</h3>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-500 hover:bg-slate-100" aria-label="Tutup">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-5">{children}</div>
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
      <div className="flex h-20 w-28 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
        {value ? <img src={value} alt="" className="h-full w-full object-cover" /> : <ImagePlus className="h-6 w-6 text-slate-400" />}
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

export function Progress({ value = 0 }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
      <div className="h-full rounded-full bg-gradient-to-r from-brand-600 to-gold-400 transition-all" style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
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
