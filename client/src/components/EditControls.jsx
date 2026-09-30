import { useState } from 'react';
import { Pencil, Plus, Save, Trash2, X } from 'lucide-react';

/** Tombol kecil untuk masuk ke mode ubah data. */
export function EditButton({ onClick, label = 'Ubah' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex items-center gap-1 rounded-lg bg-ink-950/90 px-2 py-1 text-[11px] font-bold text-white shadow-sm transition-colors hover:bg-ink-800"
    >
      <Pencil className="h-3.5 w-3.5" /> {label}
    </button>
  );
}

/** Tombol hapus dengan konfirmasi sederhana. */
export function DeleteButton({ onDelete, label = 'Hapus' }) {
  const [armed, setArmed] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        if (!armed) {
          setArmed(true);
          setTimeout(() => setArmed(false), 3000);
          return;
        }
        onDelete();
      }}
      className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold text-white shadow-sm transition-colors ${
        armed ? 'bg-red-600' : 'bg-red-600/80 hover:bg-red-600'
      }`}
    >
      <Trash2 className="h-3.5 w-3.5" /> {armed ? 'Yakin hapus?' : label}
    </button>
  );
}

function Field({ field, value, onChange }) {
  const id = `f-${field.key}`;
  const cls =
    'w-full rounded-xl border border-ink-200 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-gold-500 focus:ring-2 focus:ring-gold-400/30';
  if (field.options) {
    return (
      <select id={id} className={cls} value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
        {field.options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    );
  }
  if (field.type === 'textarea') {
    return (
      <textarea
        id={id}
        rows={field.rows || 3}
        className={cls}
        value={value ?? ''}
        placeholder={field.placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    );
  }
  return (
    <input
      id={id}
      type={field.type || 'text'}
      className={cls}
      value={value ?? ''}
      placeholder={field.placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

/**
 * Panel form inline untuk mengubah satu data (kartu agenda, berita, program,
 * pengurus, atau pengaturan situs). Nilai disimpan lewat `onSubmit(values)`.
 */
export function EditPanel({ title, subtitle, fields, values, onClose, onSubmit, onDelete, busy }) {
  const [form, setForm] = useState(() => ({ ...values }));
  const set = (key) => (v) => setForm((f) => ({ ...f, [key]: v }));

  return (
    <div className="mt-3 rounded-2xl border-2 border-dashed border-gold-400 bg-ink-50 p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-extrabold text-ink-900">{title}</p>
          {subtitle && <p className="text-xs text-ink-500">{subtitle}</p>}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1.5 text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-900"
          aria-label="Tutup panel ubah"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {fields.map((field) => (
          <label key={field.key} htmlFor={`f-${field.key}`} className={field.full ? 'block sm:col-span-2' : 'block'}>
            <span className="mb-1 block text-[11px] font-bold tracking-wide text-ink-600 uppercase">{field.label}</span>
            <Field field={field} value={form[field.key]} onChange={set(field.key)} />
          </label>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onSubmit(form)}
          disabled={busy}
          className="btn-gold px-4 py-2 text-sm disabled:opacity-60"
        >
          <Save className="h-4 w-4" /> Simpan
        </button>
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl border border-ink-200 bg-white px-4 py-2 text-sm font-semibold text-ink-700 transition-colors hover:bg-ink-50"
        >
          Batal
        </button>
        {onDelete && (
          <span className="ml-auto">
            <DeleteButton onDelete={() => onDelete(form)} />
          </span>
        )}
      </div>
    </div>
  );
}

/** Kartu "tambah data baru" di ujung rail. */
export function AddCard({ onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-full min-h-24 shrink-0 snap-start flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-ink-300 bg-white/60 px-3 py-4 text-xs font-bold text-ink-600 transition-colors hover:border-gold-500 hover:text-ink-900"
    >
      <Plus className="h-5 w-5" /> {label}
    </button>
  );
}
