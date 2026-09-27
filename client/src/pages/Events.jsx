import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Clock, MapPin } from 'lucide-react';
import { useFetch } from '../lib/context';
import { Empty, ErrorBox, PageHeader, Spinner } from '../components/ui';
import { BULAN, dateParts } from '../lib/format';

const HARI_S = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const pad = (n) => String(n).padStart(2, '0');
const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export default function Events() {
  const { data, loading, error } = useFetch('/events');
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selected, setSelected] = useState(null);
  const today = ymd(new Date());

  const byDate = useMemo(() => {
    const m = {};
    (data || []).forEach((e) => (m[e.date] ||= []).push(e));
    return m;
  }, [data]);

  const days = useMemo(() => {
    const first = new Date(cursor);
    const start = new Date(first);
    start.setDate(1 - first.getDay());
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [cursor]);

  const monthKey = `${cursor.getFullYear()}-${pad(cursor.getMonth() + 1)}`;
  const list = selected ? byDate[selected] || [] : (data || []).filter((e) => e.date.startsWith(monthKey));
  const upcoming = (data || []).filter((e) => e.date >= today).slice(0, 5);

  const move = (n) => {
    setSelected(null);
    setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + n, 1));
  };

  return (
    <>
      <PageHeader eyebrow="Agenda" title="Kalender Kegiatan" desc="Jadwal kegiatan OSIS dan sekolah selama periode 2026/2027." />
      <section className="py-16">
        <div className="container-x">
          {loading && <Spinner />}
          {error && <ErrorBox message={error} />}
          {data && (
            <div className="grid gap-8 lg:grid-cols-3">
              <div className="card p-5 lg:col-span-2">
                <div className="mb-4 flex items-center justify-between">
                  <button className="btn-ghost p-2" onClick={() => move(-1)} aria-label="Bulan sebelumnya">
                    <ChevronLeft />
                  </button>
                  <h2 className="text-lg font-bold text-brand-950">
                    {BULAN[cursor.getMonth()]} {cursor.getFullYear()}
                  </h2>
                  <button className="btn-ghost p-2" onClick={() => move(1)} aria-label="Bulan berikutnya">
                    <ChevronRight />
                  </button>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-slate-500">
                  {HARI_S.map((h) => (
                    <div key={h} className="py-2">
                      {h}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {days.map((d) => {
                    const key = ymd(d);
                    const inMonth = d.getMonth() === cursor.getMonth();
                    const evs = byDate[key] || [];
                    const isSel = selected === key;
                    return (
                      <button
                        key={key}
                        onClick={() => setSelected(isSel ? null : key)}
                        className={`flex min-h-16 flex-col items-center rounded-xl p-1.5 text-sm transition sm:min-h-20 ${
                          isSel ? 'bg-brand-700 text-white' : key === today ? 'bg-gold-400/20 ring-1 ring-gold-400' : 'hover:bg-slate-100'
                        } ${inMonth ? '' : 'opacity-35'}`}
                      >
                        <span className="font-semibold">{d.getDate()}</span>
                        <div className="mt-1 flex flex-wrap justify-center gap-0.5">
                          {evs.slice(0, 3).map((e) => (
                            <span key={e.id} className={`h-1.5 w-1.5 rounded-full ${isSel ? 'bg-white' : 'bg-brand-600'}`} />
                          ))}
                        </div>
                        {evs[0] && <span className={`mt-1 hidden w-full truncate text-[10px] sm:block ${isSel ? 'text-brand-100' : 'text-brand-700'}`}>{evs[0].title}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <h3 className="mb-4 font-bold text-brand-950">{selected ? `Agenda ${dateParts(selected).day} ${dateParts(selected).monthFull}` : `Agenda ${BULAN[cursor.getMonth()]}`}</h3>
                <div className="space-y-3">
                  {list.length === 0 && <Empty icon="Inbox" title="Tidak ada agenda" />}
                  {list.map((e) => (
                    <EventItem key={e.id} e={e} />
                  ))}
                </div>
                {!selected && upcoming.length > 0 && (
                  <>
                    <h3 className="mt-8 mb-4 font-bold text-brand-950">Akan Datang</h3>
                    <div className="space-y-3">
                      {upcoming.map((e) => (
                        <EventItem key={e.id} e={e} />
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    </>
  );
}

function EventItem({ e }) {
  const d = dateParts(e.date);
  return (
    <div className="card flex gap-4 p-4">
      <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-brand-700 text-white">
        <span className="text-lg leading-none font-extrabold">{d.day}</span>
        <span className="text-[10px] uppercase">{d.month}</span>
      </div>
      <div className="min-w-0">
        <span className="badge bg-gold-400/20 text-amber-800">{e.category}</span>
        <p className="mt-1 font-bold text-slate-900">{e.title}</p>
        {e.description && <p className="text-xs text-slate-500">{e.description}</p>}
        <div className="mt-1 flex flex-wrap gap-x-3 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" /> {e.time || '-'}
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="h-3 w-3" /> {e.location || '-'}
          </span>
        </div>
      </div>
    </div>
  );
}
