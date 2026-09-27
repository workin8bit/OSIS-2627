// Konfigurasi halaman-halaman CRUD admin.
import CrudPage from './CrudPage';
import { useFetch } from '../../lib/context';
import { Avatar, ICONS, Icon, Progress } from '../../components/ui';
import { STATUS_PROGRAM, formatDate } from '../../lib/format';

function useDivisionOptions() {
  const { data } = useFetch('/divisions');
  return (data || []).map((d) => ({ value: d.id, label: `${d.short} — ${d.name}` }));
}

export function PostsAdmin() {
  return (
    <CrudPage
      endpoint="posts"
      title="Berita"
      wide
      searchKeys={['title', 'category']}
      defaults={{ category: 'Kegiatan', published: 1 }}
      fields={[
        { name: 'title', label: 'Judul', required: true, full: true },
        {
          name: 'category',
          label: 'Kategori',
          type: 'select',
          placeholder: false,
          options: ['Kegiatan', 'Pengumuman', 'Prestasi', 'Organisasi', 'Opini'].map((x) => ({ value: x, label: x })),
        },
        { name: 'author', label: 'Penulis' },
        { name: 'excerpt', label: 'Ringkasan', type: 'textarea', rows: 2 },
        { name: 'content', label: 'Isi Berita', type: 'textarea', rows: 10, help: 'Pisahkan paragraf dengan baris kosong.' },
        { name: 'cover', label: 'Gambar Sampul', type: 'image' },
        { name: 'published', label: 'Terbitkan', type: 'checkbox' },
      ]}
      columns={[
        {
          key: 'title',
          label: 'Judul',
          render: (r) => (
            <div className="flex items-center gap-3">
              {r.cover ? <img src={r.cover} alt="" className="h-10 w-14 rounded-lg object-cover" /> : <div className="h-10 w-14 rounded-lg bg-slate-200" />}
              <div>
                <p className="font-semibold text-slate-900">{r.title}</p>
                <p className="text-xs text-slate-500">/{r.slug}</p>
              </div>
            </div>
          ),
        },
        { key: 'category', label: 'Kategori' },
        { key: 'created_at', label: 'Tanggal', render: (r) => formatDate(r.created_at) },
        { key: 'views', label: 'Dibaca' },
        {
          key: 'published',
          label: 'Status',
          render: (r) => <span className={`badge ${r.published ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>{r.published ? 'Terbit' : 'Draf'}</span>,
        },
      ]}
    />
  );
}

export function EventsAdmin() {
  return (
    <CrudPage
      endpoint="events"
      title="Agenda"
      searchKeys={['title', 'location', 'category']}
      defaults={{ category: 'Umum', time: '07:00' }}
      fields={[
        { name: 'title', label: 'Nama Kegiatan', required: true, full: true },
        { name: 'date', label: 'Tanggal', type: 'date', required: true },
        { name: 'time', label: 'Jam', type: 'time' },
        { name: 'location', label: 'Lokasi' },
        {
          name: 'category',
          label: 'Kategori',
          type: 'select',
          placeholder: false,
          options: ['Umum', 'Rapat', 'Upacara', 'Pelatihan', 'Olahraga', 'Seni', 'Keagamaan', 'Lomba'].map((x) => ({ value: x, label: x })),
        },
        { name: 'description', label: 'Keterangan', type: 'textarea', rows: 3 },
      ]}
      columns={[
        { key: 'title', label: 'Kegiatan', render: (r) => <span className="font-semibold text-slate-900">{r.title}</span> },
        { key: 'date', label: 'Tanggal', render: (r) => `${formatDate(r.date, { withDay: true })} ${r.time || ''}` },
        { key: 'location', label: 'Lokasi' },
        { key: 'category', label: 'Kategori', render: (r) => <span className="badge bg-slate-100 text-slate-700">{r.category}</span> },
      ]}
    />
  );
}

export function ProgramsAdmin() {
  const divOptions = useDivisionOptions();
  return (
    <CrudPage
      endpoint="programs"
      title="Program Kerja"
      wide
      searchKeys={['title', 'target']}
      defaults={{ status: 'rencana', progress: 0 }}
      filters={{ key: 'status', label: 'Semua Status', options: Object.entries(STATUS_PROGRAM).map(([k, v]) => ({ value: k, label: v.label })) }}
      fields={[
        { name: 'title', label: 'Nama Program', required: true, full: true },
        { name: 'division_id', label: 'Seksi Bidang', type: 'select', numeric: true, options: divOptions, full: true },
        { name: 'start_date', label: 'Tanggal Mulai', type: 'date' },
        { name: 'end_date', label: 'Tanggal Selesai', type: 'date' },
        { name: 'target', label: 'Sasaran' },
        {
          name: 'status',
          label: 'Status',
          type: 'select',
          placeholder: false,
          options: Object.entries(STATUS_PROGRAM).map(([k, v]) => ({ value: k, label: v.label })),
        },
        { name: 'progress', label: 'Progres', type: 'range', full: true },
        { name: 'description', label: 'Deskripsi', type: 'textarea', rows: 3 },
      ]}
      columns={[
        { key: 'title', label: 'Program', render: (r) => <span className="font-semibold text-slate-900">{r.title}</span> },
        { key: 'division_id', label: 'Sekbid', render: (r) => divOptions.find((d) => d.value === r.division_id)?.label.split(' — ')[0] || '-' },
        { key: 'start_date', label: 'Waktu', render: (r) => formatDate(r.start_date) },
        { key: 'status', label: 'Status', render: (r) => <span className={`badge ${STATUS_PROGRAM[r.status]?.cls}`}>{STATUS_PROGRAM[r.status]?.label}</span> },
        {
          key: 'progress',
          label: 'Progres',
          render: (r) => (
            <div className="flex w-32 items-center gap-2">
              <Progress value={r.progress} />
              <span className="text-xs font-semibold">{r.progress}%</span>
            </div>
          ),
        },
      ]}
    />
  );
}

export function MembersAdmin() {
  const divOptions = useDivisionOptions();
  return (
    <CrudPage
      endpoint="members"
      title="Pengurus"
      wide
      searchKeys={['name', 'position', 'class_name']}
      defaults={{ is_core: 0, sort_order: 10 }}
      filters={{ key: 'division_id', label: 'Semua Sekbid', options: divOptions.map((d) => ({ value: String(d.value), label: d.label })) }}
      fields={[
        { name: 'name', label: 'Nama Lengkap', required: true },
        { name: 'position', label: 'Jabatan', required: true, placeholder: 'cth. Ketua OSIS / Koordinator / Anggota' },
        { name: 'class_name', label: 'Kelas', placeholder: 'cth. XI-2' },
        { name: 'division_id', label: 'Seksi Bidang', type: 'select', numeric: true, options: divOptions, placeholder: '— Tidak ada (pengurus inti) —' },
        { name: 'instagram', label: 'Instagram', placeholder: 'username' },
        { name: 'sort_order', label: 'Urutan', type: 'number', help: 'Angka kecil tampil lebih dulu.' },
        { name: 'is_core', label: 'Pengurus Inti (Ketua, Wakil, Sekretaris, Bendahara)', type: 'checkbox', full: true },
        { name: 'quote', label: 'Motto / Kutipan', full: true },
        { name: 'photo', label: 'Foto', type: 'image' },
      ]}
      columns={[
        {
          key: 'name',
          label: 'Nama',
          render: (r) => (
            <div className="flex items-center gap-3">
              <Avatar name={r.name} src={r.photo} className="h-10 w-10 text-sm" />
              <span className="font-semibold text-slate-900">{r.name}</span>
            </div>
          ),
        },
        { key: 'position', label: 'Jabatan' },
        { key: 'class_name', label: 'Kelas' },
        {
          key: 'division_id',
          label: 'Bagian',
          render: (r) =>
            r.is_core ? <span className="badge bg-gold-400/25 text-amber-800">Inti</span> : divOptions.find((d) => d.value === r.division_id)?.label.split(' — ')[0] || '-',
        },
      ]}
    />
  );
}

export function DivisionsAdmin() {
  return (
    <CrudPage
      endpoint="divisions"
      title="Seksi Bidang"
      searchKeys={['name', 'short']}
      defaults={{ icon: 'Users', sort_order: 11 }}
      fields={[
        { name: 'short', label: 'Singkatan', placeholder: 'cth. Sekbid 1' },
        { name: 'sort_order', label: 'Urutan', type: 'number' },
        { name: 'name', label: 'Nama Seksi Bidang', required: true, full: true },
        { name: 'icon', label: 'Ikon', type: 'select', placeholder: false, options: Object.keys(ICONS).map((k) => ({ value: k, label: k })), full: true },
        { name: 'description', label: 'Deskripsi', type: 'textarea', rows: 3 },
      ]}
      columns={[
        {
          key: 'name',
          label: 'Seksi Bidang',
          render: (r) => (
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-brand-50 p-2 text-brand-700">
                <Icon name={r.icon} className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-gold-500">{r.short}</p>
                <p className="font-semibold text-slate-900">{r.name}</p>
              </div>
            </div>
          ),
        },
        { key: 'description', label: 'Deskripsi', render: (r) => <span className="line-clamp-2 text-slate-600">{r.description}</span> },
        { key: 'sort_order', label: 'Urutan' },
      ]}
    />
  );
}

export function GalleryAdmin() {
  return (
    <CrudPage
      endpoint="gallery"
      title="Foto"
      emptyIcon="Camera"
      searchKeys={['title', 'album']}
      defaults={{ album: 'Umum' }}
      fields={[
        { name: 'image', label: 'Foto', type: 'image', required: true },
        { name: 'title', label: 'Keterangan' },
        { name: 'album', label: 'Album', placeholder: 'cth. LDKS 2026' },
      ]}
      columns={[
        { key: 'image', label: 'Foto', render: (r) => <img src={r.image} alt="" className="h-14 w-20 rounded-lg object-cover" /> },
        { key: 'title', label: 'Keterangan' },
        { key: 'album', label: 'Album', render: (r) => <span className="badge bg-slate-100 text-slate-700">{r.album}</span> },
        { key: 'created_at', label: 'Diunggah', render: (r) => formatDate(r.created_at) },
      ]}
    />
  );
}
