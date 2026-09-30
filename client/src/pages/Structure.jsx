import { useQuery } from '../lib/context';
import { getStructure } from '../lib/data';
import { ErrorBox, PageHeader, Spinner, MemberCard, DivisionCard, SectionTitle } from '../components/ui';

export default function Structure() {
  const { data, loading, error } = useQuery(getStructure);

  return (
    <>
      <PageHeader 
        eyebrow="Struktur Organisasi" 
        title="Pengurus OSIS" 
        desc="Kenali para pengurus yang siap melayani dan bergerak bersama seluruh siswa SMA Negeri 3 Rembang." 
      />
      <section className="section-py bg-white">
        <div className="container-x">
          {loading && <Spinner />}
          {error && <ErrorBox message={error} />}
          {data && (
            <>
              {/* Core Officers */}
              <SectionTitle 
                title="Pengurus Inti" 
                desc="Dewan pengurus harian yang memimpin OSIS periode ini."
                center={false}
              />
              {data.core[0] && (
                <div className="mb-8">
                  <MemberCard member={data.core[0]} big />
                </div>
              )}
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {data.core.slice(1).map((m) => (
                  <MemberCard key={m.id} member={m} />
                ))}
              </div>

              {/* Divisions */}
              <SectionTitle 
                title="Seksi Bidang" 
                desc="10 seksi bidang dengan fokus pembinaan masing-masing."
                center={false}
                className="mt-16"
              />
              <div className="space-y-6">
                {data.divisions.map((d) => (
                  <DivisionCard key={d.id} division={d} members={d.members} />
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
}