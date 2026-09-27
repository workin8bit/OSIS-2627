import { Link } from 'react-router-dom';
import { CalendarDays, ClipboardList, Images, MessageSquare, Newspaper, Users } from 'lucide-react';
import { useFetch } from '../../lib/context';
import { ErrorBox, Spinner } from '../../components/ui';
import { STATUS_ASPIRASI, STATUS_PROGRAM, dateParts, relativeTime } from '../../lib/format';

export default function Dashboard() {
  const { data, loading, error } = useFetch('/admin/dashboard');
  if (loading) return <Spinner />;
  if (error) return <ErrorBox message={error} />;
  const c = data.counts;
  const cards = [
    { label: 'Aspirasi Baru', value: c.aspirations_new, sub: `${c.aspirations} total`, icon: MessageSquare, to: '/admin/aspirasi', color: 'bg-amber-500' },
    { label: 'Berita', value: c.posts, icon: Newspaper, to: '/admin/berita', color: 'bg-brand-600' },
    { label: 'Program Kerja', value: c.programs, icon: ClipboardList, to: '/admin/program', color: 'bg-emerald-600' },
    { label: 'Agenda', value: c.events, icon: CalendarDays, to: '/admin/agenda', color: 'bg-sky-600' },
    { label: 'Pengurus', value: c.members, icon: Users, to: '/admin/pengurus', color: 'bg-fuchsia-600' },
    { label: 'Foto Galeri', value: c.gallery, icon: Images, to: '/admin/galeri', color: 'bg-rose-600' },
  ];
  const totalProg = data.program_status.reduce((a, b) => a + b.c, 0) || 1;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {cards.map((x) => (
          <Link key={x.label} to={x.to} className="card p-4 transition hover:shadow-md">
            <div className={`mb-3 inline-flex rounded-xl p-2.5 text-white ${x.color}`}>
              <x.icon className="h-5 w-5" />
            </div>
            <p className="text-2xl font-extrabold text-slate-900">{x.value}</p>
            <p className="text-xs text-slate-500">
              {x.label}
              {x.sub ? ` · ${x.sub}` : ''}
            </p>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-bold text-slate-900">Aspirasi Terbaru</h2>
            <Link to="/admin/aspirasi" className="text-sm font-semibold text-brand-700">
              Kelola →
            </Link>
          </div>
          <div className="divide-y divide-slate-100">
            {data.latest_aspirations.length === 0 && <p className="text-sm text-slate-500">Belum ada aspirasi.</p>}
            {data.latest_aspirations.map((a) => (
              <div key={a.id} className="flex items-start gap-3 py-3">
                <span className={`badge shrink-0 ${STATUS_ASPIRASI[a.status]?.cls}`}>{STATUS_ASPIRASI[a.status]?.label}</span>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm text-slate-700">{a.message}</p>
                  <p className="mt-0.5 text-xs text-slate-400">
                    {a.anonymous ? 'Anonim' : a.name || '-'} · {a.category} · {relativeTime(a.created_at)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card p-5">
            <h2 className="mb-4 font-bold text-slate-900">Status Program Kerja</h2>
            <div className="space-y-3">
              {Object.entries(STATUS_PROGRAM).map(([k, v]) => {
                const n = data.program_status.find((p) => p.status === k)?.c || 0;
                return (
                  <div key={k}>
                    <div className="mb-1 flex justify-between text-sm">
                      <span>{v.label}</span>
                      <span className="font-semibold">{n}</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100">
                      <div className="h-2 rounded-full bg-brand-600" style={{ width: `${(n / totalProg) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="card p-5">
            <h2 className="mb-4 font-bold text-slate-900">Agenda Terdekat</h2>
            <div className="space-y-3">
              {data.upcoming_events.length === 0 && <p className="text-sm text-slate-500">Tidak ada agenda.</p>}
              {data.upcoming_events.map((e) => {
                const d = dateParts(e.date);
                return (
                  <div key={e.id} className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                      <span className="text-sm leading-none font-bold">{d.day}</span>
                      <span className="text-[10px] uppercase">{d.month}</span>
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{e.title}</p>
                      <p className="text-xs text-slate-500">
                        {e.time} · {e.location}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
