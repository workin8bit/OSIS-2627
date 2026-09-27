import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useQuery } from '../lib/context';
import { getStructure } from '../lib/data';
import { Avatar, ErrorBox, Icon, InstagramIcon, PageHeader, SectionTitle, Skeleton } from '../components/ui';

const igHandle = (v) => v.replace('@', '');

function ChairCard({ m }) {
  return (
    <div className="relative overflow-hidden rounded-4xl bg-ink-950 p-6 text-white sm:flex sm:items-center sm:gap-8 sm:p-8">
      <div className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-sun-400/10" />
      <Avatar name={m.name} src={m.photo} className="h-24 w-24 text-3xl ring-4 ring-sun-400 sm:h-32 sm:w-32 sm:text-4xl" />
      <div className="relative mt-5 sm:mt-0">
        <span className="badge bg-sun-400 text-ink-950">{m.position}</span>
        <p className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">{m.name}</p>
        {m.class_name && <p className="text-sm text-ink-400">Kelas {m.class_name}</p>}
        {m.quote && <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-ink-200">“{m.quote}”</p>}
        {m.instagram && (
          <a href={`https://instagram.com/${igHandle(m.instagram)}`} target="_blank" rel="noreferrer" className="mt-4 inline-flex min-h-10 items-center gap-1.5 text-sm font-semibold text-sun-400">
            <InstagramIcon className="h-4 w-4" /> @{igHandle(m.instagram)}
          </a>
        )}
      </div>
    </div>
  );
}

function CoreCard({ m }) {
  return (
    <div className="flex items-center gap-4 rounded-3xl border border-ink-200/70 bg-white p-4 sm:flex-col sm:p-6 sm:text-center">
      <Avatar name={m.name} src={m.photo} className="h-16 w-16 text-lg sm:h-20 sm:w-20 sm:text-xl" />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-extrabold tracking-wide text-ink-500 uppercase">{m.position}</p>
        <p className="mt-0.5 leading-snug font-bold text-ink-950">{m.name}</p>
        {m.class_name && <p className="text-xs text-ink-500">Kelas {m.class_name}</p>}
        {m.quote && <p className="mt-2 hidden text-xs text-ink-500 italic sm:block">“{m.quote}”</p>}
        {m.instagram && (
          <a href={`https://instagram.com/${igHandle(m.instagram)}`} target="_blank" rel="noreferrer" className="mt-1 inline-flex min-h-8 items-center gap-1 text-xs font-semibold text-ink-700 hover:text-ink-950">
            <InstagramIcon className="h-3.5 w-3.5" /> @{igHandle(m.instagram)}
          </a>
        )}
      </div>
    </div>
  );
}

/** Sekbid sebagai akordeon: hemat ruang di HP, terbuka semua di desktop. */
function DivisionBlock({ d, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="overflow-hidden rounded-3xl border border-ink-200/70 bg-white">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center gap-4 p-4 text-left sm:px-5" aria-expanded={open}>
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-ink-900 text-sun-400">
          <Icon name={d.icon} className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[11px] font-extrabold tracking-wide text-ink-500 uppercase">
            {d.short} · {d.members.length} orang
          </span>
          <span className="block leading-snug font-bold text-ink-950">{d.name}</span>
        </span>
        <ChevronDown className={`h-5 w-5 shrink-0 text-ink-400 transition ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="fade-in grid gap-2 border-t border-ink-100 p-3 sm:grid-cols-2 sm:p-4 lg:grid-cols-4">
          {d.members.length === 0 && <p className="p-2 text-sm text-ink-500">Belum ada anggota.</p>}
          {d.members.map((m) => (
            <div key={m.id} className="flex items-center gap-3 rounded-2xl bg-ink-50 p-3">
              <Avatar name={m.name} src={m.photo} className="h-11 w-11 text-sm" />
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-ink-950">{m.name}</p>
                <p className="text-xs text-ink-600">
                  {m.position}
                  {m.class_name ? ` · ${m.class_name}` : ''}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Structure() {
  const { data, loading, error } = useQuery(getStructure);
  const isDesktop = typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches;

  return (
    <>
      <PageHeader eyebrow="Struktur organisasi" title="Pengurus" highlight="OSIS" desc="Kenali para pengurus yang siap melayani dan bergerak bersama seluruh siswa SMA Negeri 3 Rembang." />
      <section className="container-x">
        {loading && (
          <div className="space-y-3">
            <Skeleton className="h-56" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
        )}
        {error && <ErrorBox message={error} />}
        {data && (
          <div className="space-y-12">
            <div>
              <SectionTitle title="Pengurus inti" />
              <div className="space-y-3">
                {data.core[0] && <ChairCard m={data.core[0]} />}
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {data.core.slice(1).map((m) => (
                    <CoreCard key={m.id} m={m} />
                  ))}
                </div>
              </div>
            </div>
            <div>
              <SectionTitle title="Seksi bidang" desc="Ketuk salah satu sekbid untuk melihat anggotanya." />
              <div className="space-y-3">
                {data.divisions.map((d, i) => (
                  <DivisionBlock key={d.id} d={d} defaultOpen={isDesktop || i === 0} />
                ))}
              </div>
            </div>
          </div>
        )}
      </section>
    </>
  );
}
