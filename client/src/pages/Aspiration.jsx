import { useState } from 'react';
import { CheckCircle2, Copy, MessageSquare, Search, Send, ShieldCheck, Shield, FileText, AlertCircle } from 'lucide-react';
import { useQuery, useToast } from '../lib/context';
import { getPublicAspirations, submitAspiration, trackAspiration } from '../lib/data';
import { PageHeader, Card, Badge, Progress, Empty, ErrorBox } from '../components/ui';
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
  const { data: answered } = useQuery(getPublicAspirations);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    if (!form.message.trim() || form.message.trim().length < 10) {
      toast('Pesan minimal 10 karakter', 'error');
      return;
    }
    setSending(true);
    try {
      setTicket(await submitAspiration(form));
      setForm({ name: '', class_name: '', category: 'Umum', message: '', anonymous: false });
      toast('Aspirasi terkirim! Simpan kode tiket Anda.', 'success');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSending(false);
    }
  };

  const doTrack = async (e) => {
    e.preventDefault();
    if (!code.trim()) return;
    setTrack(null);
    setTrackErr('');
    try {
      setTrack(await trackAspiration(code.trim()));
    } catch (err) {
      setTrackErr(err.message);
    }
  };

  return (
    <>
      <PageHeader 
        eyebrow="Kanal Aspirasi Digital" 
        title="Suaramu, Gerak Kami" 
        desc="Sampaikan ide, kritik, saran, atau keluhan untuk kemajuan SMA Negeri 3 Rembang. Identitasmu bisa dirahasiakan." 
      />
      <section className="section-py bg-white">
        <div className="container-x grid gap-8 lg:grid-cols-5">
          {/* Form / Result */}
          <div className="lg:col-span-3">
            <Card className="p-6 sm:p-8">
              {ticket ? (
                <div className="slide-up py-6 text-center">
                  <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-success-100">
                    <CheckCircle2 className="h-10 w-10 text-success-600" />
                  </div>
                  <h2 className="text-2xl font-extrabold text-ink-900">Aspirasi Terkirim!</h2>
                  <p className="mt-2 text-ink-600">Simpan kode tiket berikut untuk melacak tindak lanjut aspirasimu.</p>
                  <div className="mx-auto mt-5 flex max-w-xs items-center justify-between rounded-xl border-2 border-dashed border-gold-300 bg-gold-50 px-4 py-4">
                    <span className="font-mono text-2xl font-bold tracking-wider text-ink-900">{ticket}</span>
                    <button
                      className="rounded-lg p-2 text-ink-500 hover:bg-gold-200 transition-colors"
                      onClick={() => {
                        navigator.clipboard?.writeText(ticket);
                        toast('Kode tiket disalin ke clipboard', 'success');
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
                <form onSubmit={submit} className="space-y-5">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-brand-100 p-2.5 text-brand-700">
                      <MessageSquare className="h-5 w-5" />
                    </div>
                    <h2 className="text-xl font-bold text-ink-900">Formulir Aspirasi</h2>
                  </div>

                  <label className="flex cursor-pointer items-center gap-3 rounded-xl bg-gold-50 p-3 border border-gold-200">
                    <input type="checkbox" checked={form.anonymous} onChange={set('anonymous')} className="h-4 w-4 accent-brand-600" />
                    <ShieldCheck className="h-4 w-4 text-success-600" />
                    <span className="text-sm font-medium text-ink-700">Kirim sebagai <b>anonim</b> (nama & kelas tidak disimpan)</span>
                  </label>

                  {!form.anonymous && (
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="label">Nama Lengkap *</label>
                        <input className="input" value={form.name} onChange={set('name')} placeholder="Nama lengkap" maxLength={100} required />
                      </div>
                      <div>
                        <label className="label">Kelas *</label>
                        <input className="input" value={form.class_name} onChange={set('class_name')} placeholder="cth. XI-2" maxLength={20} required />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="label">Kategori *</label>
                    <select className="input" value={form.category} onChange={set('category')} required>
                      {CATEGORIES.map((c) => (
                        <option key={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="label">Isi Aspirasi *</label>
                    <textarea
                      className="textarea"
                      value={form.message}
                      onChange={set('message')}
                      placeholder="Tuliskan aspirasimu dengan jelas dan sopan..."
                      required
                      minLength={10}
                      maxLength={2000}
                    />
                    <div className="flex justify-between text-xs text-ink-400">
                      <span>{form.message.length}/2000 karakter</span>
                      <span className={form.message.length >= 10 ? 'text-success-600' : 'text-error-600'}>
                        {form.message.length >= 10 ? '✓ Minimal terpenuhi' : '✗ Minimal 10 karakter'}
                      </span>
                    </div>
                  </div>

                  <button className="btn-primary w-full py-3" disabled={sending || form.message.length < 10}>
                    <Send className="h-4 w-4" /> {sending ? 'Mengirim...' : 'Kirim Aspirasi'}
                  </button>
                </form>
              )}
            </Card>
          </div>

          {/* Track & Answered */}
          <div className="space-y-6 lg:col-span-2">
            <Card className="p-6">
              <div className="flex items-center gap-2">
                <div className="rounded-xl bg-brand-100 p-2.5 text-brand-700">
                  <FileText className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-ink-900">Lacak Aspirasi</h3>
              </div>
              <p className="mt-1 text-sm text-ink-500">Masukkan kode tiket yang kamu terima.</p>
              <form onSubmit={doTrack} className="mt-4 flex gap-2">
                <input className="input font-mono uppercase flex-1" placeholder="ASP-XXXXXX" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} required />
                <button className="btn-primary px-4" aria-label="Lacak">
                  <Search className="h-4 w-4" />
                </button>
              </form>
              {trackErr && <p className="mt-3 text-sm text-error-600 flex items-center gap-1"><AlertCircle className="h-4 w-4" />{trackErr}</p>}
              {track && (
                <div className="slide-up mt-4 rounded-xl border border-ink-200 p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-ink-900">{track.ticket}</span>
                    <Badge variant={track.status === 'selesai' ? 'success' : track.status === 'diproses' ? 'info' : track.status === 'baru' ? 'warning' : 'error'}>
                      {STATUS_ASPIRASI[track.status]?.label}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-ink-500">
                    {track.category} · dikirim {formatDate(track.created_at)}
                  </p>
                  <p className="mt-3 text-ink-700">{track.message}</p>
                  {track.response && (
                    <div className="mt-3 rounded-lg bg-brand-50 p-3 border border-brand-200">
                      <p className="text-xs font-bold text-brand-700">Tanggapan OSIS</p>
                      <p className="mt-1 text-ink-700">{track.response}</p>
                    </div>
                  )}
                </div>
              )}
            </Card>

            <Card className="p-6">
              <h3 className="font-bold text-ink-900">Aspirasi yang Sudah Ditindaklanjuti</h3>
              <div className="mt-4 space-y-3">
                {(answered || []).length === 0 ? (
                  <Empty icon="Shield" title="Belum ada" desc="Aspirasi yang sudah ditanggapi akan tampil di sini." />
                ) : (
                  (answered || []).map((a) => (
                    <div key={a.ticket} className="card p-4">
                      <div className="flex items-center justify-between text-xs">
                        <Badge variant="primary">{a.category}</Badge>
                        <span className="text-ink-400">{relativeTime(a.updated_at)}</span>
                      </div>
                      <p className="mt-2 text-ink-700">"{a.message}"</p>
                      <p className="mt-2 border-l-2 border-success-500 pl-3 text-ink-600">{a.response}</p>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </div>
      </section>
    </>
  );
}