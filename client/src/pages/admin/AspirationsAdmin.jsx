import { useState } from 'react';
import { Search, Trash2 } from 'lucide-react';
import { table } from '../../lib/data';
import { useQuery, useToast } from '../../lib/context';
import { Empty, ErrorBox, Modal, Spinner } from '../../components/ui';
import { STATUS_ASPIRASI, formatDate, relativeTime } from '../../lib/format';

export default function AspirationsAdmin() {
  const { data, loading, error, reload } = useQuery(() => table('aspirations').list());
  const toast = useToast();
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(null);
  const [form, setForm] = useState({ status: 'baru', response: '' });
  const [saving, setSaving] = useState(false);

  const open = (a) => {
    setSel(a);
    setForm({ status: a.status === 'baru' ? 'diproses' : a.status, response: a.response || '' });
  };

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await table('aspirations').update(sel.id, { status: form.status, response: form.response.trim() || null });
      toast('Aspirasi diperbarui');
      setSel(null);
      reload();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (a) => {
    if (!confirm(`Hapus aspirasi ${a.ticket}?`)) return;
    try {
      await table('aspirations').remove(a.id);
      toast('Aspirasi dihapus');
      reload();
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const counts = Object.fromEntries(Object.keys(STATUS_ASPIRASI).map((k) => [k, (data || []).filter((a) => a.status === k).length]));
  const rows = (data || []).filter(
    (a) => (!status || a.status === status) && (!q || `${a.ticket} ${a.message} ${a.name || ''} ${a.category}`.toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
        <button onClick={() => setStatus('')} className={`chip ${!status ? 'chip-active' : ''}`}>
          Semua ({data?.length || 0})
        </button>
        {Object.entries(STATUS_ASPIRASI).map(([k, v]) => (
          <button key={k} onClick={() => setStatus(k)} className={`chip ${status === k ? 'chip-active' : ''}`}>
            {v.label} ({counts[k] || 0})
          </button>
        ))}
      </div>
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-ink-400" />
        <input className="input rounded-full pl-12" type="search" placeholder="Cari tiket, isi, nama…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {loading && <Spinner />}
      {error && <ErrorBox message={error} />}
      {data && rows.length === 0 && <Empty icon="Inbox" title="Tidak ada aspirasi" />}

      <div className="grid gap-3">
        {rows.map((a) => (
          <div key={a.id} className={`card flex flex-col gap-3 p-4 sm:flex-row sm:items-start ${a.status === 'baru' ? 'border-sun-400 ring-2 ring-sun-400/40' : ''}`}>
            <div className="min-w-0 flex-1 cursor-pointer" onClick={() => open(a)}>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-mono font-bold text-ink-700">{a.ticket}</span>
                <span className={`badge ${STATUS_ASPIRASI[a.status]?.cls}`}>{STATUS_ASPIRASI[a.status]?.label}</span>
                <span className="badge bg-ink-100 text-ink-600">{a.category}</span>
                <span className="text-ink-400">{relativeTime(a.created_at)}</span>
              </div>
              <p className="mt-2 text-sm text-ink-800">{a.message}</p>
              <p className="mt-1 text-xs text-ink-500">
                Dari: {a.anonymous ? 'Anonim' : `${a.name || '-'}${a.class_name ? ` (${a.class_name})` : ''}`}
              </p>
              {a.response && <p className="mt-2 rounded-2xl bg-ink-50 p-3 text-sm text-ink-700"><b className="text-ink-900">Tanggapan:</b> {a.response}</p>}
            </div>
            <div className="flex gap-2">
              <button className={`${a.status === 'baru' ? 'btn-sun' : 'btn-outline'} min-h-10 flex-1 sm:flex-none`} onClick={() => open(a)}>
                Tanggapi
              </button>
              <button className="btn-icon h-10 w-10 border border-red-200 text-red-600 hover:bg-red-50" onClick={() => remove(a)} aria-label="Hapus">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal open={!!sel} onClose={() => setSel(null)} title={`Tindak Lanjut ${sel?.ticket || ''}`}>
        {sel && (
          <form onSubmit={save} className="space-y-4">
            <div className="rounded-2xl bg-ink-50 p-4 text-sm">
              <p className="text-xs text-ink-500">
                {sel.category} · {formatDate(sel.created_at, { withDay: true })}
              </p>
              <p className="mt-2 text-ink-800">{sel.message}</p>
            </div>
            <div>
              <p className="label">Status</p>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(STATUS_ASPIRASI).map(([k, v]) => (
                  <button
                    type="button"
                    key={k}
                    onClick={() => setForm({ ...form, status: k })}
                    aria-pressed={form.status === k}
                    className={`min-h-11 rounded-2xl border px-3 text-sm font-bold transition ${form.status === k ? 'border-ink-900 bg-ink-900 text-white' : 'border-ink-200 bg-white text-ink-700'}`}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label">Tanggapan (ditampilkan ke siswa)</label>
              <textarea className="input" rows={4} value={form.response} onChange={(e) => setForm({ ...form, response: e.target.value })} />
              <p className="mt-1 text-xs text-ink-500">Aspirasi berstatus “Selesai” dengan tanggapan akan tampil di halaman publik (tanpa identitas pengirim).</p>
            </div>
            <div className="flex gap-2 sm:justify-end">
              <button type="button" className="btn-outline flex-1 sm:flex-none" onClick={() => setSel(null)}>
                Batal
              </button>
              <button className="btn-primary flex-1 sm:flex-none" disabled={saving}>
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
