import { Link } from 'react-router-dom';
import { ArrowRight, CalendarDays, Clock, Images, MapPin, MessageSquarePlus, Quote, UserRound, Users } from 'lucide-react';
import { useQuery } from '../lib/context';
import { getHome, getSettings } from '../lib/data';
import { Avatar, ErrorBox, Progress, SectionTitle, Skeleton } from '../components/ui';
import { dateParts, fmtTime } from '../lib/format';
import { PostCard, PostRow } from './Posts';

const SHORTCUTS = [
  { to: '/profil', label: 'Profil', icon: UserRound },
  { to: '/struktur', label: 'Pengurus', icon: Users },
  { to: '/agenda', label: 'Agenda', icon: CalendarDays },
  { to: '/galeri', label: 'Galeri', icon: Images },
];

export default function Home() {
  const { data, loading, error } = useQuery(async () => {
    const [home, settings] = await Promise.all([getHome(), getSettings()]);
    return { ...home, settings };
  });
  const s = data?.settings || {};
  const chair = data?.core?.[0];

  const stats = [
    { label: 'Pengurus', value: data?.stats.members },
    { label: 'Seksi Bidang', value: data?.stats.divisions },
    { label: 'Program Kerja', value: data?.stats.programs },
    { label: 'Aspirasi ditindaklanjuti', value: data?.stats.aspirations_done, accent: true },
  ];

  return (
    <div className="space-y-12 pb-4 sm:space-y-20">
      {/* HERO */}
      <section className="container-x pt-2 sm:pt-6">
        <div className="relative isolate overflow-hidden rounded-4xl bg-ink-950 text-white lg:grid lg:min-h-[560px] lg:grid-cols-[1.15fr_1fr]">
          <div className="relative aspect-[4/3] sm:aspect-[16/9] lg:order-2 lg:aspect-auto">
            <img src="/hero.jpg" alt="Siswa SMA Negeri 3 Rembang" className="absolute inset-0 h-full w-full object-cover" fetchPriority="high" />
            <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/20 to-transparent lg:bg-gradient-to-r lg:from-ink-950 lg:via-ink-950/10" />
            <span className="absolute top-4 left-4 badge bg-sun-400 px-3 py-1 text-ink-950 lg:hidden">Periode {s.period || '2026/2027'}</span>
          </div>
          <div className="relative -mt-16 flex flex-col justify-center px-5 pb-6 sm:px-8 sm:pb-8 lg:mt-0 lg:px-12 lg:py-14">
            <p className="mb-3 hidden text-sm font-bold text-sun-400 lg:block">
              {s.cabinet_name || 'Kabinet'} · Periode {s.period || '2026/2027'}
            </p>
            <h1 className="text-[2.35rem] leading-[1.02] font-extrabold tracking-tight sm:text-6xl">
              OSIS <span className="text-sun-400">SMA Negeri 3</span> Rembang
            </h1>
            <p className="mt-3 text-[15px] leading-relaxed text-ink-300 sm:text-lg">
              <span className="font-semibold text-white lg:hidden">{s.cabinet_name ? `${s.cabinet_name} — ` : ''}</span>
              {s.tagline || 'Bergerak Bersama, Berkarya untuk Smaga'}
            </p>
            <div className="mt-6 grid grid-cols-2 gap-2.5 sm:flex sm:flex-wrap">
              <Link to="/aspirasi" className="btn-sun min-h-12">
                <MessageSquarePlus className="h-4 w-4" /> Kirim Aspirasi
              </Link>
              <Link to="/program" className="btn min-h-12 bg-white/10 text-white hover:bg-white/15">
                Program Kerja <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* STATISTIK + PINTASAN */}
      <section className="container-x -mt-6 space-y-3 sm:-mt-10">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {stats.map((x) => (
            <div key={x.label} className={`rounded-3xl p-4 sm:p-5 ${x.accent ? 'bg-sun-400 text-ink-950' : 'border border-ink-200/70 bg-white'}`}>
              {loading ? <Skeleton className="h-9 w-12 rounded-xl" /> : <p className="text-[2rem] leading-none font-extrabold tracking-tight sm:text-4xl">{x.value ?? '–'}</p>}
              <p className={`mt-2 text-xs leading-snug font-semibold sm:text-sm ${x.accent ? 'text-ink-800' : 'text-ink-500'}`}>{x.label}</p>
            </div>
          ))}
        </div>
        <nav className="grid grid-cols-4 gap-2 lg:hidden" aria-label="Pintasan">
          {SHORTCUTS.map((sc) => (
            <Link key={sc.to} to={sc.to} className="flex flex-col items-center gap-2 rounded-3xl py-3 transition active:scale-95 active:bg-ink-100">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ink-900 text-sun-400">
                <sc.icon className="h-5 w-5" />
              </span>
              <span className="text-xs font-bold text-ink-800">{sc.label}</span>
            </Link>
          ))}
        </nav>
      </section>

      {error && (
        <div className="container-x">
          <ErrorBox message={error} />
        </div>
      )}
      {loading && (
        <div className="container-x space-y-3">
          <Skeleton className="h-6 w-40 rounded-xl" />
          <Skeleton className="h-24" />
          <Skeleton className="h-24" />
        </div>
      )}

      {data && (
        <>
          {/* AGENDA TERDEKAT */}
          <section className="container-x">
            <SectionTitle eyebrow="Jadwal" title="Agenda terdekat" to="/agenda" linkLabel="Kalender" />
            {data.events.length === 0 ? (
              <p className="rounded-3xl border border-dashed border-ink-300 p-6 text-center text-sm text-ink-500">Belum ada agenda mendatang.</p>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {data.events.map((e, i) => {
                  const d = dateParts(e.date);
                  return (
                    <Link key={e.id} to="/agenda" className={`flex items-center gap-4 rounded-3xl p-3 pr-4 transition active:scale-[.98] ${i === 0 ? 'bg-ink-900 text-white' : 'border border-ink-200/70 bg-white'}`}>
                      <div className={`flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl ${i === 0 ? 'bg-sun-400 text-ink-950' : 'bg-ink-100 text-ink-900'}`}>
                        <span className="text-2xl leading-none font-extrabold">{d.day}</span>
                        <span className="mt-0.5 text-[11px] font-bold uppercase">{d.month}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 leading-snug font-bold">{e.title}</p>
                        <p className={`mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs ${i === 0 ? 'text-ink-300' : 'text-ink-500'}`}>
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" /> {fmtTime(e.time)} WIB
                          </span>
                          {e.location && (
                            <span className="inline-flex min-w-0 items-center gap-1">
                              <MapPin className="h-3.5 w-3.5 shrink-0" /> <span className="truncate">{e.location}</span>
                            </span>
                          )}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>

          {/* PROGRAM BERJALAN — carousel geser di HP */}
          {data.programs.length > 0 && (
            <section>
              <div className="container-x">
                <SectionTitle eyebrow="Sedang berjalan" title="Program kerja" to="/program" />
              </div>
              <div className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pb-2 sm:scroll-px-6 sm:px-6 lg:container-x lg:grid lg:grid-cols-4 lg:overflow-visible">
                {data.programs.map((p) => (
                  <Link
                    key={p.id}
                    to="/program"
                    className="flex w-[78%] shrink-0 snap-start flex-col rounded-3xl border border-ink-200/70 bg-white p-5 transition active:scale-[.98] sm:w-[46%] lg:w-auto"
                  >
                    <span className="badge self-start bg-ink-100 text-ink-700">{p.division_short || 'Umum'}</span>
                    <h3 className="mt-3 line-clamp-2 text-lg leading-snug font-extrabold text-ink-950">{p.title}</h3>
                    <p className="mt-1.5 line-clamp-2 flex-1 text-sm text-ink-500">{p.description}</p>
                    <div className="mt-5 flex items-end justify-between">
                      <span className="text-3xl leading-none font-extrabold tracking-tight">{p.progress}%</span>
                      <span className="text-xs font-semibold text-ink-500">progres</span>
                    </div>
                    <div className="mt-2">
                      <Progress value={p.progress} />
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* BERITA */}
          {data.posts.length > 0 && (
            <section className="container-x">
              <SectionTitle eyebrow="Kabar Smaga" title="Berita terbaru" to="/berita" />
              <div className="grid gap-4 lg:grid-cols-2">
                <PostCard post={data.posts[0]} large />
                <div className="divide-y divide-ink-200/70 rounded-3xl border border-ink-200/70 bg-white px-4">
                  {data.posts.slice(1).map((p) => (
                    <PostRow key={p.id} post={p} />
                  ))}
                  {data.posts.length === 1 && <p className="py-6 text-center text-sm text-ink-500">Berita lainnya akan segera hadir.</p>}
                </div>
              </div>
            </section>
          )}

          {/* SAMBUTAN KETUA + VISI */}
          <section className="container-x grid gap-3 lg:grid-cols-5">
            <div className="relative overflow-hidden rounded-4xl bg-ink-950 p-6 text-white sm:p-8 lg:col-span-3">
              <Quote className="h-9 w-9 text-sun-400" strokeWidth={2.5} />
              <p className="eyebrow mt-4 text-ink-400">Sambutan Ketua OSIS</p>
              <p className="mt-3 text-[17px] leading-relaxed text-ink-100 sm:text-xl">{s.chairman_message}</p>
              {chair && (
                <div className="mt-6 flex items-center gap-3 border-t border-white/10 pt-5">
                  <Avatar name={chair.name} src={chair.photo} className="h-12 w-12 text-base ring-2 ring-sun-400" />
                  <div className="min-w-0">
                    <p className="truncate font-bold">{chair.name}</p>
                    <p className="text-xs text-ink-400">
                      {chair.position}
                      {chair.class_name ? ` · ${chair.class_name}` : ''}
                    </p>
                  </div>
                </div>
              )}
            </div>
            <div className="flex flex-col rounded-4xl border border-ink-200/70 bg-white p-6 sm:p-8 lg:col-span-2">
              <p className="eyebrow">Visi</p>
              <p className="mt-3 flex-1 text-xl leading-snug font-extrabold tracking-tight text-ink-950 sm:text-2xl">{s.vision}</p>
              <Link to="/profil" className="btn-outline mt-6 self-start">
                Profil lengkap <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </section>

          {/* CTA ASPIRASI */}
          <section className="container-x">
            <div className="relative overflow-hidden rounded-4xl bg-sun-400 p-6 text-ink-950 sm:p-10">
              <div className="pointer-events-none absolute -right-8 -bottom-10 h-44 w-44 rounded-full border-[28px] border-ink-950/5 sm:h-64 sm:w-64" />
              <div className="relative max-w-xl">
                <h2 className="text-[1.75rem] leading-tight font-extrabold tracking-tight sm:text-4xl">Punya ide, kritik, atau keluhan?</h2>
                <p className="mt-2 text-[15px] text-ink-800 sm:text-base">Sampaikan lewat Kanal Aspirasi — boleh anonim. Pantau tindak lanjutnya dengan kode tiket.</p>
                <Link to="/aspirasi" className="btn-primary mt-5 min-h-12 w-full sm:w-auto">
                  Sampaikan sekarang <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
