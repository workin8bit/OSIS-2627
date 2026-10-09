import { Link, useParams } from 'react-router-dom';
import { useMemo, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight, Clock, MapPin } from 'lucide-react';
import { useQuery } from '../lib/context';
import { getEvents } from '../lib/data';
import { Empty, ErrorBox, PageHeader, Spinner } from '../components/ui';
import { BULAN, dateParts, fmtTime } from '../lib/format';

const HARI_S = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
const pad = (n) => String(n).padStart(2, '0');
const ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const isWeekend = (d) => d.getDay() === 0 || d.getDay() === 6;

/** Kartu agenda ringkas; 2 kartu muat penuh, sisanya digeser horizontal. */
function EventMiniCard({ event }) {
  const d = dateParts(event.date);
  return (
    <Link to={`/agenda/${event.id}`} className="card-hover flex flex-col h-full overflow-hidden rounded-2xl border border-ink-200 bg-white">
      <div className="flex w-full items-center justify-center gap-1.5 bg-gold-400 px-2 py-1.5 text-ink-950">
        <span className="text-lg leading-none font-extrabold tabular-nums">{d.day}</span>
        <span className="text-[10px] font-bold tracking-wide uppercase">{d.month}</span>
      </div>
      <div className="flex flex-1 flex-col px-2.5 py-2">
        <p className="line-clamp-2 text-xs leading-snug font-bold text-ink-900">{event.title}</p>
        <p className="mt-1.5 text-[10px] text-ink-500">{fmtTime(event.time)} WIB</p>
        <p className="mt-auto truncate pt-1.5 text-[10px] text-ink-400">{event.location || '-'}</p>
      </div>
    </Link>
  );
}

