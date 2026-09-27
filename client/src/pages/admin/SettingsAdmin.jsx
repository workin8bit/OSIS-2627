import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { saveSettings } from '../../lib/data';
import { useSettings, useToast } from '../../lib/context';

const GROUPS = [
  {
    title: 'Identitas',
    fields: [
      ['org_name', 'Nama Organisasi'],
      ['school_name', 'Nama Sekolah'],
      ['period', 'Periode'],
      ['cabinet_name', 'Nama Kabinet'],
      ['tagline', 'Tagline', 'full'],
    ],
  },
  {
    title: 'Profil',
    fields: [
      ['about', 'Tentang OSIS', 'textarea'],
      ['vision', 'Visi', 'textarea'],
      ['chairman_message', 'Sambutan Ketua OSIS', 'textarea'],
    ],
  },
  {
    title: 'Kontak & Media Sosial',
    fields: [
      ['address', 'Alamat', 'full'],
      ['email', 'Email'],
      ['phone', 'Telepon'],
      ['instagram', 'Username Instagram'],
      ['youtube', 'URL YouTube'],
      ['maps_embed', 'URL Embed Google Maps', 'full'],
    ],
  },
];

export default function SettingsAdmin() {
  const { settings } = useSettings();
  // Tunggu pengaturan lengkap termuat dari server sebelum menampilkan formulir
  if (settings.about === undefined) return null;
  return <SettingsForm initial={settings} />;
}

function SettingsForm({ initial }) {
  const { reload } = useSettings();
  const toast = useToast();
  const [form, setForm] = useState(() => ({ ...initial, missions: [...(initial.missions || [])] }));
  const [saving, setSaving] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await saveSettings({ ...form, missions: form.missions.filter((m) => m.trim()) });
      await reload();
      toast('Pengaturan disimpan');
    } catch (err) {
      toast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const setMission = (i, v) => {
    const m = [...form.missions];
    m[i] = v;
    setForm({ ...form, missions: m });
  };

  return (
    <form onSubmit={save} className="max-w-4xl space-y-6">
      {GROUPS.map((g) => (
        <div key={g.title} className="card p-5 sm:p-6">
          <h2 className="mb-4 text-lg font-extrabold text-ink-950">{g.title}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {g.fields.map(([k, label, type]) => (
              <div key={k} className={type ? 'sm:col-span-2' : ''}>
                <label className="label">{label}</label>
                {type === 'textarea' ? (
                  <textarea className="input" rows={3} value={form[k] || ''} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
                ) : (
                  <input className="input" value={form[k] || ''} onChange={(e) => setForm({ ...form, [k]: e.target.value })} />
                )}
              </div>
            ))}
          </div>
          {g.title === 'Profil' && (
            <div className="mt-4">
              <label className="label">Misi</label>
              <div className="space-y-2">
                {form.missions.map((m, i) => (
                  <div key={i} className="flex gap-2">
                    <span className="flex h-12 w-8 shrink-0 items-center justify-center text-sm font-bold text-ink-500">{i + 1}.</span>
                    <input className="input" value={m} onChange={(e) => setMission(i, e.target.value)} />
                    <button type="button" className="btn-icon h-11 w-11 text-red-600 hover:bg-red-50" onClick={() => setForm({ ...form, missions: form.missions.filter((_, j) => j !== i) })} aria-label="Hapus misi">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
              <button type="button" className="btn-ghost mt-2" onClick={() => setForm({ ...form, missions: [...form.missions, ''] })}>
                <Plus className="h-4 w-4" /> Tambah misi
              </button>
            </div>
          )}
        </div>
      ))}
      <div className="sticky bottom-20 z-20 flex justify-end lg:bottom-4">
        <button className="btn-sun min-h-12 w-full px-6 shadow-[0_12px_32px_-8px_rgba(21,20,18,.45)] sm:w-auto" disabled={saving}>
          {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
        </button>
      </div>
    </form>
  );
}
