import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useQuery } from '../lib/context';
import { getMember } from '../lib/data';
import { jabatanLengkap } from '../lib/format';
import { Card, Empty, ErrorBox, MemberProfileCard, PageHeader, Spinner } from '../components/ui';

export default function MemberProfile() {
  const { id } = useParams();
  const { data: member, loading, error } = useQuery(() => getMember(id), [id]);

  useEffect(() => {
    if (member?.name) document.title = `${member.name} — OSIS SMA Negeri 3 Rembang`;
    return () => {
      document.title = 'OSIS SMA Negeri 3 Rembang 2026/2027';
    };
  }, [member]);

  if (loading) return <Spinner />;
  if (error) return <ErrorBox message={error} />;
  if (!member) {
    return (
      <>
        <PageHeader title="Profil Pengurus" desc="Data pengurus tidak ditemukan." />
        <section className="section-py bg-white">
          <div className="container-x text-center">
            <Empty icon="Users" title="Pengurus tidak ditemukan" desc="Anggota ini mungkin sudah tidak aktif." />
            <Link to="/struktur" className="btn-secondary mt-6">
              <ArrowLeft className="h-4 w-4" /> Kembali ke daftar pengurus
            </Link>
          </div>
        </section>
      </>
    );
  }

  return (
    <>
      <PageHeader eyebrow="Profil Pengurus" title={member.name} desc={jabatanLengkap(member) || undefined} />

      <section className="section-py bg-white">
        <div className="container-x">
          <Link
            to="/struktur"
            className="mb-6 inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700"
          >
            <ArrowLeft className="h-4 w-4" /> Kembali ke daftar pengurus
          </Link>

          <Card className="mx-auto max-w-2xl overflow-hidden p-0">
            <MemberProfileCard member={member} />
          </Card>
        </div>
      </section>
    </>
  );
}