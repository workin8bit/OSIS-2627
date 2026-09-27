import { useState } from 'react';
import { Search, Trash2 } from 'lucide-react';
import { api } from '../../lib/api';
import { useFetch, useToast } from '../../lib/context';
import { Empty, ErrorBox, Modal, Spinner } from '../../components/ui';
import { STATUS_ASPIRASI, formatDate, relativeTime } from '../../lib/format';

export default function AspirationsAdmin() {
  const { data, loading, error, reload } = useFetch('/admin/aspirations');
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
      await api(`/admin/aspirations/${sel.id}`, { method: 'PUT', body: form });
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
    await api(`/admin/aspirations/${a.id}`, { method: 'DELETE' });
    toast('Aspirasi dihapus');
    reload();
  };

  const counts = Object.fromEntries(Object.keys(STATUS_ASPIRASI).map((k) => [k, (data || []).filter((a) => a.status === k).length]));
  const rows = (data || []).filter(
    (a) => (!status || a.status === status) && (!q || `${a.ticket} ${a.message} ${a.name || ''} ${a.category}`.toLowerCase().includes(q.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <button onClick={() => setStatus('')} className={`rounded-full px-4 py-1.5 text-sm font-medium ${!status ? 'bg-brand-700 text-white' : 'bg-white ring-1 ring-slate-200'}`}>
          Semua ({data?.length || 0})
        </button>
        {Object.entries(STATUS_ASPIRASI).map(([k, v]) => (
          <button key={k} onClick={() => setStatus(k)} className={`rounded-full px-4 py-1.5 text-sm font-medium ${status === k ? 'bg-brand-700 text-white' : 'bg-white ring-1 ring-slate-200'}`}>
            {v.label} ({counts[k] || 0})
          </button>
        ))}
      </div>
      <div className="relative">
        <Search className="absolute top-3 left-3 h-4 w-4 text-slate-400" />
        <input className="input pl-9" placeholder="Cari tiket, isi, nama..." value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {loading && <Spinner />}
      {error && <ErrorBox message={error} />}
      {data && rows.length === 0 && <Empty icon="Inbox" title="Tidak ada aspirasi" />}

      <div className="grid gap-3">
        {rows.map((a) => (
          <div key={a.id} className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-start">
            <div className="min-w-0 flex-1 cursor-pointer" onClick={() => open(a)}>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-mono font-bold text-slate-700">{a.ticket}</span>
                <span className={`badge ${STATUS_ASPIRASI[a.status]?.cls}`}>{STATUS_ASPIRASI[a.status]?.label}</span>
                <span className="badge bg-slate-100 text-slate-600">{a.category}</span>
                <span className="text-slate-400">{relativeTime(a.created_at)}</span>
              </div>
              <p className="mt-2 text-sm text-slate-800">{a.message}</p>
              <p className="mt-1 text-xs text-slate-500">
                Dari: {a.anonymous ? 'Anonim' : `${a.name || '-'}${a.class_name ? ` (${a.class_name})` : ''}`}
              </p>
              {a.response && <p className="mt-2 border-l-2 border-brand-400 pl-3 text-sm text-slate-600">{a.response}</p>}
            </div>
            <div className="flex gap-2">
              <button className="btn-outline py-2" onClick={() => open(a)}>
                Tanggapi
              </button>
              <button className="rounded-lg p-2 text-red-600 hover:bg-red-50" onClick={() => remove(a)} aria-label="Hapus">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal open={!!sel} onClose={() => setSel(null)} title={`Tindak Lanjut ${sel?.ticket || ''}`}>
        {sel && (
          <form onSubmit={save} className="space-y-4">
            <div className="rounded-xl bg-slate-50 p-4 text-sm">
              <p className="text-xs text-slate-500">
                {sel.category} · {formatDate(sel.created_at, { withDay: true })}
              </p>
              <p className="mt-2 text-slate-800">{sel.message}</p>
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {Object.entries(STATUS_ASPIRASI).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">Tanggapan (ditampilkan ke siswa)</label>
              <textarea className="input" rows={4} value={form.response} onChange={(e) => setForm({ ...form, response: e.target.value })} />
              <p className="mt-1 text-xs text-slate-500">Aspirasi berstatus “Selesai” dengan tanggapan akan tampil di halaman publik (tanpa identitas pengirim).</p>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" className="btn-outline" onClick={() => setSel(null)}>
                Batal
              </button>
              <button className="btn-primary" disabled={saving}>
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
