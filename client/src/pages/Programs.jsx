import { useMemo, useState } from 'react';
import { CalendarDays, Search, Users } from 'lucide-react';
import { useQuery } from '../lib/context';
import { getPrograms } from '../lib/data';
import { Empty, ErrorBox, PageHeader, Progress, Skeleton } from '../components/ui';
import { STATUS_PROGRAM, formatDate } from '../lib/format';

export default function Programs() {
  const { data, loading, error } = useQuery(getPrograms);
  const [status, setStatus] = useState('');
  const [division, setDivision] = useState('');
  const [q, setQ] = useState('');

  const divisions = useMemo(() => {
    const map = new Map();
    (data || []).forEach((p) => p.division_id && map.set(p.division_id, p.division_short));
    return [...map.entries()];
  }, [data]);

  const filtered = (data || []).filter(
    (p) =>
      (!status || p.status === status) &&
      (!division || String(p.division_id) === division) &&
      (!q || p.title.toLowerCase().includes(q.toLowerCase()))
  );

  const count = (k) => (data || []).filter((p) => p.status === k).length;
  const total = data?.length || 0;
  const done = count('selesai');

  return (
    <>
      <PageHeader eyebrow="Transparansi" title="Program Kerja" highlight="2026/2027" desc="Rencana dan capaian program kerja setiap seksi bidang OSIS." />

      <section className="container-x">
        {/* Ringkasan capaian */}
        <div className="rounded-4xl bg-ink-950 p-5 text-white sm:p-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow text-ink-400">Capaian periode</p>
              <p className="mt-1 text-4xl font-extrabold tracking-tight">
                {loading ? '–' : done}
                <span className="text-xl text-ink-500"> / {loading ? '–' : total} selesai</span>
              </p>
            </div>
            <p className="text-3xl font-extrabold text-sun-400">{total ? Math.round((done / total) * 100) : 0}%</p>
          </div>
          <div className="mt-4">
            <Progress value={total ? (done / total) * 100 : 0} dark />
          </div>
          <div className="mt-5 grid grid-cols-4 gap-1.5">
            {Object.entries(STATUS_PROGRAM).map(([k, st]) => {
              const active = status === k;
              return (
                <button
                  key={k}
                  onClick={() => setStatus(active ? '' : k)}
                  aria-pressed={active}
                  className={`rounded-2xl px-1 py-2.5 text-center transition active:scale-95 ${active ? 'bg-sun-400 text-ink-950' : 'bg-white/5 text-white hover:bg-white/10'}`}
                >
                  <span className="block text-xl leading-none font-extrabold">{loading ? '–' : count(k)}</span>
                  <span className={`mt-1 block text-[10.5px] font-bold ${active ? 'text-ink-800' : 'text-ink-400'}`}>{st.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Pencarian + filter sekbid */}
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-ink-400" />
            <input className="input rounded-full pl-12" type="search" placeholder="Cari program kerja…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Cari program kerja" />
          </div>
        </div>
        {divisions.length > 0 && (
          <div className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
            <button className={`chip ${!division ? 'chip-active' : ''}`} onClick={() => setDivision('')} aria-pressed={!division}>
              Semua sekbid
            </button>
            {divisions.map(([id, name]) => (
              <button key={id} className={`chip ${division === String(id) ? 'chip-active' : ''}`} onClick={() => setDivision(String(id))} aria-pressed={division === String(id)}>
                {name}
              </button>
            ))}
          </div>
        )}

        <div className="mt-5">
          {loading && (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <Skeleton key={i} className="h-56" />
              ))}
            </div>
          )}
          {error && <ErrorBox message={error} />}
          {data && filtered.length === 0 && <Empty icon="Inbox" title="Program tidak ditemukan" desc="Coba ubah kata kunci atau filter." />}
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => {
              const st = STATUS_PROGRAM[p.status] || STATUS_PROGRAM.rencana;
              return (
                <article key={p.id} className="fade-in flex flex-col rounded-3xl border border-ink-200/70 bg-white p-5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-extrabold tracking-wide text-ink-500 uppercase">{p.division_short || 'Umum'}</span>
                    <span className={`badge ${st.cls}`}>{st.label}</span>
                  </div>
                  <h3 className="mt-2.5 text-lg leading-snug font-extrabold tracking-tight text-ink-950">{p.title}</h3>
                  {p.description && <p className="mt-1.5 flex-1 text-sm leading-relaxed text-ink-600">{p.description}</p>}
                  <dl className="mt-4 space-y-1.5 text-[13px] text-ink-600">
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 shrink-0 text-ink-400" />
                      <dt className="sr-only">Waktu</dt>
                      <dd>
                        {formatDate(p.start_date)}
                        {p.end_date && p.end_date !== p.start_date ? ` – ${formatDate(p.end_date)}` : ''}
                      </dd>
                    </div>
                    {p.target && (
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 shrink-0 text-ink-400" />
                        <dt className="sr-only">Sasaran</dt>
                        <dd>{p.target}</dd>
                      </div>
                    )}
                  </dl>
                  <div className="mt-4 flex items-center gap-3">
                    <div className="flex-1">
                      <Progress value={p.progress} />
                    </div>
                    <span className="w-11 text-right text-sm font-extrabold">{p.progress}%</span>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
