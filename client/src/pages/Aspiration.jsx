import { useState } from 'react';
import { Check, Copy, EyeOff, Loader2, Search, Send } from 'lucide-react';
import { useQuery, useToast } from '../lib/context';
import { getPublicAspirations, submitAspiration, trackAspiration } from '../lib/data';
import { PageHeader } from '../components/ui';
import { STATUS_ASPIRASI, formatDate, relativeTime } from '../lib/format';

const CATEGORIES = ['Umum', 'Fasilitas', 'Kegiatan', 'Akademik', 'Kebersihan', 'Kantin', 'Keamanan', 'Lainnya'];
const EMPTY = { name: '', class_name: '', category: 'Umum', message: '', anonymous: false };

/** Kartu tiket bergaya karcis — dipakai setelah kirim & hasil lacak. */
function TicketStub({ code, children }) {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-ink-950 text-white">
      <div className="flex items-center justify-between gap-3 px-5 pt-5 pb-4">
        <div>
          <p className="eyebrow text-ink-400">Kode tiket</p>
          <p className="mt-1 font-mono text-2xl font-bold tracking-wider text-sun-400">{code}</p>
        </div>
        {children}
      </div>
      <div className="relative border-t-2 border-dashed border-white/15">
        <span className="absolute -top-3 -left-3 h-6 w-6 rounded-full bg-ink-50" />
        <span className="absolute -top-3 -right-3 h-6 w-6 rounded-full bg-ink-50" />
      </div>
    </div>
  );
}

