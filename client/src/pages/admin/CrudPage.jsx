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
    // `defaults` boleh fungsi agar ikut memakai filter yang sedang aktif
    // (mis. tambah anggota langsung terisi Seksi Bidang yang dipilih)
    setForm({ ...(typeof defaults === 'function' ? defaults({ [filters?.key]: filterVal }) : defaults) });
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

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {searchKeys.length > 0 && (
          <div className="relative flex-1">
            <Search className="absolute top-3 left-3 h-4 w-4 text-slate-400" />
            <input className="input pl-9" placeholder="Cari..." value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        )}
        {filters && (
          <select className="input sm:w-56" value={filterVal} onChange={(e) => setFilterVal(e.target.value)}>
            <option value="">{filters.label}</option>
            {filters.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        )}
        <button className="btn-primary sm:ml-auto" onClick={openNew}>
          <Plus className="h-4 w-4" /> Tambah {title}
        </button>
      </div>

      {loading && <Spinner />}
      {error && <ErrorBox message={error} />}
      {data && rows.length === 0 && <Empty icon={emptyIcon} title={`Belum ada ${title.toLowerCase()}`} />}
      {rows.length > 0 && (
        <div className="card overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs text-slate-500 uppercase">
              <tr>
                {columns.map((c) => (
                  <th key={c.key} className="px-4 py-3 font-semibold">
                    {c.label}
                  </th>
                ))}
                <th className="px-4 py-3 text-right font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50">
                  {columns.map((c) => (
                    <td key={c.key} className="px-4 py-3 align-middle">
                      {c.render ? c.render(r) : r[c.key]}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <button className="rounded-lg p-2 text-brand-700 hover:bg-brand-50" onClick={() => openEdit(r)} aria-label="Edit">
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button className="rounded-lg p-2 text-red-600 hover:bg-red-50" onClick={() => remove(r)} aria-label="Hapus">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={!!editing} onClose={close} title={`${editing?.id ? 'Edit' : 'Tambah'} ${title}`} wide={wide}>
        <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
          {fields.map((f) => (
            <div key={f.name} className={f.full || f.type === 'textarea' || f.type === 'image' ? 'sm:col-span-2' : ''}>
              {f.type === 'checkbox' ? (
                <label className="flex cursor-pointer items-center gap-2 pt-6 text-sm font-medium text-slate-700">
                  <input type="checkbox" className="h-4 w-4 accent-brand-700" checked={!!form[f.name]} onChange={(e) => setForm({ ...form, [f.name]: e.target.checked })} />
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
              {f.help && <p className="mt-1 text-xs text-slate-500">{f.help}</p>}
            </div>
          ))}
          <div className="flex justify-end gap-2 sm:col-span-2">
            <button type="button" className="btn-outline" onClick={close}>
              Batal
            </button>
            <button className="btn-primary" disabled={saving}>
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
          <input type="range" min={0} max={100} step={5} className="flex-1 accent-brand-700" value={v || 0} onChange={(e) => onChange(e.target.value)} />
          <span className="w-12 text-right text-sm font-semibold">{v || 0}%</span>
        </div>
      );
    default:
      return <input className="input" type={f.type || 'text'} value={v} onChange={(e) => onChange(e.target.value)} required={f.required} placeholder={f.placeholder} />;
  }
}
