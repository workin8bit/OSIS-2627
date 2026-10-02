import { useState } from 'react';
import { useQuery } from '../lib/context';
import { getStructure } from '../lib/data';
import { ErrorBox, PageHeader, Spinner, MemberCard, DivisionCard, SectionTitle } from '../components/ui';
import MemberProfileModal from '../components/MemberProfileModal';

export default function Structure() {
  const { data, loading, error } = useQuery(getStructure);
  const [selectedId, setSelectedId] = useState(null);

  return (
    <>
      <PageHeader 
        eyebrow="Struktur Organisasi" 
        title="Pengurus OSIS" 
        desc="Kenali para pengurus yang siap melayani dan bergerak bersama seluruh siswa SMA Negeri 3 Rembang. Klik kartu untuk melihat profil lengkap." 
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
                  <MemberCard member={data.core[0]} big onSelect={(m) => setSelectedId(m.id)} />
                </div>
              )}
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {data.core.slice(1).map((m) => (
                  <MemberCard key={m.id} member={m} onSelect={(member) => setSelectedId(member.id)} />
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
                  <DivisionCard
                    key={d.id}
                    division={d}
                    members={d.members}
                    onSelectMember={(member) => setSelectedId(member.id)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      <MemberProfileModal memberId={selectedId} onClose={() => setSelectedId(null)} />
    </>
  );
}