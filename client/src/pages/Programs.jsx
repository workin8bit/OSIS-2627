import { useMemo, useState } from 'react';
import { CalendarDays, Search, Users, Filter, ChevronDown } from 'lucide-react';
import { useQuery } from '../lib/context';
import { getPrograms } from '../lib/data';
import { Empty, ErrorBox, PageHeader, Spinner, ProgramCard, Card, Badge, TabButton } from '../components/ui';
import { STATUS_PROGRAM, formatDate } from '../lib/format';

export default function Programs() {
  const { data, loading, error } = useQuery(getPrograms);
  const [status, setStatus] = useState('');
  const [division, setDivision] = useState('');
  const [q, setQ] = useState('');
  const [showFilters, setShowFilters] = useState(false);

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
      <PageHeader 
        eyebrow="Program Kerja" 
        title="Program Kerja 2026/2027" 
        desc="Transparansi rencana dan capaian program kerja setiap seksi bidang OSIS." 
      />
      <section className="section-py bg-white">
        <div className="container-x">
          {/* Summary Stats */}
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {summary.map(({ k, n }) => {
              const st = STATUS_PROGRAM[k];
              return (
                <TabButton
                  key={k}
                  active={status === k}
                  onClick={() => setStatus(status === k ? '' : k)}
                >
                  <div className="flex items-center justify-center gap-2">
                    <Badge variant={k === 'selesai' ? 'success' : k === 'berjalan' ? 'info' : k === 'rencana' ? 'primary' : 'error'} className="text-xs">
                      {st.label}
                    </Badge>
                    <span className="font-bold">{n}</span>
                  </div>
                </TabButton>
              );
            })}
          </div>

          {/* Filters */}
          <div className="mb-6 space-y-4">
            <div className="relative flex-1">
              <Search className="absolute top-3.5 left-3.5 h-5 w-5 text-ink-400" />
              <input 
                className="input pl-11" 
                placeholder="Cari program kerja..." 
                value={q} 
                onChange={(e) => setQ(e.target.value)} 
              />
            </div>
            
            <div className="flex flex-wrap gap-3">
              <select className="input flex-1 min-w-[160px]" value={division} onChange={(e) => setDivision(e.target.value)}>
                <option value="">Semua Sekbid</option>
                {divisions.map(([id, name]) => (
                  <option key={id} value={id}>{name}</option>
                ))}
              </select>
            </div>
          </div>

          {loading && <Spinner />}
          {error && <ErrorBox message={error} />}
          {data && filtered.length === 0 && (
            <Empty icon="Inbox" title="Program tidak ditemukan" desc="Coba ubah filter atau kata kunci pencarian." />
          )}
          
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => (
              <ProgramCard key={p.id} program={p} />
            ))}
          </div>
          
          {filtered.length > 0 && filtered.length < (data?.length || 0) && (
            <div className="mt-6 text-center text-sm text-ink-500">
              Menampilkan {filtered.length} dari {data.length} program
            </div>
          )}
        </div>
      </section>
    </>
  );
}