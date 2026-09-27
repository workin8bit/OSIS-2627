import { useState } from 'react';
import { CheckCircle2, Copy, MessageSquare, Search, Send, ShieldCheck } from 'lucide-react';
import { api } from '../lib/api';
import { useFetch, useToast } from '../lib/context';
import { PageHeader } from '../components/ui';
import { STATUS_ASPIRASI, formatDate, relativeTime } from '../lib/format';

const CATEGORIES = ['Umum', 'Fasilitas', 'Kegiatan', 'Akademik', 'Kebersihan', 'Kantin', 'Keamanan', 'Lainnya'];

export default function Aspiration() {
  const toast = useToast();
  const [form, setForm] = useState({ name: '', class_name: '', category: 'Umum', message: '', anonymous: false });
  const [sending, setSending] = useState(false);
  const [ticket, setTicket] = useState(null);
  const [code, setCode] = useState('');
  const [track, setTrack] = useState(null);
  const [trackErr, setTrackErr] = useState('');
  const { data: answered } = useFetch('/aspirations/public');

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      const r = await api('/aspirations', { method: 'POST', body: form });
      setTicket(r.ticket);
      setForm({ name: '', class_name: '', category: 'Umum', message: '', anonymous: false });
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSending(false);
    }
  };

  const doTrack = async (e) => {
    e.preventDefault();
    setTrack(null);
    setTrackErr('');
    try {
      setTrack(await api(`/aspirations/track/${encodeURIComponent(code.trim())}`));
    } catch (err) {
      setTrackErr(err.message);
    }
  };

  return (
    <>
      <PageHeader eyebrow="Kanal Aspirasi Digital" title="Suaramu, Gerak Kami" desc="Sampaikan ide, kritik, saran, atau keluhan untuk kemajuan SMA Negeri 3 Rembang. Identitasmu bisa dirahasiakan." />
      <section className="py-16">
        <div className="container-x grid gap-8 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <div className="card p-6 sm:p-8">
              {ticket ? (
                <div className="fade-in py-6 text-center">
                  <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-500" />
                  <h2 className="mt-4 text-2xl font-extrabold text-brand-950">Aspirasi Terkirim!</h2>
                  <p className="mt-2 text-slate-600">Simpan kode tiket berikut untuk melacak tindak lanjut aspirasimu.</p>
                  <div className="mx-auto mt-5 flex max-w-xs items-center justify-between rounded-xl border-2 border-dashed border-brand-300 bg-brand-50 px-4 py-3">
                    <span className="font-mono text-2xl font-bold tracking-wider text-brand-800">{ticket}</span>
                    <button
                      className="rounded-lg p-2 text-brand-700 hover:bg-brand-100"
                      onClick={() => {
                        navigator.clipboard?.writeText(ticket);
                        toast('Kode tiket disalin');
                      }}
                      aria-label="Salin"
                    >
                      <Copy className="h-5 w-5" />
                    </button>
                  </div>
                  <button className="btn-outline mt-6" onClick={() => setTicket(null)}>
                    Kirim aspirasi lain
                  </button>
                </div>
              ) : (
                <form onSubmit={submit} className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-brand-50 p-2.5 text-brand-700">
                      <MessageSquare className="h-5 w-5" />
                    </div>
                    <h2 className="text-xl font-bold text-brand-950">Formulir Aspirasi</h2>
                  </div>
                  <label className="flex cursor-pointer items-center gap-3 rounded-xl bg-slate-50 p-3 text-sm">
                    <input type="checkbox" checked={form.anonymous} onChange={set('anonymous')} className="h-4 w-4 accent-brand-700" />
                    <ShieldCheck className="h-4 w-4 text-emerald-600" />
                    Kirim sebagai <b>anonim</b> (nama & kelas tidak disimpan)
                  </label>
                  {!form.anonymous && (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="label">Nama</label>
                        <input className="input" value={form.name} onChange={set('name')} placeholder="Nama lengkap" maxLength={100} />
                      </div>
                      <div>
                        <label className="label">Kelas</label>
                        <input className="input" value={form.class_name} onChange={set('class_name')} placeholder="cth. XI-2" maxLength={20} />
                      </div>
                    </div>
                  )}
                  <div>
                    <label className="label">Kategori</label>
                    <select className="input" value={form.category} onChange={set('category')}>
                      {CATEGORIES.map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Isi Aspirasi *</label>
                    <textarea
                      className="input min-h-36"
                      value={form.message}
                      onChange={set('message')}
                      placeholder="Tuliskan aspirasimu dengan jelas dan sopan..."
                      required
                      minLength={10}
                      maxLength={2000}
                    />
                    <p className="mt-1 text-right text-xs text-slate-400">{form.message.length}/2000</p>
                  </div>
                  <button className="btn-primary w-full py-3" disabled={sending}>
                    <Send className="h-4 w-4" /> {sending ? 'Mengirim...' : 'Kirim Aspirasi'}
                  </button>
                </form>
              )}
            </div>
          </div>

          <div className="space-y-6 lg:col-span-2">
            <div className="card p-6">
              <h3 className="font-bold text-brand-950">Lacak Aspirasi</h3>
              <p className="mt-1 text-sm text-slate-500">Masukkan kode tiket yang kamu terima.</p>
              <form onSubmit={doTrack} className="mt-4 flex gap-2">
                <input className="input font-mono uppercase" placeholder="ASP-XXXXXX" value={code} onChange={(e) => setCode(e.target.value)} required />
                <button className="btn-primary px-3" aria-label="Lacak">
                  <Search className="h-4 w-4" />
                </button>
              </form>
              {trackErr && <p className="mt-3 text-sm text-red-600">{trackErr}</p>}
              {track && (
                <div className="fade-in mt-4 rounded-xl border border-slate-200 p-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold">{track.ticket}</span>
                    <span className={`badge ${STATUS_ASPIRASI[track.status]?.cls}`}>{STATUS_ASPIRASI[track.status]?.label}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {track.category} · dikirim {formatDate(track.created_at)}
                  </p>
                  <p className="mt-3 text-slate-700">{track.message}</p>
                  {track.response && (
                    <div className="mt-3 rounded-lg bg-brand-50 p-3">
                      <p className="text-xs font-bold text-brand-700">Tanggapan OSIS</p>
                      <p className="mt-1 text-slate-700">{track.response}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <h3 className="mb-3 font-bold text-brand-950">Aspirasi yang Sudah Ditindaklanjuti</h3>
              <div className="space-y-3">
                {(answered || []).length === 0 && <p className="text-sm text-slate-500">Belum ada.</p>}
                {(answered || []).map((a) => (
                  <div key={a.ticket} className="card p-4 text-sm">
                    <div className="flex items-center justify-between text-xs">
                      <span className="badge bg-slate-100 text-slate-700">{a.category}</span>
                      <span className="text-slate-400">{relativeTime(a.updated_at)}</span>
                    </div>
                    <p className="mt-2 text-slate-700">“{a.message}”</p>
                    <p className="mt-2 border-l-2 border-emerald-500 pl-3 text-slate-600">{a.response}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
