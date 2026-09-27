import { useQuery } from '../lib/context';
import { getStructure } from '../lib/data';
import { Avatar, ErrorBox, Icon, InstagramIcon, PageHeader, Spinner } from '../components/ui';

function MemberCard({ m, big }) {
  return (
    <div className={`card flex flex-col items-center p-6 text-center transition hover:-translate-y-1 hover:shadow-md ${big ? 'ring-2 ring-gold-400' : ''}`}>
      <Avatar name={m.name} src={m.photo} className={big ? 'h-28 w-28 text-3xl' : 'h-20 w-20 text-xl'} />
      <p className={`mt-4 font-bold text-slate-900 ${big ? 'text-lg' : ''}`}>{m.name}</p>
      <p className="text-sm font-semibold text-brand-700">{m.position}</p>
      {m.class_name && <p className="text-xs text-slate-500">Kelas {m.class_name}</p>}
      {m.quote && <p className="mt-3 text-xs text-slate-500 italic">“{m.quote}”</p>}
      {m.instagram && (
        <a href={`https://instagram.com/${m.instagram.replace('@', '')}`} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1 text-xs text-pink-600 hover:underline">
          <InstagramIcon className="h-3.5 w-3.5" /> @{m.instagram.replace('@', '')}
        </a>
      )}
    </div>
  );
}

export default function Structure() {
  const { data, loading, error } = useQuery(getStructure);

  return (
    <>
      <PageHeader eyebrow="Struktur Organisasi" title="Pengurus OSIS" desc="Kenali para pengurus yang siap melayani dan bergerak bersama seluruh siswa SMA Negeri 3 Rembang." />
      <section className="py-16">
        <div className="container-x">
          {loading && <Spinner />}
          {error && <ErrorBox message={error} />}
          {data && (
            <>
              <h2 className="mb-8 text-center text-2xl font-extrabold text-brand-950">Pengurus Inti</h2>
              {data.core[0] && (
                <div className="mx-auto mb-6 max-w-xs">
                  <MemberCard m={data.core[0]} big />
                </div>
              )}
              <div className="mx-auto grid max-w-5xl gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {data.core.slice(1).map((m) => (
                  <MemberCard key={m.id} m={m} />
                ))}
              </div>

              <h2 className="mt-20 mb-8 text-center text-2xl font-extrabold text-brand-950">Seksi Bidang</h2>
              <div className="space-y-6">
                {data.divisions.map((d) => (
                  <div key={d.id} className="card overflow-hidden">
                    <div className="flex items-center gap-4 border-b border-slate-100 bg-brand-50/60 px-6 py-4">
                      <div className="rounded-xl bg-brand-700 p-2.5 text-white">
                        <Icon name={d.icon} className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gold-500">{d.short}</p>
                        <p className="font-bold text-slate-900">{d.name}</p>
                      </div>
                    </div>
                    <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
                      {d.members.length === 0 && <p className="text-sm text-slate-500">Belum ada anggota.</p>}
                      {d.members.map((m) => (
                        <div key={m.id} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3">
                          <Avatar name={m.name} src={m.photo} className="h-12 w-12 text-sm" />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-slate-900">{m.name}</p>
                            <p className="text-xs text-brand-700">{m.position}</p>
                            {m.class_name && <p className="text-xs text-slate-500">Kelas {m.class_name}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
}
