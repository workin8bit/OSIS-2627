import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Clock, MapPin, X } from 'lucide-react';
import { useQuery } from '../lib/context';
import { getEvents } from '../lib/data';
import { Empty, ErrorBox, PageHeader, Skeleton } from '../components/ui';
import { BULAN, dateParts, fmtTime } from '../lib/format';

const HARI_S = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const pad = (n) => String(n).padStart(2, '0');
const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export default function Events() {
  const { data, loading, error } = useQuery(getEvents);
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
    const start = new Date(cursor);
    start.setDate(1 - cursor.getDay());
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
  const sel = selected && dateParts(selected);

  return (
    <>
      <PageHeader eyebrow="Agenda" title="Kalender" highlight="kegiatan" desc="Jadwal kegiatan OSIS dan sekolah selama periode 2026/2027." />
      <section className="container-x">
        {loading && <Skeleton className="h-96" />}
        {error && <ErrorBox message={error} />}
        {data && (
          <div className="grid gap-6 lg:grid-cols-5 lg:items-start">
            {/* KALENDER */}
            <div className="card p-3 sm:p-5 lg:sticky lg:top-24 lg:col-span-3">
              <div className="mb-2 flex items-center justify-between">
                <button className="btn-icon text-ink-700 hover:bg-ink-100" onClick={() => move(-1)} aria-label="Bulan sebelumnya">
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <h2 className="text-lg font-extrabold text-ink-950" aria-live="polite">
                  {BULAN[cursor.getMonth()]} {cursor.getFullYear()}
                </h2>
                <button className="btn-icon text-ink-700 hover:bg-ink-100" onClick={() => move(1)} aria-label="Bulan berikutnya">
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
              <div className="grid grid-cols-7 text-center text-[11px] font-bold text-ink-400 uppercase">
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
                  const isToday = key === today;
                  return (
                    <button
                      key={key}
                      onClick={() => setSelected(isSel ? null : key)}
                      aria-pressed={isSel}
                      aria-label={`${d.getDate()} ${BULAN[d.getMonth()]}${evs.length ? `, ${evs.length} agenda` : ''}`}
                      className={`relative flex aspect-square flex-col items-center justify-center rounded-2xl text-[15px] font-bold transition active:scale-90 sm:aspect-auto sm:min-h-20 sm:justify-start sm:pt-2 ${
                        isSel ? 'bg-ink-900 text-white' : isToday ? 'bg-sun-400 text-ink-950' : evs.length ? 'bg-ink-50 text-ink-900 hover:bg-ink-100' : 'text-ink-700 hover:bg-ink-50'
                      } ${inMonth ? '' : 'opacity-30'}`}
                    >
                      {d.getDate()}
                      {evs.length > 0 && (
                        <span className="mt-1 flex gap-0.5">
                          {evs.slice(0, 3).map((e) => (
                            <span key={e.id} className={`h-1.5 w-1.5 rounded-full ${isSel ? 'bg-sun-400' : isToday ? 'bg-ink-950' : 'bg-ink-900'}`} />
                          ))}
                        </span>
                      )}
                      {evs[0] && <span className={`mt-1 hidden w-full truncate px-1 text-[10px] font-semibold sm:block ${isSel ? 'text-ink-300' : 'text-ink-500'}`}>{evs[0].title}</span>}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* DAFTAR */}
            <div className="lg:col-span-2">
              <div className="mb-3 flex items-center justify-between gap-2 px-1">
                <h3 className="text-lg font-extrabold text-ink-950">{sel ? `${sel.weekday}, ${sel.day} ${sel.monthFull}` : `Agenda ${BULAN[cursor.getMonth()]}`}</h3>
                {selected && (
                  <button onClick={() => setSelected(null)} className="chip min-h-9 px-3 text-xs">
                    <X className="h-3.5 w-3.5" /> Semua
                  </button>
                )}
              </div>
              <div className="space-y-2.5">
                {list.length === 0 && <Empty icon="Inbox" title="Tidak ada agenda" desc={selected ? 'Pilih tanggal lain yang bertanda titik.' : undefined} />}
                {list.map((e) => (
                  <EventItem key={e.id} e={e} highlight={e.date === today} />
                ))}
              </div>
              {!selected && upcoming.length > 0 && (
                <>
                  <h3 className="mt-8 mb-3 px-1 text-lg font-extrabold text-ink-950">Akan datang</h3>
                  <div className="space-y-2.5">
                    {upcoming.map((e) => (
                      <EventItem key={e.id} e={e} />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </section>
    </>
  );
}

function EventItem({ e, highlight }) {
  const d = dateParts(e.date);
  return (
    <article className={`flex gap-4 rounded-3xl p-3 pr-4 ${highlight ? 'bg-ink-900 text-white' : 'border border-ink-200/70 bg-white'}`}>
      <div className={`flex h-16 w-16 shrink-0 flex-col items-center justify-center rounded-2xl ${highlight ? 'bg-sun-400 text-ink-950' : 'bg-ink-100 text-ink-900'}`}>
        <span className="text-2xl leading-none font-extrabold">{d.day}</span>
        <span className="mt-0.5 text-[11px] font-bold uppercase">{d.month}</span>
      </div>
      <div className="min-w-0 flex-1 py-0.5">
        <p className={`text-[11px] font-extrabold tracking-wide uppercase ${highlight ? 'text-sun-400' : 'text-ink-500'}`}>{e.category}</p>
        <p className="mt-0.5 leading-snug font-bold">{e.title}</p>
        {e.description && <p className={`mt-1 text-[13px] leading-relaxed ${highlight ? 'text-ink-300' : 'text-ink-600'}`}>{e.description}</p>}
        <div className={`mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs ${highlight ? 'text-ink-300' : 'text-ink-500'}`}>
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" /> {fmtTime(e.time)} WIB
          </span>
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3.5 w-3.5" /> {e.location || '-'}
          </span>
        </div>
      </div>
    </article>
  );
}
