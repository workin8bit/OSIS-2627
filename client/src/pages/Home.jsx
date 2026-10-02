import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, BookOpen, CalendarDays, Camera, CheckCircle2, ChevronDown, ChevronRight, Clock,
  Layers, MapPin, MessageSquare, Quote, Target, Users,
} from 'lucide-react';
import { useQuery } from '../lib/context';
import { getHome, getSettings } from '../lib/data';
import { Avatar, ErrorBox } from '../components/ui';
import { AddCard, DeleteButton, EditButton, EditPanel } from '../components/EditControls';
import { dateParts, fmtTime, formatDate, relativeTime } from '../lib/format';

const HERO_FIELDS = [
  { key: 'cabinet_name', label: 'Nama kabinet' },
  { key: 'tagline', label: 'Tagline', type: 'textarea', full: true, rows: 2 },
  { key: 'period', label: 'Periode', placeholder: '2026/2027' },
];

const EVENT_FIELDS = [
  { key: 'title', label: 'Judul kegiatan', full: true },
  { key: 'date', label: 'Tanggal', type: 'date' },
  { key: 'time', label: 'Waktu', type: 'time' },
  { key: 'location', label: 'Lokasi' },
  { key: 'category', label: 'Kategori' },
  { key: 'description', label: 'Deskripsi', type: 'textarea', full: true },
];

const PROGRAM_FIELDS = [
  { key: 'title', label: 'Nama program', full: true },
  { key: 'description', label: 'Deskripsi', type: 'textarea', full: true },
  { key: 'progress', label: 'Progres (%)', type: 'number' },
  { key: 'status', label: 'Status', type: 'select', options: ['rencana', 'berjalan', 'selesai', 'batal'] },
];

const POST_FIELDS = [
  { key: 'title', label: 'Judul berita', full: true },
  { key: 'excerpt', label: 'Ringkasan', type: 'textarea', full: true },
  { key: 'category', label: 'Kategori' },
  { key: 'cover', label: 'URL gambar', full: true },
];

const GREETING_FIELDS = [
  { key: 'message', label: 'Isi sambutan', type: 'textarea', full: true, rows: 4 },
  { key: 'name', label: 'Nama ketua' },
  { key: 'position', label: 'Jabatan' },
  { key: 'class_name', label: 'Kelas' },
  { key: 'photo', label: 'URL foto', full: true },
];

const VISION_FIELDS = [{ key: 'vision', label: 'Teks visi', type: 'textarea', full: true, rows: 3 }];

/** Kelola satu panel ubah data yang terbuka pada satu waktu per section. */
function useEditor() {
  const [key, setKey] = useState(null);
  return {
    key,
    is: (k) => key === k,
    edit: (k) => setKey(k),
    close: () => setKey(null),
  };
}

const SHORTCUTS = [
  { to: '/profil', label: 'Profil', icon: BookOpen },
  { to: '/struktur', label: 'Pengurus', icon: Users },
  { to: '/agenda', label: 'Agenda', icon: CalendarDays },
  { to: '/galeri', label: 'Galeri', icon: Camera },
];

function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-2xl bg-ink-200 ${className}`} />;
}

function SectionHead({ title, linkTo, linkLabel = 'Lihat semua', expanded, onToggle, summary }) {
  return (
    <div className={`flex items-center justify-between gap-3 ${expanded === false ? 'mb-0' : 'mb-4'}`}>
      <button
        type="button"
        onClick={onToggle}
        className="flex min-w-0 items-center gap-1.5 text-left"
        aria-expanded={expanded}
      >
        <ChevronDown className={`h-5 w-5 shrink-0 text-ink-500 transition-transform duration-200 ${expanded ? '' : '-rotate-90'}`} />
        <span className="min-w-0">
          <span className="block truncate text-xl font-extrabold tracking-tight text-ink-900 sm:text-2xl">{title}</span>
          {!expanded && summary && <span className="block truncate text-xs text-ink-500">{summary}</span>}
        </span>
      </button>
      {linkTo && (
        <Link to={linkTo} className="inline-flex shrink-0 items-center gap-1 text-sm font-bold text-ink-900 hover:text-gold-600">
          {linkLabel} <ChevronRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}

function StatTile({ icon: IconComponent, label, value, highlight = false }) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-1.5 rounded-2xl px-2 py-3 text-center sm:aspect-square ${
        highlight ? 'bg-gold-400 text-ink-950' : 'bg-ink-950 text-white'
      }`}
    >
      <IconComponent className={`h-5 w-5 sm:h-6 sm:w-6 ${highlight ? 'text-ink-950' : 'text-gold-400'}`} />
      <p className={`text-xl leading-none font-extrabold tabular-nums sm:text-3xl ${highlight ? 'text-ink-950' : 'text-white'}`}>{value}</p>
      <p className={`text-[10px] leading-tight font-semibold sm:text-xs ${highlight ? 'text-ink-800' : 'text-ink-300'}`}>{label}</p>
    </div>
  );
}

