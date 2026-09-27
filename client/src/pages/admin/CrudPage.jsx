import { useState } from 'react';
import { Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { table } from '../../lib/data';
import { useQuery, useToast } from '../../lib/context';
import { Empty, ErrorBox, ImageInput, Modal, Spinner } from '../../components/ui';

/**
 * Halaman CRUD generik.
 * fields: [{ name, label, type: text|textarea|select|date|time|number|checkbox|image|range, options, required, full, help }]
 * columns: [{ key, label, render(row) }]
 */
export default function CrudPage({ endpoint, title, fields, columns, defaults = {}, searchKeys = [], filters, wide = false, emptyIcon = 'Inbox' }) {
  const { data, loading, error, reload } = useQuery(() => table(endpoint).list(), [endpoint]);
  const toast = useToast();
  const [editing, setEditing] = useState(null); // null | {} (baru) | row
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [q, setQ] = useState('');
  const [filterVal, setFilterVal] = useState('');

  const openNew = () => {
    setForm({ ...defaults });
    setEditing({});
  };
  const openEdit = (row) => {
    setForm({ ...row });
    setEditing(row);
  };
  const close = () => setEditing(null);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {};
      for (const f of fields) {
        let v = form[f.name];
        if (f.type === 'number' || f.type === 'range') v = v === '' || v == null ? null : Number(v);
        if (f.type === 'checkbox') v = !!v;
        if (f.type === 'select' && f.numeric) v = v === '' || v == null ? null : Number(v);
        if (typeof v === 'string' && v.trim() === '' && !f.keepEmpty) v = null;
        payload[f.name] = v ?? null;
      }
      if (editing.id) await table(endpoint).update(editing.id, payload);
      else await table(endpoint).create(payload);
      toast(`${title} berhasil disimpan`);
      close();
      reload();
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row) => {
    if (!confirm(`Hapus data ini?\n\n${row[columns[0].key] ?? ''}`)) return;
    try {
      await table(endpoint).remove(row.id);
      toast('Data dihapus');
      reload();
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const rows = (data || []).filter((r) => {
    if (filters && filterVal && String(r[filters.key]) !== filterVal) return false;
    if (!q) return true;
    return searchKeys.some((k) => String(r[k] ?? '').toLowerCase().includes(q.toLowerCase()));
  });

  const [primary, ...rest] = columns;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        {searchKeys.length > 0 && (
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-ink-400" />
            <input className="input rounded-full pl-12" type="search" placeholder={`Cari ${title.toLowerCase()}…`} value={q} onChange={(e) => setQ(e.target.value)} aria-label="Cari" />
          </div>
        )}
        {filters && (
          <select className="input rounded-full sm:w-60" value={filterVal} onChange={(e) => setFilterVal(e.target.value)} aria-label={filters.label}>
            <option value="">{filters.label}</option>
            {filters.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        )}
        <button className="btn-primary hidden sm:ml-auto sm:inline-flex" onClick={openNew}>
          <Plus className="h-4 w-4" /> Tambah {title}
        </button>
      </div>

      {data && (
        <p className="px-1 text-xs font-semibold text-ink-500">
          {rows.length} dari {data.length} data
        </p>
      )}
      {loading && <Spinner />}
      {error && <ErrorBox message={error} />}
      {data && rows.length === 0 && <Empty icon={emptyIcon} title={q || filterVal ? 'Tidak ada yang cocok' : `Belum ada ${title.toLowerCase()}`} />}

      {/* HP: daftar kartu */}
      {rows.length > 0 && (
        <ul className="space-y-2.5 sm:hidden">
          {rows.map((r) => (
            <li key={r.id} className="card p-4">
              <div className="min-w-0">{primary.render ? primary.render(r) : <p className="font-bold text-ink-950">{r[primary.key]}</p>}</div>
              {rest.length > 0 && (
                <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-ink-100 pt-3 text-sm">
                  {rest.map((c) => (
                    <div key={c.key} className="min-w-0">
                      <dt className="text-[11px] font-bold tracking-wide text-ink-400 uppercase">{c.label}</dt>
                      <dd className="mt-0.5 text-ink-800">{c.render ? c.render(r) : r[c.key] ?? '–'}</dd>
                    </div>
                  ))}
                </dl>
              )}
              <div className="mt-3 flex gap-2">
                <button className="btn-outline min-h-10 flex-1" onClick={() => openEdit(r)}>
                  <Pencil className="h-4 w-4" /> Edit
                </button>
                <button className="btn-icon h-10 w-10 border border-red-200 text-red-600 hover:bg-red-50" onClick={() => remove(r)} aria-label="Hapus">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Tablet & desktop: tabel */}
      {rows.length > 0 && (
        <div className="card hidden overflow-x-auto sm:block">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-ink-200 text-[11px] tracking-wide text-ink-500 uppercase">
              <tr>
                {columns.map((c) => (
                  <th key={c.key} className="px-4 py-3.5 font-bold">
                    {c.label}
                  </th>
                ))}
                <th className="px-4 py-3.5 text-right font-bold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-ink-50/70">
                  {columns.map((c) => (
                    <td key={c.key} className="px-4 py-3 align-middle">
                      {c.render ? c.render(r) : r[c.key]}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button className="btn-icon h-9 w-9 text-ink-700 hover:bg-ink-100" onClick={() => openEdit(r)} aria-label="Edit">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button className="btn-icon h-9 w-9 text-red-600 hover:bg-red-50" onClick={() => remove(r)} aria-label="Hapus">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* FAB tambah (HP) */}
      <button
        className="btn-sun fixed right-4 bottom-24 z-30 min-h-14 rounded-full pr-6 pl-5 shadow-[0_12px_32px_-8px_rgba(21,20,18,.45)] sm:hidden"
        onClick={openNew}
        style={{ marginBottom: 'env(safe-area-inset-bottom)' }}
      >
        <Plus className="h-5 w-5" strokeWidth={2.5} /> Tambah
      </button>

      <Modal open={!!editing} onClose={close} title={`${editing?.id ? 'Edit' : 'Tambah'} ${title}`} wide={wide}>
        <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
          {fields.map((f) => (
            <div key={f.name} className={f.full || f.type === 'textarea' || f.type === 'image' ? 'sm:col-span-2' : ''}>
              {f.type === 'checkbox' ? (
                <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded-2xl bg-ink-50 px-4 text-sm font-semibold text-ink-800 sm:mt-6">
                  <input type="checkbox" className="h-5 w-5 accent-ink-900" checked={!!form[f.name]} onChange={(e) => setForm({ ...form, [f.name]: e.target.checked })} />
                  {f.label}
                </label>
              ) : (
                <>
                  <label className="label">
                    {f.label} {f.required && <span className="text-red-500">*</span>}
                  </label>
                  <Field f={f} value={form[f.name]} onChange={(v) => setForm({ ...form, [f.name]: v })} />
                </>
              )}
              {f.help && <p className="mt-1 text-xs text-ink-500">{f.help}</p>}
            </div>
          ))}
          <div className="sticky bottom-0 -mx-5 flex gap-2 border-t border-ink-100 bg-white px-5 pt-3 sm:static sm:col-span-2 sm:mx-0 sm:justify-end sm:border-0 sm:px-0 sm:pt-0">
            <button type="button" className="btn-outline flex-1 sm:flex-none" onClick={close}>
              Batal
            </button>
            <button className="btn-primary flex-1 sm:flex-none" disabled={saving}>
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

function Field({ f, value, onChange }) {
  const v = value ?? '';
  switch (f.type) {
    case 'textarea':
      return <textarea className="input" rows={f.rows || 4} value={v} onChange={(e) => onChange(e.target.value)} required={f.required} />;
    case 'select':
      return (
        <select className="input" value={v} onChange={(e) => onChange(e.target.value)} required={f.required}>
          {f.placeholder !== false && <option value="">{f.placeholder || '— Pilih —'}</option>}
          {f.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      );
    case 'image':
      return <ImageInput value={v} onChange={onChange} />;
    case 'range':
      return (
        <div className="flex items-center gap-3">
          <input type="range" min={0} max={100} step={5} className="flex-1 accent-ink-900" value={v || 0} onChange={(e) => onChange(e.target.value)} />
          <span className="w-12 text-right text-sm font-semibold">{v || 0}%</span>
        </div>
      );
    default:
      return <input className="input" type={f.type || 'text'} value={v} onChange={(e) => onChange(e.target.value)} required={f.required} placeholder={f.placeholder} />;
  }
}