export default function Aspiration() {
  const toast = useToast();
  const [form, setForm] = useState(EMPTY);
  const [sending, setSending] = useState(false);
  const [ticket, setTicket] = useState(null);
  const [copied, setCopied] = useState(false);
  const [code, setCode] = useState('');
  const [track, setTrack] = useState(null);
  const [trackErr, setTrackErr] = useState('');
  const [tracking, setTracking] = useState(false);
  const { data: answered } = useQuery(getPublicAspirations);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      setTicket(await submitAspiration(form));
      setForm(EMPTY);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSending(false);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(ticket);
      setCopied(true);
      toast('Kode tiket disalin');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast('Salin manual kode tiketnya, ya', 'error');
    }
  };

  const doTrack = async (e) => {
    e.preventDefault();
    setTrack(null);
    setTrackErr('');
    setTracking(true);
    try {
      setTrack(await trackAspiration(code.trim().toUpperCase()));
    } catch (err) {
      setTrackErr(err.message);
    } finally {
      setTracking(false);
    }
  };

  const len = form.message.length;

  return (
    <>
      <PageHeader eyebrow="Kanal Aspirasi" title="Suaramu," highlight="gerak kami." desc="Sampaikan ide, kritik, saran, atau keluhan untuk kemajuan Smaga. Identitasmu bisa dirahasiakan." />

      <section className="container-x grid gap-4 lg:grid-cols-5 lg:items-start">
        {/* FORMULIR / TIKET */}
        <div className="lg:col-span-3">
          {ticket ? (
            <div className="fade-in space-y-4">
              <div className="rounded-3xl bg-sun-400 p-5 text-ink-950">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-ink-950 text-sun-400">
                  <Check className="h-6 w-6" strokeWidth={3} />
                </span>
                <h2 className="mt-4 text-2xl font-extrabold tracking-tight">Aspirasi terkirim!</h2>
                <p className="mt-1 text-[15px] text-ink-800">Simpan kode tiket di bawah untuk melacak tindak lanjutnya.</p>
              </div>
              <TicketStub code={ticket}>
                <button onClick={copy} className="btn-icon bg-white/10 text-white hover:bg-white/20" aria-label="Salin kode tiket">
                  {copied ? <Check className="h-5 w-5 text-sun-400" /> : <Copy className="h-5 w-5" />}
                </button>
              </TicketStub>
              <button className="btn-outline w-full" onClick={() => setTicket(null)}>
                Kirim aspirasi lain
              </button>
            </div>
          ) : (
            <form onSubmit={submit} className="card space-y-5 p-5 sm:p-7">
              {/* Anonim sebagai toggle besar */}
              <label className={`flex cursor-pointer items-center gap-3 rounded-2xl p-3.5 transition ${form.anonymous ? 'bg-ink-900 text-white' : 'bg-ink-50'}`}>
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${form.anonymous ? 'bg-sun-400 text-ink-950' : 'bg-white text-ink-600'}`}>
                  <EyeOff className="h-5 w-5" />
                </span>
                <span className="flex-1 text-sm leading-snug">
                  <b className="block">Kirim sebagai anonim</b>
                  <span className={form.anonymous ? 'text-ink-300' : 'text-ink-500'}>Nama & kelas tidak disimpan</span>
                </span>
                <input type="checkbox" checked={form.anonymous} onChange={set('anonymous')} className="peer sr-only" />
                <span className={`relative h-7 w-12 shrink-0 rounded-full transition ${form.anonymous ? 'bg-sun-400' : 'bg-ink-300'} peer-focus-visible:ring-4 peer-focus-visible:ring-sun-300/60`}>
                  <span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${form.anonymous ? 'left-6' : 'left-1'}`} />
                </span>
              </label>

              {!form.anonymous && (
                <div className="grid grid-cols-[1fr_7rem] gap-3">
                  <div>
                    <label className="label" htmlFor="asp-name">
                      Nama
                    </label>
                    <input id="asp-name" className="input" value={form.name} onChange={set('name')} placeholder="Nama lengkap" maxLength={100} autoComplete="name" />
                  </div>
                  <div>
                    <label className="label" htmlFor="asp-class">
                      Kelas
                    </label>
                    <input id="asp-class" className="input" value={form.class_name} onChange={set('class_name')} placeholder="XI-2" maxLength={20} />
                  </div>
                </div>
              )}

              <fieldset>
                <legend className="label">Kategori</legend>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((c) => (
                    <button type="button" key={c} onClick={() => setForm({ ...form, category: c })} className={`chip ${form.category === c ? 'chip-active' : ''}`} aria-pressed={form.category === c}>
                      {c}
                    </button>
                  ))}
                </div>
              </fieldset>

              <div>
                <label className="label" htmlFor="asp-msg">
                  Isi aspirasi <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="asp-msg"
                  className="input min-h-40 resize-y"
                  value={form.message}
                  onChange={set('message')}
                  placeholder="Tuliskan aspirasimu dengan jelas dan sopan…"
                  required
                  minLength={10}
                  maxLength={2000}
                />
                <div className="mt-1.5 flex justify-between text-xs">
                  <span className={len > 0 && len < 10 ? 'font-semibold text-red-600' : 'text-ink-400'}>{len > 0 && len < 10 ? `Minimal 10 karakter (kurang ${10 - len})` : 'Minimal 10 karakter'}</span>
                  <span className="text-ink-400 tabular-nums">{len}/2000</span>
                </div>
              </div>

              <button className="btn-sun min-h-13 w-full text-base" disabled={sending}>
                {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />} {sending ? 'Mengirim…' : 'Kirim aspirasi'}
              </button>
            </form>
          )}
        </div>

        {/* LACAK + DITINDAKLANJUTI */}
        <div className="space-y-4 lg:col-span-2">
          <div className="card p-5 sm:p-6">
            <h2 className="text-lg font-extrabold text-ink-950">Lacak aspirasi</h2>
            <p className="mt-0.5 text-sm text-ink-500">Masukkan kode tiket yang kamu terima.</p>
            <form onSubmit={doTrack} className="mt-4 flex gap-2">
              <input
                className="input rounded-full font-mono uppercase"
                placeholder="ASP-XXXXXX"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                required
                aria-label="Kode tiket"
                autoCapitalize="characters"
                spellCheck={false}
              />
              <button className="btn-icon h-12 w-12 bg-ink-900 text-white hover:bg-ink-800" aria-label="Lacak" disabled={tracking}>
                {tracking ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
              </button>
            </form>
            {trackErr && <p className="mt-3 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{trackErr}</p>}
            {track && (
              <div className="fade-in mt-4 space-y-3">
                <TicketStub code={track.ticket}>
                  <span className={`badge ${STATUS_ASPIRASI[track.status]?.cls}`}>{STATUS_ASPIRASI[track.status]?.label}</span>
                </TicketStub>
                <div className="px-1 text-sm">
                  <p className="text-xs font-semibold text-ink-500">
                    {track.category} · dikirim {formatDate(track.created_at)}
                  </p>
                  <p className="mt-2 leading-relaxed text-ink-800">{track.message}</p>
                </div>
                {track.response ? (
                  <div className="rounded-2xl bg-sun-100 p-4 text-sm">
                    <p className="text-xs font-extrabold tracking-wide text-ink-700 uppercase">Tanggapan OSIS</p>
                    <p className="mt-1.5 leading-relaxed text-ink-900">{track.response}</p>
                  </div>
                ) : (
                  <p className="rounded-2xl bg-ink-50 p-4 text-sm text-ink-500">Belum ada tanggapan. Cek lagi nanti, ya.</p>
                )}
              </div>
            )}
          </div>

          <div>
            <h2 className="mb-3 px-1 text-lg font-extrabold text-ink-950">Sudah ditindaklanjuti</h2>
            <div className="space-y-3">
              {(answered || []).length === 0 && <p className="rounded-3xl border border-dashed border-ink-300 p-5 text-center text-sm text-ink-500">Belum ada.</p>}
              {(answered || []).map((a) => (
                <article key={a.ticket} className="card p-4 text-sm">
                  <div className="flex items-center justify-between gap-2 text-xs">
                    <span className="badge bg-ink-100 text-ink-700">{a.category}</span>
                    <span className="text-ink-400">{relativeTime(a.updated_at)}</span>
                  </div>
                  <p className="mt-2.5 leading-relaxed text-ink-800">“{a.message}”</p>
                  <div className="mt-3 flex gap-2.5 rounded-2xl bg-ink-50 p-3">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sun-400">
                      <Check className="h-3 w-3 text-ink-950" strokeWidth={3} />
                    </span>
                    <p className="leading-relaxed text-ink-700">{a.response}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