function Hero({ s, editable, actions }) {
  const ui = useEditor();
  return (
    <section className="container-x pt-4 sm:pt-6">
      <div className="slide-up overflow-hidden rounded-3xl bg-ink-950 text-white shadow-xl shadow-ink-950/20">
        <div className="relative">
          <img src="/hero.jpg" alt="Siswa SMA Negeri 3 Rembang" className="h-48 w-full object-cover opacity-70 sm:h-60" />
          <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/40 to-transparent" />
          <span className="absolute top-4 left-4 rounded-full bg-gold-400 px-3 py-1 text-xs font-extrabold text-ink-950">
            Periode {s.period || '2026/2027'}
          </span>
          {editable && (
            <span className="absolute top-4 right-4">
              <EditButton onClick={() => (ui.is('hero') ? ui.close() : ui.edit('hero'))} label="Ubah teks" />
            </span>
          )}
        </div>

        <div className="px-5 pt-4 pb-5 sm:px-6 sm:pb-6">
          <h1 className="text-2xl leading-tight font-extrabold sm:text-3xl">
            OSIS <span className="text-gold-400">SMA Negeri 3</span> Rembang
          </h1>
          <p className="mt-1 text-sm font-bold text-gold-300">{s.cabinet_name || 'Kabinet Tri Hita Karana'}</p>
          {s.tagline && <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-200">{s.tagline}</p>}

          <div className="mt-5 flex gap-3">
            <Link to="/aspirasi" className="btn-gold flex-1 px-3 py-3 text-sm">
              <MessageSquare className="h-4 w-4" /> Kirim Aspirasi
            </Link>
            <Link
              to="/program"
              className="btn flex-1 border border-white/30 px-3 py-3 text-sm text-white hover:bg-white/10 focus-visible:ring-white/50"
            >
              Program Kerja <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {editable && ui.is('hero') && (
            <EditPanel
              title="Teks Hero Beranda"
              subtitle="Perubahan langsung tampil di halaman siswa setelah disimpan."
              fields={HERO_FIELDS}
              values={{ cabinet_name: s.cabinet_name || '', tagline: s.tagline || '', period: s.period || '' }}
              onClose={ui.close}
              onSubmit={(v) => actions.saveSettings(v)}
            />
          )}
        </div>
      </div>
    </section>
  );
}

function Shortcuts() {
  return (
    <section className="container-x mt-6 lg:hidden">
      <div className="grid grid-cols-4 gap-3">
        {SHORTCUTS.map(({ to, label, icon: IconComponent }) => (
          <Link key={to} to={to} className="flex flex-col items-center gap-2">
            <span className="flex aspect-square w-full items-center justify-center rounded-2xl bg-ink-950 text-gold-400 shadow-sm transition-transform active:scale-95">
              <IconComponent className="h-5 w-5 sm:h-6 sm:w-6" />
            </span>
            <span className="text-xs font-semibold text-ink-700">{label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function Stats({ stats, loading, editable }) {
  return (
    <section className="container-x mt-6">
      {editable && (
        <p className="mb-3 text-xs text-ink-500">
          Angka di bawah dihitung otomatis dari data pengurus, seksi bidang, program kerja, dan Prognosa.
          Ubah lewat menu terkait.
        </p>
      )}
      <div className="grid grid-cols-4 gap-2.5 sm:gap-3">
        {loading
          ? Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="aspect-square" />)
          : [
              { icon: Users, label: 'Pengurus', value: stats?.members ?? 0 },
              { icon: Layers, label: 'Seksi Bidang', value: stats?.divisions ?? 0 },
              { icon: Target, label: 'Program Kerja', value: stats?.programs ?? 0 },
              { icon: CheckCircle2, label: 'Aspirasi ditindaklanjuti', value: stats?.aspirations_done ?? 0, highlight: true },
            ].map((item) => <StatTile key={item.label} {...item} />)}
      </div>
    </section>
  );
}

function AgendaList({ events, loading, editable, actions }) {
  const ui = useEditor();
  const [busy, setBusy] = useState(false);
  const save = (id, v) => {
    setBusy(true);
    Promise.resolve(actions.saveEvent(id, v)).finally(() => setBusy(false));
  };

  if (loading) {
    return (
      <div className="scrollbar-none -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        {Array.from({ length: 3 }, (_, i) => (
          <Skeleton key={i} className="h-40 w-[72%] shrink-0 snap-start sm:w-72" />
        ))}
      </div>
    );
  }
  if (!events.length && !editable) {
    return <div className="card p-6 text-center text-sm text-ink-500">Belum ada agenda mendatang.</div>;
  }

  const editing = ui.is('new')
    ? { id: null, values: { title: '', date: new Date().toISOString().slice(0, 10), time: '', location: '', category: '', description: '' } }
    : events.find((e) => String(e.id) === ui.key);

  return (
    <>
      <div className="scrollbar-none -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
        {events.slice(0, 5).map((event, i) => {
          const d = dateParts(event.date);
          const dark = i === 0;
          return (
            <div key={event.id} className="relative flex w-[72%] shrink-0 snap-start flex-col sm:w-72">
              <Link
                to="/agenda"
                className={`flex flex-col overflow-hidden rounded-2xl transition-transform active:scale-[0.99] ${
                  dark ? 'bg-ink-950 text-white shadow-lg shadow-ink-950/20' : 'border border-ink-200 bg-white'
                }`}
              >
                <div className="flex w-full items-center justify-center gap-2 bg-gold-400 px-3.5 py-2.5 text-ink-950">
                  <span className="text-2xl leading-none font-extrabold tabular-nums sm:text-3xl">{d.day}</span>
                  <span className="text-[10px] font-bold tracking-wide uppercase sm:text-xs">{d.month} {d.year}</span>
                </div>
                <div className="flex min-w-0 flex-1 flex-col px-3.5 py-3">
                  <p className={`line-clamp-2 text-sm font-bold leading-snug ${dark ? 'text-white' : 'text-ink-900'}`}>
                    {event.title}
                  </p>
                  <p className={`mt-1.5 flex items-center gap-1.5 text-xs ${dark ? 'text-ink-300' : 'text-ink-500'}`}>
                    <Clock className="h-3.5 w-3.5" /> {fmtTime(event.time)} WIB
                  </p>
                  <p className={`mt-auto flex items-center gap-1.5 pt-2 text-xs ${dark ? 'text-ink-300' : 'text-ink-500'}`}>
                    <MapPin className="h-3.5 w-3.5" /> <span className="truncate">{event.location || '-'}</span>
                  </p>
                </div>
              </Link>

              {editable && (
                <div className="mt-2 flex gap-2">
                  <EditButton
                    onClick={() => (ui.is(String(event.id)) ? ui.close() : ui.edit(String(event.id)))}
                    label="Ubah"
                  />
                  <DeleteButton
                    onDelete={() => {
                      ui.close();
                      actions.removeEvent(event.id);
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}

        {editable && <AddCard onClick={() => ui.edit('new')} label="Tambah agenda" />}
      </div>

      {editable && editing && (
        <EditPanel
          title={editing.id ? 'Ubah agenda' : 'Tambah agenda baru'}
          subtitle="Agenda dengan tanggal terdekat tampil lebih dulu di Beranda."
          fields={EVENT_FIELDS}
          values={editing.values || editing}
          busy={busy}
          onClose={ui.close}
          onSubmit={(v) => save(editing.id, v)}
          onDelete={
            editing.id
              ? () => {
                  ui.close();
                  actions.removeEvent(editing.id);
                }
              : undefined
          }
        />
      )}
    </>
  );
}

function ProgramCarousel({ programs, loading, expanded, onToggle, editable, actions }) {
  const ui = useEditor();
  const [busy, setBusy] = useState(false);
  const editing = ui.is('new') ? { id: null, values: { title: '', description: '', progress: 0, status: 'berjalan' } } : programs.find((p) => String(p.id) === ui.key);

  return (
    <section className="bg-ink-50 pt-6">
      <div className="container-x">
        <SectionHead
          title="Program Kerja"
          linkTo="/program"
          linkLabel="Lihat semua"
          expanded={expanded}
          onToggle={onToggle}
          summary={`Sedang berjalan · ${programs.length} program`}
        />
      </div>

      {!expanded ? null : loading ? (
        <div className="container-x">
          <Skeleton className="h-44 w-[75%]" />
        </div>
      ) : !programs.length && !editable ? (
        <div className="container-x">
          <div className="card p-6 text-center text-sm text-ink-500">Belum ada program yang sedang berjalan.</div>
        </div>
      ) : (
        <div className="scrollbar-none flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 sm:px-6 lg:px-[max(2rem,calc((100%-72rem)/2+2rem))]">
          {programs.map((program) => (
            <div key={program.id} className="flex w-[75%] shrink-0 snap-start flex-col sm:w-64 lg:w-72">
              <article className="card flex flex-1 flex-col p-4">
                <span className="badge-gold self-start text-[10px] px-2 py-0.5">{program.division_short || 'Umum'}</span>
                <h3 className="mt-2.5 line-clamp-2 text-sm font-extrabold text-ink-900">{program.title}</h3>
                <p className="mt-1 line-clamp-2 flex-1 text-xs leading-relaxed text-ink-500">{program.description}</p>
                <div className="mt-4 flex items-center gap-2.5">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink-200">
                    <div
                      className="h-full rounded-full bg-gold-400"
                      style={{ width: `${Math.min(100, Math.max(0, program.progress))}%` }}
                    />
                  </div>
                  <span className="text-sm leading-none font-extrabold tabular-nums text-ink-900">{program.progress}%</span>
                </div>
              </article>

              {editable && (
                <div className="mt-2 flex gap-2">
                  <EditButton
                    onClick={() => (ui.is(String(program.id)) ? ui.close() : ui.edit(String(program.id)))}
                    label="Ubah"
                  />
                  <DeleteButton
                    onDelete={() => {
                      ui.close();
                      actions.removeProgram(program.id);
                    }}
                  />
                </div>
              )}
            </div>
          ))}

          {editable && <AddCard onClick={() => ui.edit('new')} label="Tambah program" />}
        </div>
      )}

      {editable && expanded && editing && (
        <div className="container-x mt-3">
          <EditPanel
            title={editing.id ? 'Ubah program' : 'Tambah program baru'}
            subtitle="Kolom progres mengisi bar pada kartu program."
            fields={PROGRAM_FIELDS}
            values={editing.values || editing}
            busy={busy}
            onClose={ui.close}
            onSubmit={(v) => {
              setBusy(true);
              Promise.resolve(actions.saveProgram(editing.id, v)).finally(() => setBusy(false));
            }}
            onDelete={
              editing.id
                ? () => {
                    ui.close();
                    actions.removeProgram(editing.id);
                  }
                : undefined
            }
          />
        </div>
      )}
    </section>
  );
}

/** Tombol "Selengkapnya" di dalam kartu berita (kartunya sendiri sudah jadi link). */
function ReadMore({ compact = false, className = '' }) {
  return (
    <span
      className={
        compact
          ? `inline-flex shrink-0 items-center gap-1 rounded-full bg-brand-50 px-3 py-1.5 text-xs font-bold text-brand-700 transition-colors group-hover:bg-brand-600 group-hover:text-white ${className}`
          : `inline-flex items-center gap-1.5 rounded-full bg-brand-600 px-4 py-2 text-sm font-bold text-white transition-colors group-hover:bg-brand-700 ${className}`
      }
    >
      Selengkapnya
      <ArrowRight className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
    </span>
  );
}

function NewsSection({ posts, loading, editable, actions }) {
  const ui = useEditor();
  const [busy, setBusy] = useState(false);

  if (loading) {
    return (
      <div className="container-x space-y-3">
        <Skeleton className="h-72 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }
  if (!posts.length && !editable) {
    return <div className="card p-6 text-center text-sm text-ink-500">Belum ada berita.</div>;
  }

  const [lead, ...rest] = posts;
  const editing = ui.is('new')
    ? { id: null, values: { title: '', excerpt: '', category: 'Prestasi', cover: '' } }
    : posts.find((p) => String(p.id) === ui.key);

  const toolbar = (post) =>
    editable && (
      <div className="mt-2 flex gap-2">
        <EditButton onClick={() => (ui.is(String(post.id)) ? ui.close() : ui.edit(String(post.id)))} label="Ubah" />
        <DeleteButton
          onDelete={() => {
            ui.close();
            actions.removePost(post.id);
          }}
        />
      </div>
    );

  return (
    <>
      <div className="space-y-3">
        {lead && (
          <div>
            <Link to={`/berita/${lead.slug}`} className="group block overflow-hidden rounded-2xl border border-ink-200 bg-white">
              <div className="relative aspect-[16/9] overflow-hidden bg-ink-200">
                {lead.cover ? (
                  <img
                    src={lead.cover}
                    alt={lead.title}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-ink-400">Tanpa gambar</div>
                )}
                <span className="absolute top-3 left-3 rounded-full bg-gold-400 px-3 py-1 text-xs font-extrabold text-ink-950">
                  {lead.category}
                </span>
              </div>
              <div className="p-5">
                <p className="text-xs text-ink-500">{formatDate(lead.created_at)}</p>
                <h3 className="mt-1.5 text-xl font-extrabold text-ink-900">{lead.title}</h3>
                <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-ink-600">{lead.excerpt}</p>
                <ReadMore className="mt-4" />
              </div>
            </Link>
            {toolbar(lead)}
          </div>
        )}

        {rest.map((post) => (
          <div key={post.id}>
            <Link
              to={`/berita/${post.slug}`}
              className="group flex items-center gap-3 rounded-2xl border border-ink-200 bg-white p-3 transition-colors hover:border-ink-300"
            >
              <div className="h-16 w-20 shrink-0 overflow-hidden rounded-xl bg-ink-200">
                {post.cover && <img src={post.cover} alt="" className="h-full w-full object-cover" loading="lazy" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold tracking-wide text-ink-500 uppercase">
                  {post.category} · {relativeTime(post.created_at)}
                </p>
                <p className="mt-1 line-clamp-2 text-sm font-bold text-ink-900">{post.title}</p>
              </div>
              <ReadMore compact />
            </Link>
            {toolbar(post)}
          </div>
        ))}

        {editable && <AddCard onClick={() => ui.edit('new')} label="Tambah berita" />}
      </div>

      {editable && editing && (
        <EditPanel
          title={editing.id ? 'Ubah berita' : 'Tambah berita baru'}
          subtitle="Isi artikel lengkap tetap dikelola dari menu Berita agar tampil di halaman detail."
          fields={POST_FIELDS}
          values={editing.values || editing}
          busy={busy}
          onClose={ui.close}
          onSubmit={(v) => {
            setBusy(true);
            Promise.resolve(actions.savePost(editing.id, v)).finally(() => setBusy(false));
          }}
          onDelete={
            editing.id
              ? () => {
                  ui.close();
                  actions.removePost(editing.id);
                }
              : undefined
          }
        />
      )}
    </>
  );
}

function Greeting({ s, chairman, editable, actions }) {
  const ui = useEditor();
  if (!s.chairman_message && !chairman && !editable) return null;
  return (
    <section className="container-x mt-6">
      <div className="relative rounded-3xl bg-ink-950 p-6 text-white sm:p-8">
        <Quote className="h-8 w-8 text-gold-400" />
        <p className="mt-3 text-xs font-bold tracking-widest text-gold-300 uppercase">Sambutan Ketua OSIS</p>
        <p className="mt-3 text-justify text-base leading-relaxed text-pretty text-ink-100 sm:text-lg">
          “{s.chairman_message}”
        </p>

        {chairman && (
          <div className="mt-6 flex items-center gap-4 border-t border-white/10 pt-5">
            <Avatar
              name={chairman.name}
              src={chairman.photo}
              fallbackColor="from-gold-500 to-gold-700"
              className="h-16 w-16 shrink-0 text-xl ring-2 ring-gold-400 ring-offset-2 ring-offset-ink-950"
            />
            <div className="min-w-0">
              <p className="font-extrabold">{chairman.name}</p>
              <p className="text-sm text-gold-300">{chairman.position}</p>
              {chairman.class_name && <p className="text-xs text-ink-400">Kelas {chairman.class_name}</p>}
            </div>
          </div>
        )}

        {editable && (
          <span className="absolute top-4 right-4">
            <EditButton onClick={() => (ui.is('sambutan') ? ui.close() : ui.edit('sambutan'))} label="Ubah" />
          </span>
        )}
      </div>

      {editable && ui.is('sambutan') && (
        <EditPanel
          title="Ubah sambutan Ketua OSIS"
          subtitle="Identitas ketua mengikuti data pengurus inti (menu Pengurus)."
          fields={GREETING_FIELDS}
          values={{
            message: s.chairman_message || '',
            name: chairman?.name || '',
            position: chairman?.position || '',
            class_name: chairman?.class_name || '',
            photo: chairman?.photo || '',
          }}
          onClose={ui.close}
          onSubmit={actions.saveGreeting}
        />
      )}
    </section>
  );
}

function VisionCard({ vision, editable, actions }) {
  const ui = useEditor();
  if (!vision && !editable) return null;
  return (
    <section className="container-x mt-6">
      <div className="relative rounded-3xl border border-ink-200 bg-white p-6 sm:p-8">
        <p className="text-xs font-bold tracking-widest text-gold-600 uppercase">Visi</p>
        <p className="mt-3 text-justify text-xl leading-snug font-extrabold text-ink-900 sm:text-2xl">{vision}</p>
        <Link to="/profil" className="btn-outline mt-6 inline-flex">
          Profil lengkap <ArrowRight className="h-4 w-4" />
        </Link>
        {editable && (
          <span className="absolute top-4 right-4">
            <EditButton onClick={() => (ui.is('visi') ? ui.close() : ui.edit('visi'))} label="Ubah" />
          </span>
        )}
      </div>

      {editable && ui.is('visi') && (
        <EditPanel
          title="Ubah visi"
          fields={VISION_FIELDS}
          values={{ vision: vision || '' }}
          onClose={ui.close}
          onSubmit={(v) => actions.saveSettings({ vision: v.vision })}
        />
      )}
    </section>
  );
}

function AspirationCta() {
  return (
    <section className="container-x mt-6 mb-4">
      <div className="rounded-3xl bg-gold-400 p-6 text-ink-950 sm:p-8">
        <h2 className="text-xl font-extrabold sm:text-2xl">Punya ide, kritik, atau keluhan?</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-800">
          Sampaikan lewat Kanal Aspirasi Digital — boleh anonim, dan pantau tindak lanjutnya dengan kode tiket.
        </p>
        <Link to="/aspirasi" className="btn mt-5 w-full bg-ink-950 py-3 text-sm text-white hover:bg-ink-900 focus-visible:ring-ink-950">
          Sampaikan sekarang <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </section>
  );
}

function Divider() {
  return <div className="h-px w-full bg-ink-200" role="separator" />;
}

/**
 * Tampilan Beranda yang dipakai bersama oleh halaman publik dan panel admin
 * "Tampilan Siswa". Saat `editable` aktif, tiap bagian mendapat kontrol ubah
 * data tanpa mengubah tampilan yang dilihat siswa.
 */
export function BerandaView({ data, loading, error, s, editable = false, actions = {} }) {
  const [agendaOpen, setAgendaOpen] = useState(editable);
  const [programOpen, setProgramOpen] = useState(editable);

  return (
    <>
      <Hero s={s} editable={editable} actions={actions} />

      <div className="mt-4"><Divider /></div>
      <Shortcuts />

      <div className="mt-4"><Divider /></div>
      <Stats stats={data?.stats} loading={loading} editable={editable} />

      {error && (
        <div className="container-x mt-6">
          <ErrorBox message={error} />
        </div>
      )}

      <div className="mt-4"><Divider /></div>
      <section className="container-x mt-6">
        <SectionHead
          title="Agenda Terdekat"
          linkTo="/agenda"
          linkLabel="Kalender"
          expanded={agendaOpen}
          onToggle={() => setAgendaOpen((v) => !v)}
          summary={`${(data?.events || []).length} kegiatan mendatang`}
        />
        {agendaOpen && (
          <AgendaList events={data?.events || []} loading={loading} editable={editable} actions={actions} />
        )}
      </section>

      <div className="mt-4"><Divider /></div>
      <ProgramCarousel
        programs={data?.programs || []}
        loading={loading}
        expanded={programOpen}
        onToggle={() => setProgramOpen((v) => !v)}
        editable={editable}
        actions={actions}
      />

      <div className="mt-4"><Divider /></div>
      <section className="container-x mt-6">
        <SectionHead title="Berita Terbaru" linkTo="/berita" linkLabel="Lihat semua" />
        <NewsSection posts={data?.posts || []} loading={loading} editable={editable} actions={actions} />
      </section>

      <div className="mt-4"><Divider /></div>
      <Greeting s={s} chairman={data?.core?.[0]} editable={editable} actions={actions} />

      <div className="mt-4"><Divider /></div>
      <VisionCard vision={s.vision} editable={editable} actions={actions} />

      <div className="mt-4"><Divider /></div>
      <AspirationCta />
    </>
  );
}

export default function Home() {
  const { data, loading, error } = useQuery(async () => {
    const [home, settings] = await Promise.all([getHome(), getSettings()]);
    return { ...home, settings };
  });

  return <BerandaView data={data} loading={loading} error={error} s={data?.settings || {}} />;
}
