import { useMemo, useState } from 'react';
import { CalendarDays, Search, Users } from 'lucide-react';
import { useFetch } from '../lib/context';
import { Empty, ErrorBox, PageHeader, Progress, Spinner } from '../components/ui';
import { STATUS_PROGRAM, formatDate } from '../lib/format';

export default function Programs() {
  const { data, loading, error } = useFetch('/programs');
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

  const summary = Object.keys(STATUS_PROGRAM).map((k) => ({ k, n: (data || []).filter((p) => p.status === k).length }));

  return (
    <>
      <PageHeader eyebrow="Program Kerja" title="Program Kerja 2026/2027" desc="Transparansi rencana dan capaian program kerja setiap seksi bidang OSIS." />
      <section className="py-16">
        <div className="container-x">
          <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">
            {summary.map(({ k, n }) => (
              <button
                key={k}
                onClick={() => setStatus(status === k ? '' : k)}
                className={`card p-4 text-left transition ${status === k ? 'ring-2 ring-brand-600' : 'hover:shadow-md'}`}
              >
                <p className="text-2xl font-extrabold text-brand-950">{n}</p>
                <span className={`badge mt-1 ${STATUS_PROGRAM[k].cls}`}>{STATUS_PROGRAM[k].label}</span>
              </button>
            ))}
          </div>

          <div className="mb-6 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute top-3 left-3 h-4 w-4 text-slate-400" />
              <input className="input pl-9" placeholder="Cari program kerja..." value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <select className="input sm:w-56" value={division} onChange={(e) => setDivision(e.target.value)}>
              <option value="">Semua Sekbid</option>
              {divisions.map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          {loading && <Spinner />}
          {error && <ErrorBox message={error} />}
          {data && filtered.length === 0 && <Empty icon="Inbox" title="Program tidak ditemukan" />}
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => {
              const st = STATUS_PROGRAM[p.status] || STATUS_PROGRAM.rencana;
              return (
                <div key={p.id} className="card flex flex-col p-6">
                  <div className="flex items-center justify-between gap-2">
                    <span className="badge bg-brand-50 text-brand-700">{p.division_short || 'Umum'}</span>
                    <span className={`badge ${st.cls}`}>{st.label}</span>
                  </div>
                  <h3 className="mt-3 text-lg font-bold text-slate-900">{p.title}</h3>
                  <p className="mt-1 flex-1 text-sm text-slate-600">{p.description}</p>
                  <div className="mt-4 space-y-1.5 text-xs text-slate-500">
                    <p className="flex items-center gap-1.5">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {formatDate(p.start_date)}
                      {p.end_date && p.end_date !== p.start_date ? ` – ${formatDate(p.end_date)}` : ''}
                    </p>
                    {p.target && (
                      <p className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5" /> Sasaran: {p.target}
                      </p>
                    )}
                  </div>
                  <div className="mt-4">
                    <div className="mb-1 flex justify-between text-xs">
                      <span className="text-slate-500">Progres</span>
                      <span className="font-bold text-brand-700">{p.progress}%</span>
                    </div>
                    <Progress value={p.progress} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
}
