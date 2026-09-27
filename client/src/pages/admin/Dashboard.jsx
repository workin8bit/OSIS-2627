import { Link } from 'react-router-dom';
import { ArrowRight, CalendarDays, ChevronRight, ClipboardList, Images, Newspaper, Users } from 'lucide-react';
import { useAuth, useQuery } from '../../lib/context';
import { getDashboard } from '../../lib/data';
import { ErrorBox, Skeleton } from '../../components/ui';
import { STATUS_ASPIRASI, STATUS_PROGRAM, dateParts, fmtTime, relativeTime } from '../../lib/format';

const PROG_BAR = { rencana: 'bg-ink-300', berjalan: 'bg-sun-400', selesai: 'bg-emerald-500', batal: 'bg-red-400' };

export default function Dashboard() {
  const { user } = useAuth();
  const { data, loading, error } = useQuery(getDashboard);
  if (error) return <ErrorBox message={error} />;
  if (loading)
    return (
      <div className="space-y-3">
        <Skeleton className="h-36" />
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {[0, 1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      </div>
    );

  const c = data.counts;
  const cards = [
    { label: 'Berita', value: c.posts, icon: Newspaper, to: '/admin/berita' },
    { label: 'Program Kerja', value: c.programs, icon: ClipboardList, to: '/admin/program' },
    { label: 'Agenda', value: c.events, icon: CalendarDays, to: '/admin/agenda' },
    { label: 'Pengurus', value: c.members, icon: Users, to: '/admin/pengurus' },
    { label: 'Foto Galeri', value: c.gallery, icon: Images, to: '/admin/galeri' },
  ];
  const totalProg = data.program_status.reduce((a, b) => a + b.c, 0);
  const firstName = (user?.name || '').split(' ')[0];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Sorotan aspirasi baru */}
      <Link to="/admin/aspirasi" className="group block overflow-hidden rounded-4xl bg-ink-950 p-5 text-white sm:p-7">
        <p className="text-sm text-ink-400">Halo{firstName ? `, ${firstName}` : ''}</p>
        <div className="mt-3 flex items-end justify-between gap-4">
          <div>
            <p className="text-5xl leading-none font-extrabold tracking-tight text-sun-400 sm:text-6xl">{c.aspirations_new}</p>
            <p className="mt-2 text-sm font-semibold">
              aspirasi baru menunggu <span className="text-ink-400">· {c.aspirations} total</span>
            </p>
          </div>
          <span className="btn-sun shrink-0 group-hover:bg-sun-300">
            Tinjau <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      </Link>

      {/* Hitungan konten */}
      <div className="no-scrollbar -mx-4 flex snap-x gap-2.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-3 sm:px-0 lg:grid-cols-5">
        {cards.map((x) => (
          <Link key={x.label} to={x.to} className="card w-[40%] shrink-0 snap-start p-4 transition hover:border-ink-300 active:scale-[.97] sm:w-auto">
            <x.icon className="h-5 w-5 text-ink-400" />
            <p className="mt-4 text-3xl leading-none font-extrabold tracking-tight text-ink-950">{x.value}</p>
            <p className="mt-1.5 text-xs font-semibold text-ink-500">{x.label}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3 lg:gap-6">
        <section className="card p-5 lg:col-span-2">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-ink-950">Aspirasi terbaru</h2>
            <Link to="/admin/aspirasi" className="inline-flex min-h-10 items-center gap-1 text-sm font-bold text-ink-900">
              Kelola <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="divide-y divide-ink-100">
            {data.latest_aspirations.length === 0 && <p className="py-4 text-sm text-ink-500">Belum ada aspirasi.</p>}
            {data.latest_aspirations.map((a) => (
              <Link key={a.id} to="/admin/aspirasi" className="block py-3.5">
                <div className="flex items-center gap-2 text-xs">
                  <span className={`badge ${STATUS_ASPIRASI[a.status]?.cls}`}>{STATUS_ASPIRASI[a.status]?.label}</span>
                  <span className="truncate text-ink-400">
                    {a.anonymous ? 'Anonim' : a.name || '-'} · {a.category} · {relativeTime(a.created_at)}
                  </span>
                </div>
                <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-ink-800">{a.message}</p>
              </Link>
            ))}
          </div>
        </section>

        <div className="space-y-4 lg:space-y-6">
          <section className="card p-5">
            <h2 className="text-lg font-extrabold text-ink-950">Status program kerja</h2>
            {/* Bar bertumpuk */}
            <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-ink-100">
              {Object.keys(STATUS_PROGRAM).map((k) => {
                const n = data.program_status.find((p) => p.status === k)?.c || 0;
                return n ? <div key={k} className={PROG_BAR[k]} style={{ width: `${(n / (totalProg || 1)) * 100}%` }} title={`${STATUS_PROGRAM[k].label}: ${n}`} /> : null;
              })}
            </div>
            <ul className="mt-4 grid grid-cols-2 gap-2">
              {Object.entries(STATUS_PROGRAM).map(([k, v]) => {
                const n = data.program_status.find((p) => p.status === k)?.c || 0;
                return (
                  <li key={k} className="flex items-center gap-2 rounded-2xl bg-ink-50 px-3 py-2.5 text-sm">
                    <span className={`h-2.5 w-2.5 rounded-full ${PROG_BAR[k]}`} />
                    <span className="flex-1 text-ink-600">{v.label}</span>
                    <span className="font-extrabold">{n}</span>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="card p-5">
            <h2 className="mb-3 text-lg font-extrabold text-ink-950">Agenda terdekat</h2>
            <div className="space-y-2">
              {data.upcoming_events.length === 0 && <p className="text-sm text-ink-500">Tidak ada agenda.</p>}
              {data.upcoming_events.map((e) => {
                const d = dateParts(e.date);
                return (
                  <div key={e.id} className="flex items-center gap-3">
                    <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-2xl bg-ink-100 text-ink-900">
                      <span className="text-base leading-none font-extrabold">{d.day}</span>
                      <span className="text-[10px] font-bold uppercase">{d.month}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold">{e.title}</p>
                      <p className="truncate text-xs text-ink-500">
                        {fmtTime(e.time)} · {e.location || '-'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