function EventRail({ events }) {
  return (
    <div className="scrollbar-none -mx-4 flex snap-x snap-mandatory gap-2.5 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
      {events.map((e) => (
        <div key={e.id} className="w-[46%] shrink-0 snap-start sm:w-[46%] lg:w-56">
          <EventMiniCard event={e} />
        </div>
      ))}
    </div>
  );
}

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
    const first = new Date(cursor);
    const start = new Date(first);
    // Kalender dimulai hari Senin
    start.setDate(1 - ((first.getDay() + 6) % 7));
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [cursor]);

  const monthKey = `${cursor.getFullYear()}-${pad(cursor.getMonth() + 1)}`;
  const list = selected ? byDate[selected] || [] : (data || []).filter((e) => e.date.startsWith(monthKey));
  const upcoming = (data || []).filter((e) => e.date >= today).slice(0, 10);

  const move = (n) => {
    setSelected(null);
    setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + n, 1));
  };

  return (
    <>
      <PageHeader 
        eyebrow="Agenda" 
        title="Kalender Kegiatan" 
        desc="Jadwal kegiatan OSIS dan sekolah selama periode 2026/2027." 
      />
      <section className="section-py bg-white pb-16 sm:pb-20">
        <div className="container-x">
          {loading && <Spinner />}
          {error && <ErrorBox message={error} />}
          {data && (
            <>
              <div className="grid gap-6 lg:grid-cols-3">
                  <div className="card p-5 lg:col-span-2">
                    <div className="mb-4 flex items-center justify-between">
                      <button type="button" className="btn-ghost p-2" onClick={() => move(-1)} aria-label="Bulan sebelumnya">
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <h2 className="text-lg font-bold text-ink-900">
                        {BULAN[cursor.getMonth()]} {cursor.getFullYear()}
                      </h2>
                      <button type="button" className="btn-ghost p-2" onClick={() => move(1)} aria-label="Bulan berikutnya">
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-ink-500">
                      {HARI_S.map((h, i) => (
                        <div key={h} className={`py-2 ${i > 4 ? 'text-red-500' : ''}`}>{h}</div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                      {days.map((d) => {
                        const key = ymd(d);
                        const inMonth = d.getMonth() === cursor.getMonth();
                        const evs = byDate[key] || [];
                        const isSel = selected === key;
                        const weekend = isWeekend(d);
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => setSelected(isSel ? null : key)}
                            className={`flex min-h-16 flex-col items-center justify-center rounded-xl p-1.5 text-sm transition sm:min-h-20 ${
                              isSel ? 'bg-gold-400 text-ink-950' : key === today ? 'bg-gold-100 ring-1 ring-gold-400' : 'hover:bg-ink-100'
                            } ${inMonth ? '' : 'opacity-35'}`}
                          >
                            <span className={`font-semibold ${!isSel && weekend ? 'text-red-500' : ''}`}>{d.getDate()}</span>
                            <div className="mt-1 flex flex-wrap justify-center gap-0.5">
                              {evs.slice(0, 3).map((e) => (
                                <span key={e.id} className={`h-1.5 w-1.5 rounded-full ${isSel ? 'bg-ink-950' : 'bg-gold-500'}`} />
                              ))}
                            </div>
                            {evs[0] && <span className={`mt-1 hidden w-full truncate text-[10px] sm:block ${isSel ? 'text-ink-800' : 'text-ink-600'}`}>{evs[0].title}</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="min-w-0">
                    <h3 className="mb-3 font-bold text-ink-900">{selected ? `Agenda ${dateParts(selected).day} ${dateParts(selected).monthFull}` : `Agenda ${BULAN[cursor.getMonth()]}`}</h3>
                    {list.length === 0 ? (
                      <Empty icon="Inbox" title="Tidak ada agenda" />
                    ) : (
                      <EventRail events={list} />
                    )}

                    {!selected && upcoming.length > 0 && (
                      <div className="mt-8">
                        <h3 className="mb-3 font-bold text-ink-900">
                          Akan Datang <span className="text-sm font-semibold text-ink-500">({upcoming.length})</span>
                        </h3>
                        <EventRail events={upcoming} />
                      </div>
                    )}
                  </div>
                </div>
            </>
          )}
        </div>
      </section>
    </>
  );
}

/** Halaman detail agenda */
function EventDetail() {
  const { id } = useParams();
  const { data, loading, error } = useQuery(() => getEvents().then((evs) => evs.find((e) => e.id == id)), [id]);

  if (loading) return <Spinner />;
  if (error) return <ErrorBox message={error} />;
  if (!data) {
    return (
      <>
        <PageHeader title="Agenda" desc="Kegiatan tidak ditemukan." />
        <section className="section-py bg-white">
          <div className="container-x text-center">
            <Empty icon="Inbox" title="Kegiatan tidak ditemukan" />
            <Link to="/agenda" className="btn-secondary mt-6">
              Kembali ke kalender
            </Link>
          </div>
        </section>
      </>
    );
  }

  const d = dateParts(data.date);

  return (
    <>
      <PageHeader
        eyebrow="Detail Agenda"
        title={data.title}
        desc={`${d.day} ${d.monthFull} ${d.year} · ${fmtTime(data.time)} WIB · ${data.location || 'Lokasi belum ditentukan'}`}
      />
      <section className="section-py bg-white">
        <div className="container-x max-w-2xl">
          <Link to="/agenda" className="mb-6 inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700">
            Kembali ke kalender
          </Link>
          <div className="card p-6">
            {data.category && <span className="badge-gold text-xs mb-3">{data.category}</span>}
            <h2 className="text-2xl font-bold text-ink-900">{data.title}</h2>
            <div className="mt-4 grid gap-2 text-sm text-ink-600">
              <p className="flex items-center gap-2"><CalendarDays className="h-4 w-4" /> {d.day} {d.monthFull} {d.year}</p>
              <p className="flex items-center gap-2"><Clock className="h-4 w-4" /> {fmtTime(data.time)} WIB</p>
              {data.location && <p className="flex items-center gap-2"><MapPin className="h-4 w-4" /> {data.location}</p>}
            </div>
            {data.description && (
              <div className="mt-6 prose-osis text-base">
                {data.description}
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}

export { Events, EventDetail };