import { Eye, Info } from 'lucide-react';
import { useQuery, useSettings, useToast } from '../../lib/context';
import { getHome, saveSettings, table } from '../../lib/data';
import { BerandaView } from '../Home';

const events = table('events');
const programs = table('programs');
const posts = table('posts');
const members = table('members');

const clean = (v) => (typeof v === 'string' ? v.trim() : v);
const nullable = (v) => {
  const t = clean(v);
  return t === '' || t == null ? null : t;
};
const clamp = (v, min, max) => Math.min(max, Math.max(min, Number(v) || 0));

/**
 * Panel "Tampilan Siswa": menampilkan Halaman Beranda persis seperti yang
 * dilihat siswa, dengan kontrol ubah data langsung di atas tiap bagian.
 */
export default function StudentViewAdmin() {
  const { data, loading, error, reload } = useQuery(() => getHome(), []);
  const { settings, reload: reloadSettings } = useSettings();
  const toast = useToast();

  const refresh = () => {
    reload();
    reloadSettings();
  };

  const run = async (fn, message) => {
    try {
      await fn();
      toast(message);
      refresh();
    } catch (err) {
      toast(err.message, 'error');
    }
  };

  const actions = {
    saveSettings: (values) =>
      run(() => saveSettings(values), 'Teks Beranda berhasil disimpan'),

    saveEvent: (id, values) =>
      run(async () => {
        const payload = {
          title: clean(values.title),
          date: clean(values.date),
          time: nullable(values.time),
          location: nullable(values.location),
          category: clean(values.category) || 'Umum',
          description: nullable(values.description),
        };
        if (!payload.title || !payload.date) throw new Error('Judul dan tanggal agenda wajib diisi');
        if (id) await events.update(id, payload);
        else await events.create(payload);
      }, id ? 'Agenda berhasil diperbarui' : 'Agenda berhasil ditambahkan'),

    removeEvent: (id) => run(() => events.remove(id), 'Agenda dihapus'),

    saveProgram: (id, values) =>
      run(async () => {
        const payload = {
          title: clean(values.title),
          description: nullable(values.description),
          status: clean(values.status) || 'rencana',
          progress: clamp(values.progress, 0, 100),
        };
        if (!payload.title) throw new Error('Nama program wajib diisi');
        if (id) await programs.update(id, payload);
        else await programs.create(payload);
      }, id ? 'Program berhasil diperbarui' : 'Program berhasil ditambahkan'),

    removeProgram: (id) => run(() => programs.remove(id), 'Program dihapus'),

    savePost: (id, values) =>
      run(async () => {
        const payload = {
          title: clean(values.title),
          excerpt: nullable(values.excerpt),
          category: clean(values.category) || 'Kegiatan',
          cover: nullable(values.cover),
        };
        if (!payload.title) throw new Error('Judul berita wajib diisi');
        if (id) await posts.update(id, payload);
        // slug dibuat & dijamin unik oleh trigger posts_slug di database
        else await posts.create(payload);
      }, id ? 'Berita berhasil diperbarui' : 'Berita berhasil ditambahkan'),

    removePost: (id) => run(() => posts.remove(id), 'Berita dihapus'),

    saveGreeting: ({ message, name, position, class_name, photo }) =>
      run(async () => {
        await saveSettings({ chairman_message: clean(message) });
        const chairman = data?.core?.[0];
        if (chairman) {
          await members.update(chairman.id, {
            name: clean(name) || chairman.name,
            position: clean(position) || chairman.position,
            class_name: nullable(class_name),
            photo: nullable(photo),
          });
        }
      }, 'Sambutan Ketua berhasil disimpan'),
  };

  return (
    <>
      <div className="mb-5">
        <div className="flex items-center gap-2">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-ink-950 text-gold-400">
            <Eye className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-ink-900">Tampilan Siswa</h1>
            <p className="text-xs text-ink-500">Pratinjau Halaman Beranda persis seperti yang dilihat siswa</p>
          </div>
        </div>

        <div className="mt-4 flex items-start gap-2 rounded-2xl border border-gold-300 bg-gold-100/60 p-3 text-xs leading-relaxed text-ink-700">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-gold-700" />
          <p>
            Bagian yang bisa diubah langsung: <strong>Hero</strong>, <strong>Agenda Terdekat</strong>,{' '}
            <strong>Program Kerja</strong>, <strong>Berita Terbaru</strong>, <strong>Sambutan Ketua</strong>, dan{' '}
            <strong>Visi</strong>. Klik <strong>Ubah</strong> pada kartu yang ingin diedit, lalu Simpan. Angka statistik
            dihitung otomatis dari data modul lain.
          </p>
        </div>
      </div>

      <BerandaView data={data} loading={loading} error={error} s={settings} editable actions={actions} />
    </>
  );
}
